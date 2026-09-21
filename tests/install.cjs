'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {device,installationLink,controller}=require('../trading/install.js');
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
async function main(){
  await test('Android, iPhone and desktop-class iPad detection',()=>{
    assert.equal(device({userAgent:'Mozilla/5.0 (Linux; Android 15) Chrome/130'}),'android');
    assert.equal(device({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18) Safari'}),'ios');
    assert.equal(device({userAgent:'Mozilla/5.0 Macintosh Safari',platform:'MacIntel',maxTouchPoints:5}),'ios');
    assert.equal(device({userAgent:'Mozilla/5.0 Macintosh Safari',platform:'MacIntel',maxTouchPoints:0}),'desktop');
    assert.equal(device({userAgent:'Mozilla/5.0 Windows Chrome/130'}),'desktop');
  });
  await test('Phone sharing strips query, fragments and local-only addresses',()=>{
    assert.equal(installationLink({hostname:'example.com',origin:'https://example.com',search:'?token=private',hash:'#secret'}),'https://example.com/trading/install');
    for(const hostname of ['localhost','127.0.0.1','[::1]'])assert.equal(installationLink({hostname,origin:'http://'+hostname}),null);
  });
  await test('No browser install event means honest manual fallback',async()=>{
    const c=controller();assert.equal(c.available(),false);assert.equal(await c.prompt(),'manual');
  });
  await test('Native prompt is prevented until a click, then is used only once',async()=>{
    const c=controller();let prevented=0,prompts=0;
    c.capture({preventDefault(){prevented++;},async prompt(){prompts++;return {outcome:'accepted'};}});
    assert.equal(prevented,1);assert.equal(prompts,0);assert(c.available());
    assert.equal(await c.prompt(),'accepted');assert.equal(prompts,1);assert.equal(c.available(),false);assert.equal(await c.prompt(),'manual');
  });
  await test('Older userChoice API and cancellations are supported',async()=>{
    const c=controller();c.capture({preventDefault(){},async prompt(){},userChoice:Promise.resolve({outcome:'dismissed'})});
    assert.equal(await c.prompt(),'dismissed');assert.equal(c.available(),false);
  });
  await test('Failed prompts do not leak errors or claim installation',async()=>{
    const c=controller();c.capture({preventDefault(){},async prompt(){throw Error('Not allowed');}});
    assert.equal(await c.prompt(),'failed');assert.equal(await c.prompt(),'manual');
  });
  await test('Repeated clicks cannot open duplicate installation prompts',async()=>{
    const c=controller();let release;
    c.capture({preventDefault(){},prompt(){return new Promise(r=>release=r);}});
    const first=c.prompt();assert.equal(await c.prompt(),'busy');release({outcome:'accepted'});assert.equal(await first,'accepted');
  });
  await test('Completed installation prevents re-prompts',async()=>{
    const c=controller();c.installed();c.capture({preventDefault(){},prompt(){throw Error('Must not run');}});
    assert.equal(c.available(),false);assert.equal(await c.prompt(),'installed');
  });
  await test('Both public install entry points have working fallbacks and one manifest',()=>{
    for(const file of ['app.html','install.html']){
      const html=fs.readFileSync(path.join(__dirname,'../trading',file),'utf8');
      assert.equal((html.match(/rel="manifest"/g)||[]).length,1);
      assert.match(html,/href="\/trading\/install\?device=android" data-install-device="android"/);
      assert.match(html,/href="\/trading\/install\?device=ios" data-install-device="ios"/);
      assert.match(html,/aria-labelledby="z-install-title"/);
      assert.equal((html.match(/src="\/trading\/install.js\?v=1"/g)||[]).length,1);
    }
    const app=fs.readFileSync(path.join(__dirname,'../trading/app.html'),'utf8');
    assert(app.indexOf('data-install-device')<app.indexOf('data-login-form'));
    assert(!fs.readFileSync(path.join(__dirname,'../trading/app.js'),'utf8').includes('beforeinstallprompt'));
  });
  await test('Offline navigation serves only its matching shell, never protected content',async()=>{
    const handlers={},matches=[];
    const ctx={URL,self:{location:{origin:'https://local'},addEventListener:(name,f)=>handlers[name]=f},fetch:async()=>{throw Error('offline');},caches:{match:async p=>{matches.push(p);return p;}}};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../trading/sw.js'),'utf8'),ctx);
    for(const route of ['/trading/app?source=pwa','/trading/install?device=ios']){
      let response;handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://local'+route},respondWith:p=>response=p});
      assert.equal(await response,route.split('?')[0]);
    }
    for(const route of ['/api/trade-access?action=content','/trading/source/app-pages.json']){
      let intercepted=false;handlers.fetch({request:{method:'GET',url:'https://local'+route},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
    }
    assert.deepEqual(matches,['/trading/app','/trading/install']);
  });
  console.log('\n'+passed+' installation checks passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

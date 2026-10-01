'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {device,installationLink,appleLink,embeddedIOS,controller,init}=require('../trading/install.js');
const {enhance}=require('../trading/source/install.cjs');
function element(extra={}){
  return Object.assign({hidden:false,dataset:{},textContent:'',attributes:{},handlers:{},
    addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);},
    emit(name,event={}){for(const fn of this.handlers[name]||[])fn(event);},
    setAttribute(name,value){this.attributes[name]=value;},
    querySelector(){return null;},querySelectorAll(){return [];},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},select(){this.selected=true;}
  },extra);
}
function ui({type='android',pathname='/trading/app',search='',standalone=false,navStandalone=false,sw,dialog=true,access='none',safari=false,ua,clipboard}={}){
  const label=element(),trigger=element({href:'/trading/install?install=1',querySelector:()=>label}),native=element(),note=element(),close=element(),status=element(),banner=element(),update=element({hidden:true});
  const guides=['android','ios','desktop'].map(guide=>element({dataset:{guide},hidden:true}));
  const deviceLinks=['android','ios'].map(installDevice=>element({dataset:{installDevice}}));
  const authPanel=element({hidden:access==='workspace'}),workspace=element({hidden:access!=='workspace'}),useApp=element();
  const safariInput=element(),safariStatus=element(),safariHelp=element({querySelector:s=>s==='[data-safari-link]'?safariInput:s==='[data-safari-status]'?safariStatus:null}),safariCopy=element({closest:()=>safariHelp});
  const modal=element({open:false,showModal(){this.open=true;},close(){this.open=false;this.emit('close');},querySelector(s){return s==='[data-install-close]'?close:s==='[data-install-dialog-note]'?note:s==='[data-safari-help]'?safariHelp:null;},querySelectorAll:()=>guides});
  const map={'[data-install-status]':[status],'[data-install-trigger]':[trigger],'[data-install-native]':[native],'[data-install-trigger],[data-install-native]':[trigger,native],'[data-install-device]':deviceLinks,'.z-install-banner':[banner],'[data-use-app]':[useApp],'[data-safari-link]':safari?[safariInput]:[],'[data-copy-safari]':safari?[safariCopy]:[]};
  const media=element({matches:standalone}),win=element({navigator:{userAgent:ua||(type==='ios'?'iPhone Safari':type==='android'?'Android Chrome':'Windows Chrome'),standalone:navStandalone,clipboard},location:{hostname:'example.com',origin:'https://example.com',pathname,search,href:'https://example.com'+pathname+search},matchMedia:()=>media});
  win.document={activeElement:trigger,querySelector:s=>s==='#z-install-dialog'&&dialog?modal:s==='[data-app-update]'?update:access!=='none'&&s==='[data-auth-panel]'?authPanel:access!=='none'&&s==='[data-app-workspace]'?workspace:null,querySelectorAll:s=>map[s]||[]};
  if(sw)win.navigator.serviceWorker=sw;
  const click=(node,extra={})=>{const event={prevented:false,preventDefault(){this.prevented=true;},...extra};node.emit('click',event);return event;};
  init(win);return {win,trigger,native,label,note,close,status,banner,update,guides,deviceLinks,modal,media,click,authPanel,workspace,useApp,safariInput,safariStatus,safariCopy,safariHelp};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
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
    const first=c.prompt();assert(c.busy());assert.equal(await c.prompt(),'busy');release({outcome:'accepted'});assert.equal(await first,'accepted');assert.equal(c.busy(),false);
  });
  await test('Completed installation prevents re-prompts',async()=>{
    const c=controller();c.installed();c.capture({preventDefault(){},prompt(){throw Error('Must not run');}});
    assert.equal(c.available(),false);assert.equal(await c.prompt(),'installed');
  });
  await test('Main button invokes a ready browser prompt synchronously from the user click',async()=>{
    const u=ui();let prompts=0,prevented=0,release;
    u.win.emit('beforeinstallprompt',{preventDefault(){prevented++;},prompt(){prompts++;return new Promise(r=>release=r);}});
    assert.equal(prompts,0);assert.equal(prevented,1);
    assert(u.click(u.trigger).prevented);assert.equal(prompts,1);assert.equal(u.modal.open,false);assert.equal(u.trigger.attributes['aria-busy'],'true');
    u.click(u.trigger);assert.equal(prompts,1);assert.equal(u.modal.open,false);
    release({outcome:'accepted'});await flush();assert.match(u.status.textContent,/accepted/);assert.equal(u.trigger.attributes['aria-busy'],'false');
    u.win.emit('appinstalled');assert.equal(u.label.textContent,'Open Trade Zuko');assert(u.banner.hidden);u.click(u.trigger);assert.equal(u.win.location.href,'/trading/app');
  });
  await test('A late browser event exposes Install now without prompting automatically',async()=>{
    const u=ui();u.click(u.trigger);assert(u.modal.open);assert.equal(u.guides[0].hidden,false);assert(u.native.hidden);let prompts=0;
    u.win.emit('beforeinstallprompt',{preventDefault(){},prompt(){prompts++;return Promise.resolve({outcome:'accepted'});}});
    assert.equal(prompts,0);assert.equal(u.native.hidden,false);assert.match(u.note.textContent,/Install now/);
    u.click(u.native);assert.equal(prompts,1);assert.equal(u.modal.open,false);await flush();
  });
  await test('Cancellation keeps a working, focused manual fallback',async()=>{
    const u=ui();u.win.emit('beforeinstallprompt',{preventDefault(){},prompt:async()=>({outcome:'dismissed'})});u.click(u.trigger);await flush();
    assert(u.modal.open);assert.match(u.note.textContent,/cancelled/);assert(u.close.focused);assert(u.native.hidden);u.click(u.close);assert.equal(u.modal.open,false);assert(u.trigger.focused);
  });
  await test('iPhone routes portfolio visitors into the app before Home Screen instructions',()=>{
    const home=ui({type:'ios',pathname:'/'});home.click(home.trigger);assert.equal(home.win.location.href,'/trading/app?install=1');assert.equal(home.modal.open,false);
    const app=ui({type:'ios',search:'?install=1'});assert(app.modal.open);assert.equal(app.guides[1].hidden,false);assert(app.native.hidden);assert.match(app.note.textContent,/Share → Add to Home Screen/);
    app.win.emit('beforeinstallprompt',{preventDefault(){},prompt(){throw Error('iOS must not use this prompt');}});app.click(app.trigger);assert(app.native.hidden);
  });
  await test('Desktop visitors get a desktop guide and Android options never install on desktop',()=>{
    const u=ui({type:'desktop'});u.click(u.trigger);assert.equal(u.guides[2].hidden,false);assert.equal(u.guides[0].hidden,true);assert.match(u.note.textContent,/this browser/);
    let prompts=0;u.win.emit('beforeinstallprompt',{preventDefault(){},prompt(){prompts++;return Promise.resolve({outcome:'accepted'});}});
    u.click(u.deviceLinks[0]);assert.equal(prompts,0);assert(u.native.hidden);assert.match(u.note.textContent,/Android phone/);
  });
  await test('Installed mode opens the app and modified clicks preserve normal link behaviour',()=>{
    const u=ui({standalone:true});assert.equal(u.label.textContent,'Open Trade Zuko');assert.equal(u.trigger.href,'/trading/app');assert(u.deviceLinks.every(a=>a.hidden));u.click(u.trigger);assert.equal(u.win.location.href,'/trading/app');
    const normal=ui();assert.equal(normal.click(normal.trigger,{ctrlKey:true}).prevented,false);assert.equal(normal.modal.open,false);
  });
  await test('Install intent never auto-prompts and missing dialog support uses the public guide',()=>{
    const u=ui({search:'?install=1'});assert(u.modal.open);let prompts=0;u.win.emit('beforeinstallprompt',{preventDefault(){},prompt(){prompts++;}});assert.equal(prompts,0);
    const fallback=ui({dialog:false});fallback.click(fallback.trigger);assert.equal(fallback.win.location.href,'/trading/install?device=android');
  });
  await test('First installation is not mistaken for a waiting service-worker update',async()=>{
    const registration=element({waiting:{postMessage(){}},installing:element()});
    const first=ui({sw:element({controller:null,register:async()=>registration})});await flush();assert(first.update.hidden);
    const existing=ui({sw:element({controller:{},register:async()=>registration})});await flush();assert.equal(existing.update.hidden,false);
  });
  await test('Apple install uses the actual app entry from every other trading page',()=>{
    for(const pathname of ['/','/trading','/trading/install','/trading/learn/gift-nifty']){
      const u=ui({type:'ios',pathname});u.click(u.trigger);assert.equal(u.win.location.href,'/trading/app?install=1');assert.equal(u.modal.open,false);
    }
    const u=ui({type:'ios',pathname:'/trading/app',search:'?install=1'});assert.match(u.label.textContent,/Home Screen/);assert(u.modal.open);assert(u.native.hidden);
  });
  await test('Apple installed mode recognises navigator.standalone without a matching media query',()=>{
    const u=ui({type:'ios',navStandalone:true,search:'?install=1',access:'login'});
    assert.equal(u.modal.open,false);assert(u.banner.hidden);assert.equal(u.label.textContent,'Open Trade Zuko');u.click(u.trigger);assert(u.authPanel.scrolled);
  });
  await test('Use app now focuses sign-in or the learning area without navigation or reload',()=>{
    for(const access of ['login','workspace']){
      const u=ui({access,search:'?install=1'});assert(u.modal.open);assert(u.click(u.useApp).prevented);
      const panel=access==='login'?u.authPanel:u.workspace;assert(panel.focused);assert(panel.scrolled);assert.equal(panel.attributes.tabindex,'-1');assert.equal(u.modal.open,false);assert.equal(u.win.location.href,'https://example.com/trading/app?install=1');
      u.trigger.focused=false;u.modal.emit('close');assert.equal(u.trigger.focused,false,'A delayed browser close event must not steal focus back from the app');
    }
    const u=ui({pathname:'/'});assert.equal(u.click(u.useApp).prevented,false);
  });
  await test('iPhone embedded-browser help copies only the public app link',async()=>{
    assert(embeddedIOS({userAgent:'iPhone Instagram'}));assert(!embeddedIOS({userAgent:'iPhone Safari'}));
    assert.equal(appleLink({hostname:'localhost',origin:'http://localhost'}),null);
    assert.equal(appleLink({hostname:'example.com',origin:'https://example.com',search:'?token=private'}),'https://example.com/trading/app?install=1');
    let copied;const u=ui({type:'ios',ua:'iPhone Instagram',safari:true,search:'?install=1',clipboard:{async writeText(value){copied=value;}}});
    assert(u.safariHelp.open);assert.match(u.note.textContent,/inside another app/);u.click(u.safariCopy);await flush();assert.equal(copied,'https://example.com/trading/app?install=1');assert.match(u.safariStatus.textContent,/Copied/);
  });
  await test('Safari manual-copy fallback remains usable without clipboard permission',async()=>{
    const u=ui({type:'ios',safari:true});u.click(u.safariCopy);await flush();assert(u.safariInput.selected);assert(u.safariInput.focused);assert.match(u.safariStatus.textContent,/Press and hold/);
  });
  await test('Homepage and trading entry points have one manifest, installer and accessible dialog',()=>{
    for(const file of ['index.html','trading.html','trading/library.html','trading/app.html','trading/install.html']){
      const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
      assert.equal((html.match(/rel="manifest"/g)||[]).length,1,file);
      assert.equal((html.match(/id="z-install-dialog"/g)||[]).length,1,file);
      assert.equal((html.match(/src="\/trading\/install.js\?v=4"/g)||[]).length,1,file);
      assert.equal((html.match(/name="apple-mobile-web-app-capable" content="yes"/g)||[]).length,1,file);
      assert.match(html,/data-copy-safari/);assert.match(html,/class="z-apple-steps"/);assert.match(html,/data-use-app/);
      assert.match(html,/data-install-trigger/);assert.match(html,/data-guide="desktop"/);
      assert.match(html,/aria-labelledby="z-install-title"/);
      assert.equal(enhance(html),html,'Rebuilding must not duplicate or alter installer markup: '+file);
    }
    for(const file of ['app.html','install.html']){
      const html=fs.readFileSync(path.join(__dirname,'../trading',file),'utf8');
      assert.equal((html.match(/rel="manifest"/g)||[]).length,1);
      assert.match(html,/href="\/trading\/install\?device=android" data-install-device="android"/);
      assert.match(html,/href="\/trading\/install\?device=ios" data-install-device="ios"/);
      assert.match(html,/aria-labelledby="z-install-title"/);
      assert.equal((html.match(/src="\/trading\/install.js\?v=4"/g)||[]).length,1);
    }
    const app=fs.readFileSync(path.join(__dirname,'../trading/app.html'),'utf8');
    assert(app.indexOf('data-install-device')<app.indexOf('data-login-form'));
    assert.match(app,/data-app-motion/);assert.match(app,/data-app-theme/);
    assert.match(app,/src="\/trading-lab.js\?v=2"/);
    assert(app.indexOf('/trading/network.js?v=1')<app.indexOf('/trading/app.js?v=5'));
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

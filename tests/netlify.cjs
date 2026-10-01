'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {blobAdapter,runHandler}=require('../netlify/lib/adapter.cjs');
const root=path.resolve(__dirname,'..');
let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
async function main(){
  await test('Netlify storage enforces strong reads and atomic compare-and-swap',async()=>{
    const calls=[],adapter=blobAdapter({getWithMetadata:async(key,options)=>{calls.push({key,options});return {data:'{"example":true}',etag:'a'};},set:async(key,value,options)=>{calls.push({key,value,options});return {modified:options.onlyIfMatch==='a',etag:'b'};}});
    const record=await adapter.get('access');assert.equal(calls[0].options.consistency,'strong');assert.equal(await new Response(record.stream).text(),'{"example":true}');
    await adapter.put('access','{}',{ifMatch:'a'});assert.equal(calls[1].options.onlyIfMatch,'a');
    await assert.rejects(()=>adapter.put('access','{}',{ifMatch:'stale'}),error=>error.name==='BlobPreconditionFailedError');
    await assert.rejects(()=>adapter.put('access','{}',{}),/Conditional/);
  });
  await test('Netlify HTTP adapter preserves secure headers, queries and trusted IP',async()=>{
    const response=await runHandler(async(req,res)=>{assert.equal(req.query.action,'test');assert.equal(req.body.test,1);assert.equal(req.trustedClientIP,'192.0.2.1');res.setHeader('Set-Cookie','__Host-zuko=test; Secure; HttpOnly; SameSite=Strict; Path=/');res.setHeader('Cache-Control','no-store');res.status(201).json({ok:true});},new Request('https://fixture.netlify.app/api/trade-access?action=test',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'evil'},body:'{"test":1}'}),{ip:'192.0.2.1'});
    assert.equal(response.status,201);assert.match(response.headers.get('set-cookie'),/HttpOnly/);assert.equal((await response.json()).ok,true);
    let called=false;const large=await runHandler(()=>called=true,new Request('https://fixture.netlify.app/api',{method:'POST',body:'x'.repeat(12289)}));assert.equal(large.status,413);assert.equal(called,false);
    const malformed=await runHandler(()=>called=true,new Request('https://fixture.netlify.app/api',{method:'POST',body:'{'}));assert.equal(malformed.status,400);assert.equal(called,false);
  });
  await test('Publishing includes public assets only and canonical URLs are configurable',()=>{
    execFileSync(process.execPath,['netlify/build.cjs'],{cwd:root,env:{...process.env,SITE_ORIGIN:'https://fixture.netlify.app'},stdio:'pipe'});
    const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
    const files=walk(path.join(root,'dist')).map(f=>path.relative(path.join(root,'dist'),f).replaceAll('\\','/'));
    for(const file of files)assert(!/(^|\/)(\.env|node_modules|source|api|netlify|tests|\.vercel|\.netlify)(\/|\.|$)/.test(file),file);
    assert(files.includes('trading/app.html'));assert(files.includes('trading/google-login.js'));assert(files.includes('_redirects'));
    const html=fs.readFileSync(path.join(root,'dist/trading/app.html'),'utf8');assert.match(html,/https:\/\/fixture.netlify.app\/trading\/app/);assert(!html.includes('https://aman-singh-resume.vercel.app'));
    assert.match(fs.readFileSync(path.join(root,'dist/_redirects'),'utf8'),/\/trading\/app \/trading\/app.html 200/);
    execFileSync(process.execPath,['netlify/build.cjs'],{cwd:root,stdio:'pipe'});
  });
  console.log('\n'+count+' Netlify migration checks passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

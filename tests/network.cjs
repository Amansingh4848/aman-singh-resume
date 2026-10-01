'use strict';
const assert=require('node:assert/strict'),create=require('../trading/network.js');
let count=0;
async function test(name,fn){await fn();count++;console.log('PASS '+name);}
function fixture(fetch){
  const active=new Map();let n=0;
  const env={AbortController,fetch,setTimeout(fn,ms){active.set(++n,{fn,ms});return n;},clearTimeout(id){active.delete(id);}};
  return {api:create(env),active};
}
async function main(){
  await test('Safari-compatible requests preserve credentials, CSRF, body and no-store policy',async()=>{
    let seen;const f=fixture(async(url,options)=>{seen={url,options};return {status:200,json:async()=>({ok:true})};});
    const result=await f.api.json('/api/trade-access',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'X-Zuko-CSRF':'fixture-only'},body:'{}'});
    assert.equal(seen.url,'/api/trade-access');assert.equal(seen.options.credentials,'same-origin');assert.equal(seen.options.cache,'no-store');assert.equal(seen.options.headers['X-Zuko-CSRF'],'fixture-only');assert.equal(seen.options.body,'{}');assert.equal(seen.options.method,'POST');assert(seen.options.signal instanceof AbortSignal);assert.deepEqual(result.body,{ok:true});assert.equal(f.active.size,0);
  });
  await test('Hung requests abort without needing AbortSignal.timeout',async()=>{
    const f=fixture((url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')))));
    const pending=f.api.json('/api/trade-access');const timer=[...f.active.values()][0];assert.equal(timer.ms,15000);timer.fn();await assert.rejects(pending,/aborted/);assert.equal(f.active.size,0);
  });
  await test('HTTP errors preserve their status and timers clear after JSON and network failures',async()=>{
    const denied=fixture(async()=>({status:401,json:async()=>({error:'Access denied'})}));assert.equal((await denied.api.json('/api')).response.status,401);assert.equal(denied.active.size,0);
    for(const fetch of [async()=>{throw Error('offline');},async()=>({json:async()=>{throw Error('invalid body');}})]){const f=fixture(fetch);await assert.rejects(f.api.json('/api'));assert.equal(f.active.size,0);}
  });
  await test('Parallel app requests have independent abort controllers',async()=>{
    const waits=[];const f=fixture((url,options)=>new Promise((resolve,reject)=>{waits.push({url,options,resolve});options.signal.addEventListener('abort',()=>reject(Error('aborted')));}));
    const first=f.api.json('/first'),second=f.api.json('/second');[...f.active.values()][0].fn();await assert.rejects(first,/aborted/);assert.equal(waits[1].options.signal.aborted,false);waits[1].resolve({json:async()=>({second:true})});assert.deepEqual((await second).body,{second:true});assert.equal(f.active.size,0);
  });
  console.log('\n'+count+' app-network compatibility checks passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

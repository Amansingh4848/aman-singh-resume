'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),auth=require('../trading/source/auth.cjs'),google=require('../trading/source/google-auth.cjs');
const {OAuth2Client}=require('google-auth-library');
let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
async function main(){
  const originalClient=process.env.GOOGLE_CLIENT_ID,clientId='123456789-fixture.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_ID=clientId;
  const state={schema:1,owner:await auth.hashPassword('Owner-fixture-password-2026'),learner:await auth.hashPassword('Learner-fixture-password-2026'),recovery:await auth.hashPassword('Recovery-fixture-password-2026'),ownerVersion:1,learnerVersion:1,signingKey:auth.random(),attempts:{}};
  const keyPair=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
  const certs={fixture:keyPair.publicKey.export({format:'pem',type:'spki'})};
  const originalCerts=OAuth2Client.prototype.getFederatedSignonCertsAsync;
  OAuth2Client.prototype.getFederatedSignonCertsAsync=async()=>({certs});
  const signed=(nonce,changes={},key=keyPair.privateKey)=>{
    const now=Math.floor(Date.now()/1000),payload={iss:'https://accounts.google.com',aud:clientId,sub:'fixture-user-123',email:'fixture@example.test',email_verified:true,iat:now-5,exp:now+300,nonce,...changes};
    const header=Buffer.from(JSON.stringify({alg:'RS256',kid:'fixture'})).toString('base64url');
    const body=header+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url');
    return body+'.'+crypto.sign('RSA-SHA256',Buffer.from(body),key).toString('base64url');
  };
  try{
    await test('Google challenges reject tampering, expiry and use as app sessions',()=>{
      const c=google.challenge(state,100);
      assert.equal(google.readChallenge(c.token,state,101).nonce,c.nonce);
      assert.equal(google.readChallenge(c.token+'x',state,101),null);
      assert.equal(google.readChallenge(c.token,state,600100),null);
      assert.equal(auth.readSession(c.token,state,101),null);
      google.consumeChallenge(state,c.nonce,100);assert.throws(()=>google.consumeChallenge(state,c.nonce,101),/already/);
    });
    await test('Real Google verifier checks signature, issuer, audience, expiry, nonce and verified email',async()=>{
      const nonce=auth.random(),result=await google.verifyCredential(signed(nonce),clientId,nonce);
      assert.match(result.subject,/^[a-f0-9]{64}$/);assert.deepEqual(Object.keys(result),['subject']);
      for(const token of [signed(nonce,{aud:'wrong'}),signed(nonce,{iss:'https://evil.example'}),signed(nonce,{iat:1,exp:2}),signed('other'),signed(nonce,{email_verified:false}),signed(nonce,{},crypto.generateKeyPairSync('rsa',{modulusLength:2048}).privateKey)]){
        await assert.rejects(()=>google.verifyCredential(token,clientId,nonce));
      }
    });
    let stored=structuredClone(state),etag=1,ip=0;
    const provider={get:async()=>({stream:new Response(JSON.stringify(stored)).body,blob:{etag:String(etag)}}),put:async(_,value,opts)=>{if(opts.ifMatch!==String(etag)){const e=Error();e.name='BlobPreconditionFailedError';throw e;}stored=JSON.parse(value);etag++;}};
    const handler=require('../api/trade-access.js').createHandler(async()=>provider);
    async function request(action,{method='GET',body={},cookie='',csrf='',origin='https://aman-singh-resume.vercel.app'}={}){
      const headers={};let result,status;
      await handler({method,query:{action,page:'library'},body:{action,...body},headers:{origin,cookie,'content-type':'application/json','x-zuko-csrf':csrf},socket:{remoteAddress:'fixture-'+ ++ip}},{setHeader:(k,v)=>headers[k]=v,set statusCode(v){status=v;},end:v=>result=JSON.parse(v)});
      return {status,result,headers,cookie:(headers['Set-Cookie']||'').split(';')[0]};
    }
    let googleSession,challenge;
    await test('Google login is nonce-bound, replay-resistant and cannot select owner role',async()=>{
      challenge=await request('google-config');assert.equal(challenge.result.enabled,true);assert.equal(challenge.result.clientId,clientId);
      assert.match(challenge.headers['Set-Cookie'],/HttpOnly; SameSite=Strict; Secure/);
      const body={credential:signed(challenge.result.nonce),role:'owner'};
      assert.equal((await request('google-login',{method:'POST',body})).status,401);
      assert.equal((await request('google-login',{method:'POST',cookie:challenge.cookie,body,origin:'https://evil.example'})).status,403);
      googleSession=await request('google-login',{method:'POST',cookie:challenge.cookie,body});
      assert.equal(googleSession.status,200);assert.equal(googleSession.result.role,'learner');assert.equal(googleSession.result.provider,'google');
      assert.equal((await request('google-login',{method:'POST',cookie:challenge.cookie,body})).status,401);
      assert.equal((await request('content',{cookie:googleSession.cookie})).status,200);
      assert.equal((await request('change-owner',{method:'POST',cookie:googleSession.cookie,csrf:googleSession.result.csrf,body:{newPassword:'Not-an-owner-password-2026'}})).status,403);
      assert(!JSON.stringify(stored).includes('fixture@example.test'));assert(!JSON.stringify(stored).includes('fixture-user-123'));
    });
    await test('Google offline packs require a session and CSRF, not a Google or shared password',async()=>{
      assert.equal((await request('offline-pack',{method:'POST',cookie:googleSession.cookie})).status,403);
      const result=await request('offline-pack',{method:'POST',cookie:googleSession.cookie,csrf:googleSession.result.csrf});
      assert.equal(result.status,200);assert.equal(result.result.sourceRole,'learner');assert.equal(Object.keys(result.result.pages).length,23);
      assert.match(result.headers['Cache-Control'],/no-store/);
      stored.learnerVersion++;assert.equal((await request('session',{cookie:googleSession.cookie})).status,401);
      assert.equal((await request('offline-status',{method:'POST',body:{permit:result.result.permit}})).result.valid,false);
    });
    await test('Unconfigured Google is disabled; SDK is not cached or self-hosted',async()=>{
      delete process.env.GOOGLE_CLIENT_ID;
      assert.equal((await request('google-config')).result.enabled,false);
      assert.equal((await request('session',{cookie:googleSession.cookie})).status,401);
      const html=fs.readFileSync(path.join(root,'trading/app.html'),'utf8'),sw=fs.readFileSync(path.join(root,'trading/sw.js'),'utf8'),js=fs.readFileSync(path.join(root,'trading/google-login.js'),'utf8');
      assert.match(html,/data-google-access hidden/);assert.match(html,/not your Google password/);assert.match(html,/trading\/privacy/);
      assert.match(js,/https:\/\/accounts.google.com\/gsi\/client/);assert(!sw.includes('accounts.google.com'));assert.match(sw,/google-login.js/);
      assert.throws(()=>auth.signSession(state,'owner',Date.now(),{subject:'a'.repeat(64)}),/Invalid/);
    });
  }finally{OAuth2Client.prototype.getFederatedSignonCertsAsync=originalCerts;if(originalClient===undefined)delete process.env.GOOGLE_CLIENT_ID;else process.env.GOOGLE_CLIENT_ID=originalClient;}
  console.log('\n'+count+' Google sign-in checks passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

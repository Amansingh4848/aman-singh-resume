'use strict';
const crypto=require('node:crypto');
const auth=require('./auth.cjs');
const configuredClient=()=>/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(process.env.GOOGLE_CLIENT_ID||'')?process.env.GOOGLE_CLIENT_ID:'';
function challenge(state,now=Date.now()){
  const payload={kind:'google-login-v1',nonce:auth.random(),expires:now+600000};
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  return {nonce:payload.nonce,token:body+'.'+crypto.createHmac('sha256',state.signingKey).update(body).digest('base64url')};
}
function readChallenge(token,state,now=Date.now()){
  try{
    if(typeof token!=='string'||token.length>2048)return null;
    const parts=token.split('.');if(parts.length!==2)return null;
    const [body,sig]=parts;
    if(!auth.equal(sig,crypto.createHmac('sha256',state.signingKey).update(body).digest('base64url')))return null;
    const p=JSON.parse(Buffer.from(body,'base64url').toString());
    return p.kind==='google-login-v1'&&typeof p.nonce==='string'&&p.nonce.length===43&&Number.isFinite(p.expires)&&p.expires>now?p:null;
  }catch{return null;}
}
let client;
async function verifyCredential(credential,clientId,nonce){
  if(typeof credential!=='string'||credential.length>8192)throw Error('Invalid Google credential.');
  const {OAuth2Client}=require('google-auth-library');
  client||=new OAuth2Client();
  // Google's verifier checks the signature, audience, issuer and expiration.
  const ticket=await client.verifyIdToken({idToken:credential,audience:clientId});
  const p=ticket.getPayload();
  if(!p||!auth.equal(p.nonce||'',nonce)||p.email_verified!==true||typeof p.sub!=='string'||!p.sub||p.sub.length>255)throw Error('Invalid Google identity.');
  // No email, name, avatar, Google access token or refresh token is persisted.
  return {subject:crypto.createHash('sha256').update('trade-zuko:'+p.sub).digest('hex')};
}
function consumeChallenge(state,nonce,now=Date.now()){
  const key=crypto.createHash('sha256').update(nonce).digest('hex');
  state.googleUsed=Object.fromEntries(Object.entries(state.googleUsed||{}).filter(([,expiry])=>expiry>now));
  if(state.googleUsed[key]){const error=Error('This Google sign-in has already been used. Please try again.');error.status=401;throw error;}
  state.googleUsed[key]=now+600000;
}
module.exports={configuredClient,challenge,readChallenge,verifyCredential,consumeChallenge};

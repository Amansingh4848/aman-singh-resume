'use strict';
const crypto=require('node:crypto'),{promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const HASH_OPTIONS={N:131072,r:8,p:1,maxmem:160*1024*1024};
const random=()=>crypto.randomBytes(32).toString('base64url');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);};
function validPassword(p){return typeof p==='string'&&p.length>=15&&p.length<=128;}
async function hashPassword(p){if(!validPassword(p))throw Error('Use a password of 15 to 128 characters.');const salt=random();return {salt,hash:(await scrypt(p,salt,64,HASH_OPTIONS)).toString('hex')};}
async function verifyPassword(p,record){if(typeof p!=='string'||p.length>128||!record?.salt||!record?.hash)return false;return equal((await scrypt(p,record.salt,64,HASH_OPTIONS)).toString('hex'),record.hash);}
function signSession(state,role,now=Date.now()){const payload={role,version:role==='owner'?state.ownerVersion:state.learnerVersion,expires:now+(role==='owner'?3600000:43200000),csrf:random()};const body=Buffer.from(JSON.stringify(payload)).toString('base64url');return body+'.'+crypto.createHmac('sha256',state.signingKey).update(body).digest('base64url');}
function readSession(token,state,now=Date.now()){try{if(typeof token!=='string'||token.length>2048)return null;const parts=token.split('.');if(parts.length!==2)return null;const [body,sig]=parts;if(!equal(sig,crypto.createHmac('sha256',state.signingKey).update(body).digest('base64url')))return null;const p=JSON.parse(Buffer.from(body,'base64url').toString());if(!['owner','learner'].includes(p.role)||!Number.isFinite(p.expires)||p.expires<=now||p.version!==(p.role==='owner'?state.ownerVersion:state.learnerVersion)||typeof p.csrf!=='string')return null;return p;}catch{return null;}}
function consumeAttempt(state,ip,now=Date.now()){
  const window=900000,key=crypto.createHmac('sha256',state.signingKey).update(ip).digest('hex').slice(0,32);
  const attempts=Object.fromEntries(Object.entries(state.attempts||{}).filter(([,v])=>v.until>now));
  const row=attempts[key]||{count:0,until:now+window};const global=state.globalAttempt?.until>now?state.globalAttempt:{count:0,until:now+window};
  if(row.count>=8||global.count>=80){const error=Error('Too many attempts. Wait 15 minutes before trying again.');error.status=429;throw error;}
  row.count++;global.count++;attempts[key]=row;state.attempts=attempts;state.globalAttempt=global;return state;
}
module.exports={random,equal,validPassword,hashPassword,verifyPassword,signSession,readSession,consumeAttempt};

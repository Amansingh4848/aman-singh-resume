'use strict';
const auth=require('../trading/source/auth.cjs');
function createHandler(provider){
const STATE='trade-zuko/access-v1.json';
const cookieName=()=>process.env.ZUKO_LOCAL_TEST==='1'?'zuko_local':'__Host-zuko';
const cookies=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(v=>v.trim().split(/=(.*)/s)).filter(v=>v.length>=2));
const send=(res,status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
const setCookie=(res,token,role)=>res.setHeader('Set-Cookie',`${cookieName()}=${token}; Path=/; HttpOnly; SameSite=Strict; ${process.env.ZUKO_LOCAL_TEST==='1'?'':'Secure; '}Max-Age=${token?(role==='owner'?3600:43200):0}`);
let blobPromise;
async function storage(){return blobPromise||(blobPromise=provider());}
async function read(){const {get}=await storage();const result=await get(STATE,{access:'private',useCache:false});if(!result)throw Error('Access is not configured.');const state=JSON.parse(await new Response(result.stream).text());if(state.schema!==1||!state.signingKey||!state.owner?.hash||!state.learner?.hash)throw Error('Invalid access configuration.');return {state,etag:result.blob.etag};}
async function update(mutator){const {put}=await storage();for(let tries=0;tries<4;tries++){const record=await read();const result=await mutator(record.state);try{await put(STATE,JSON.stringify(record.state),{access:'private',allowOverwrite:true,addRandomSuffix:false,ifMatch:record.etag,contentType:'application/json',cacheControlMaxAge:60});return {state:record.state,result};}catch(e){if(e.name!=='BlobPreconditionFailedError')throw e;}}const e=Error('Another update is in progress. Please try again.');e.status=409;throw e;}
function originOK(req){const allowed=['https://aman-singh-resume.vercel.app'];if(process.env.VERCEL_URL)allowed.push('https://'+process.env.VERCEL_URL);if(process.env.ZUKO_LOCAL_TEST==='1')allowed.push('http://127.0.0.1:8765');return allowed.includes(req.headers.origin);}
async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store, max-age=0');res.setHeader('Vary','Cookie');res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(res,405,{error:'Method not allowed.'});}
  try{
    const action=req.method==='GET'?req.query?.action:req.body?.action;
    if(req.method==='POST'){
      if(!originOK(req)||!String(req.headers['content-type']||'').startsWith('application/json'))return send(res,403,{error:'Request not allowed.'});
      if(!req.body||Buffer.byteLength(JSON.stringify(req.body))>4096)return send(res,400,{error:'Invalid request.'});
    }
    if(req.method==='POST'&&action==='logout'){setCookie(res,'');return send(res,200,{ok:true});}
    const record=await read();let state=record.state;
    const session=auth.readSession(cookies(req)[cookieName()],state);
    if(req.method==='GET'){
      if(!['session','content'].includes(action))return send(res,400,{error:'Unknown request.'});
      if(!session)return send(res,401,{error:'Please log in to Trade Zuko.'});
      if(action==='session')return send(res,200,{role:session.role,csrf:session.csrf,expires:session.expires});
      const page=typeof req.query.page==='string'?req.query.page:'library';
      const pages=require('../trading/source/app-pages.json');
      if(!Object.hasOwn(pages,page))return send(res,404,{error:'Lesson not found.'});
      return send(res,200,{page,title:pages[page].title,html:pages[page].html});
    }
    if(!['login','change-learner','change-owner','recover-owner'].includes(action))return send(res,400,{error:'Unknown request.'});
    if(action.startsWith('change-')&&(!session||session.role!=='owner'||!auth.equal(req.headers['x-zuko-csrf']||'',session.csrf)))return send(res,403,{error:'Owner access is required.'});
    // The counter is durable across server instances. Never trust a caller-supplied IP header in production.
    const ip=process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||'unknown').split(',')[0].trim():String(req.socket?.remoteAddress||'local');
    state=(await update(s=>auth.consumeAttempt(s,ip))).state;
    if(action==='login'){
      const role=req.body.role;if(!['owner','learner'].includes(role))return send(res,400,{error:'Choose learner or owner access.'});
      if(!await auth.verifyPassword(req.body.password,state[role]))return send(res,401,{error:'The password is incorrect. Please try again.'});
      const token=auth.signSession(state,role);setCookie(res,token,role);const s=auth.readSession(token,state);return send(res,200,{role,csrf:s.csrf,expires:s.expires});
    }
    const recovering=action==='recover-owner',target=action==='change-learner'?'learner':'owner';
    if(!auth.validPassword(req.body.newPassword))return send(res,400,{error:'Use 15 to 128 characters for the new password.'});
    if(!await auth.verifyPassword(recovering?req.body.recoveryKey:req.body.ownerPassword,recovering?state.recovery:state.owner))return send(res,401,{error:recovering?'Recovery key is incorrect.':'Owner password is incorrect.'});
    if(await auth.verifyPassword(req.body.newPassword,state[target==='owner'?'learner':'owner']))return send(res,400,{error:'Owner and learner passwords must be different.'});
    const newHash=await auth.hashPassword(req.body.newPassword),expectedOwner=state.ownerVersion;
    const changed=await update(s=>{if(s.ownerVersion!==expectedOwner){const e=Error('Owner access changed. Log in again.');e.status=409;throw e;}s[target]=newHash;s[target+'Version']++;s.updatedAt=new Date().toISOString();});
    if(target==='owner'){setCookie(res,'');return send(res,200,{ok:true,loggedOut:true,message:'Owner password changed. Log in with your new owner password.'});}
    return send(res,200,{ok:true,message:'Learner password changed. Old learner sessions are now invalid. Share only the new learner password.'});
  }catch(e){return send(res,e.status||503,{error:e.status?e.message:'Secure access is temporarily unavailable. Please try again shortly.'});}
}
return handler;
}
module.exports=createHandler(()=>import('@vercel/blob'));
module.exports.createHandler=createHandler;

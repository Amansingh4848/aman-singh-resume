/* A bounded JSON request also works in Safari without AbortSignal.timeout(). */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.TradeNetwork=factory(root);
})(typeof window==='undefined'?null:window,function(env){
  'use strict';
  async function json(url,options={},timeout=15000){
    const controller=new env.AbortController();
    const timer=env.setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await env.fetch(url,{...options,signal:controller.signal});
      const body=await response.json();
      return {response,body};
    }finally{env.clearTimeout(timer);}
  }
  return {json};
});

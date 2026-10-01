'use strict';
// Keep persistence private, strongly consistent, and protected against lost updates.
function blobAdapter(store){
  return {
    async get(key){
      const record=await store.getWithMetadata(key,{type:'text',consistency:'strong'});
      return record?{stream:new Response(record.data).body,blob:{etag:record.etag}}:null;
    },
    async put(key,value,options){
      if(!options?.ifMatch)throw Error('Conditional writes are required.');
      const result=await store.set(key,value,{onlyIfMatch:options.ifMatch});
      if(!result.modified){const error=Error('State changed.');error.name='BlobPreconditionFailedError';throw error;}
      return result;
    }
  };
}
async function runHandler(handler,request,context={}){
  const headers=new Headers(),url=new URL(request.url);let status=200,body='';
  let input;
  if(request.method==='POST'){
    // Bound the input before parsing, including chunked requests without Content-Length.
    const reader=request.body?.getReader();let length=0;const chunks=[];
    if(reader){for(;;){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>12288){await reader.cancel();return Response.json({error:'Request too large.'},{status:413,headers:{'Cache-Control':'no-store'}});}chunks.push(value);}}
    try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return Response.json({error:'Invalid request.'},{status:400,headers:{'Cache-Control':'no-store'}});}
  }
  const response={
    setHeader(name,value){if(Array.isArray(value)){headers.delete(name);value.forEach(v=>headers.append(name,v));}else headers.set(name,String(value));},
    get statusCode(){return status;},set statusCode(value){status=value;},
    status(value){status=value;return this;},
    json(value){body=JSON.stringify(value);return this;},
    end(value){body=value||'';}
  };
  await handler({method:request.method,headers:Object.fromEntries(request.headers),query:Object.fromEntries(url.searchParams),body:input,trustedClientIP:context.ip||'unknown',socket:{remoteAddress:context.ip||'unknown'}},response);
  return new Response(body,{status,headers});
}
module.exports={blobAdapter,runHandler};

/* Encrypted, opt-in learning snapshots. No credentials or owner powers are cached. */
(function(scope,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else scope.TradeOffline=api;})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const ITERATIONS=600000,DB='trade-zuko-offline-v1',STORE='packs',KEY='study';
  const context=new TextEncoder().encode('Trade Zuko offline study / v1');
  function passwordOK(value){return typeof value==='string'&&value.length>=15&&value.length<=128;}
  async function keyFor(password,salt,crypto){
    if(!passwordOK(password))throw Error('Enter your app password (15–128 characters).');
    const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  function validBundle(bundle){
    return bundle?.schema===1&&['learner','owner'].includes(bundle.sourceRole)&&typeof bundle.permit==='string'&&typeof bundle.savedAt==='string'&&bundle.pages&&typeof bundle.pages==='object'&&Object.keys(bundle.pages).length>0&&Object.values(bundle.pages).every(p=>typeof p.title==='string'&&typeof p.html==='string');
  }
  async function seal(bundle,password,crypto){
    if(!validBundle(bundle))throw Error('The study download is incomplete. Please try again.');
    const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await keyFor(password,salt,crypto);
    const data=new TextEncoder().encode(JSON.stringify(bundle));
    const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:context},key,data);
    return {schema:1,salt,iv,cipher,savedAt:bundle.savedAt,sourceRole:bundle.sourceRole,pages:Object.keys(bundle.pages).length,bytes:cipher.byteLength};
  }
  async function unseal(record,password,crypto){
    if(record?.schema!==1||record.salt?.byteLength!==16||record.iv?.byteLength!==12||!record.cipher?.byteLength)throw Error('No complete offline download was found. Log in online and download the lessons first.');
    const key=await keyFor(password,record.salt,crypto);let plain;
    try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv,additionalData:context},key,record.cipher);}catch{throw Error('That password cannot unlock this download. Use the password that was current when you saved it, or log in online and download it again.');}
    const bundle=JSON.parse(new TextDecoder().decode(plain));if(!validBundle(bundle))throw Error('This offline download is damaged. Reconnect and download it again.');return bundle;
  }
  function database(idb){return new Promise((resolve,reject)=>{
    if(!idb)return reject(Error('Offline storage is unavailable in this browser. Use your phone’s main browser with storage enabled.'));
    const request=idb.open(DB,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('Offline storage could not be opened. Check your browser storage settings.'));
    request.onblocked=()=>reject(Error('Close other Trade Zuko tabs and retry the download.'));
  });}
  async function storage(idb,operation,value){
    const db=await database(idb);
    return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,operation==='read'?'readonly':'readwrite'),store=tx.objectStore(STORE);let request;
      if(operation==='read')request=store.get(KEY);else if(operation==='save')request=store.put(value,KEY);else request=store.delete(KEY);
      tx.oncomplete=()=>{db.close();resolve(operation==='read'?request.result:undefined);};
      tx.onerror=tx.onabort=()=>{db.close();reject(Error('Offline storage could not be saved. Free some space or use a non-private browser window, then retry.'));};
    });
  }
  async function prepareShell(win){
    if(!win.isSecureContext||!win.navigator.serviceWorker||!win.crypto?.subtle)throw Error('Open the secure HTTPS app link in Safari, Chrome or Edge to save lessons.');
    const reg=await win.navigator.serviceWorker.register('/trading/sw.js',{scope:'/trading/'});
    let readinessTimer;
    const ready=await Promise.race([win.navigator.serviceWorker.ready,new Promise((_,reject)=>{readinessTimer=win.setTimeout(()=>reject(Error('The app is still preparing. Keep this page open, then try downloading again.')),25000);})]).finally(()=>win.clearTimeout(readinessTimer));
    if(reg.waiting)throw Error('A new app version is ready. Tap “Update to the latest app”, then download your lessons.');
    const worker=ready.active;if(!worker)throw Error('The app is not ready yet. Reload and try again.');
    await new Promise((resolve,reject)=>{
      const channel=new win.MessageChannel(),timer=win.setTimeout(()=>{channel.port1.close();reject(Error('Could not verify the offline app files. Use “Update to the latest app”, then retry.'));},15000);
      channel.port1.onmessage=event=>{win.clearTimeout(timer);channel.port1.close();if(event.data?.ready===true)resolve();else reject(Error('Some app files are missing. Reconnect and retry the download.'));};
      worker.postMessage({type:'VERIFY_OFFLINE_SHELL'},[channel.port2]);
    });
  }
  return {ITERATIONS,seal,unseal,validBundle,prepareShell,read:idb=>storage(idb,'read'),save:(idb,record)=>storage(idb,'save',record),remove:idb=>storage(idb,'remove')};
});

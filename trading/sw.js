'use strict';
// Cache only the login shell and public presentation assets, never protected responses.
const CACHE='trade-zuko-shell-2026-09-21-v3';
const ASSETS=['/trading/app','/trading/install','/trading/install.css?v=1','/trading/install.js?v=1','/trading/icon.svg','/trading/icon-180.png','/trading/icon-192.png','/trading/icon-512.png','/trading/manifest.webmanifest','/worlds.css?v=2','/channels.css?v=1','/identity.css?v=1','/trading-lab.css?v=1','/trading/learning.css?v=1','/motion-quality.js?v=1','/worlds.js?v=2','/identity.js?v=1','/trading/math.js?v=1','/trading/learning.js?v=1','/trading/app.js?v=2','/trading-lab.js?v=2','/assets/aman-singh.jpg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('trade-zuko-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(event.request.mode==='navigate'&&['/trading/app','/trading/install'].includes(url.pathname)){
    event.respondWith(fetch(event.request).then(response=>{if(!response.ok)throw Error('Unavailable');return response;}).catch(()=>caches.match(url.pathname)));return;
  }
  const key=url.pathname+url.search;if(!ASSETS.includes(key))return;
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(key))||fetch(event.request)));
});

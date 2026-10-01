(() => {
'use strict';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],offline=window.TradeOffline;
let session=null,currentPage='library',navigation=0,checking=false,offlineMode=false,offlineBundle=null,manualLock=false,offlineBusy=false,accessGeneration=0;
const status=$('[data-app-status]'),content=$('[data-app-content]'),authPanel=$('[data-auth-panel]'),workspace=$('[data-app-workspace]'),ownerPanel=$('[data-owner-panel]');
const appMotion=$('[data-app-motion]');
function motionLabel(){const off=document.documentElement.dataset.motion==='off';appMotion.textContent=off?'Play motion':'Pause motion';appMotion.setAttribute('aria-label',off?'Play app animations':'Pause app animations');}
appMotion.addEventListener('click',()=>{$('.world-motion').click();motionLabel();});
$('[data-app-theme]').addEventListener('click',()=>$('.theme-toggle').click());motionLabel();
async function api(action,data){
  const options={credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)};
  let url='/api/trade-access?action='+encodeURIComponent(action);
  if(data){options.method='POST';options.headers={'Content-Type':'application/json','X-Zuko-CSRF':session?.csrf||''};options.body=JSON.stringify({action,...data});url='/api/trade-access';}
  const response=await fetch(url,options),result=await response.json();
  if(!response.ok){const e=Error(result.error||'Request failed.');e.status=response.status;throw e;}return result;
}
function canRead(){return !!session||offlineMode&&!!offlineBundle;}
function lock(message='Please log in to Trade Zuko.'){
  session=null;offlineMode=false;offlineBundle=null;navigation++;accessGeneration++;
  content.replaceChildren();workspace.hidden=true;ownerPanel.hidden=true;authPanel.hidden=false;
  $('[data-app-logout]').hidden=true;status.textContent=message;offlineControls();
}
function authorize(s){
  session=s;offlineMode=false;manualLock=false;authPanel.hidden=true;workspace.hidden=false;ownerPanel.hidden=s.role!=='owner';
  $('[data-app-logout]').hidden=false;status.textContent=s.role==='owner'?'Owner access — you control the learner password.':'Learner access — welcome to Trade Zuko.';offlineControls();
}
function offlineControls(){
  $('[data-offline-download]').hidden=!session||offlineMode;
  $('[data-offline-lock]').hidden=!offlineMode;
  $('[data-offline-mode]').hidden=!offlineMode;
  $('[data-offline-open]').hidden=!offlineBundle||offlineMode;
  if(offlineMode)$('[data-offline-mode]').textContent='Offline study mode · saved '+new Date(offlineBundle.savedAt).toLocaleDateString()+'. Videos, social feeds, payments and owner controls need internet.';
}
async function refreshDownloadInfo(){
  try{
    const record=await offline.read(indexedDB),message=record?'Saved on '+new Date(record.savedAt).toLocaleDateString()+' · '+record.pages+' learning sections · '+(record.bytes/1024/1024).toFixed(1)+' MB encrypted.':'No offline download on this device yet. Log in online, then choose “Download all lessons”.';
    $('[data-offline-saved]').textContent=message;$('[data-offline-summary]').textContent=message;
    $('[data-offline-remove]').hidden=!record;
  }catch(e){$('[data-offline-summary]').textContent=e.message;$('[data-offline-saved]').textContent=e.message;}
  offlineControls();
}
async function validateSaved(bundle){
  if(navigator.onLine===false)return true;
  try{
    const result=await api('offline-status',{permit:bundle.permit});
    if(!result.valid){
      await offline.remove(indexedDB);offlineBundle=null;await refreshDownloadInfo();
      const e=Error('Access has changed. Log in online with the current password and download the lessons again.');e.revoked=true;throw e;
    }
  }catch(e){if(e.revoked)throw e;if(e.status===403)throw Error('This address could not verify saved access. Use Aman’s current app link.');}
  return true; // A network/server outage must not defeat the requested offline access.
}
async function enterOffline(bundle,scroll=false){
  if(!bundle)return;const generation=accessGeneration;
  await validateSaved(bundle);if(generation!==accessGeneration)return;
  offlineBundle=bundle;offlineMode=true;session=null;manualLock=false;
  authPanel.hidden=true;ownerPanel.hidden=true;workspace.hidden=false;$('[data-app-logout]').hidden=true;
  status.textContent='Offline library unlocked. Your saved lessons and study tools are ready.';offlineControls();await showPage(requestedPage(),scroll);
}
function requestedPage(){const match=location.hash.match(/^#page=(.+)$/);if(!match)return 'library';try{return decodeURIComponent(match[1]);}catch{return 'library';}}
function render(data,offlineView){
  if(!offlineView){content.innerHTML=data.html;return;}
  const template=document.createElement('template');template.innerHTML=data.html;
  template.content.querySelectorAll('iframe,video,audio').forEach(n=>n.remove());
  template.content.querySelectorAll('img[src^="http"]').forEach(n=>n.remove());
  template.content.querySelectorAll('[data-feed-status]').forEach(n=>n.textContent='You are viewing a downloaded snapshot. Videos and new social posts need an internet connection.');
  content.replaceChildren(template.content);
}
async function showPage(page,scroll=false){
  if(!canRead())return;
  const parts=page.split('#'),anchor=parts[1];page=parts[0];const id=++navigation;currentPage=page;
  content.setAttribute('aria-busy','true');
  try{
    let data;
    if(offlineMode){data=Object.hasOwn(offlineBundle.pages,page)?offlineBundle.pages[page]:null;if(!data){const e=Error('This page is not in the saved download.');e.status=404;throw e;}}
    else{const response=await fetch('/api/trade-access?action=content&page='+encodeURIComponent(page),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});data=await response.json();if(!response.ok){const e=Error(data.error||'Unable to load lesson.');e.status=response.status;throw e;}}
    if(id!==navigation||!canRead())return;
    render(data,offlineMode);window.TradeLearning.init(content);window.TradeLab?.init(content);
    all('[data-app-route]').forEach(b=>{if(b.dataset.appRoute===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(anchor)content.querySelector('#'+CSS.escape(anchor))?.scrollIntoView({block:'start'});
    else if(scroll)workspace.scrollIntoView({behavior:document.documentElement.dataset.motion==='off'?'instant':'smooth',block:'start'});
    if(!offlineMode)loadVideos();
  }catch(e){
    if(id!==navigation)return;
    if(e.status===401||e.status===403){lock('Access changed or expired. Log in again with the current password.');}
    else if(e.status!==404&&offlineBundle&&!offlineMode){await enterOffline(offlineBundle,scroll);}
    else{content.replaceChildren();const note=document.createElement('p');note.className='shell z-feedback';note.textContent=(e.status===404?'That page is not in this library.':'A connection is needed for fresh lessons. Unlock your saved download to keep learning offline.')+' Choose a page above to try again.';content.append(note);}
  }finally{if(id===navigation)content.removeAttribute('aria-busy');}
}
function navigate(page){if(requestedPage()===page)showPage(page,true);else location.hash='page='+encodeURIComponent(page);}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-app-route]');if(b){navigate(b.dataset.appRoute);return;}
  const local=e.target.closest('[data-app-content] a[href^="#"]');if(local){e.preventDefault();content.querySelector('#'+CSS.escape(local.getAttribute('href').slice(1)))?.scrollIntoView({block:'start'});return;}
  const a=e.target.closest('[data-app-content] a[href^="/trading/"]');if(a){const url=new URL(a.href);if(!['/trading/app','/trading/install'].includes(url.pathname)){e.preventDefault();navigate(url.pathname.slice('/trading/'.length)+url.hash);return;}}
  if(offlineMode&&e.target.closest('[data-app-content] a[href^="http"]')){e.preventDefault();status.textContent='That video, social post or external source needs internet. Reconnect, then log in online to open it.';}
});
addEventListener('hashchange',()=>{if(canRead()&&location.hash.startsWith('#page='))showPage(requestedPage(),true);});
async function formRequest(form,task){
  const feedback=form.querySelector('.z-feedback'),button=form.querySelector('button[type=submit]');
  button.disabled=true;feedback.textContent='Please wait…';feedback.dataset.error='false';
  try{await task(new FormData(form),feedback);form.reset();}
  catch(e){feedback.textContent=e.message||'Connection unavailable. Please try again.';feedback.dataset.error='true';}
  finally{button.disabled=false;}
}
$('[data-login-form]').addEventListener('submit',e=>{
  e.preventDefault();formRequest(e.currentTarget,async d=>{
    const s=await api('login',{role:d.get('role'),password:d.get('password')});
    accessGeneration++;offlineBundle=null;authorize(s);await showPage(requestedPage(),true);
    // Only retain a previously opted-in copy in memory after validating this exact password.
    try{const record=await offline.read(indexedDB);if(record){const bundle=await offline.unseal(record,d.get('password'),crypto);await validateSaved(bundle);offlineBundle=bundle;offlineControls();}}catch{}
  });
});
all('[data-password-form]').forEach(form=>form.addEventListener('submit',e=>{
  e.preventDefault();formRequest(form,async(d,feedback)=>{
    if(d.get('newPassword')!==d.get('confirmPassword'))throw Error('The two new passwords do not match.');
    const result=await api('change-'+form.dataset.passwordForm,{ownerPassword:d.get('ownerPassword'),newPassword:d.get('newPassword')});
    if(result.loggedOut)lock(result.message);else feedback.textContent=result.message+' Offline copies cannot be revoked until their devices reconnect.';
  });
}));
$('[data-recovery-form]').addEventListener('submit',e=>{
  e.preventDefault();formRequest(e.currentTarget,async(d,feedback)=>{
    if(d.get('newPassword')!==d.get('confirmPassword'))throw Error('The two new passwords do not match.');
    const result=await api('recover-owner',{recoveryKey:d.get('recoveryKey'),newPassword:d.get('newPassword')});lock(result.message);feedback.textContent=result.message;
  });
});
$('[data-app-logout]').addEventListener('click',async()=>{
  manualLock=true;
  try{await api('logout',{});lock('You are logged out. Your encrypted download stays saved; its password is required to reopen it.');}
  catch{lock('This screen is locked. Reconnect and log out again to clear the server session.');}
});
$('[data-offline-save]').addEventListener('submit',e=>{
  e.preventDefault();if(offlineBusy)return;offlineBusy=true;
  formRequest(e.currentTarget,async(d,feedback)=>{
    if(!session||offlineMode)throw Error('Log in online before downloading.');
    if(!d.get('consent'))throw Error('Confirm that you want to save an encrypted copy on this device.');
    const generation=accessGeneration;
    feedback.textContent='Preparing the offline app files…';await offline.prepareShell(window);
    feedback.textContent='Downloading all learning sections…';const bundle=await api('offline-pack',{password:d.get('password')});
    feedback.textContent='Encrypting your download on this device…';const record=await offline.seal(bundle,d.get('password'),crypto);
    if(generation!==accessGeneration||!session)throw Error('Access changed during download. Log in and retry.');
    await offline.save(indexedDB,record);if(generation!==accessGeneration)return;offlineBundle=bundle;
    try{await navigator.storage?.persist?.();}catch{}
    await refreshDownloadInfo();feedback.textContent='Download complete: all '+record.pages+' learning sections are ready offline. Test “Read saved lessons” before travelling.';
  }).finally(()=>offlineBusy=false);
});
$('[data-offline-login]').addEventListener('submit',e=>{
  e.preventDefault();formRequest(e.currentTarget,async d=>{
    const generation=accessGeneration,record=await offline.read(indexedDB),bundle=await offline.unseal(record,d.get('password'),crypto);
    if(generation!==accessGeneration)return;await enterOffline(bundle,true);
  });
});
$('[data-offline-open]').addEventListener('click',async()=>{try{await enterOffline(offlineBundle,true);}catch(e){lock(e.message);}});
$('[data-offline-lock]').addEventListener('click',()=>{manualLock=true;lock('Saved lessons are locked. Enter your download password to reopen them.');});
$('[data-offline-remove]').addEventListener('click',async()=>{
  if(!confirm('Remove only the downloaded learning pack from this device? Your journal and read markers will stay.'))return;
  try{accessGeneration++;await offline.remove(indexedDB);offlineBundle=null;if(offlineMode)lock('Offline download removed. Log in online to continue.');await refreshDownloadInfo();$('[data-offline-operation]').textContent='Saved learning pack removed. You can download it again while online; your notes were not removed.';}
  catch(e){$('[data-offline-operation]').textContent=e.message;}
});
async function check(initial=false){
  if(checking||manualLock)return;checking=true;const generation=accessGeneration;
  try{
    if(offlineMode){try{await validateSaved(offlineBundle);}catch(e){lock(e.message);}return;}
    const s=await api('session');if(generation!==accessGeneration||manualLock)return;const hadSession=!!session;authorize(s);if(initial||!hadSession)await showPage(requestedPage());
  }catch(e){
    if(generation!==accessGeneration||manualLock)return;
    if(!e.status&&offlineBundle){try{await enterOffline(offlineBundle);}catch(error){lock(error.message);}}
    else if(e.status>=500&&offlineBundle){try{await enterOffline(offlineBundle);}catch(error){lock(error.message);}}
    else lock(e.status===401?'Enter your learner password, or unlock an existing offline download below.':'Internet is unavailable. Use “Open downloaded lessons offline” if you saved a pack on this device.');
  }finally{checking=false;}
}
document.addEventListener('visibilitychange',()=>{content.hidden=true;if(!document.hidden)check().finally(()=>content.hidden=false);});
addEventListener('pageshow',e=>{if(e.persisted)check(true);});
addEventListener('offline',()=>{if(offlineBundle)enterOffline(offlineBundle).catch(e=>lock(e.message));else lock('You are offline. Open your downloaded lessons with the password used to save them.');});
addEventListener('online',()=>check(true));
setInterval(()=>{if(canRead()&&!document.hidden)check();},60000);
async function loadVideos(){
  const area=content.querySelector('[data-app-videos]');if(!area)return;
  const grid=area.querySelector('[data-video-grid]'),notice=area.querySelector('[data-feed-status]');
  try{
    const response=await fetch('/api/youtube?channel=trading',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();
    const data=await response.json();if(!area.isConnected||!session||offlineMode)return;
    grid.replaceChildren();
    for(const v of data.videos){
      if(!/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(v.url))continue;
      const a=document.createElement('a');a.className='live-video-card';a.href=v.url;a.target='_blank';a.rel='noopener noreferrer';
      const img=document.createElement('img');img.src=v.thumbnail;img.alt='';img.width=480;img.height=360;img.loading='lazy';
      const label=document.createElement('span');label.className='live-video-caption';label.textContent=v.title;a.append(img,label);grid.append(a);
    }
    notice.textContent=data.stale?'Showing recent cached channel updates. Open YouTube for the newest uploads.':'Latest public YouTube uploads. Open any thumbnail to watch.';
    area.querySelector('[data-video-search]')?.addEventListener('input',e=>{let n=0;[...grid.children].forEach(a=>{a.hidden=!a.textContent.toLowerCase().includes(e.target.value.toLowerCase());if(!a.hidden)n++;});const count=area.querySelector('[data-result-count]');if(count)count.textContent=n+' videos';});
    const count=area.querySelector('[data-result-count]');if(count)count.textContent=grid.children.length+' videos';
  }catch{if(notice)notice.textContent='Video updates need internet. Your downloaded study lessons remain available.';}
}
refreshDownloadInfo();check(true);
})();

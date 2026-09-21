/* Browser installation is progressive enhancement; manual instructions always remain available. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else api.init(root);
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  function device(nav){
    if(/iPad|iPhone|iPod/i.test(nav.userAgent)||nav.platform==='MacIntel'&&nav.maxTouchPoints>1)return 'ios';
    return /Android/i.test(nav.userAgent)?'android':'desktop';
  }
  function installationLink(location){
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)?null:location.origin+'/trading/install';
  }
  function controller(){
    let promptEvent=null,busy=false,complete=false;
    return {
      capture(event){event.preventDefault();if(!complete)promptEvent=event;},
      available(){return !!promptEvent&&!busy&&!complete;},
      installed(){complete=true;promptEvent=null;},
      async prompt(){
        if(complete)return 'installed';
        if(busy)return 'busy';
        if(!promptEvent)return 'manual';
        const event=promptEvent;promptEvent=null;busy=true;
        try{const answer=await event.prompt();const choice=answer?.outcome?answer:await event.userChoice;return choice?.outcome==='accepted'?'accepted':'dismissed';}
        catch{return 'failed';}
        finally{busy=false;}
      }
    };
  }
  function init(win){
    const doc=win.document,nav=win.navigator,$=s=>doc.querySelector(s),all=s=>[...doc.querySelectorAll(s)],type=device(nav),state=controller();
    const modal=$('#z-install-dialog'),desktop=$('[data-install-desktop]'),standalone=win.matchMedia('(display-mode: standalone)');
    let opener=null,installed=standalone.matches||nav.standalone===true;
    const say=message=>all('[data-install-status]').forEach(n=>n.textContent=message);
    function refresh(){
      if(desktop)desktop.hidden=installed||type!=='desktop'||!state.available();
      all('[data-install-device]').forEach(a=>{a.hidden=installed;});
      all('.z-install-banner').forEach(n=>n.hidden=installed);
      if(installed)say('Trade Zuko is installed. Open it from your Home Screen or continue to the app.');
    }
    function instructions(target,message){
      if(!modal||typeof modal.showModal!=='function'){win.location.href='/trading/install?device='+target;return;}
      opener=doc.activeElement;
      modal.querySelectorAll('[data-guide]').forEach(n=>n.hidden=n.dataset.guide!==target);
      const note=modal.querySelector('[data-install-dialog-note]');
      note.textContent=message||(type==='desktop'?'These steps are for your '+(target==='ios'?'iPhone or iPad':'Android phone')+'. Open this page on that device first.':'If you opened this inside another app, open it in '+(target==='ios'?'Safari':'Chrome')+' first.');
      if(!modal.open)modal.showModal();
      modal.querySelector('[data-install-close]').focus();
    }
    async function request(target){
      if(installed){say('Trade Zuko is already open as an installed app.');return;}
      // An Android-labelled button must never install a desktop app or open an iOS prompt.
      if(target==='ios'||target!==type||!state.available()){instructions(target==='desktop'?'android':target);return;}
      const pending=state.prompt();refresh();
      const result=await pending;
      const messages={accepted:'Installation accepted. Your browser will finish adding Trade Zuko; look for its icon.',dismissed:'Installation was cancelled. You can try again from your browser’s menu.',failed:'The install prompt could not open. Use your browser’s installation menu.',manual:'Use your browser’s installation menu.',busy:'An installation prompt is already open.',installed:'Trade Zuko is installed.'};
      say(messages[result]);refresh();
      if(['dismissed','failed','manual'].includes(result)&&target!=='desktop')instructions(target,messages[result]);
    }
    all('[data-install-device]').forEach(a=>a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();request(a.dataset.installDevice);}));
    desktop?.addEventListener('click',()=>request('desktop'));
    win.addEventListener('beforeinstallprompt',event=>{state.capture(event);refresh();});
    win.addEventListener('appinstalled',()=>{installed=true;state.installed();modal?.close();refresh();});
    standalone.addEventListener?.('change',event=>{installed=event.matches||nav.standalone===true;if(installed)state.installed();refresh();});
    modal?.querySelector('[data-install-close]')?.addEventListener('click',()=>modal.close());
    modal?.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
    modal?.addEventListener('close',()=>opener?.focus());
    const selected=new URLSearchParams(win.location.search).get('device');
    if(['ios','android'].includes(selected))all('.z-install-instructions [data-guide]').forEach(n=>n.dataset.recommended=String(n.dataset.guide===selected));
    const share=installationLink(win.location),input=$('[data-install-link]'),copy=$('[data-copy-install]'),copyStatus=$('[data-copy-status]');
    if(input)input.value=share||'';
    if(copy){
      copy.disabled=!share;
      if(!share)copyStatus.textContent='Local preview: this address works only on this computer. Use the hosted installation page on your phone.';
      copy.addEventListener('click',async()=>{
        try{if(!nav.clipboard?.writeText)throw Error();await nav.clipboard.writeText(share);copyStatus.textContent='Link copied. Send it to your phone and open it in Safari or Chrome.';}
        catch{input.focus();input.select();copyStatus.textContent='Select and copy the link above manually; automatic copying is unavailable.';}
      });
    }
    if(win.location.hostname.endsWith('.vercel.app')&&win.location.hostname!=='aman-singh-resume.vercel.app')all('[data-install-release]').forEach(n=>{n.hidden=false;n.textContent='Preview build: Vercel sign-in may be required on another device. Public learner launch is not yet available at this address.';});
    refresh();
    if('serviceWorker'in nav){
      nav.serviceWorker.register('/trading/sw.js',{scope:'/trading/'}).then(reg=>{
        const update=$('[data-app-update]');
        const waiting=()=>{if(update&&reg.waiting)update.hidden=false;};waiting();
        reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',waiting));
        let requested=false,refreshing=false;
        update?.addEventListener('click',()=>{if(reg.waiting){requested=true;reg.waiting.postMessage({type:'ACTIVATE_UPDATE'});}});
        nav.serviceWorker.addEventListener('controllerchange',()=>{if(requested&&!refreshing){refreshing=true;win.location.reload();}});
      }).catch(()=>say('The app could not prepare its offline opening screen. You can still use it online; reopen this page in Safari or Chrome to retry.'));
    }
  }
  return {device,installationLink,controller,init};
});

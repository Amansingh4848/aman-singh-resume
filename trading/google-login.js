(() => {
'use strict';
let loading;
function loadLibrary(){
  if(window.google?.accounts?.id)return Promise.resolve();
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    const timeout=setTimeout(()=>{script.remove();loading=null;reject(Error('Google sign-in is unavailable. Check your connection and try again.'));},15000);
    script.onload=()=>{clearTimeout(timeout);if(window.google?.accounts?.id)resolve();else{loading=null;reject(Error('Google sign-in could not load.'));}};
    script.onerror=()=>{clearTimeout(timeout);script.remove();loading=null;reject(Error('Google sign-in could not load. You can still use your learner password.'));};
    document.head.append(script);
  });
  return loading;
}
window.TradeGoogle={
  init({request,onLogin}){
    const area=document.querySelector('[data-google-access]'),button=area.querySelector('[data-google-button]'),feedback=area.querySelector('[data-google-status]'),retry=area.querySelector('[data-google-retry]');
    let busy=false,generation=0;
    async function start(){
      const current=++generation;retry.hidden=true;button.replaceChildren();
      try{
        const config=await request('google-config');if(current!==generation)return;
        if(!config.enabled){area.hidden=true;return;}
        area.hidden=false;feedback.textContent='Loading secure Google sign-in…';
        await loadLibrary();if(current!==generation)return;
        window.google.accounts.id.initialize({client_id:config.clientId,nonce:config.nonce,auto_select:false,button_auto_select:false,ux_mode:'popup',callback:async response=>{
          if(busy||current!==generation)return;busy=true;feedback.textContent='Verifying your Google sign-in…';button.setAttribute('aria-busy','true');
          try{const session=await request('google-login',{credential:response.credential});if(current!==generation)return;await onLogin(session);feedback.textContent='Signed in as a learner.';}
          catch(error){feedback.textContent=error.message||'Google sign-in failed.';button.replaceChildren();retry.hidden=false;}
          finally{busy=false;button.removeAttribute('aria-busy');}
        }});
        window.google.accounts.id.renderButton(button,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'pill',width:Math.max(200,Math.min(320,Math.floor(area.getBoundingClientRect().width)))});
        feedback.textContent='Learner access only. Personal classes are enrolled separately.';
      }catch(error){if(current!==generation)return;area.hidden=false;feedback.textContent=error.message||'Google sign-in needs an internet connection.';retry.hidden=false;}
    }
    retry.addEventListener('click',start);
    start();
    return {refresh:start,logout(){generation++;window.google?.accounts?.id?.disableAutoSelect();start();}};
  }
};
})();

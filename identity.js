(() => {
  'use strict';
  const root=document.documentElement, dialog=document.querySelector('#world-atlas');
  const triggers=[...document.querySelectorAll('[data-open-atlas]')];
  if(!dialog || typeof dialog.showModal!=='function')return;
  let opener=null;
  const close=()=>dialog.close();
  triggers.forEach(button=>{
    button.hidden=false;
    button.addEventListener('click',()=>{opener=button;dialog.showModal();root.dataset.atlasOpen='true';dialog.querySelector('.atlas-close').focus();});
  });
  root.dataset.atlasReady='true';
  dialog.querySelector('.atlas-close').addEventListener('click',close);
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  dialog.addEventListener('close',()=>{delete root.dataset.atlasOpen;opener?.focus();});
  const number=dialog.querySelector('[data-atlas-number]'),caption=dialog.querySelector('[data-atlas-caption]');
  const current=dialog.querySelector('[aria-current="page"]');
  const preview=link=>{number.textContent=link.dataset.atlasNumber;caption.textContent=link.dataset.atlasLabel;};
  dialog.querySelectorAll('.atlas-links a').forEach(link=>{
    link.addEventListener('pointerenter',()=>preview(link));link.addEventListener('focus',()=>preview(link));
    link.addEventListener('click',close);
  });
  dialog.querySelector('.atlas-links').addEventListener('pointerleave',()=>preview(current));
  preview(current);
  const railObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('atlas-idle',!entry.isIntersecting)),{rootMargin:'100px'});
  document.querySelectorAll('.atlas-rail').forEach(rail=>railObserver.observe(rail));
  // The portfolio already owns its theme button; the other pages share its preference.
  if(document.querySelector('.world-header')){
    const theme=document.querySelector('.theme-toggle');
    try{document.body.classList.toggle('light',localStorage.getItem('aman-theme')==='light');}catch(_){}
    const label=()=>theme.setAttribute('aria-label',document.body.classList.contains('light')?'Switch to dark theme':'Switch to light theme');
    theme.addEventListener('click',()=>{document.body.classList.toggle('light');try{localStorage.setItem('aman-theme',document.body.classList.contains('light')?'light':'dark');}catch(_){}label();document.dispatchEvent(new Event('aman-theme-change'));});
    label();
  }
})();

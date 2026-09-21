(() => {
  'use strict';
  const root=document.documentElement, motion=document.querySelector('.world-motion'), detail=document.querySelector('.world-quality');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'), compact=matchMedia('(max-width:760px)');
  let paused=false, chosen=null;
  try { paused=localStorage.getItem('aman-motion')==='paused'; const saved=localStorage.getItem('aman-quality');if(['ultra','balanced'].includes(saved))chosen=saved; } catch(_){}
  const quality=()=>chosen||(compact.matches?'balanced':'ultra');
  const enabled=()=>!paused&&!reduce.matches;
  const nav=document.querySelector('#world-nav'), menu=document.querySelector('.world-menu');
  function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  compact.addEventListener('change',()=>{closeMenu();sync();resize();});
  document.querySelector('[data-year]').textContent=new Date().getFullYear();
  const scenes=[...document.querySelectorAll('.world-hero,.world-section,.world-cta,.world-marquee')];
  const visible=new WeakMap();
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{visible.set(entry.target,entry.isIntersecting);entry.target.classList.toggle('scene-idle',!entry.isIntersecting||!enabled()||document.hidden);});},{rootMargin:'100px'});
  scenes.forEach(scene=>observer.observe(scene));
  const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}});},{threshold:.08});
  document.querySelectorAll('.reveal').forEach((element,index)=>{element.style.setProperty('--delay',(index%3*65)+'ms');revealObserver.observe(element);});
  const canvas=document.querySelector('.world-canvas'), ctx=canvas.getContext('2d');
  let width=0,height=0,frame=0,previous=0,elapsed=0,phase=0;
  function draw(){
    if(!ctx||!width||!height)return;
    const rgb=document.body.classList.contains('light')?'95,86,152':'171,177,244';
    ctx.clearRect(0,0,width,height);
    const lines=quality()==='ultra'?9:4,steps=quality()==='ultra'?64:32;
    for(let band=0;band<2;band++) for(let line=0;line<lines;line++) {
      ctx.beginPath();
      for(let i=0;i<=steps;i++) {const p=i/steps;const x=width*p;const y=height*(.25+band*.5)+Math.sin(p*5.5+phase*.12+line*.095+band*2)*height*.15+Math.cos(p*7-phase*.08)*height*.045+line*height*.011;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
      ctx.lineWidth=.75;ctx.strokeStyle=`rgba(${rgb},${.035+line/lines*.055})`;ctx.stroke();
    }
    const count=quality()==='ultra'?30:12;
    for(let i=0;i<count;i++){const x=((i*.618034+Math.sin(phase*.06+i)*.014)%1)*width;const y=((i*.754878-phase*.0018)%1+1)%1*height;ctx.fillStyle=`rgba(${rgb},${.13+(Math.sin(phase*.4+i)+1)*.1})`;ctx.beginPath();ctx.arc(x,y,i%5===0?1.5:.7,0,Math.PI*2);ctx.fill();}
  }
  function tick(now){frame=0;if(!enabled()||document.hidden)return;const dt=previous?Math.min(now-previous,80):0;previous=now;phase+=dt/1000;elapsed+=dt;const interval=1000/(quality()==='ultra'?60:30);if(elapsed>=interval){elapsed=0;draw();}frame=requestAnimationFrame(tick);}
  function resize(){if(!ctx)return;const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const pixels=window.PortfolioMotionQuality.canvasSize(width,height,devicePixelRatio,quality(),'ambient');canvas.width=pixels.width;canvas.height=pixels.height;ctx.setTransform(pixels.scaleX,0,0,pixels.scaleY,0,0);canvas.dataset.resolution=pixels.width+'×'+pixels.height;draw();}
  function sync(){
    const active=enabled();root.dataset.motion=active?'on':'off';root.dataset.quality=quality();root.dataset.pageVisible=String(!document.hidden);root.classList.toggle('motion-enabled',active);
    motion.textContent=active?'Ⅱ':'▶';motion.setAttribute('aria-label',reduce.matches?'Reduced motion enabled on your device':active?'Pause animations':'Play animations');motion.title=motion.getAttribute('aria-label');motion.setAttribute('aria-pressed',String(!active));motion.disabled=reduce.matches;
    detail.textContent=quality().toUpperCase();detail.setAttribute('aria-label',`Visual detail: ${quality()==='ultra'?'Ultra':'Balanced'}. Switch to ${quality()==='ultra'?'balanced':'ultra'} effects.`);detail.disabled=reduce.matches;
    scenes.forEach(scene=>scene.classList.toggle('scene-idle',!visible.get(scene)||!active||document.hidden));
    if(frame)cancelAnimationFrame(frame);frame=0;previous=0;elapsed=0;canvas.dataset.running=String(active&&!document.hidden);
    if(active&&!document.hidden&&ctx)frame=requestAnimationFrame(tick);else draw();
  }
  motion.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('aman-motion',paused?'paused':'playing');}catch(_){}sync();});
  detail.addEventListener('click',()=>{chosen=quality()==='ultra'?'balanced':'ultra';try{localStorage.setItem('aman-quality',chosen);}catch(_){}resize();sync();});
  reduce.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  document.addEventListener('aman-theme-change',draw);
  new ResizeObserver(resize).observe(canvas);
  const progress=document.querySelector('.world-progress');let scheduled=false;
  function updateProgress(){const total=document.documentElement.scrollHeight-innerHeight;progress.style.scale=(total>0?Math.max(0,Math.min(1,scrollY/total)):0)+' 1';scheduled=false;}
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress);}},{passive:true});
  addEventListener('resize',updateProgress,{passive:true});
  resize();sync();updateProgress();
})();

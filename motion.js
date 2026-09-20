(() => {
  'use strict';
  const root = document.documentElement;
  const control = document.querySelector('.motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const listeners = [];
  let paused = false;
  try { paused = localStorage.getItem('aman-motion') === 'paused'; } catch (_) {}
  const enabled = () => !preference.matches && !paused;

  function updateMotion() {
    const active = enabled();
    root.dataset.motion = active ? 'on' : 'off';
    root.classList.toggle('motion-ready', active);
    const label = preference.matches ? 'Reduced motion enabled on your device' : active ? 'Pause animations' : 'Play animations';
    control.setAttribute('aria-label', label);
    control.setAttribute('aria-pressed', String(!active));
    control.title = label;
    control.disabled = preference.matches;
    listeners.forEach(listener => listener(active));
  }
  control.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('aman-motion', paused ? 'paused' : 'playing'); } catch (_) {}
    updateMotion();
  });
  preference.addEventListener('change', updateMotion);
  updateMotion();

  const syncPageVisibility = () => { root.dataset.pageVisible = String(!document.hidden); };
  document.addEventListener('visibilitychange', syncPageVisibility);
  syncPageVisibility();

  const profileDialog = document.querySelector('#profile-dialog');
  let profileOpener;
  document.querySelectorAll('.profile-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      profileOpener = trigger;
      if (typeof profileDialog.showModal === 'function') profileDialog.showModal();
      else location.hash = 'profiles';
    });
  });
  document.querySelector('.profile-close').addEventListener('click', () => profileDialog.close());
  profileDialog.addEventListener('click', event => {
    const bounds = profileDialog.getBoundingClientRect();
    if (event.target === profileDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) profileDialog.close();
  });
  profileDialog.addEventListener('close', () => { if (profileOpener) profileOpener.focus(); });
  profileDialog.querySelectorAll('a').forEach(link => link.addEventListener('click', () => profileDialog.close()));

  // Keep heading semantics and line breaks intact while staging individual words.
  document.querySelectorAll('.section-heading h2,.contact-inner h2,.education h2,.resume-copy h2').forEach(heading => {
    let wordIndex = 0;
    [...heading.childNodes].forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
        const span = document.createElement('span');
        span.className = 'heading-word';
        span.style.setProperty('--heading-index', wordIndex++);
        span.textContent = word;
        fragment.append(span);
      });
      node.replaceWith(fragment);
    });
  });

  const ribbon = document.querySelector('.trust-strip');
  let ribbonVisible = true;
  const syncRibbon = () => ribbon.classList.toggle('ribbon-paused', !ribbonVisible || document.hidden || !enabled());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { ribbonVisible = entries[0].isIntersecting; syncRibbon(); }).observe(ribbon);
  }
  document.addEventListener('visibilitychange', syncRibbon);
  listeners.push(syncRibbon);
  syncRibbon();

  document.querySelectorAll('.capability-grid,.download-grid,.social-grid,.project-grid').forEach(group => {
    [...group.children].forEach((item, index) => item.style.setProperty('--reveal-delay', `${index % 2 * 110}ms`));
  });

  // These layers are purely decorative and never enter the accessibility tree.
  document.querySelectorAll('main > section:not(.hero):not(.trust-strip)').forEach((section,index) => {
    section.classList.add('ambient-section');
    section.style.setProperty('--scene-delay', (index * -1.3) + 's');
    const decoration = document.createElement('div');
    decoration.className = 'section-decoration';
    decoration.setAttribute('aria-hidden','true');
    decoration.innerHTML = '<div class="section-divider"></div><div class="section-aura"></div><div class="section-orb"><svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="116"/><circle class="orb-dashed" cx="150" cy="150" r="139"/><g class="orb-arc"><path d="M150 52a98 98 0 0 1 98 98M150 248a98 98 0 0 1-98-98"/><circle class="orb-centre" cx="150" cy="52" r="3"/><circle class="orb-centre" cx="150" cy="248" r="3"/></g><path d="M130 150h40M150 130v40"/></svg></div>';
    section.prepend(decoration);
  });
  document.querySelectorAll('.capability-card,.download-card,.social-card').forEach((card,index) => {
    const sweep = document.createElement('span');
    sweep.className = 'light-sweep';
    sweep.setAttribute('aria-hidden','true');
    sweep.style.setProperty('--sweep-delay', (index * -1.7) + 's');
    card.append(sweep);
  });

  const header = document.querySelector('.site-header');
  const links = [...document.querySelectorAll('.site-header nav a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let scrollPending = false;
  function updateNavigation() {
    header.classList.toggle('scrolled', scrollY > 24);
    let current = -1;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top < innerHeight * .4) current = index; });
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const timeline = document.querySelector('.timeline');
    const bounds = timeline.getBoundingClientRect();
    timeline.style.setProperty('--section-progress', Math.max(0, Math.min(1, (innerHeight * .72 - bounds.top) / bounds.height)));
    scrollPending = false;
  }
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateNavigation); } }, { passive:true });
  addEventListener('resize', updateNavigation, { passive:true });
  updateNavigation();

  const hero = document.querySelector('.hero');
  const visual = document.querySelector('.hero-visual');
  const monogram = document.querySelector('.monogram-card');
  function attachTilt(target, surface, strength) {
    target.addEventListener('pointermove', event => {
      if (!enabled() || !finePointer.matches) return;
      const box = target.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      surface.style.setProperty('--tilt-x', `${(.5 - y) * strength}deg`);
      surface.style.setProperty('--tilt-y', `${(x - .5) * strength}deg`);
      surface.style.setProperty('--shine-x', `${x * 100}%`);
      surface.style.setProperty('--shine-y', `${y * 100}%`);
    }, { passive:true });
    const reset = () => {
      surface.style.setProperty('--tilt-x', '0deg');
      surface.style.setProperty('--tilt-y', '0deg');
    };
    target.addEventListener('pointerleave', reset);
    listeners.push(active => { if (!active) reset(); });
  }
  attachTilt(visual, monogram, 22);
  document.querySelectorAll('.capability-card').forEach(card => attachTilt(card, card, 7));
  document.querySelectorAll('.project-card').forEach(card => attachTilt(card, card, 4));
  document.querySelectorAll('.download-card,.social-card').forEach(card => attachTilt(card, card, 0));
  document.querySelectorAll('.hero-actions .button').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!enabled() || !finePointer.matches) return;
      const box = button.getBoundingClientRect();
      button.style.setProperty('--magnet-x', `${(event.clientX - box.left - box.width / 2) * .07}px`);
      button.style.setProperty('--magnet-y', `${(event.clientY - box.top - box.height / 2) * .12}px`);
    }, { passive:true });
    const reset = () => {
      button.style.setProperty('--magnet-x', '0px');
      button.style.setProperty('--magnet-y', '0px');
    };
    button.addEventListener('pointerleave', reset);
    button.addEventListener('blur', reset);
    listeners.push(active => { if (!active) reset(); });
  });

  // Original real-time energy sculpture. No franchise assets or animation library.
  // Decorative motion is bounded, pausable, and suspended outside the viewport.
  const artScenes = [...document.querySelectorAll('.project-card,.ambient-section')];
  const sceneVisible = new WeakMap();
  const syncArt = () => artScenes.forEach(scene => {
    const active = enabled() && !document.hidden && sceneVisible.get(scene);
    scene.classList.toggle('art-paused', !active);
    scene.dataset.scene = active ? 'active' : 'paused';
  });
  if ('IntersectionObserver' in window) {
    const artObserver = new IntersectionObserver(entries => { entries.forEach(entry => sceneVisible.set(entry.target, entry.isIntersecting)); syncArt(); });
    artScenes.forEach(scene => artObserver.observe(scene));
  } else artScenes.forEach(scene => sceneVisible.set(scene, true));
  listeners.push(syncArt);
  document.addEventListener('visibilitychange', syncArt);
  syncArt();

  // Viewport-sized field: a single bounded canvas animates behind every section.
  // It renders at 24 fps (20 on phones), caps resolution, and stops when paused.
  function installAmbientField() {
    const field = document.querySelector('.ambient-canvas');
    const ctx = field.getContext('2d');
    if (!ctx) return;
    const small = matchMedia('(max-width:600px)');
    let width = 0, height = 0, request = 0, previous = 0, phase = 0;
    let isLight = document.body.classList.contains('light');
    let scrollPhase = scrollY * .00035;
    let targetX = .5, targetY = .5, driftX = .5, driftY = .5;
    const motes = Array.from({length:42},(_,index) => ({
      x:(index * .618034) % 1,
      y:(index * .754878) % 1,
      speed:.3 + (index % 5) * .1,
      size:index % 7 === 0 ? 1.5 : .7,
      offset:index * 1.8
    }));
    function render() {
      if (!width || !height) return;
      ctx.clearRect(0,0,width,height);
      const tint = isLight ? '108,78,160' : '174,144,241';
      const cool = isLight ? '61,105,164' : '131,185,236';
      const alpha = isLight ? .1 : .14;
      for (let ribbon = 0; ribbon < 3; ribbon++) {
        const base = height * (.22 + ribbon * .3);
        for (let line = 0; line < 5; line++) {
          const gradient = ctx.createLinearGradient(0,0,width,0);
          gradient.addColorStop(0,'rgba(' + tint + ',0)');
          gradient.addColorStop(.25,'rgba(' + tint + ',' + (alpha * (1 - line * .12)) + ')');
          gradient.addColorStop(.65,'rgba(' + cool + ',' + (alpha * .65) + ')');
          gradient.addColorStop(1,'rgba(' + cool + ',0)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = line === 0 ? 1 : .5;
          ctx.beginPath();
          for (let step = 0; step <= 56; step++) {
            const x = step / 56 * width;
            const wave = Math.sin(step / 56 * 5 + phase * .22 + ribbon * 1.9 + scrollPhase);
            const second = Math.cos(step / 56 * 3 - phase * .16 + ribbon);
            const y = base + wave * height * .07 + second * height * .055 + line * 7 + (driftY - .5) * 18;
            if (!step) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
      }
      const count = small.matches ? 24 : motes.length;
      for (let i = 0; i < count; i++) {
        const mote = motes[i];
        const x = ((mote.x + Math.sin(phase * .12 + mote.offset) * .028 + (driftX - .5) * .009 + 1) % 1) * width;
        const y = (((mote.y - phase * .007 * mote.speed - scrollPhase * .012) % 1 + 1) % 1) * height;
        const opacity = .12 + (Math.sin(phase * .6 + mote.offset) + 1) * .13;
        ctx.fillStyle = 'rgba(' + (i % 2 ? tint : cool) + ',' + opacity + ')';
        ctx.beginPath(); ctx.arc(x,y,mote.size,0,Math.PI * 2); ctx.fill();
        if (i % 7 === 0) {
          ctx.strokeStyle = 'rgba(' + tint + ',' + opacity * .32 + ')'; ctx.lineWidth = .6;
          ctx.beginPath(); ctx.moveTo(x-4,y); ctx.lineTo(x+4,y); ctx.moveTo(x,y-4); ctx.lineTo(x,y+4); ctx.stroke();
        }
      }
    }
    function animate(now) {
      request = 0;
      if (!enabled() || document.hidden) return;
      if (now - previous >= 1000 / (small.matches ? 20 : 24)) {
        const delta = Math.min(now - (previous || now),90) / 1000;
        phase += delta;
        scrollPhase += (scrollY * .00035 - scrollPhase) * .045;
        driftX += (targetX - driftX) * .05;
        driftY += (targetY - driftY) * .05;
        previous = now;
        render();
      }
      request = requestAnimationFrame(animate);
    }
    function syncField() {
      if (request) cancelAnimationFrame(request);
      request = 0; previous = 0;
      const active = enabled() && !document.hidden;
      field.dataset.running = String(active);
      if (active) request = requestAnimationFrame(animate);
      else render();
    }
    function resizeField() {
      const rect = field.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1,small.matches ? 1 : 1.5);
      field.width = Math.round(width * ratio); field.height = Math.round(height * ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      render();
    }
    addEventListener('pointermove',event => {
      if (!enabled() || !finePointer.matches) return;
      targetX = event.clientX / Math.max(width,1);
      targetY = event.clientY / Math.max(height,1);
    },{passive:true});
    if ('ResizeObserver' in window) new ResizeObserver(resizeField).observe(field);
    else addEventListener('resize',resizeField,{passive:true});
    new MutationObserver(() => { isLight = document.body.classList.contains('light'); render(); }).observe(document.body,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',syncField);
    listeners.push(syncField);
    resizeField(); syncField();
  }
  installAmbientField();

  const canvas = document.querySelector('.network-canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const compact = matchMedia('(max-width: 600px)').matches;
  const boostButton = document.querySelector('.core-boost');
  const boostLabel = boostButton.querySelector('span');
  const TAU = Math.PI * 2;
  const sparks = Array.from({ length:compact ? 48 : 85 }, (_, index) => ({
    phase:((index * .61803398875) % 1) * TAU,
    radius:.2 + ((index * .381966) % 1) * .26,
    speed:.12 + (index % 7) * .03,
    height:((index * .75487766) % 1) * 2 - 1,
    size:index % 6 === 0 ? 1.65 : .7,
    tint:index % 3
  }));
  let size = 0;
  let frame = 0;
  let lastTime = 0;
  let time = .6;
  let charge = 0;
  let boostUntil = 0;
  let visible = true;
  let light = document.body.classList.contains('light');
  const pointer = { x:0, y:0, tx:0, ty:0 };
  const colors = () => light ? ['104,68,178','33,108,136','95,103,181'] : ['189,170,255','145,220,243','183,189,255'];

  visual.addEventListener('pointermove', event => {
    if (!finePointer.matches || !enabled()) return;
    const box = visual.getBoundingClientRect();
    pointer.tx = ((event.clientX - box.left) / box.width - .5) * .11;
    pointer.ty = ((event.clientY - box.top) / box.height - .5) * .08;
  }, { passive:true });
  visual.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  boostButton.setAttribute('aria-pressed', 'false');
  boostButton.addEventListener('click', () => {
    if (!enabled()) return;
    boostUntil = performance.now() + 2800;
    visual.classList.add('is-charged');
    boostButton.setAttribute('aria-pressed', 'true');
    boostLabel.textContent = 'Energy activated';
  });

  function projectRing(phase, ring, expansion = 1) {
    const radius = [.355,.415,.445][ring] * expansion;
    const tilt = [.48,1.1,-.92][ring] + Math.sin(time * .13 + ring) * .15 + pointer.y;
    const turn = [-.4,.55,-.7][ring] + time * [ .045,-.06,.035 ][ring] + pointer.x;
    const x = Math.cos(phase) * radius;
    const y = Math.sin(phase) * radius * Math.cos(tilt);
    const z = Math.sin(phase) * radius * Math.sin(tilt);
    const depth = 1 + z * .25;
    return { x:size * (.5 + (x * Math.cos(turn) - y * Math.sin(turn)) * depth + pointer.x * .18), y:size * (.5 + (x * Math.sin(turn) + y * Math.cos(turn)) * depth + pointer.y * .18), z };
  }

  function strokeRing(ring, tint) {
    const expansion = 1 + charge * .025;
    context.beginPath();
    for (let step = 0; step <= 120; step++) {
      const point = projectRing(step / 120 * TAU, ring, expansion);
      if (!step) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y);
    }
    context.strokeStyle = 'rgba(' + tint + ',' + (light ? .2 : .24) + ')';
    context.lineWidth = 1;
    context.stroke();
    // Long luminous comet trails travel around each rotating 3D orbit.
    for (let comet = 0; comet < 2; comet++) {
      const head = time * [ .48,-.36,.28 ][ring] + comet * Math.PI + ring * 1.6;
      for (let part = 0; part < 24; part++) {
        const alpha = (1 - part / 24) * (.8 + charge * .2);
        const a = projectRing(head - part * .025, ring, expansion);
        const b = projectRing(head - (part + 1) * .025, ring, expansion);
        context.strokeStyle = 'rgba(' + tint + ',' + alpha + ')';
        context.lineWidth = (2.5 - part / 20) * (1 + charge * .45);
        context.beginPath(); context.moveTo(a.x,a.y); context.lineTo(b.x,b.y); context.stroke();
      }
      const headPoint = projectRing(head,ring,expansion);
      const glow = context.createRadialGradient(headPoint.x,headPoint.y,0,headPoint.x,headPoint.y,12 + charge * 10);
      glow.addColorStop(0,'rgba(' + tint + ',.6)'); glow.addColorStop(1,'rgba(' + tint + ',0)');
      context.fillStyle = glow; context.beginPath(); context.arc(headPoint.x,headPoint.y,12 + charge * 10,0,TAU); context.fill();
      context.fillStyle = light ? 'rgb(' + tint + ')' : '#eaffff';
      context.beginPath(); context.arc(headPoint.x,headPoint.y,1.6 + charge,0,TAU); context.fill();
    }
  }

  function draw() {
    if (!size) return;
    context.clearRect(0, 0, size, size);
    const palette = colors();
    const halo = context.createRadialGradient(size * .5,size * .5,size * .11,size * .5,size * .5,size * .46);
    halo.addColorStop(0,'rgba(' + palette[0] + ',' + (.08 + charge * .12) + ')');
    halo.addColorStop(.4,'rgba(' + palette[0] + ',.025)');
    halo.addColorStop(1,'rgba(' + palette[0] + ',0)');
    context.fillStyle = halo; context.fillRect(0,0,size,size);
    context.save(); context.translate(size / 2,size / 2);
    // Precision-machined dial: tick marks and segmented moving light bands.
    for (let i = 0; i < 100; i++) {
      const phase = i / 100 * TAU + time * .018;
      const outer = size * .303;
      const inner = outer - (i % 5 === 0 ? size * .018 : size * .007);
      context.strokeStyle = 'rgba(' + palette[i % 25 === 0 ? 1 : 0] + ',' + (i % 5 === 0 ? .42 : .17) + ')';
      context.lineWidth = i % 25 === 0 ? 2 : .8;
      context.beginPath(); context.moveTo(Math.cos(phase) * inner,Math.sin(phase) * inner); context.lineTo(Math.cos(phase) * outer,Math.sin(phase) * outer); context.stroke();
    }
    for (let ring = 0; ring < 3; ring++) {
      context.strokeStyle = 'rgba(' + palette[ring] + ',' + (ring === 2 ? .22 : .55) + ')';
      context.lineWidth = ring === 0 ? 2 : 1;
      for (let part = 0; part < 3; part++) {
        const angle = time * (ring % 2 ? -.12 : .09) + part * TAU / 3 + ring;
        context.beginPath(); context.arc(0,0,size * (.238 + ring * .02),angle,angle + .84); context.stroke();
      }
    }
    context.restore();
    sparks.forEach((spark,index) => {
      const phase = spark.phase + time * spark.speed;
      const radius = size * (spark.radius + Math.sin(time * .2 + index) * .014);
      const x = size * .5 + Math.cos(phase) * radius;
      const y = size * .5 + Math.sin(phase) * radius * (.65 + spark.height * .23);
      const alpha = .15 + (Math.sin(phase + index) + 1) * .15 + charge * .22;
      context.fillStyle = 'rgba(' + palette[spark.tint] + ',' + alpha + ')';
      context.beginPath(); context.arc(x,y,spark.size,0,TAU); context.fill();
    });
    for (let ring = 2; ring >= 0; ring--) strokeRing(ring,palette[ring]);
  }

  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || !enabled()) return;
    if (now - lastTime >= 1000 / (compact ? 30 : 45)) {
      const delta = Math.min(now - (lastTime || now),70) / 1000;
      const boosting = now < boostUntil;
      charge += ((boosting ? 1 : 0) - charge) * .065;
      time += delta * (1 + charge * 2.8);
      pointer.x += (pointer.tx - pointer.x) * .07;
      pointer.y += (pointer.ty - pointer.y) * .07;
      if (!boosting && boostButton.getAttribute('aria-pressed') === 'true') {
        visual.classList.remove('is-charged');
        boostButton.setAttribute('aria-pressed','false');
        boostLabel.textContent = 'Power up';
      }
      lastTime = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    const active = visible && !document.hidden && enabled();
    hero.classList.toggle('scene-paused', !active);
    boostButton.disabled = !enabled();
    if (!enabled()) {
      boostUntil = 0; charge = 0;
      pointer.tx = pointer.ty = pointer.x = pointer.y = 0;
      visual.classList.remove('is-charged');
      boostButton.setAttribute('aria-pressed','false');
      boostLabel.textContent = 'Motion paused';
    } else if (!boostUntil || performance.now() > boostUntil) boostLabel.textContent = 'Power up';
    if (active) frame = requestAnimationFrame(tick);
    else draw();
  }
  function resize() {
    size = canvas.getBoundingClientRect().width;
    const ratio = Math.min(devicePixelRatio || 1, compact ? 1.5 : 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else addEventListener('resize', resize, { passive:true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold:0 }).observe(visual);
  }
  new MutationObserver(() => {
    light = document.body.classList.contains('light');
    draw();
  }).observe(document.body, { attributes:true, attributeFilter:['class'] });
  document.addEventListener('visibilitychange', sync);
  listeners.push(sync);
  resize();
  sync();
})();

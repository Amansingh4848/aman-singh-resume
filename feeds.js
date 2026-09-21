(() => {
  'use strict';
  const requests = new Map();
  function feed(channel) {
    if (!requests.has(channel)) requests.set(channel,fetch('/api/youtube?channel='+encodeURIComponent(channel),{signal:AbortSignal.timeout(12000)}).then(response=>{if(!response.ok) throw new Error('Unavailable'); return response.json();}).catch(error=>{requests.delete(channel);throw error;}));
    return requests.get(channel);
  }
  function videoCard(video,channel) {
    const card = document.createElement('a');
    card.className = 'live-video-card animated-card';
    card.href = video.url; card.target = '_blank'; card.rel = 'noopener noreferrer';
    const frame = document.createElement('span'); frame.className = 'live-video-image';
    const image = document.createElement('img'); image.src = video.thumbnail+'?refresh='+Math.floor(Date.now()/300000); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.width = 480; image.height = 360;
    image.addEventListener('error',()=>{image.hidden=true;},{once:true});
    const play = document.createElement('span'); play.className = 'video-play'; play.textContent = '▶'; play.setAttribute('aria-hidden','true');
    frame.append(image,play);
    const caption = document.createElement('span'); caption.className = 'live-video-caption';
    const source = document.createElement('small'); source.textContent = channel === 'trading' ? 'TRADE WITH ZUKO · YOUTUBE' : 'AMAN SINGH SUNEO · YOUTUBE';
    const title = document.createElement('strong'); title.textContent = video.title;
    const date = document.createElement('time'); date.dateTime = video.published; const parsed = new Date(video.published); date.textContent = Number.isNaN(parsed.getTime()) ? 'Watch on YouTube ↗' : parsed.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})+' · Watch ↗';
    caption.append(source,title,date); card.append(frame,caption); return card;
  }
  document.querySelectorAll('[data-live-channel]').forEach(section => {
    const channel = section.dataset.liveChannel;
    const grid = section.querySelector('[data-video-grid]');
    const status = section.querySelector('[data-feed-status]');
    const search = section.querySelector('[data-video-search]');
    let videos = [], lastAttempt = 0, active = false;
    function render() {
      const term = (search?.value || '').trim().toLowerCase();
      const shown = videos.filter(video=>video.title.toLowerCase().includes(term));
      grid.replaceChildren(...shown.map(video=>videoCard(video,channel)));
      if (!shown.length) { const empty = document.createElement('p'); empty.className='feed-empty'; empty.textContent='No matching videos in the latest uploads. Try a different search or open the full channel.'; grid.append(empty); }
      if (search) section.querySelector('[data-result-count]').textContent = shown.length+(shown.length===1?' video':' videos');
    }
    async function update() {
      lastAttempt = Date.now();
      try {
        const result = await feed(channel);
        videos = result.videos.slice(0,Number(section.dataset.limit)||15);
        render();
        status.textContent = result.stale ? 'Recent snapshot · YouTube refresh is temporarily delayed.' : 'Connected to YouTube · Refreshes approximately every 5 minutes while this page is open.';
        section.dataset.feedState = result.stale ? 'stale' : 'live';
      } catch (_) {
        status.textContent = 'Live updates are temporarily unavailable. Showing selected videos; open the channel for every upload.';
        section.dataset.feedState = 'fallback';
      }
    }
    if (search) search.addEventListener('input',()=>{if(videos.length) render();});
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(active && (!lastAttempt || Date.now()-lastAttempt>=300000)) update();},{rootMargin:'300px'}); observer.observe(section);
    } else { active=true; update(); }
    setInterval(()=>{if(active&&!document.hidden&&Date.now()-lastAttempt>=300000){requests.delete(channel);update();}},300000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active&&Date.now()-lastAttempt>=300000){requests.delete(channel);update();}});
  });
  // The homepage's selected YouTube cards receive the latest titles and thumbnails too.
  const homeCards = document.querySelectorAll('#social-gallery .gallery-card[data-platform="youtube"]');
  homeCards.forEach(card=>{card.dataset.homeVideo=card.href.includes('Qzyo42T5c54')?'life':'trading';});
  if (homeCards.length) {
    const refreshHome = async () => {
      for (const channel of ['trading','life']) {
        try {
          const result = await feed(channel);
          document.querySelectorAll(`[data-home-video="${channel}"]`).forEach((card,index)=>{
            const video = result.videos[index]; if(!video) return;
            card.href = video.url; card.setAttribute('aria-label',video.title+' — watch on YouTube');
            const image=card.querySelector('img'); image.src=video.thumbnail+'?refresh='+Math.floor(Date.now()/300000); image.alt=video.title;
            card.querySelector('.media-caption strong').textContent=video.title;
          });
        } catch (_) { /* The original linked cards remain usable. */ }
      }
    };
    let homeVisible=false,homeLoaded=0;
    const updateHome=()=>{homeLoaded=Date.now();requests.delete('trading');requests.delete('life');refreshHome();};
    const observer = new IntersectionObserver(entries=>{homeVisible=entries.some(entry=>entry.isIntersecting);if(homeVisible&&(!homeLoaded||Date.now()-homeLoaded>=300000))updateHome();},{rootMargin:'200px'}); observer.observe(document.querySelector('#social-gallery'));
    setInterval(()=>{if(homeVisible&&!document.hidden&&Date.now()-homeLoaded>=300000)updateHome();},300000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&homeVisible&&Date.now()-homeLoaded>=300000)updateHome();});
  }
  // Embeds load only on request: no heavy player or Instagram scripts on first paint.
  let youtubeReady;
  function loadYouTubePlayerAPI(){
    if(window.YT?.Player)return Promise.resolve();
    if(!youtubeReady)youtubeReady=new Promise((resolve,reject)=>{window.onYouTubeIframeAPIReady=resolve;const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=reject;document.body.append(script);});
    return youtubeReady;
  }
  document.querySelectorAll('[data-load-playlist]').forEach(button=>button.addEventListener('click',()=>{
    const id = button.dataset.loadPlaylist; if(!/^UU[A-Za-z0-9_-]{22}$/.test(id)) return;
    const shell=button.parentElement;
    const overlay=document.createElement('div');overlay.className='player-loading';overlay.setAttribute('role','status');
    const heading=document.createElement('strong');heading.textContent='Connecting to YouTube…';
    const note=document.createElement('p');note.textContent='The full uploads player will appear here when YouTube is ready.';
    const link=document.createElement('a');link.className='action primary';link.href=id==='UUZw-Gm-KziSU0qCRnD7-Igw'?'https://www.youtube.com/@tradewithzuko4/videos':'https://www.youtube.com/channel/UCP1U0LFXN5BjjqfNue8WHCw/videos';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open the full channel ↗';overlay.append(heading,note,link);
    const frame=document.createElement('iframe');frame.id='player-'+id;frame.src='https://www.youtube-nocookie.com/embed/videoseries?list='+id+'&rel=0&enablejsapi=1&origin='+encodeURIComponent(location.origin);frame.title=button.dataset.playerTitle||'YouTube channel uploads';frame.allow='encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.className='channel-player';button.replaceWith(frame);shell.append(overlay);
    let ready=false;
    const fallback=()=>{if(!ready){heading.textContent='Watch the full library on YouTube';note.textContent='The embedded player is unavailable in this browser. Every public upload is available through the channel link.';}};
    loadYouTubePlayerAPI().then(()=>new window.YT.Player(frame.id,{events:{onReady:()=>{ready=true;overlay.remove();frame.focus();},onError:()=>{ready=false;if(!overlay.isConnected)shell.append(overlay);fallback();}}})).catch(fallback);
    setTimeout(fallback,15000);
  }));
  document.querySelectorAll('[data-load-instagram]').forEach(button=>button.addEventListener('click',()=>{
    const shell=button.closest('.instagram-live');
    const container=shell.querySelector('.instagram-embed-slot');
    const placeholder=container.querySelector('.instagram-placeholder');
    const embed=document.createElement('div');embed.className='instagram-embed-content';container.append(embed);
    let loaded=false;
    const frameObserver=new MutationObserver(()=>{const frame=embed.querySelector('iframe');if(frame){frame.title='Aman Singh Suneo’s Instagram profile';if(frame.getBoundingClientRect().height>200){loaded=true;if(placeholder)placeholder.hidden=true;embed.classList.add('is-ready');frameObserver.disconnect();}}});frameObserver.observe(embed,{childList:true,subtree:true,attributes:true,attributeFilter:['style','height']});
    const block=document.createElement('blockquote'); block.className='instagram-media'; block.setAttribute('data-instgrm-permalink','https://www.instagram.com/amansinghsuneo4447__/'); block.setAttribute('data-instgrm-version','14');
    const link=document.createElement('a');link.href='https://www.instagram.com/amansinghsuneo4447__/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='View the latest posts on Instagram ↗';block.append(link);embed.append(block);
    button.hidden=true; shell.querySelector('.embed-notice').textContent='Instagram controls this live panel. If it is unavailable, use “Open Instagram” to see every post.';
    setTimeout(()=>{if(!loaded){shell.querySelector('.embed-notice').textContent='Instagram is not displaying this profile panel here right now. Open Instagram for the latest posts; the photos above remain available.';if(placeholder){placeholder.querySelector('p').textContent='See the newest moments directly on Instagram.';placeholder.querySelector('small').textContent='The linked photo journal stays available here.';}frameObserver.disconnect();embed.remove();}},15000);
    if(window.instgrm) window.instgrm.Embeds.process();
    else {const script=document.createElement('script');script.src='https://www.instagram.com/embed.js';script.async=true;script.addEventListener('error',()=>{shell.querySelector('.embed-notice').textContent='Instagram could not load here. Open Instagram to see the latest posts.';});document.body.append(script);}
  }));
})();

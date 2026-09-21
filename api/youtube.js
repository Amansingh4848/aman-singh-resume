'use strict';
const CHANNELS = {trading:'UCZw-Gm-KziSU0qCRnD7-Igw',life:'UCP1U0LFXN5BjjqfNue8WHCw'};
const cache = new Map();
function decode(value) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi,(_,key) => {
    if (key[0] === '#') { const number = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2),16) : parseInt(key.slice(1),10); return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : ''; }
    return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'}[key.toLowerCase()];
  });
}
function parseFeed(xml) {
  const tag = (entry,name) => decode((entry.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>')) || [,''])[1]);
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(match => {
    const id = tag(match[1],'yt:videoId');
    return {id,title:tag(match[1],'title'),published:tag(match[1],'published'),updated:tag(match[1],'updated'),url:'https://www.youtube.com/watch?v='+id,thumbnail:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'};
  }).filter(video => /^[A-Za-z0-9_-]{11}$/.test(video.id) && video.title).slice(0,15);
}
async function handler(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex');
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'Method not allowed'}); }
  const key = req.query.channel;
  if (typeof key !== 'string' || !Object.hasOwn(CHANNELS,key)) return res.status(400).json({error:'Unknown channel'});
  const previous = cache.get(key);
  if (previous && Date.now()-previous.time < 300000) {
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).json(previous.body);
  }
  try {
    const response = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id='+CHANNELS[key],{signal:AbortSignal.timeout(8000),headers:{Accept:'application/atom+xml, application/xml'}});
    if (!response.ok) throw new Error('Feed unavailable');
    const xml = await response.text();
    if (xml.length > 500000) throw new Error('Feed too large');
    const videos = parseFeed(xml);
    if (!videos.length) throw new Error('Feed empty');
    const body = {channel:key,channelId:CHANNELS[key],playlist:'UU'+CHANNELS[key].slice(2),fetchedAt:new Date().toISOString(),refreshSeconds:300,stale:false,videos};
    cache.set(key,{time:Date.now(),body});
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).json(body);
  } catch (_) {
    res.setHeader('Cache-Control','no-store');
    if (previous && Date.now()-previous.time < 3600000) return res.status(200).json({...previous.body,stale:true});
    return res.status(503).json({error:'YouTube is temporarily unavailable. Use the full channel link.'});
  }
}
module.exports = handler;
module.exports.parseFeed = parseFeed;

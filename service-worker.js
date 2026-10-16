/* Build 5.12 PWA shell cache; never cache cross-origin, Supabase or Stripe API requests. */
const VERSION='dd-worldwide-1098';
const SHELL=['./manifest.webmanifest','./world-expansion.css','./world-expansion.js',
 './royal-treasury.css','./royal-treasury.js','./beta-511.css','./beta-511.js',
 './living-512.css','./living-512.js','./battle-513.css','./battle-513.js','./armory-514.js','./armory-514.css','./kingdom-515.js','./kingdom-515.css','./territory-516.js','./territory-516.css','./resources-5161.js','./resources-5161.css','./royal-messenger-517.css','./royal-messenger-517.js','./royal-media-518.css','./royal-media-518.js','./royal-united-519.js','./royal-united-519.css','./living-kingdom-600.js','./living-kingdom-600.css','./living-battles-610.js','./living-battles-610.css','./bloodlines-620.js','./riders-warbands-656.js','./riders-warbands-656.css','./bloodlines-620.css','./dominion-reborn-610.css','./dominion-reborn-610.js','./living-bond-611.js','./living-bond-611.css','./kingdom-council-670.js','./kingdom-council-670.css','./alliance-warfare-680.js','./alliance-warfare-680.css','./world-exploration-690.js','./world-exploration-690.css','./royal-interface-612.js','./royal-interface-612.css','./icons/dino-192.png','./icons/dino-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dd-worldwide-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const r=event.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
 const url=new URL(r.url);
 if(url.pathname.includes('/auth/')||url.pathname.includes('/rest/')||url.pathname.includes('/functions/')||url.pathname.includes('/storage/'))return;
 if(r.mode==='navigate'){event.respondWith(fetch(r).then(async response=>{if(response.ok){const cache=await caches.open(VERSION);cache.put('./',response.clone())}return response}).catch(async()=>{const cached=await caches.match('./');return cached||Response.error()}));return}
 if(!SHELL.some(asset=>url.pathname.endsWith(asset.replace('./',''))))return;
 event.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(cache=>cache.put(r,copy))}return res})));
});

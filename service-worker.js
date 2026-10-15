/* Build 5.12 PWA shell cache; never cache cross-origin, Supabase or Stripe API requests. */
const VERSION='dd-worldwide-1064';
const SHELL=['./manifest.webmanifest','./world-expansion.css','./world-expansion.js',
 './royal-treasury.css','./royal-treasury.js','./beta-511.css','./beta-511.js',
 './living-512.css','./living-512.js','./battle-513.css','./battle-513.js','./icons/dino-192.png','./icons/dino-512.png'];
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

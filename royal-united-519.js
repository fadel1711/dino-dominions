/* Dino Dominion 5.19 — Kingdoms United (5.19 + 5.20 + 5.21)
 * Photos: only Private and Alliance; server-screened, private bucket, signed 60s links.
 * Alliance War Room: R4/R5-only posts via Supabase RLS, viewed by members.
 * Reporting: existing secure report table. Blocks sync per signed-in commander.
 * Fails closed if schema, moderation key, or Edge Function is not yet active.
 */
(()=>{'use strict';
const MAX_PHOTO=1500000,UUID=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const PHOTO=/^\[\[DD519:PHOTO:([a-f\d-]{36})\]\]$/i;
const $=id=>document.getElementById(id),api=()=>window.DDOnlineClient;
const ctx=()=>window.DD517?.context?.()||{};
const esc=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[k]));
let panel=null,lightbox=null,posts=[],allianceRank=0,fetchKey='',photoCache=new Map(),pending=new Set(),lastUser='',boardLoaded=false,menuOpen=false,photoReady=false,checkedStatus=false,checkingStatus=false;
const eligible=v=>(v.room==='private'&&UUID.test(v.peer||'')&&v.userId!==v.peer)||(v.room==='alliance'&&UUID.test(v.allianceId||''));
// The exit control lives outside the replaceable notice body so failures never trap commanders.
const warContent=()=>panel?.querySelector('#dd519WarContent');
function closeWar(){menuOpen=false;if(panel)panel.hidden=true;const b=$('dd519WarButton');if(b&&!b.hidden)b.focus({preventScroll:true});}
function notify(s){const el=$('dd519Info');if(el){el.textContent=s;el.hidden=!s;}else{const fallback=$('dd517Status');if(fallback){fallback.textContent=s;fallback.hidden=!s;}}}
function renderBody(body){const match=String(body??'').match(PHOTO);if(!match||!UUID.test(match[1]))return null;
return `<button type="button" class="dd519MediaCard" data-519-openphoto="${match[1]}"><span class="dd519Frame" data-519-photo="${match[1]}"><span class="dd519PhotoPlaceholder">🔒 Protected photo · tap to view</span></span><small>🖼️ Screened image · Private/Alliance only</small></button>`;}
function isPhoto(body){return PHOTO.test(String(body??''));}
function labelFor(body){return isPhoto(body)?'🖼️ Photo':null;}
function install(){const root=$('dd517Messenger'),form=$('dd517Form');if(!root||!form)return;
const bar=document.createElement('div');bar.id='dd519Tools';bar.className='dd519Tools';bar.innerHTML=`<button type="button" id="dd519PhotoButton" title="Send a moderated photo">🖼️ Photo</button><button type="button" id="dd519WarButton" title="Alliance War Room">📣 War Room</button><span class="dd519Build">KINGDOMS UNITED · 5.19</span><input id="dd519File" type="file" accept="image/*" hidden><span id="dd519Info" role="status" hidden></span>`;
form.parentNode.insertBefore(bar,form);
const board=document.createElement('section');board.className='dd519WarPanel';board.id='dd519WarPanel';board.hidden=true;board.setAttribute('role','dialog');board.setAttribute('aria-label','Alliance War Room');board.innerHTML='<div class="dd519WarHead"><h3>🛡️ Alliance War Room</h3><button type="button" data-519="closeWar" aria-label="Exit War Room">✕ Exit</button></div><div id="dd519WarContent" role="status"></div>';root.appendChild(board);panel=board;
const viewer=document.createElement('div');viewer.className='dd519Lightbox';viewer.id='dd519Lightbox';viewer.hidden=true;viewer.innerHTML=`<button type="button" data-519="closePhoto" aria-label="Close photo">✕ Close</button><img alt="Image shared by a commander"><p>Images are screened automatically, but inappropriate content can still slip through. Use Report on the message.</p>`;root.appendChild(viewer);lightbox=viewer;
root.addEventListener('click',onClick);$('dd519File').addEventListener('change',onFile);
window.addEventListener('dd519-ready',()=>sync());sync();
}
function sync(){const v=ctx();const userChanged=v.userId!==lastUser;
if(userChanged){lastUser=v.userId||'';photoCache.clear();pending.clear();photoReady=false;checkedStatus=false;allianceRank=0;posts=[];fetchKey='';boardLoaded=false;panel&&(panel.hidden=true);}
const active=!!v.open&&!!v.userId;const photo=$('dd519PhotoButton'),war=$('dd519WarButton');
if(photo){photo.hidden=!active||!['private','alliance'].includes(v.room);photo.disabled=!eligible(v)||!photoReady;photo.title=!eligible(v)?'Select a commander or join an alliance':!photoReady?'Photos will unlock after secure moderation is activated':'Choose a private image to screen';}
if(war){war.hidden=!active||v.room!=='alliance';war.disabled=!v.allianceId;}
if(panel&&!active)panel.hidden=true;
if(active&&!checkedStatus&&!checkingStatus)checkServer();
}
async function checkServer(){checkingStatus=true;try{const {data,error}=await api().functions.invoke('dd519-media',{body:{action:'status'}});photoReady=!error&&data?.enabled===true;}catch{photoReady=false;}finally{checkingStatus=false;checkedStatus=true;const b=$('dd519PhotoButton');if(b){const v=ctx();b.disabled=!eligible(v)||!photoReady;b.title=photoReady?'Choose a moderated private photo':'Photo moderation setup not activated yet';}if(!photoReady&&['private','alliance'].includes(ctx().room))notify('🔒 Photos will unlock after secure moderation setup. Stickers, GIFs and text still work.');}}
async function onRoom(){sync();const v=ctx();if(menuOpen&&(v.room!=='alliance'||!v.allianceId)){menuOpen=false;panel.hidden=true;}if(v.open&&v.room==='alliance'&&v.allianceId&&menuOpen)await loadBoard();}
function onOpen(open){if(!open){menuOpen=false;if(panel)panel.hidden=true;if(lightbox)lightbox.hidden=true;}sync();}
function afterRender(){sync();const v=ctx();if(!v.open||!v.userId)return;
for(const el of document.querySelectorAll('#dd517Messages [data-519-photo]')){
 const id=el.dataset['519Photo'];if(!UUID.test(id))continue;
 const cache=photoCache.get(id);if(cache&&Date.now()<cache.until){showImage(el,cache.url);continue;}
 if(!pending.has(id))resolveImage(id,el);
}}
function showImage(el,url){if(!el?.isConnected)return;let img=el.querySelector('img');if(!img){el.textContent='';img=document.createElement('img');img.alt='Private photo shared in chat';img.loading='lazy';img.referrerPolicy='no-referrer';el.appendChild(img);}img.src=url;}
async function resolveImage(id,el){const v=ctx();if(!v.userId||pending.has(id))return;pending.add(id);
try{const {data,error}=await api().functions.invoke('dd519-media',{body:{action:'view',id}});if(error||!data?.url||typeof data.url!=='string'||!data.url.startsWith('https://'))throw Error('Unavailable');if(ctx().userId!==v.userId)return;
photoCache.set(id,{url:data.url,until:Date.now()+45_000});showImage(el,data.url);
}catch{if(el?.isConnected)el.textContent='🔒 Photo unavailable or access restricted';}finally{pending.delete(id);}}
async function openPhoto(id){const c=photoCache.get(id);if(!c||Date.now()>c.until){const el=document.querySelector(`[data-519-photo="${id}"]`);await resolveImage(id,el);}
const rec=photoCache.get(id);if(!rec||!lightbox)return notify('Photo unavailable. It may have been removed or your access changed.');const img=lightbox.querySelector('img');img.src=rec.url;lightbox.hidden=false;}
function imageToWebp(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{try{const scale=Math.min(1,1280/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));if(c.width*c.height>2500000)throw Error('Image too large');c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>{URL.revokeObjectURL(url);if(b?.type==='image/webp'&&b.size>0&&b.size<=MAX_PHOTO)resolve(b);else reject(Error('Please choose a smaller image.'))},'image/webp',0.77);}catch(e){URL.revokeObjectURL(url);reject(e)}};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Unsupported photo format'))};img.src=url;});}
async function onFile(e){const file=e.target.files?.[0];e.target.value='';if(!file)return;const v=ctx();if(!eligible(v))return notify('Pictures are only for selected Private and Alliance chats.');if(file.size>9_000_000||!file.type.startsWith('image/'))return notify('Please select an image under 9 MB.');
if(!confirm('Screen and share this photo in '+(v.room==='alliance'?'Alliance Chat':'Private Chat')+'? Images are reviewed automatically, not perfectly.'))return;
const btn=$('dd519PhotoButton');btn.disabled=true;notify('Preparing and screening your photo…');
try{const blob=await imageToWebp(file);if(ctx().userId!==v.userId||ctx().room!==v.room||ctx().peer!==v.peer)return notify('Chat changed; photo cancelled.');
const form=new FormData();form.append('file',new File([blob],'royal-photo.webp',{type:'image/webp'}));form.append('channel',v.room);if(v.room==='private')form.append('recipient_id',v.peer);else form.append('alliance_id',v.allianceId);
const {data,error}=await api().functions.invoke('dd519-media',{body:form});if(error||!data?.ok)throw Error(data?.error||error?.message||'Server-side media screening is not activated yet');
notify('✅ Photo approved and sent!');await window.DD517?.refresh?.();
}catch(err){notify('🛡️ Photo not shared: '+String(err.message||'Screening unavailable').slice(0,155));}finally{sync();}}
async function loadBoard(){const v=ctx(),key=v.userId+':'+v.allianceId;if(!v.allianceId||!v.userId)return;
if(fetchKey!==key){fetchKey=key;posts=[];allianceRank=0;}const body=warContent();if(!body)return;body.innerHTML='<p>Loading alliance notices…</p>';
try{
 const [role,notices]=await Promise.all([api().from('alliance_members').select('rank').eq('alliance_id',v.allianceId).eq('user_id',v.userId).maybeSingle(),api().from('dd519_alliance_posts').select('id,created_at,kind,body,pinned,author_id').eq('alliance_id',v.allianceId).order('created_at',{ascending:false}).limit(30)]);
if(ctx().allianceId!==v.allianceId||!menuOpen)return;
if(role.error||notices.error){body.innerHTML='<p>🛡️ War Room notices are unavailable until the 5.19 Supabase backend is configured. Your alliance chat is still available.</p>';return;}
 allianceRank=Number(role.data?.rank||0);posts=notices.data||[];boardLoaded=true;renderBoard();
 }catch(_){if(menuOpen&&ctx().allianceId===v.allianceId)body.innerHTML='<p>War Room could not load. Exit and try again later; alliance chat is unaffected.</p>';}}
function renderBoard(){const officer=allianceRank>=4,body=warContent();if(!body)return;body.innerHTML=`<p class="dd519Small">Pinned strategy, leadership announcements, and war invitations. R4/R5 officers can publish.</p>${officer?`<form id="dd519PostForm"><select name="kind" aria-label="Notice type"><option value="announcement">📣 Announcement</option><option value="war">⚔️ War strategy</option><option value="invite">🔔 Battle invitation</option></select><textarea name="body" maxlength="500" minlength="3" placeholder="Write instructions to your alliance…" required></textarea><label><input type="checkbox" name="pinned"> 📌 Pin notice</label><button type="submit">Publish notice</button></form>`:'<p class="dd519Small">📜 Officers publish; members can read and follow invitations.</p>'}
<div class="dd519Posts">${posts.length?posts.slice().sort((a,b)=>Number(b.pinned)-Number(a.pinned)||Date.parse(b.created_at)-Date.parse(a.created_at)).map(p=>`<article class="dd519Post"><strong>${p.pinned?'📌 ':''}${{announcement:'📣 Announcement',war:'⚔️ Strategy',invite:'🔔 War invitation'}[p.kind]||'Notice'}</strong><time>${new Date(p.created_at).toLocaleString()}</time><p>${esc(p.body)}</p>${p.kind==='invite'?'<button type="button" data-519="warfront">⚔️ Open Warfront</button>':''}</article>`).join(''):'<p>No notices yet. Your officers can post the first announcement.</p>'}</div>`;
}
async function post(e){e.preventDefault();const v=ctx();if(!v.userId||!v.allianceId||allianceRank<4)return notify('Officer permissions required');const f=e.target;const body=f.elements.body.value.trim();const kind=f.elements.kind.value;const pinned=f.elements.pinned.checked;if(body.length<3||body.length>500||!['announcement','war','invite'].includes(kind))return;
const btn=f.querySelector('[type="submit"]');btn.disabled=true;
try{const {error}=await api().from('dd519_alliance_posts').insert({alliance_id:v.allianceId,author_id:v.userId,kind,body,pinned});if(error)throw error;notify('Alliance notice published');await loadBoard();}catch(x){notify('Could not publish: '+String(x.message).slice(0,130));}finally{if(btn.isConnected)btn.disabled=false;}}
async function blockUser(userId){const v=ctx();if(!UUID.test(userId)||!v.userId||v.userId===userId)return;const {error}=await api().from('dd519_blocks').upsert({owner_id:v.userId,blocked_id:userId},{onConflict:'owner_id,blocked_id',ignoreDuplicates:true});if(error)notify('Muted on this device. Cloud block sync needs backend setup.');}
async function loadBlocks(){const v=ctx();if(!v.userId)return [];const {data,error}=await api().from('dd519_blocks').select('blocked_id').eq('owner_id',v.userId).limit(1000);return error?[]:(data||[]).map(x=>x.blocked_id);}
async function onClick(e){const b=e.target.closest('[data-519], [data-519-openphoto], #dd519PhotoButton, #dd519WarButton');if(!b)return;if(b.id==='dd519PhotoButton'){e.preventDefault();$('dd519File')?.click();return;}
if(b.id==='dd519WarButton'){e.preventDefault();menuOpen=!menuOpen;panel.hidden=!menuOpen;if(menuOpen)await loadBoard();return;}
if(b.dataset['519Openphoto']){e.preventDefault();await openPhoto(b.dataset['519Openphoto']);return;}
const act=b.dataset['519'];if(act==='closePhoto'){lightbox.hidden=true;lightbox.querySelector('img').removeAttribute('src');}if(act==='closeWar'){e.preventDefault();closeWar();}if(act==='warfront'){closeWar();window.DD517?.close?.();window.DDFullUI?.open?.('war');}}
function boot(){install();$('dd517Messenger')?.addEventListener('submit',e=>{if(e.target?.id==='dd519PostForm')post(e)});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen&&!lightbox?.hidden){return;}if(e.key==='Escape'&&menuOpen){e.preventDefault();e.stopPropagation();closeWar();}},true);}
window.DD519={renderBody,isPhoto,labelFor,onRoom,onOpen,afterRender,sync,blockUser,loadBlocks,version:'5.19.0-kingdoms-united'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

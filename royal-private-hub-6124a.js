/* Dino Dominion 6.12.4a — Private Inbox & Companions layout.
 * UI only. Reuses the verified DD517, DD6123, DD6123a and DD6124 controllers.
 * No new writes, SQL or payment changes. Private previews are obtained through
 * the signed-in user's existing RLS-protected messages and profile endpoints.
 */
(()=>{'use strict';
 const VERSION='6.12.4a';
 const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
 const $=id=>document.getElementById(id);
 const client=()=>window.DDOnlineClient||null;
 const account=()=>window.DD517?.context?.()?.userId||'';
 const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let active='chats',current='',sequence=0,refreshTimer=null,observedPanel=null,initComplete=false,requestAt=0,requestTicket=0;
 const countsCache=new Map(); // Account-scoped; never reuse another commander's counts.
 const requestSummary=()=>{
  const pane=$('dd6124Panel'),hub=$('dd6124aHub');if(!pane||!hub)return;
  // Classify the EXISTING Companions markup so its normal button handlers stay bound.
  let group='misc',requestGroups=0,incoming=0;
  for(const child of [...pane.children]){
   child.classList.remove('dd6124aRequestItem','dd6124aFriendItem');
   if(child.matches('h4')){
    const t=child.textContent.trim();
    if(/^(Incoming requests|Sent requests)\b/i.test(t)){group='request';requestGroups++;if(/^Incoming/i.test(t))incoming=Number((t.match(/\((\d+)\)/)||[])[1]||0);}
    else if(/^Friends\b/i.test(t))group='friend';else group='misc';
   }
   if(group==='request')child.classList.add('dd6124aRequestItem');
   else if(group==='friend'&&child.matches('h4,.dd6124Person,.dd6124Muted'))child.classList.add('dd6124aFriendItem');
  }
  const empty=$('dd6124aRequestEmpty');if(empty)empty.hidden=requestGroups>0||pane.querySelector('[data-dd6124="retry"]')!==null||/Loading/i.test(pane.textContent);
  const badge=$('dd6124aReqBadge');if(badge){badge.textContent=incoming>99?'99+':String(incoming);badge.hidden=incoming===0;}
 };
 async function refreshRequestBadge(force=false){
  const user=account(),badge=$('dd6124aReqBadge'),api=client();
  if(!UUID.test(user)||!badge||!api||!api.rpc)return;
  if(!force&&Date.now()-requestAt<15000)return;
  requestAt=Date.now();const ticket=++requestTicket;
  try{
   const {data:authState,error:authError}=await api.auth.getUser();
   if(authError||authState?.user?.id!==user||ticket!==requestTicket)return;
   const {data,error}=await api.rpc('dd6124_friend_list');
   if(error||!Array.isArray(data)||account()!==user||ticket!==requestTicket)return;
   const count=data.filter(x=>x.status==='pending'&&x.direction==='incoming').length;
   badge.textContent=count>99?'99+':String(count);badge.hidden=count===0;
  }catch{/* Existing friendships panel displays backend failures explicitly. */}
 }
 function setMode(next){
  if(!['chats','requests','friends'].includes(next))return;
  active=next;
  const root=$('dd517Messenger'),hub=$('dd6124aHub');if(!root||!hub)return;
  hub.dataset.active=next;root.dataset.dd6124aTab=next;
  for(const b of hub.querySelectorAll('[data-dd6124a-tab]')){
   const chosen=b.dataset.dd6124aTab===next;b.setAttribute('aria-selected',String(chosen));b.setAttribute('tabindex',chosen?'0':'-1');
  }
  for(const name of ['chats','requests','friends']){
   const pane=$('dd6124a'+name[0].toUpperCase()+name.slice(1));if(pane)pane.hidden=next!==name;
  }
  if(next!=='chats'){
   const slot=$('dd6124FriendsMount'),target=next==='requests'?$('dd6124aRequestsSlot'):$('dd6124aFriendsSlot');
   if(slot&&target&&slot.parentNode!==target)target.appendChild(slot);
   const toggle=slot?.querySelector('[data-dd6124="toggle"]');
   const pane=$('dd6124Panel');
   if(toggle&&pane?.hidden){toggle.click();if(pane.hidden)toggle.click();}
   requestSummary();
  }else{
   setChatSelected();void loadThreads();void refreshRequestBadge();
  }
 }
 function setChatSelected(){const root=$('dd517Messenger');if(root)root.dataset.dd6124aChatSelected=String(UUID.test(window.DD517?.context?.()?.peer||''));}
 function msgPreview(body){const s=String(body||'');if(/^\[\[DD518:STICKER:/i.test(s))return '🧩 Sticker';if(/^\[\[DD518:GIF:/i.test(s))return '🎞️ GIF';if(/^\[\[DD519:PHOTO:/i.test(s))return '🖼️ Photo';return s.replace(/\s+/g,' ').slice(0,96)||'Message';}
 const formatTime=s=>{const d=new Date(s);if(!Number.isFinite(d.getTime()))return '';try{return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(d)}catch{return ''}};
 function cursors(uid){try{const data=JSON.parse(localStorage.getItem('dd517:'+uid+':seen')||'{}');return data&&typeof data==='object'?data:{}}catch{return {}}}
 function muted(uid){try{const v=JSON.parse(localStorage.getItem('dd517:'+uid+':blocked')||'[]');return Array.isArray(v)?v.filter(x=>UUID.test(x)):[]}catch{return []}}
 async function countThreads(user,threads,ticket){
  // Exact per-chat counts are read-only and bounded to the twelve visible threads.
  // Use four workers, not a burst of one unbounded request per message.
  const api=client();if(!api)return;
  const pending=threads.filter(t=>{const cached=countsCache.get(user+':'+t.id);return !cached||cached.latest!==String(t.latest.id)||Date.now()-cached.at>120000;});
  let next=0;
  async function work(){while(next<pending.length){
   const entry=pending[next++],peer=entry.id;
   try{
    const query=api.from('messages').select('id',{count:'exact',head:true})
     .eq('channel','private')
     .or(`and(sender_id.eq.${user},recipient_id.eq.${peer}),and(sender_id.eq.${peer},recipient_id.eq.${user})`);
    const {count,error}=await query;
    if(error||!Number.isSafeInteger(count)||count<0)continue;
    if(ticket!==sequence||account()!==user)return;
    countsCache.set(user+':'+peer,{count,latest:String(entry.latest.id),at:Date.now()});
    const node=$('dd6124aTotal-'+peer);if(node){node.textContent=count+' '+(count===1?'message':'messages');node.title='Total messages in this conversation';}
   }catch{/* Keep transparent recent-count fallback if the exact count request fails. */}
  }}
  await Promise.all(Array.from({length:Math.min(4,pending.length)},()=>work()));
 }
 async function loadThreads(){
  const holder=$('dd6124aThreads'),user=account(),api=client(),ticket=++sequence;
  if(!holder||!UUID.test(user)||!api||active!=='chats'){
   if(holder)holder.textContent='Sign in to see your private conversations.';return;
  }
  holder.innerHTML='<p class="dd6124aMuted">Loading recent conversations…</p>';
  try{
   const {data:identity,error:identityError}=await api.auth.getUser();
   if(identityError||identity?.user?.id!==user)throw Error('Sign-in changed. Reopen Messenger.');
   const result=await api.from('messages')
    .select('id,created_at,sender_id,recipient_id,body')
    .eq('channel','private')
    .or(`sender_id.eq.${user},recipient_id.eq.${user}`)
    .order('created_at',{ascending:false}).limit(180);
   if(result.error)throw result.error;
   if(ticket!==sequence||account()!==user)return;
   const filtered=new Set(muted(user));
   const blocked=await api.from('dd519_blocks').select('blocked_id').eq('owner_id',user).limit(1000);
   if(!blocked.error)for(const b of blocked.data||[])filtered.add(b.blocked_id);
   if(ticket!==sequence||account()!==user)return;
   const read=cursors(user),base=Date.parse(read['private:all']||'')||0;
   const group=new Map();const all=Array.isArray(result.data)?result.data:[];
   for(const msg of all){
    const peer=msg.sender_id===user?msg.recipient_id:msg.sender_id;
    if(!UUID.test(peer)||peer===user||filtered.has(peer))continue;
    let t=group.get(peer);
    if(!t){t={id:peer,latest:msg,shown:0,unread:0};group.set(peer,t);}
    t.shown++;
    if(msg.sender_id!==user && (Date.parse(msg.created_at)||0)>Math.max(base,Date.parse(read['private:'+peer]||'')||0))t.unread++;
   }
   const threads=[...group.values()].slice(0,12),ids=threads.map(x=>x.id);
   const profileResult=ids.length?await api.from('commander_profiles').select('user_id,commander_name,avatar').in('user_id',ids):{data:[]};
   if(ticket!==sequence||account()!==user)return;
   const profiles=new Map((profileResult.data||[]).map(p=>[p.user_id,p]));
   holder.innerHTML=threads.length?threads.map(t=>{
    const p=profiles.get(t.id),name=escapeHTML(p?.commander_name||'Commander '+t.id.slice(0,6)),avatar=escapeHTML(p?.avatar||'🦖');
    const last=escapeHTML(msgPreview(t.latest.body)),fromMe=t.latest.sender_id===user?'You: ':'';
    const prior=countsCache.get(user+':'+t.id),same=prior?.latest===String(t.latest.id)&&Date.now()-prior.at<120000;
    const known=all.length<180,count=same?String(prior.count):(known?String(t.shown):`${t.shown}+ recent`);
    return `<div class="dd6124aThread" data-dd6124a-thread="${t.id}">
       <button type="button" class="dd6124aAvatar" data-dd6124a-profile="${t.id}" title="View ${name}'s profile" aria-label="View ${name}'s profile">${avatar}</button>
       <button type="button" class="dd6124aThreadMain" data-dd6124a-open="${t.id}" aria-label="Open chat with ${name}">
        <span class="dd6124aThreadTop"><strong>${name}</strong><time>${escapeHTML(formatTime(t.latest.created_at))}</time></span>
        <span class="dd6124aPreview">${fromMe}${last}</span>
        <small id="dd6124aTotal-${t.id}" class="dd6124aMsgCount" title="Count of messages in the recent fetch; loading total…">${count} ${(same?prior.count:t.shown)===1?'message':'messages'}</small>
       </button>${t.unread?`<span class="dd6124aUnread" aria-label="${t.unread} unread messages">${t.unread>99?'99+':t.unread}</span>`:''}
     </div>`;
   }).join(''):'<p class="dd6124aMuted">No private conversations yet. Tap <b>New chat</b> to find a commander.</p>';
   const total=threads.reduce((n,t)=>n+t.unread,0),badge=$('dd6124aChatBadge');
   if(badge){badge.textContent=total>99?'99+':String(total);badge.hidden=total===0;}
   // Counts upgrade asynchronously without holding the conversation UI hostage.
   void countThreads(user,threads,ticket);
  }catch(e){if(ticket===sequence&&account()===user&&holder){holder.replaceChildren();const p=document.createElement('p');p.className='dd6124aError';p.textContent='Conversations unavailable: '+String(e?.message||e).slice(0,130);holder.appendChild(p);}}
 }
 function buildHub(){
  const host=document.createElement('div');host.id='dd6124aHub';host.className='dd6124aHub';
  host.innerHTML=`<div class="dd6124aNav" role="tablist" aria-label="Private Messenger sections">
   <button type="button" role="tab" data-dd6124a-tab="chats" aria-selected="true">💬 Chats <span id="dd6124aChatBadge" class="dd6124aPill" hidden>0</span></button>
   <button type="button" role="tab" data-dd6124a-tab="requests" aria-selected="false">🛡 Requests &amp; Blocks <span id="dd6124aReqBadge" class="dd6124aPill" hidden>0</span></button>
   <button type="button" role="tab" data-dd6124a-tab="friends" aria-selected="false">👑 Friends &amp; Aid</button>
  </div>
  <section id="dd6124aChats" class="dd6124aPane" role="tabpanel" aria-label="Chats">
   <div class="dd6124aSectionHead"><b>Conversations</b><div><button type="button" data-dd6124a="new" title="Find a commander">＋ New chat</button><button type="button" data-dd6124a="refresh" aria-label="Refresh chats" title="Refresh chats">↻</button></div></div>
   <div id="dd6124aThreads" class="dd6124aThreads" aria-live="polite"></div><div id="dd6124aSearchMount"></div>
  </section>
  <section id="dd6124aRequests" class="dd6124aPane" role="tabpanel" aria-label="Requests and blocked commanders" hidden>
   <div class="dd6124aSectionHead"><b>Friend requests</b><button type="button" data-dd6124a="refreshFriends" title="Refresh requests">↻</button></div>
   <p id="dd6124aRequestEmpty" class="dd6124aMuted" hidden>No pending friend requests.</p>
   <div id="dd6124aRequestsSlot"></div><div class="dd6124aSectionHead dd6124aBlockHeading"><b>🛡️ Blocked commanders</b></div><div id="dd6124aBlocksSlot"></div>
  </section>
  <section id="dd6124aFriends" class="dd6124aPane" role="tabpanel" aria-label="Friends and verified Kingdom Aid" hidden>
   <div class="dd6124aSectionHead"><b>Friends &amp; Kingdom Aid</b><button type="button" data-dd6124a="refreshFriends" title="Refresh friends">↻</button></div>
   <div id="dd6124aFriendsSlot"></div>
  </section>`;
  host.addEventListener('click',async e=>{
   const nav=e.target.closest('[data-dd6124a-tab]');if(nav&&host.contains(nav)){setMode(nav.dataset.dd6124aTab);return;}
   const open=e.target.closest('[data-dd6124a-open]');if(open&&host.contains(open)){
    const id=open.dataset.dd6124aOpen;if(!UUID.test(id))return;
    window.DDCommanderSafety?.openPrivate?.(id);setTimeout(()=>{setChatSelected();},100);return;
   }
   const prof=e.target.closest('[data-dd6124a-profile]');if(prof&&host.contains(prof)){const id=prof.dataset.dd6124aProfile;if(UUID.test(id))window.DDCommanderSafety?.openProfile?.(id);return;}
   const b=e.target.closest('[data-dd6124a]');if(!b||!host.contains(b))return;
   if(b.dataset.dd6124a==='refresh'){void loadThreads();}
   else if(b.dataset.dd6124a==='new'){
    const search=host.querySelector('.dd6123FindToggle');
    if(search){search.open=!search.open; b.setAttribute('aria-expanded',String(search.open));if(search.open)search.querySelector('#dd517Search')?.focus();}
   }else if(b.dataset.dd6124a==='refreshFriends'){
    window.DDRoyalCompanions?.invalidate?.();
    const list=$('dd6124Panel');if(list?.hidden)$('dd6124FriendsMount [data-dd6124="toggle"]')?.click();
   }
  });
  return host;
 }
 function ensureHub(){
  const root=$('dd517Messenger'),controls=$('dd517Controls');
  if(!root||!controls)return;
  if(window.DD517?.context?.()?.room!=='private'){
   if(root.dataset.dd6124aTab){delete root.dataset.dd6124aTab;delete root.dataset.dd6124aChatSelected;}
   sequence++;current='';return;
  }
  const tools=controls.querySelector('.dd6123PrivateTools');
  if(!tools)return;
  const user=account();if(user!==current){current=user;sequence++;requestAt=0;countsCache.clear();active='chats';for(const id of ['dd6124aChatBadge','dd6124aReqBadge']){const badge=$(id);if(badge)badge.hidden=true;}}
  let hub=$('dd6124aHub');const remount=!hub||hub.parentNode!==tools;
  if(remount){
   hub=buildHub();tools.insertBefore(hub,tools.firstChild);
   // The existing modules own these elements and their listeners. Do not clone.
  }
  const slot=$('dd6124FriendsMount');if(slot){
   const target=active==='requests'?$('dd6124aRequestsSlot'):$('dd6124aFriendsSlot');
   if(target&&slot.parentNode!==target)target.appendChild(slot);
   window.DDRoyalCompanions?.mount?.();
  }
  const block=tools.querySelector('.dd6123aTools');const blockSlot=$('dd6124aBlocksSlot');
  if(block&&blockSlot&&block.parentNode!==blockSlot)blockSlot.appendChild(block);
  const search=controls.querySelector('.dd6123FindToggle');const searchSlot=$('dd6124aSearchMount');
  if(search&&searchSlot&&search.parentNode!==searchSlot){searchSlot.appendChild(search);search.open=false;}
  if(remount){setMode(active);setChatSelected();}
  if(slot){const pane=$('dd6124Panel');if(pane&&observedPanel!==pane){observedPanel=pane;new MutationObserver(requestSummary).observe(pane,{childList:true});requestSummary();}}
 }
 function boot(){
  if(initComplete)return true;
  const root=$('dd517Messenger'),ctrl=$('dd517Controls');if(!root||!ctrl)return false;
  initComplete=true;
  let waiting=false;new MutationObserver(()=>{
   if(waiting)return;waiting=true;queueMicrotask(()=>{waiting=false;ensureHub();});
  }).observe(ctrl,{childList:true,subtree:true});
  root.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>{setTimeout(ensureHub,0);}));
  document.addEventListener('click',e=>{if(e.target.closest('[data-dd6123="block"],[data-517="mute"],[data-dd6123a="unmute"]'))setTimeout(()=>{if(root.dataset.dd6124aTab==='chats')void loadThreads();},850);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active==='chats'&&root.dataset.dd6124aTab==='chats')void loadThreads();});
  const connect=()=>{const c=client();if(!c?.auth?.onAuthStateChange)return false;
   c.auth.onAuthStateChange(()=>{sequence++;current='';active='chats';const list=$('dd6124aThreads');if(list)list.replaceChildren();for(const id of ['dd6124aChatBadge','dd6124aReqBadge']){const badge=$(id);if(badge)badge.hidden=true;}requestAt=0;requestTicket++;countsCache.clear();const root=$('dd517Messenger');if(root){delete root.dataset.dd6124aTab;delete root.dataset.dd6124aChatSelected;}setTimeout(ensureHub,70);});return true;
  };if(!connect()){let attempts=0;const iv=setInterval(()=>{if(connect()||++attempts>30)clearInterval(iv)},250);}
  refreshTimer=setInterval(()=>{if(document.hidden||root.hidden||root.dataset.dd6124aTab!=='chats')return;if(!UUID.test(account()))return;void loadThreads();void refreshRequestBadge();},30000);
  ensureHub();return true;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!boot()){let i=0;const t=setInterval(()=>{if(boot()||++i>40)clearInterval(t)},250);}});else if(!boot()){let i=0;const t=setInterval(()=>{if(boot()||++i>40)clearInterval(t)},250);}
 window.DDPrivateHub={version:VERSION,refresh:()=>void loadThreads(),openTab:setMode};
})();

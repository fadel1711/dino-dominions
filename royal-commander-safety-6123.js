/* Dino Dominion 6.12.3 — Commander Profiles & Safety (additive module)
 * Requires: royal-messenger-517.js, dd519 backend, SQL 6.12.3.
 * No access to local save, wallet, or payment paths.
 */
(()=>{'use strict';
const VERSION='6.12.3-review';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[x]));
const client=()=>window.DDOnlineClient;
const root=()=>document.getElementById('dd517Messenger');
const $=id=>document.getElementById(id);
let modal=null,activeUser='',currentMessage=null,blockedForMe=false,fetchTicket=0;
let recentBusy=false, recentVisible=false;
const reasonNames={inappropriate_name:'Inappropriate commander name',impersonation:'Impersonation',harassment:'Harassment',spam:'Spam or abuse',other:'Other'};
const me=()=>window.DD517?.context?.().userId||'';
const safeId=v=>UUID.test(String(v||''));
function feedback(msg){const p=$('dd6123Feedback');if(p){p.textContent=String(msg||'');p.hidden=!msg;}}
function ensureModal(){if(modal)return modal;
 modal=document.createElement('div');modal.id='dd6123ProfileShade';modal.className='dd6123Shade';modal.hidden=true;
 modal.innerHTML='<section class="dd6123Sheet" role="dialog" aria-modal="true" aria-labelledby="dd6123Title"><header><span class="dd6123Overline">👑 COMMANDER RECORD</span><button type="button" data-dd6123="close" aria-label="Close commander profile">✕</button></header><div id="dd6123Body" aria-live="polite"></div><p id="dd6123Feedback" role="status" hidden></p></section>';
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{if(e.target===modal)hide();});
 return modal;
}
function hide(){if(modal)modal.hidden=true;activeUser='';currentMessage=null;fetchTicket++;}
function view(content){ensureModal();$('dd6123Body').innerHTML=content;feedback('');}
async function userProfile(uid,link=null){
 if(!safeId(uid)||!me())return;
 ensureModal();const t=++fetchTicket;activeUser=uid;currentMessage=link;modal.hidden=false;
 view('<p class="dd6123Hint">Opening commander record…</p>');
 try{
  const c=client();const [{data:p,error:profileError},{data:b,error:blockError}]=await Promise.all([
   c.from('commander_profiles').select('user_id,commander_name,avatar').eq('user_id',uid).maybeSingle(),
   c.from('dd519_blocks').select('blocked_id').eq('owner_id',me()).eq('blocked_id',uid).maybeSingle()
  ]);
  if(t!==fetchTicket)return;
  if(profileError||!p){view('<p class="dd6123Hint">Commander profile unavailable.</p>');return;}
  blockedForMe=!blockError&&!!b;
  const mine=uid===me();
  const name=esc(p.commander_name||'Commander'), avatar=esc(p.avatar||'🦖');
  view(`<div class="dd6123Identity"><div class="dd6123Avatar">${avatar}</div><div><h2 id="dd6123Title">${name}</h2><small>Player ID · ${esc(uid.slice(0,8))}…</small></div></div><div class="dd6123Actions">
    ${mine?'<p class="dd6123Hint">This is your commander profile.</p>':`<button data-dd6123="message" class="dd6123Primary">💬 Message</button>
    <button data-dd6123="block">${blockedForMe?'🔓 Unblock':'🛡️ Block'}</button>
    <button data-dd6123="report">🚩 Report profile</button>`}
    </div>${mine?'':'<div id="dd6123FriendAction"></div>'}
    <p class="dd6123Hint">Blocking prevents new private messages and personal Royal Mail in both directions. Shared public chat may still be visible to others.</p>`);
  if(!mine&&blockedForMe){$('dd6123FriendAction').innerHTML='<p class="dd6123Hint">Friendship is unavailable while this commander is blocked.</p>';}
  else if(!mine&&window.DDRoyalCompanions?.renderProfileAction){await window.DDRoyalCompanions.renderProfileAction(uid,$('dd6123FriendAction'));}
 }catch(e){if(t===fetchTicket)view(`<p class="dd6123Hint">Couldn't open this profile. ${esc(e?.message||'Try again.')}</p>`);}
}
async function fromMessage(messageId){
 const room=window.DD517?.context?.().room||'';
 const table=room.startsWith('lang:')?'dd517_language_messages':'messages';
 if(!/^\d+$/.test(String(messageId))&& !safeId(messageId))return;
 try{
  const {data,error}=await client().from(table).select('sender_id,id').eq('id',messageId).maybeSingle();
  if(error||!data||!safeId(data.sender_id))return;
  await userProfile(data.sender_id,{table,id:String(messageId)});
 }catch{}
}
async function cloudBlock(uid){
 if(uid!==activeUser)return;
 const identity=me();if(!identity||uid===identity||!safeId(uid))return;
 const action=blockedForMe?'unblock':'block';
 if(action==='block'&&!confirm('Block this commander? They will not be able to send you private messages or personal Royal Mail.'))return;
 feedback('Saving your safety preference…');
 try{
  const c=client();let res;
  if(action==='block')res=await c.from('dd519_blocks').insert({owner_id:identity,blocked_id:uid});
  else res=await c.from('dd519_blocks').delete().eq('owner_id',identity).eq('blocked_id',uid);
  if(res.error&&!(action==='block'&&res.error.code==='23505'))throw res.error;
  const key=`dd517:${identity}:blocked`;
  let old;try{old=JSON.parse(localStorage.getItem(key)||'[]')}catch{old=[]}
  const list=new Set(Array.isArray(old)?old:[]);
  if(action==='block')list.add(uid);else list.delete(uid);
  try{localStorage.setItem(key,JSON.stringify([...list]));}catch{}
  blockedForMe=action==='block';
  window.DDRoyalCompanions?.invalidate?.();
  const friendMount=$('dd6123FriendAction');
  if(friendMount){
    if(blockedForMe)friendMount.innerHTML='<p class="dd6123Hint">Friendship is unavailable while this commander is blocked.</p>';
    else if(window.DDRoyalCompanions?.renderProfileAction)void window.DDRoyalCompanions.renderProfileAction(uid,friendMount);
  }
  const btn=modal?.querySelector('[data-dd6123="block"]');
  if(btn)btn.textContent=blockedForMe?'🔓 Unblock':'🛡️ Block';
  if(action==='block'){
   // Existing Messenger mute handler updates its in-memory filter without rewriting it.
   // Uses the verified 5.17 delegated action, after successful server INSERT.
   const host=root();if(host){const proxy=document.createElement('button');proxy.hidden=true;
    proxy.dataset['517']='mute';proxy.dataset.user=uid;host.appendChild(proxy);proxy.click();proxy.remove();}
   feedback('Commander blocked. Private contact is prevented by the server.');
  }else{
   // Existing 5.17 closure retains muted IDs until a new page session.
   // Never auto-reload: unsynced Cloud Kingdom progress could be lost.
   feedback('Commander unblocked on the server. Previously hidden messages will reappear after your next normal game restart.');
  }
 }catch(e){feedback('Could not update block: '+String(e?.message||'Please retry.').slice(0,150));}
}
function showReport(){
 const host=$('dd6123Body');if(!host)return;
 const prev=$('dd6123ReportForm');if(prev){prev.remove();return;}
 const div=document.createElement('form');div.id='dd6123ReportForm';div.className='dd6123ReportForm';
 div.innerHTML=`<label for="dd6123Reason">Why are you reporting this profile?</label><select id="dd6123Reason" required>${Object.entries(reasonNames).map(([v,label])=>`<option value="${v}">${esc(label)}</option>`).join('')}</select><label for="dd6123Details">Additional context (optional)</label><textarea id="dd6123Details" maxlength="500" rows="3" placeholder="Describe the concern, without sharing private information"></textarea><button type="submit" class="dd6123Primary">Submit profile report</button>`;
 host.appendChild(div);
 div.addEventListener('submit',async e=>{
  e.preventDefault();const uid=activeUser;const identity=me();if(!safeId(uid)||!identity||uid===identity)return;
  const submit=div.querySelector('[type=submit]');submit.disabled=true;feedback('Submitting…');
  try{const {error}=await client().from('dd6123_profile_reports').insert({reporter_id:identity,target_id:uid,reason:$('dd6123Reason').value,details:$('dd6123Details').value.trim()});
    if(error)throw error;
    div.remove();feedback('Report submitted for moderation review. Thank you.');
  }catch(err){feedback('Report was not submitted: '+String(err?.message||'Try again.').slice(0,150));}
  finally{if(submit.isConnected)submit.disabled=false;}
 });
}
function openPrivate(uid){
 if(!safeId(uid))return;
 hide();const host=root();if(!host)return;
 const privateTab=host.querySelector('[data-room="private"]');privateTab?.click();
 // 5.17 renders room controls synchronously when the private tab is clicked.
 const field=$('dd517Player'),button=host.querySelector('[data-517="setPeer"]');
 if(field&&button){field.value=uid;button.click();}else window.DD517?.open?.();
}
async function recentConversations(container){
 const identity=me();if(!identity||recentBusy)return;
 recentBusy=true;container.innerHTML='<small class="dd6123Hint">Loading recent conversations…</small>';
 try{
  const {data,error}=await client().from('messages')
   .select('id,sender_id,recipient_id,created_at').eq('channel','private')
   .or(`sender_id.eq.${identity},recipient_id.eq.${identity}`)
   .order('created_at',{ascending:false}).limit(180);
  if(error)throw error;
  const peerIds=[];for(const msg of data||[]){const id=msg.sender_id===identity?msg.recipient_id:msg.sender_id;if(safeId(id)&&!peerIds.includes(id))peerIds.push(id);if(peerIds.length>=30)break;}
  const {data:profiles}=peerIds.length?await client().from('commander_profiles').select('user_id,commander_name,avatar').in('user_id',peerIds):{data:[]};
  const names=new Map((profiles||[]).map(p=>[p.user_id,p]));
  container.innerHTML=peerIds.length?peerIds.map(id=>{const p=names.get(id);return `<button type="button" class="dd6123Recent" data-dd6123-recent="${esc(id)}"><span>${esc(p?.avatar||'🦖')}</span><b>${esc(p?.commander_name||'Commander '+id.slice(0,6))}</b><small>Open chat ›</small></button>`;}).join(''):'<small class="dd6123Hint">No private conversations yet. Start one by tapping a commander’s name.</small>';
 }catch(e){container.innerHTML=`<small class="dd6123Hint">Conversations unavailable: ${esc(e?.message||'Retry later')}</small>`;}
 finally{recentBusy=false;}
}
function enhanceMessageNames(){
 const box=$('dd517Messages');if(!box)return;
 box.querySelectorAll('.dd517MsgMeta b').forEach(name=>{
   if(name.getAttribute('role')==='button')return;
   name.setAttribute('role','button');name.setAttribute('tabindex','0');
   name.setAttribute('aria-label','Open commander profile: '+name.textContent.trim());
 });
}
function ensurePrivateTools(){
 const ctrl=$('dd517Controls');if(!ctrl||window.DD517?.context?.().room!=='private')return;
 const existing=ctrl.querySelector('.dd6123PrivateTools');if(existing)return;
 recentVisible=false;const t=document.createElement('section');t.className='dd6123PrivateTools';
 const currentPeer=window.DD517?.context?.().peer;
 t.innerHTML=`${safeId(currentPeer)?`<button type="button" data-dd6123="current" data-peer="${esc(currentPeer)}">👤 View current commander's profile</button>`:''}<button type="button" data-dd6123="recent">🕘 Recent conversations</button><div id="dd6123RecentList" hidden></div><div id="dd6124FriendsMount"></div>`;
 // Preserve the existing search/ID controls, but tuck them into an expandable section
 // so they do not dominate small iPhone screens. Existing delegated clicks still work.
 const search=ctrl.querySelector('.dd517Friend');
 if(search){
  const details=document.createElement('details');details.className='dd6123FindToggle';
  const summary=document.createElement('summary');summary.textContent='🔎 Find a commander';
  details.appendChild(summary);ctrl.insertBefore(details,search);details.appendChild(search);
 }
 ctrl.insertBefore(t,ctrl.firstChild);
 window.DDRoyalCompanions?.mount?.();
}
function init(){
 const host=root();if(!host)return false;
 ensureModal();
 const msgBox=$('dd517Messages');if(msgBox){
   new MutationObserver(enhanceMessageNames).observe(msgBox,{childList:true});
   enhanceMessageNames();
 }
 host.addEventListener('keydown',e=>{
   const label=e.target.closest('.dd517MsgMeta b[role="button"]');
   if(label && (e.key==='Enter'||e.key===' ')){
     e.preventDefault();const id=label.closest('.dd517Bubble')?.dataset.id;
     if(id)void fromMessage(id);
   }
 });
 host.addEventListener('click',async e=>{
  const recent=e.target.closest('[data-dd6123-recent]');
  if(recent&&host.contains(recent)){e.preventDefault();e.stopPropagation();openPrivate(recent.dataset.dd6123Recent);return;}
  const name=e.target.closest('.dd517MsgMeta b');
  if(name&&host.contains(name)){
   e.preventDefault();e.stopPropagation();const id=name.closest('.dd517Bubble')?.dataset.id;
   if(id)await fromMessage(id);return;
  }
  const button=e.target.closest('[data-dd6123]');if(!button||!host.contains(button))return;
  if(button.dataset.dd6123==='current'){await userProfile(button.dataset.peer);return;}
  if(button.dataset.dd6123==='recent'){
   const target=$('dd6123RecentList');if(!target)return;
   recentVisible=!recentVisible;target.hidden=!recentVisible;
   if(recentVisible)await recentConversations(target);
  }
 });
 modal.addEventListener('click',e=>{
  const b=e.target.closest('[data-dd6123]');if(!b)return;
  const action=b.dataset.dd6123;
  if(action==='close')hide();else if(action==='message')openPrivate(activeUser);
  else if(action==='block')void cloudBlock(activeUser);
  else if(action==='report')showReport();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal&&!modal.hidden)hide()});
 const controls=$('dd517Controls');if(controls){new MutationObserver(ensurePrivateTools).observe(controls,{childList:true});ensurePrivateTools();}
 return true;
}
function boot(){if(init())return;let count=0;const tick=setInterval(()=>{if(init()||++count>40)clearInterval(tick)},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DDCommanderSafety={openProfile:userProfile,version:VERSION,openPrivate};
})();

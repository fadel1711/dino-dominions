/* Dino Dominion 6.12.4 — Royal Companions & verified Kingdom Aid.
 * Friend lists, limits, block checks, and resource grants are enforced server-side.
 * UI never writes social tables or grants resources directly; it fails closed if
 * the tracked 6.12.4 migration has not been approved and deployed.
 */
(()=>{'use strict';
const VERSION='6.12.4';
const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=()=>window.DDOnlineClient||null;
const identity=()=>window.DD517?.context?.()?.userId||'';
let lastUser='',cached=[],cacheUser='',cacheAt=0,opened=false,busy=false,statusText='',renderSeq=0,watching=false;
const profileRequests=new WeakMap();
function resetForAccount(){
 const now=identity();
 if(now===lastUser)return now;
 lastUser=now;cached=[];cacheUser='';cacheAt=0;opened=false;busy=false;statusText='';renderSeq++;
 const pane=$('dd6124Panel');if(pane){pane.replaceChildren();pane.hidden=true;}
 const profile=$('dd6123FriendAction');if(profile)profile.replaceChildren();
 return now;
}
function invalidate(){cacheAt=0;if(opened)void renderPanel();}
function status(msg){statusText=String(msg||'');const el=$('dd6124Status');if(el)el.textContent=statusText;}
async function friendList(force=false){
 const user=resetForAccount();if(!UUID.test(user))return [];
 if(!force&&cacheUser===user&&Date.now()-cacheAt<12000)return cached;
 const api=client();if(!api)throw Error('Cloud connection unavailable');
 const {data,error}=await api.rpc('dd6124_friend_list');
 if(identity()!==user)throw Error('Account changed — reopen Companions');
 if(error)throw Error(error.message||'Friends service unavailable');
 if(!Array.isArray(data))throw Error('Friends service is not ready');
 cached=data.filter(item=>UUID.test(item.peer_id)&&['pending','accepted'].includes(item.status));
 cacheUser=user;cacheAt=Date.now();return cached;
}
async function perform(peer,action){
 const user=resetForAccount();if(!UUID.test(user)||!UUID.test(peer)||user===peer||busy)return false;
 if(!['request','accept','decline','cancel','remove'].includes(action))return false;
 if(action==='remove'&&!window.confirm('Remove this commander from your friends list?'))return false;
 const api=client();if(!api)return false;
 busy=true;status('Updating friendship…');
 try{
  const {data,error}=await api.rpc('dd6124_friend_action',{p_peer:peer,p_action:action});
  if(identity()!==user)return false;
  if(error)throw Error(error.message||'Request not completed');
  if(!data?.status)throw Error('Unexpected server response');
  cacheAt=0;await friendList(true);
  const phrases={request:'Friend request sent.',accept:'You are friends now!',decline:'Request declined.',cancel:'Request cancelled.',remove:'Friend removed.'};
  status(phrases[action]);
  if(opened)await renderPanel();
  return true;
 }catch(e){if(identity()===user)status('Friendship unavailable: '+String(e.message||e).slice(0,170));return false;}
 finally{busy=false;}
}
async function sendAid(peer){
 const user=resetForAccount();if(!UUID.test(user)||!UUID.test(peer)||user===peer||busy)return false;
 const api=client();if(!api)return false;
 busy=true;status('Sending verified Kingdom Aid…');
 try{
  const {data,error}=await api.rpc('dd6124_send_aid',{p_recipient:peer});
  if(identity()!==user)return false;
  if(error)throw Error(error.message||'Aid could not be sent');
  if(data?.status!=='sent'||Number(data.wood)!==15||Number(data.ore)!==10)
   throw Error('Unconfirmed server response. Check Royal Authority before retrying.');
  status('🎁 Sent! Your friend received +15 wood and +10 ore in verified Royal Authority.');
  if(opened)await renderPanel();
  return true;
 }catch(e){if(identity()===user)status('Aid not confirmed: '+String(e.message||e).slice(0,170));return false;}
 finally{busy=false;}
}
function card(item,limitReached){
 const peer=esc(item.peer_id),name=esc(item.commander_name||'Commander'),avatar=esc(item.avatar||'🦖');
 let actions='';
 if(item.status==='accepted')actions=`<button type="button" data-dd6124="chat" data-peer="${peer}">Message</button><button type="button" data-dd6124="aid" data-peer="${peer}" ${limitReached?'disabled title="Daily sending limit reached"':''}>🎁 Help</button><button type="button" data-dd6124="remove" data-peer="${peer}">Remove</button>`;
 else if(item.direction==='incoming')actions=`<button type="button" data-dd6124="accept" data-peer="${peer}">Accept</button><button type="button" data-dd6124="decline" data-peer="${peer}">Decline</button>`;
 else actions=`<button type="button" data-dd6124="cancel" data-peer="${peer}">Cancel</button>`;
 return `<div class="dd6124Person"><button type="button" class="dd6124Name" data-dd6124="profile" data-peer="${peer}"><span>${avatar}</span><b>${name}</b></button><div class="dd6124PersonActions">${actions}</div></div>`;
}
async function renderPanel(){
 const pane=$('dd6124Panel');if(!pane||!opened)return;
 const user=resetForAccount();if(!UUID.test(user)){pane.innerHTML='<p class="dd6124Muted">Sign in to access Royal Companions.</p>';return;}
 const ticket=++renderSeq;
 pane.innerHTML='<p class="dd6124Muted">Loading Royal Companions…</p>';
 try{
  const api=client();if(!api)throw Error('No connection');
  const [list,{data:aid,error:aidError}]=await Promise.all([friendList(),api.rpc('dd6124_aid_summary')]);
  if(identity()!==user||ticket!==renderSeq||!opened)return;
  if(aidError||!aid||!Number.isFinite(Number(aid.sent))||!Number.isFinite(Number(aid.received)))throw Error('Aid summary unavailable');
  const friends=list.filter(x=>x.status==='accepted');
  const incoming=list.filter(x=>x.status==='pending'&&x.direction==='incoming');
  const outgoing=list.filter(x=>x.status==='pending'&&x.direction==='outgoing');
  const sent=Math.min(3,Math.max(0,Number(aid.sent))),received=Math.min(3,Math.max(0,Number(aid.received)));
  pane.innerHTML=`<div class="dd6124Summary"><b>👑 Royal Companions</b><small>${friends.length} friends · ${incoming.length} incoming</small></div>
  <div class="dd6124AidInfo"><strong>🎁 Kingdom Aid</strong><span>Sent ${sent}/3 · Received ${received}/3 today</span><small>Resets 00:00 UTC · Each gift adds <b>15 wood + 10 ore</b> to verified Royal Authority, not local kingdom resources or Gems.</small></div>
  ${incoming.length?`<h4>Incoming requests (${incoming.length})</h4>${incoming.map(x=>card(x,false)).join('')}`:''}
  <h4>Friends (${friends.length})</h4>${friends.length?friends.map(x=>card(x,sent>=3)).join(''):'<p class="dd6124Muted">No friends yet. Tap a commander’s name in chat to send a request.</p>'}
  ${outgoing.length?`<h4>Sent requests (${outgoing.length})</h4>${outgoing.map(x=>card(x,false)).join('')}`:''}
  <button type="button" class="dd6124Authority" data-dd6124="authority">🛡️ View verified resources</button>
  <p id="dd6124Status" role="status" aria-live="polite" class="dd6124Status">${esc(statusText)}</p>`;
 }catch(e){if(identity()===user&&ticket===renderSeq&&opened)pane.innerHTML=`<p class="dd6124Muted">Royal Companions unavailable. Please try again after the server update.</p><button type="button" data-dd6124="retry">Retry</button><p class="dd6124Status" role="status">${esc(String(e.message||e).slice(0,140))}</p>`;}
}
async function renderProfileAction(peer,target){
 const user=resetForAccount();if(!target||!UUID.test(user)||!UUID.test(peer)||user===peer)return;
 const ticket={};profileRequests.set(target,ticket);
 target.innerHTML='<small class="dd6124Loading">Checking friendship…</small>';
 try{
  const list=await friendList();
  if(!target.isConnected||identity()!==user||profileRequests.get(target)!==ticket)return;
  const item=list.find(x=>x.peer_id===peer);
  let actions;
  if(!item)actions='<button type="button" data-dd6124="request">🤝 Add friend</button>';
  else if(item.status==='accepted')actions='<button type="button" data-dd6124="aid">🎁 Send Kingdom Aid</button><button type="button" data-dd6124="remove">Remove friend</button>';
  else if(item.direction==='incoming')actions='<button type="button" data-dd6124="accept">✓ Accept</button><button type="button" data-dd6124="decline">Decline</button>';
  else actions='<span class="dd6124Loading">Friend request pending</span><button type="button" data-dd6124="cancel">Cancel request</button>';
  target.innerHTML=`<div class="dd6124ProfileActions" data-dd6124-peer="${esc(peer)}">${actions}</div>`;
 }catch(e){if(target.isConnected&&identity()===user&&profileRequests.get(target)===ticket)target.innerHTML='<small class="dd6124Loading">Friendships are not available on the server yet.</small>';}
}
function mount(){
 const slot=$('dd6124FriendsMount');if(!slot||slot.querySelector('[data-dd6124="toggle"]'))return;
 slot.innerHTML='<button type="button" class="dd6124Toggle" data-dd6124="toggle" aria-expanded="false">👑 Companions <span>Friends &amp; Aid</span></button><div id="dd6124Panel" hidden></div>';
 slot.addEventListener('click',async event=>{
  const b=event.target.closest('[data-dd6124]');if(!b||!slot.contains(b))return;
  const action=b.dataset.dd6124;
  if(action==='toggle'){
   const user=resetForAccount();opened=!opened;const pane=$('dd6124Panel');pane.hidden=!opened;b.setAttribute('aria-expanded',String(opened));
   if(opened){if(!UUID.test(user)){opened=false;pane.hidden=true;return;}await renderPanel();}return;
  }
  if(action==='retry'){await renderPanel();return;}
  if(action==='authority'){window.DD517?.close?.();window.DDRoyalAuthority?.open?.();return;}
  const peer=b.dataset.peer;if(!UUID.test(peer))return;
  if(action==='chat'){window.DDCommanderSafety?.openPrivate?.(peer);return;}
  if(action==='profile'){window.DDCommanderSafety?.openProfile?.(peer);return;}
  if(action==='aid')await sendAid(peer);
  else if(['request','accept','decline','cancel','remove'].includes(action))await perform(peer,action);
 });
}
function boot(){
 const messenger=$('dd517Messenger');if(!messenger)return false;
 const controls=$('dd517Controls');if(controls){new MutationObserver(()=>mount()).observe(controls,{childList:true});mount();}
 const shade=$('dd6123ProfileShade');if(shade)shade.addEventListener('click',async event=>{
  const button=event.target.closest('[data-dd6124]');if(!button||!shade.contains(button))return;
  const action=button.dataset.dd6124,peer=button.closest('[data-dd6124-peer]')?.dataset.dd6124Peer;
  if(!UUID.test(peer))return;
  if(action==='aid')await sendAid(peer);
  else if(['request','accept','decline','cancel','remove'].includes(action))await perform(peer,action);
  const target=$('dd6123FriendAction');
  if(target?.isConnected){
   await renderProfileAction(peer,target);
   if(target.isConnected&&statusText){const msg=document.createElement('small');msg.className='dd6124Status';msg.setAttribute('role','status');msg.textContent=statusText;target.appendChild(msg);}
  }
 });
 if(!watching){watching=true;let tries=0;const bind=()=>{
  const api=client();if(!api?.auth?.onAuthStateChange){if(++tries<20)setTimeout(bind,700);return;}
  api.auth.onAuthStateChange(()=>{setTimeout(()=>{
   // Clear old visible friend details immediately on authentication changes;
   // the new DD517 account context is read on the next user interaction.
   lastUser='';cached=[];cacheUser='';cacheAt=0;opened=false;renderSeq++;
   const pane=$('dd6124Panel');if(pane){pane.replaceChildren();pane.hidden=true;}
   const toggle=$('dd6124FriendsMount [data-dd6124="toggle"]');toggle?.setAttribute('aria-expanded','false');
   const profile=$('dd6123FriendAction');if(profile)profile.replaceChildren();
  },0);});
 };bind();}
 return true;
}
function init(){if(boot())return;let tries=0;const t=setInterval(()=>{if(boot()||++tries>=40)clearInterval(t)},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.DDRoyalCompanions={version:VERSION,mount,renderProfileAction,requestFriend:peer=>perform(peer,'request'),invalidate};
})();

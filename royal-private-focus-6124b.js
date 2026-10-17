/* Dino Dominion 6.12.4b — focused Private Messenger hotfix.
 * Additive UI only: does not modify DD517, database, account or payments.
 * Load AFTER royal-private-hub-6124a.js.
 */
(()=>{'use strict';
 const VERSION='6.12.4b';
 const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
 const $=id=>document.getElementById(id);
 const ctx=()=>window.DD517?.context?.()||{};
 let installed=false,previousRoom='',previousPeer='',showInbox=true;
 let lookupSerial=0;
 const names=new Map(),pendingNames=new Set();
 const style=document.createElement('style');
 style.id='dd6124bFocusStyles';
 style.textContent=`
  #dd517Messenger .dd6124bThreadBar{display:flex;align-items:center;gap:10px;min-height:45px;padding:2px 2px 6px;border-bottom:1px solid #445e65}
  #dd517Messenger .dd6124bThreadBar[hidden]{display:none!important}
  #dd517Messenger .dd6124bThreadBar>button{flex:0 0 auto;padding:6px 12px;min-height:35px;border-radius:9px;background:#28434d;border:1px solid #698080;color:#f1d49b;font-weight:700;font-size:12px}
  #dd517Messenger .dd6124bThreadBar>div{min-width:0;display:flex;flex-direction:column;gap:2px;overflow:hidden}
  #dd517Messenger .dd6124bThreadBar strong{font-size:13px;color:#f4dba5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #dd517Messenger .dd6124bThreadBar small{font-size:10px;color:#9cb9b8}
  #dd517Messenger.dd6124bThread[data-dd6124a-tab="chats"] #dd6124aHub>.dd6124aNav,
  #dd517Messenger.dd6124bThread[data-dd6124a-tab="chats"] #dd6124aHub>.dd6124aPane{display:none!important}
  #dd517Messenger.dd6124bThread[data-dd6124a-tab="chats"] #dd517Controls{flex:0 0 auto!important;min-height:0;overflow:visible!important}
  #dd517Messenger.dd6124bThread[data-dd6124a-tab="chats"] #dd517Messages{display:flex!important;flex:1 1 auto!important;min-height:0;overflow-y:auto}
  #dd517Messenger.dd6124bThread[data-dd6124a-tab="chats"] .dd517Composer{display:block!important;flex:none!important}
  #dd517Messenger.dd6124bInbox[data-dd6124a-tab="chats"] #dd517Messages,
  #dd517Messenger.dd6124bInbox[data-dd6124a-tab="chats"] .dd517Composer{display:none!important}
  #dd517Messenger.dd6124bInbox[data-dd6124a-tab="chats"] #dd517Controls{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain}
  #dd517Messenger.dd6124bInbox[data-dd6124a-tab="chats"] .dd6124aThreads{max-height:min(60dvh,520px)}
 `;
 document.head.appendChild(style);

 function header(hub){
  let bar=hub.querySelector('#dd6124bThreadBar');
  if(bar)return bar;
  bar=document.createElement('div');bar.id='dd6124bThreadBar';bar.className='dd6124bThreadBar';bar.hidden=true;
  const back=document.createElement('button');back.type='button';back.textContent='‹ Chats';back.setAttribute('aria-label','Back to private conversations');
  const details=document.createElement('div'),name=document.createElement('strong'),subtitle=document.createElement('small');
  name.id='dd6124bPeerName';name.textContent='Private chat';subtitle.textContent='Private conversation';
  details.append(name,subtitle);bar.append(back,details);
  back.addEventListener('click',e=>{
   e.preventDefault();e.stopPropagation();showInbox=true;sync();
   // Only the inbox list is refreshed; the currently open thread stays intact.
   window.DDPrivateHub?.refresh?.();
  });
  hub.insertBefore(bar,hub.firstChild);
  return bar;
 }
 function updateName(peer,account){
  const title=$('dd6124bPeerName');if(!title||!UUID.test(peer))return;
  const row=$('dd6124aThreads')?.querySelector(`[data-dd6124a-thread="${peer}"] .dd6124aThreadTop strong`);
  const fromRow=row?.textContent?.trim();if(fromRow)names.set(account+':'+peer,fromRow);
  const key=account+':'+peer;
  const display=names.get(key)||'Commander '+peer.slice(0,6);
  if(title.textContent!==display)title.textContent=display;
  if(names.has(key)||pendingNames.has(key)||!UUID.test(account))return;
  const client=window.DDOnlineClient;
  if(!client?.from)return;
  pendingNames.add(key);
  const ticket=++lookupSerial;
  void (async()=>{
   try{
    const {data,error}=await client.from('commander_profiles')
      .select('commander_name').eq('user_id',peer).maybeSingle();
    if(error||!data?.commander_name)return;
    if(ticket!==lookupSerial||ctx().userId!==account||ctx().peer!==peer)return;
    names.set(key,String(data.commander_name));
    const el=$('dd6124bPeerName');if(el&&el.textContent!==names.get(key))el.textContent=names.get(key);
   }catch{/* The chat remains available if profiles are offline. */}
   finally{pendingNames.delete(key);}
  })();
 }
 function sync(){
  const root=$('dd517Messenger'),state=ctx();if(!root)return;
  const room=state.room||'',peer=state.peer||'';
  if(room!=='private'){
   previousRoom=room;previousPeer='';showInbox=true;
   root.classList.remove('dd6124bThread','dd6124bInbox');return;
  }
  // Opening Private from another channel starts at the inbox. Selecting a peer
  // always switches to chat, including profile shortcuts and the search dialog.
  if(previousRoom!=='private'){previousRoom='private';previousPeer=peer;showInbox=true;}
  else if(previousPeer!==peer){previousPeer=peer;showInbox=false;}
  const hub=$('dd6124aHub');if(!hub)return;
  const bar=header(hub);
  const onChats=root.dataset.dd6124aTab==='chats';
  const showThread=UUID.test(peer)&&!showInbox&&onChats;
  root.classList.toggle('dd6124bThread',showThread);
  root.classList.toggle('dd6124bInbox',!showThread&&onChats);
  bar.hidden=!showThread;
  if(showThread)updateName(peer,state.userId||'');
 }
 function init(){
  if(installed)return true;
  const root=$('dd517Messenger'),controls=$('dd517Controls');if(!root||!controls)return false;
  installed=true;
  // Existing controller still owns all messages and click handlers. Listen in
  // capture phase and allow it to complete before adjusting only the layout.
  root.addEventListener('click',e=>{
   const target=e.target.closest?.('[data-dd6124a-open],[data-517="setPeer"],[data-peer]');
   if(!target)return;
   const peer=target.dataset.dd6124aOpen||target.dataset.peer||$('dd517Player')?.value||'';
   if(UUID.test(peer)&&peer!==ctx().userId){previousRoom='private';previousPeer=peer;showInbox=false;setTimeout(sync,0);}
  },true);
  new MutationObserver(sync).observe(controls,{childList:true,subtree:true});
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-dd6124a-tab','data-dd6124a-chat-selected','hidden']});
  root.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  sync();return true;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  if(!init()){let retries=0;const t=setInterval(()=>{if(init()||++retries>=40)clearInterval(t)},250);}
 },{once:true});
 else if(!init()){let retries=0;const t=setInterval(()=>{if(init()||++retries>=40)clearInterval(t)},250);}
 window.DDPrivateFocus={version:VERSION};
})();

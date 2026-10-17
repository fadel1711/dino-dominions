/* Dino Dominion — Build 6.12.3a · Muted Commanders manager
 * Additive frontend fix. No game economy, saves, payment or RLS changes.
 * The pinned Messenger build supports an in-memory unmute bridge.
 * After confirmed cloud removal and device storage update, it refreshes
 * messages instantly. Never auto-reload an unsaved Cloud Kingdom.
 */
(()=>{'use strict';
 const VERSION='6.12.3b-instant-unmute';
 const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const $=id=>document.getElementById(id);
 const authId=()=>window.DD517?.context?.()?.userId||'';
 const client=()=>window.DDOnlineClient;
 const key=uid=>`dd517:${uid}:blocked`;
 let root=null,requests=0;
 function localBlocks(uid){if(!UUID.test(uid))return [];
  try{const a=JSON.parse(localStorage.getItem(key(uid))||'[]');return Array.isArray(a)?a.filter(x=>UUID.test(x)&&x!==uid).slice(0,1000):[];}catch{return [];}
 }
 function saveLocal(uid,ids){try{localStorage.setItem(key(uid),JSON.stringify([...ids]));return true;}catch{return false;}}
 function tools(){
  const wrapper=document.createElement('div');wrapper.className='dd6123aTools';
  wrapper.innerHTML='<button type="button" data-dd6123a="toggle">🛡️ Muted commanders</button><div class="dd6123aList" data-dd6123a-list hidden></div>';
  return wrapper;
 }
 function ensureTools(){if(!root)return;
  const p=$('dd517Settings');
  if(p&&!p.hidden&&p.querySelector('[data-517="saveSettings"]')&&!p.querySelector('.dd6123aTools'))p.appendChild(tools());
  const privateTools=$('dd517Controls')?.querySelector('.dd6123PrivateTools');
  if(privateTools&&!privateTools.querySelector('.dd6123aTools'))privateTools.insertBefore(tools(),privateTools.querySelector('#dd6124FriendsMount')||null);
 }
 async function showList(target){
  const uid=authId(),request=++requests;
  if(!UUID.test(uid)){target.innerHTML='<small>Sign in to manage muted commanders.</small>';return;}
  const c=client();if(!c){target.innerHTML='<small>Server is offline. Try again when connected.</small>';return;}
  target.innerHTML='<small>Loading muted commanders…</small>';
  try{
   const {data:cloud,error:cloudError}=await c.from('dd519_blocks').select('blocked_id').eq('owner_id',uid).limit(1000);
   if(!target.isConnected||target.hidden||request!==requests||authId()!==uid)return;
   if(cloudError)throw cloudError;
   const ids=[...new Set([...localBlocks(uid),...(cloud||[]).map(row=>row.blocked_id)])].filter(id=>UUID.test(id)&&id!==uid).slice(0,100);
   if(!ids.length){target.innerHTML='<p class="dd6123aHint">No muted commanders. You’re all clear. 🦖</p>';return;}
   const {data:profiles,error:profileError}=await c.from('commander_profiles').select('user_id,commander_name,avatar').in('user_id',ids);
   if(!target.isConnected||target.hidden||request!==requests||authId()!==uid)return;
   const names=new Map((!profileError&&Array.isArray(profiles)?profiles:[]).map(p=>[p.user_id,p]));
   target.innerHTML='<p class="dd6123aHint">Muting also blocks private contact. Unmute removes your cloud block and saved device filter.</p>'+ids.map(id=>{
     const p=names.get(id);return `<div class="dd6123aRow"><span>${esc(p?.avatar||'🦖')} <b>${esc(p?.commander_name||'Commander '+id.slice(0,8))}</b></span><button type="button" data-dd6123a="unmute" data-dd6123a-id="${esc(id)}">🔓 Unmute</button></div>`;
   }).join('')+'<p class="dd6123aHint">Unmuting works immediately without restarting the game. The server and device mute lists both update.</p>';
  }catch(e){if(target.isConnected&&request===requests&&authId()===uid)target.innerHTML=`<p class="dd6123aError">Could not load muted commanders: ${esc(e?.message||'Connection error')}</p>`;}
 }
 async function unmute(button){
  const uid=authId(),blockedId=button.dataset.dd6123aId;
  if(!UUID.test(uid)||!UUID.test(blockedId)||blockedId===uid)return;
  const c=client();if(!c)return;
  const mount=button.closest('.dd6123aList');if(!mount)return;
  button.disabled=true;button.textContent='Unmuting…';
  try{
   const {error}=await c.from('dd519_blocks').delete().eq('owner_id',uid).eq('blocked_id',blockedId);
   if(error)throw error;
   // Never let a response for account A change account B's local mute list.
   if(authId()!==uid)return;
   const ids=new Set(localBlocks(uid));ids.delete(blockedId);
   const saved=saveLocal(uid,ids);
   if(!saved){mount.innerHTML='<p class="dd6123aError">Cloud block removed, but local device storage could not be updated. Reopen Messenger later.</p>';return;}
   const live=await window.DD517?.unmuteNow?.(blockedId,uid);
   if(authId()!==uid)return;
   const summary=live===true
     ? '✅ Commander unmuted! Messenger refreshed immediately — no restart required.'
     : '✅ Commander unmuted in Supabase and on this device. Live refresh was unavailable; close and reopen Messenger when cloud syncing has finished.';
   mount.innerHTML='<p class="dd6123aSuccess">'+esc(summary)+'</p><button type="button" data-dd6123a="refresh">↻ Manage another commander</button>';
   window.DDRoyalCompanions?.invalidate?.();
  }catch(e){if(button.isConnected){button.disabled=false;button.textContent='🔓 Unmute';
    const p=document.createElement('p');p.className='dd6123aError';p.textContent='Unmute failed: '+String(e?.message||'Please retry.').slice(0,180);mount.appendChild(p);}
  }
 }
 function installStyles(){if($('dd6123aStyle'))return;const style=document.createElement('style');style.id='dd6123aStyle';style.textContent=`
  .dd6123aTools{border-top:1px solid #7b6a48;margin-top:12px;padding-top:10px;min-width:0}
  .dd6123aTools>button{width:100%;white-space:normal;background:#264b50!important;color:#f7dfaa!important;border:1px solid #9d875b!important;text-align:left}
  .dd6123aList{padding:8px 0;min-width:0}.dd6123aList[hidden]{display:none!important}
  .dd6123aRow{display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #56625c;padding:9px 0}
  .dd6123aRow>span{overflow-wrap:anywhere;min-width:0;flex:1}.dd6123aRow>button{flex-shrink:0;margin:0!important;white-space:normal}
  .dd6123aHint{font-size:12px;color:#d9d0b5;line-height:1.5}.dd6123aError{font-size:12px;color:#ffb2a4}.dd6123aSuccess{font-size:12px;color:#b2f1cb;line-height:1.5}
  `;document.head.appendChild(style);}
 function init(){const el=$('dd517Messenger');if(!el)return false;root=el;installStyles();
  const prefs=$('dd517Settings'), controls=$('dd517Controls');
  if(prefs)new MutationObserver(ensureTools).observe(prefs,{childList:true});
  if(controls)new MutationObserver(ensureTools).observe(controls,{childList:true});
  root.addEventListener('click',async e=>{
   const b=e.target.closest('[data-dd6123a]');if(!b||!root.contains(b))return;
   const act=b.dataset.dd6123a;
   if(act==='toggle'){
     const list=b.closest('.dd6123aTools')?.querySelector('[data-dd6123a-list]');if(!list)return;
     list.hidden=!list.hidden;if(!list.hidden)await showList(list);
   }else if(act==='refresh'){
     const list=b.closest('.dd6123aList');if(list)await showList(list);
   }else if(act==='unmute')await unmute(b);
  });
  ensureTools();return true;
 }
 function boot(){if(init())return;let attempts=0;const interval=setInterval(()=>{if(init()||++attempts>=40)clearInterval(interval)},250);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.DDMuteManager={version:VERSION};
})();

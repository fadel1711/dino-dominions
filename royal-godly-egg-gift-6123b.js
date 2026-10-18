/* Dino Dominion 6.12.3b + Astrite bonus gift queue — private Royal Mail gift claim.
 * Requires a server-issued, account-scoped gift record. The separate Royal Mail
 * letter is informational; deleting it cannot erase this gift entitlement.
 * No player IDs, credentials, issuance powers or random-egg odds in public code.
 * This is beta Cloud Kingdom progression, NOT server-authoritative competitive
 * inventory. The save bridge keeps a permanent receipt to prevent reclaims.
 */
(()=>{'use strict';
 const VERSION='6.12.3b-godly-egg';
 const $=id=>document.getElementById(id);
 const client=()=>window.DDOnlineClient;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let account='',gift=null,gifts=[],busy=false,loaded=0,seq=0,notice='';
 let renderedNode=null,renderedHTML='';
 const valid=g=>!!g&&g.recipient_id===account&&Number(g.tier)===5&&
   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(g.id);
 const game=()=>window.DDGameCloudBridge;
 const snap=()=>{try{return game()?.exportState?.()||null;}catch{return null;}};
 const claimed=(s,item=gift)=>Array.isArray(s?.royalGiftEggReceipts)&&!!item&&s.royalGiftEggReceipts.includes(item.id);
 const eggOccupied=s=>!!(s?.incubating&&typeof s.incubating==='object');
 const cloudReady=()=>{try{const c=window.DDCloud;const st=c?.getStatus?.();return st?.uid===account&&st.mode==='ready'&&!c?.hasPending?.();}catch{return false;}};
 async function signedInId(){try{const c=client();const {data,error}=await c.auth.getSession();return error?'':data?.session?.user?.id||'';}catch{return '';}}
 function reset(user){account=user||'';gift=null;gifts=[];busy=false;loaded=0;seq++;notice='';render();}
 function render(){const el=$('dd6123bEggGiftMount');if(!el)return;
  // Show the oldest UNCLAIMED server-issued gift first. A claimed gift is
  // never allowed to hide a newer award (each one has its own cloud receipt).
  const s=snap(),available=gifts.filter(item=>!claimed(s,item));
  gift=available[0]||gifts[gifts.length-1]||null;
  if(!gift||!account){el.hidden=true;if(el.childNodes.length)el.replaceChildren();renderedNode=el;renderedHTML='';return;}
  const done=available.length===0,occupied=eggOccupied(s),ready=cloudReady();
  const msg=done?'✅ All your Royal Godly Egg gifts have been claimed!':
   occupied?'🥚 Finish hatching the egg already in your incubator, then claim the next one.':
   !ready?'☁️ Wait for Cloud Kingdom to say “saved” before claiming.':
   '✨ Guaranteed Godly rarity. Incubates for 60 seconds; no random-egg pity counters are changed.';
  const remaining=available.length;
  const countText=gifts.length>1?`<p class="dd6123bEggStatus" aria-live="polite">🥚 ${remaining} unclaimed gift${remaining===1?'':'s'} of ${gifts.length} total</p>`:'';
  const note=gift.note||'For my Queen, a little legend waiting to be born. ❤️';
  const html=`<div class="dd6123bEggGift" role="region" aria-label="Godly Egg special delivery"><div class="dd6123bEggOverline">💝 ROYAL GIFTS FROM YOUR KING</div><h3>${esc(gift.title||'🥚 Royal Godly Egg')}</h3><p>“${esc(note)}”</p>${countText}<p class="dd6123bEggStatus">${esc(msg)}</p><button type="button" data-dd6123b-egg-claim="${esc(gift.id)}" ${busy||done||occupied||!ready?'disabled':''}>${busy?'Verifying…':done?'All Claimed':'🥚 Claim My Godly Egg'}</button>${notice?`<small class="dd6123bEggNotice" role="status">${esc(notice)}</small>`:''}<small>Claim and hatch each egg separately. Every gift has its own receipt in your Cloud Kingdom.</small></div>`;
  if(renderedNode!==el||renderedHTML!==html){renderedNode=el;renderedHTML=html;el.innerHTML=html;}
  el.hidden=false;
 }
 function ensure(){const panel=$('onlineApp')?.querySelector('.ddMailPanel');if(!panel)return;
  let el=$('dd6123bEggGiftMount');if(el&&el.closest('.ddMailPanel')!==panel)el=null;
  if(!el){el=document.createElement('section');el.id='dd6123bEggGiftMount';el.hidden=true;
   const preceding=panel.querySelector('#dd6123gGiftMount');const heading=panel.querySelector('.ddMailHeading');
   if(preceding)preceding.insertAdjacentElement('afterend',el);
   else if(heading)heading.insertAdjacentElement('afterend',el);
   else panel.prepend(el);
  }
  render();
 }
 async function fetchGift(force=false){const c=client();if(!c)return;
  const uid=await signedInId();if(uid!==account)reset(uid);
  if(!uid)return;
  if(!force&&Date.now()-loaded<20000){render();return;}
  const token=++seq;
  try{
   const {data,error}=await c.from('dd6123b_royal_egg_gifts')
     .select('id,recipient_id,tier,title,note,created_at')
     .eq('recipient_id',uid)
     .order('created_at',{ascending:false}).limit(50);
   if(error)throw error;
   if(token!==seq||account!==uid)return;
   gifts=(Array.isArray(data)?data:[]).filter(valid).reverse();loaded=Date.now();notice='';
  }catch(e){if(token===seq&&account===uid)notice='Could not verify the Godly Egg gift right now. Retry after reconnecting.';}
  finally{render();}
 }
 async function claim(giftId){if(busy||!gift||!valid(gift)||gift.id!==giftId)return;
  const uid=account,c=client();busy=true;notice='';render();
  try{
   if(!uid||uid!==await signedInId())throw Error('Sign in to your own commander account first.');
   if(!cloudReady())throw Error('Wait for Cloud Kingdom to finish saving.');
   const {data,error}=await c.from('dd6123b_royal_egg_gifts')
     .select('id,recipient_id,tier')
     .eq('id',giftId).eq('recipient_id',uid).maybeSingle();
   if(error||!data||!valid(data))throw Error('Royal Gift could not be verified.');
   if(uid!==await signedInId()||!cloudReady())throw Error('Your account or cloud save changed. Please retry.');
   const live=snap();if(!live||!Array.isArray(live.dinos)||!Array.isArray(live.creatures))throw Error('Kingdom is not ready.');
   if(claimed(live)){notice='This Godly egg was already claimed.';return;}
   if(eggOccupied(live))throw Error('Finish your existing incubating egg first.');
   if(live.creatures.length>=200)throw Error('Your dinosaur collection is full.');
   if(window.DDGameTab?.()==='battle')throw Error('Finish your active battle before claiming.');
   const before=window.DDCloud.getStatus();
   if(before.uid!==uid||!cloudReady())throw Error('Cloud save started syncing; retry when saved.');
   // The main game's narrow bridge mutates the current state in-place.
   // It DOES NOT call importState(), reset an active battle, or overwrite saves.
   const outcome=await window.DDGodlyEggGiftClaim?.(giftId);
   if(!outcome?.ok)throw Error(outcome?.reason||'Egg gift cannot be claimed yet.');
   // The existing CAS sync confirms the one-time receipt and egg together.
   // Never announce a confirmed award while the kingdom is in conflict/offline.
   let saved=false;
   for(let attempt=0;attempt<70;attempt++){
     await new Promise(resolve=>setTimeout(resolve,140));
     const cst=window.DDCloud?.getStatus?.();
     if(!cst||cst.uid!==uid)throw Error('Account changed during save. Review Cloud Kingdom backup.');
     if(['conflict','offline','error'].includes(cst.mode))throw Error('Egg is on this device but cloud sync needs attention. Do NOT overwrite your device save.');
     if(cst.mode==='ready'&&Number(cst.revision)>Number(before.revision)&&!window.DDCloud.hasPending()){
       saved=true;break;
     }
   }
   notice=saved?'🥚 Your Godly Egg is safely saved! Hatch it from the Eggs tab after 60 seconds.':
    'Egg added, but cloud save is still syncing. Wait for Cloud Kingdom SAVED before closing this page.';
  }catch(e){notice=String(e?.message||e||'Gift claim unavailable').slice(0,180);}
  finally{busy=false;render();}
 }
 function start(){const app=$('onlineApp');if(!app)return false;
  let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;ensure();});}).observe(app,{subtree:true,childList:true});
  app.addEventListener('click',e=>{const b=e.target.closest('[data-dd6123b-egg-claim]');if(!b||!app.contains(b))return;e.preventDefault();e.stopPropagation();void claim(b.dataset.dd6123bEggClaim);},true);
  client()?.auth?.onAuthStateChange?.((event,session)=>{const id=session?.user?.id||'';if(id!==account)reset(id);if(event==='SIGNED_IN')void fetchGift(true);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void fetchGift(true);});
  setInterval(()=>{ensure();if(!document.hidden)void fetchGift();},20000);
  ensure();void fetchGift(true);return true;
 }
 function boot(){if(start())return;let tries=0;const t=setInterval(()=>{if(start()||++tries>=40)clearInterval(t)},250);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.DD6123bEggGift={version:VERSION,refresh:()=>fetchGift(true)};
})();

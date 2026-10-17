/* Dino Dominion 6.12.3g beta — 24-hour Royal Energy Gift (recipient-neutral client)
 * Royal Mail panel + signed-in, server-checked expedition entitlement.
 * This file contains NO recipients, magic gift codes, owner privileges, or secrets.
 * SQL migration and actual gift issuance must be handled privately in Supabase.
 */
(()=>{'use strict';
 const VERSION='6.12.3g-review';
 const client=()=>window.DDOnlineClient;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let userId='',gifts=[],loadedAt=0,loading=false,issue='',loadToken=0,claiming='';
 let busyMount=false;
 const validTime=s=>{const v=Date.parse(s||'');return Number.isFinite(v)?v:0;};
 const activeGift=()=>gifts.find(g=>g.claimed_at&&validTime(g.expires_at)>Date.now());
 const pendingGift=()=>gifts.find(g=>!g.claimed_at);
 const displayDate=s=>{try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(s));}catch{return String(s||'');}};
 const shortTime=ms=>{const mins=Math.max(0,Math.ceil(ms/60000)),h=Math.floor(mins/60),m=mins%60;return h?`${h}h ${m}m`:`${m}m`;};
 function message(msg){issue=String(msg||'').slice(0,240);render();}
 function reset(next){userId=next||'';gifts=[];loadedAt=0;issue='';claiming='';loadToken++;render();}
 function hasActiveDisplay(){return !!activeGift();}
 function statusChip(energy){const active=activeGift();return active?`⚡ Unlimited (gift · ${shortTime(validTime(active.expires_at)-Date.now())})`:`Energy ${Number(energy)||0}/12`;}
 async function signedInId(){const c=client();if(!c)return '';
  try{const {data,error}=await c.auth.getSession();return !error?(data?.session?.user?.id||''):'';}catch{return '';}}
 async function load(force=false){const c=client(),uid=await signedInId();if(uid!==userId)reset(uid);
  if(!uid||!c){render();return;}
  if(loading)return;
  if(!force&&Date.now()-loadedAt<20000){render();return;}
  const token=++loadToken;loading=true;
  try{const {data,error}=await c.from('dd6123g_energy_gifts')
    .select('id,title,note,claimed_at,expires_at,created_at')
    .eq('recipient_id',uid).order('created_at',{ascending:false}).limit(6);
   if(error)throw error;
   if(token!==loadToken||userId!==uid)return;
   const wasActive=hasActiveDisplay();gifts=Array.isArray(data)?data:[];loadedAt=Date.now();issue='';if(wasActive!==hasActiveDisplay())window.DD512Game?.refresh?.();
  }catch(e){if(token===loadToken){issue=gifts.length?'Gift status unavailable. You can retry from Royal Mail.':'';}}
  finally{loading=false;render();}
 }
 function buildHTML(){if(!userId)return '';
  const pending=pendingGift(),active=activeGift(),expired=gifts.find(g=>g.claimed_at&&!active&&validTime(g.expires_at)<=Date.now());
  if(!pending&&!active&&!expired&&!issue)return '';
  const label=pending?'UNCLAIMED ROYAL PRESENT':active?'YOUR ROYAL BLESSING IS ACTIVE':'PREVIOUS ROYAL GIFT';
  const title=pending?.title||active?.title||expired?.title||'Royal Gift of Eternity';
  const note=pending?.note||active?.note||expired?.note||'';
  const state=pending?`<button type="button" data-dd6123g-claim="${esc(pending.id)}" ${claiming?'disabled':''}>${claiming?'Claiming…':'💝 Claim 24 Hours of Unlimited Energy'}</button><small>The 24-hour timer starts when you claim.</small>`:
    active?`<p class="dd6123gActive">⚡ UNLIMITED EXPEDITION ENERGY</p><small>Expires ${esc(displayDate(active.expires_at))} · ${esc(shortTime(validTime(active.expires_at)-Date.now()))} left</small>`:
    '<small>Your 24-hour unlimited energy gift has expired.</small>';
  return `<div class="dd6123gGift" role="region" aria-label="Special Royal Energy Gift"><div class="dd6123gOverline">💝 ${label}</div><h3>${esc(title)}</h3>${note?`<p class="dd6123gNote">${esc(note)}</p>`:''}${state}${issue?`<p role="status" class="dd6123gIssue">${esc(issue)}</p>`:''}<small>Applies to expeditions and boss challenges. Dinosaur battle skill energy is separate.</small></div>`;
 }
 function render(){const mount=$('dd6123gGiftMount');if(!mount)return;const html=buildHTML();if(mount.innerHTML!==html)mount.innerHTML=html;mount.hidden=!html;}
 function ensurePanel(){const mail=$('onlineApp')?.querySelector('.ddMailPanel');if(!mail)return;
  let mount=$('dd6123gGiftMount');if(mount&&mount.closest('.ddMailPanel')!==mail)mount=null;
  if(!mount){mount=document.createElement('section');mount.id='dd6123gGiftMount';mount.hidden=true;
   const header=mail.querySelector('.ddMailHeading');if(header)header.insertAdjacentElement('afterend',mount);else mail.prepend(mount);
   render();void load();
  }
 }
 async function claim(giftId){if(claiming||!gifts.some(g=>g.id===giftId&&!g.claimed_at))return;
  const c=client(),uid=userId;claiming=giftId;render();
  try{if(!uid||await signedInId()!==uid)throw Error('Sign in to your own commander account.');
   const {data,error}=await c.rpc('dd6123g_claim_energy_gift',{p_gift_id:giftId});
   if(error)throw error;
   const g=gifts.find(x=>x.id===giftId);if(g){g.claimed_at=new Date().toISOString();g.expires_at=data;}
   issue='Activated! Your 24-hour adventure pass is now live.';loadedAt=0;window.DD512Game?.refresh?.();
  }catch(err){issue='Unable to claim: '+String(err?.message||'Please retry').slice(0,150);}
  finally{claiming='';render();}
 }
 async function authorize(){const c=client();if(!c)return false;
  // Authorization occurs on Supabase EVERY expedition; the device clock is UI-only.
  // Reject an in-flight grant if the active player changes before the RPC completes.
  try{const before=await signedInId();if(!before)return false;
   const {data,error}=await c.rpc('dd6123g_energy_active');
   if(error||data!==true)return false;
   return before===await signedInId();
  }catch{return false;}
 }
 // Living Kingdom disables its Scout/Defend buttons at zero energy. Re-enable only
 // their UI while the server-claimed gift appears active (gameplay still calls RPC).
 function enableLivingButtons(){const dd=window.DD512;if(!dd?.adventurePanel)return;
  if(dd.adventurePanel._dd6123g)return;
  const original=dd.adventurePanel;
  const wrapped=function(...args){let markup=original.apply(this,args);
   if(typeof markup==='string'&&hasActiveDisplay()){
    markup=markup.replace(/(data-action="living:(?:scout|defend)")\s+disabled/g,'$1');
   }
   return markup;
  };
  wrapped._dd6123g=true;dd.adventurePanel=wrapped;
 }
 function boot(){const target=$('onlineApp');if(!target)return false;
  enableLivingButtons();
  target.addEventListener('click',e=>{const b=e.target.closest('[data-dd6123g-claim]');if(!b||!target.contains(b))return;
   e.preventDefault();e.stopPropagation();void claim(b.dataset.dd6123gClaim);
  },true);
  let scheduled=false;
  new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;ensurePanel();});})
   .observe(target,{childList:true,subtree:true});
  ensurePanel();void load();setInterval(()=>{render();if(!document.hidden)void load();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&$('dd6123gGiftMount'))void load(true);});
  client()?.auth?.onAuthStateChange?.((event,session)=>{const uid=session?.user?.id||'';if(uid!==userId)reset(uid);if(event==='SIGNED_IN')void load(true);});
  return true;
 }
 function start(){if(boot())return;let count=0;const t=setInterval(()=>{if(boot()||++count>=40)clearInterval(t)},250);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.DDEnergyGift={version:VERSION,authorize,statusChip,hasActiveDisplay,refresh:()=>load(true)};
})();

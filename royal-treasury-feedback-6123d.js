/* Dino Dominion 6.12.3d — truthful Stripe TEST return feedback.
 * Presentation-only addition: never completes orders, credits gems, mutates saves,
 * changes checkout keys, or trusts a success URL as payment evidence.
 */
(()=>{'use strict';
 const KEY='dd6123d:treasury:checkout';
 const SHOW_SUCCESS=/^(success)$/i.test(new URLSearchParams(location.search).get('treasury')||'');
 const MAX_WAIT_MS=55000,POLL_MS=2500,MARKER_AGE_MS=60*60*1000;
 let pending=SHOW_SUCCESS,verified=null,finished=false,started=Date.now(),rootObserver=null,bodyObserver=null,bodyEl=null;
 const safeRead=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{return null}};
 const safeWrite=x=>{try{sessionStorage.setItem(KEY,JSON.stringify(x))}catch{}};
 const safeRemove=()=>{try{sessionStorage.removeItem(KEY)}catch{}};
 // Record the customer's checkout attempt before the original handler navigates to Stripe.
 document.addEventListener('click',e=>{
  const b=e.target?.closest?.('button[data-dd510="purchase"][data-sku]');
  if(!b||!b.closest('#dd510Body')||b.disabled)return;
  const sku=b.dataset.sku;
  if(!/^[a-z0-9_]{3,40}$/.test(sku))return;
  safeWrite({sku,startedAt:Date.now()});
 },true);
 function message(){
  if(verified)return `✅ Payment verified · +${Number(verified.royal_gems||0).toLocaleString()} sandbox test gems delivered. See Receipts.`;
  return finished?'Payment return received. Check Receipts: only a server-verified PAID order credits gems.':'Awaiting signed payment verification. Your test gems will appear after the Stripe webhook confirms payment.';
 }
 function updateNotice(){
  if(!SHOW_SUCCESS||!bodyEl)return;
  const el=bodyEl.querySelector('.dd510Notice');
  if(!el)return;
  const desired=message(),status=verified?'verified':finished?'unconfirmed':'pending';
  if(el.dataset.dd6123dStatus===status&&el.textContent===desired)return;
  el.dataset.dd6123dStatus=status;
  el.classList.toggle('dd6123dVerified',!!verified);
  el.classList.toggle('dd6123dUnconfirmed',finished&&!verified);
  el.textContent=desired;
 }
 function attachBody(){
  const el=document.getElementById('dd510Body');
  if(!el||el===bodyEl)return !!el;
  bodyObserver?.disconnect();bodyEl=el;
  bodyObserver=new MutationObserver(updateNotice);
  bodyObserver.observe(el,{childList:true,subtree:true});
  updateNotice();rootObserver?.disconnect();rootObserver=null;
  return true;
 }
 async function reconcile(){
  if(!pending)return;
  const marker=safeRead();
  if(!marker||typeof marker.startedAt!=='number'||Date.now()-marker.startedAt>MARKER_AGE_MS||!/^[a-z0-9_]{3,40}$/.test(marker.sku||'')){
   pending=false;finished=true;updateNotice();return;
  }
  const client=window.DDOnlineClient;
  if(!client?.rpc||!client?.auth?.getUser){
   if(Date.now()-started<MAX_WAIT_MS)setTimeout(reconcile,POLL_MS);
   else{pending=false;finished=true;updateNotice()}
   return;
  }
  try{
   const {data:who,error:authError}=await client.auth.getUser();
   if(authError||!who?.user?.id)throw new Error('auth pending');
   if(marker.accountId&&marker.accountId!==who.user.id){pending=false;finished=true;safeRemove();updateNotice();return;}
   // Account-bound after first verified session. Never use another user's receipt.
   if(!marker.accountId)safeWrite({...marker,accountId:who.user.id});
   const {data,error}=await client.rpc('dd510_storefront');
   if(error)throw error;
   const orders=Array.isArray(data?.orders)?data.orders:[];
   const match=orders.find(o=>o?.status==='paid'&&o.sku===marker.sku&&
    Number.isFinite(Date.parse(o.created_at||''))&&
    Date.parse(o.created_at)>=marker.startedAt-5*1000&&
    Date.parse(o.created_at)<=Date.now()+2*60*1000);
   if(match){verified=match;pending=false;finished=true;safeRemove();updateNotice();return;}
  }catch(_){/* Retry limited to the return flow; payment/wallet never changed here. */}
  if(Date.now()-started<MAX_WAIT_MS)setTimeout(reconcile,POLL_MS);
  else{pending=false;finished=true;updateNotice()}
 }
 if(SHOW_SUCCESS){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
   if(!attachBody()){
    rootObserver=new MutationObserver(attachBody);
    rootObserver.observe(document.body,{childList:true,subtree:true});
   }
   setTimeout(reconcile,1400);
  },{once:true});
  else{
   if(!attachBody()){
    rootObserver=new MutationObserver(attachBody);
    rootObserver.observe(document.body,{childList:true,subtree:true});
   }
   setTimeout(reconcile,1400);
  }
 }
})();
/* Dino Dominion 6.15.0 — Royal Gift Code tab + daily Dominion Trial.
 * Additive UI; RPCs own all grants. This script never writes player saves,
 * inventory, wallet balances, payment state or authoritative battle results.
 * Installed after the untouched 6.12.3d Stripe feedback module.
 */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]));
 let panel=null,body=null,observer=null,busy=false,tab='codes',code='',feedback='',trial=null,loginUid='';
 const client=()=>window.DDOnlineClient||null;
 async function who(){const api=client();if(!api?.auth?.getUser)return '';
  try{const {data,error}=await api.auth.getUser();return error?'':data?.user?.id||''}catch{return ''}}
 async function rpc(name,args={}){const api=client();if(!api?.rpc)throw Error('Connection unavailable. Reconnect and retry.');
  const {data,error}=await api.rpc(name,args);if(error)throw Error(error.message||'Server could not verify the request.');return data;}
 function makeOverlay(){
  if(panel)return;
  panel=document.createElement('section');panel.id='dd615Overlay';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Royal Codes and Dominion Trial');
  panel.innerHTML=`<div class="dd615Screen">
   <header class="dd615Head"><button type="button" data-dd615="close" aria-label="Return to Royal Treasury">‹</button>
    <div><small>♛ DINO DOMINION · 6.15</small><strong>Royal Rewards</strong></div><span aria-hidden="true">🎁</span></header>
   <nav class="dd615Tabs" aria-label="Royal rewards"><button type="button" data-dd615="tab" data-tab="codes">🎁 Gift Codes</button><button type="button" data-dd615="tab" data-tab="trial">⚔️ Dominion Trial</button></nav>
   <div class="dd615Body" id="dd615Body"></div>
  </div>`;
  document.body.appendChild(panel);body=$('dd615Body');
  panel.addEventListener('click',e=>{
   const btn=e.target.closest('[data-dd615]');if(!btn)return;
   const action=btn.dataset.dd615;
   if(action==='close'){e.preventDefault();close();return}
   if(action==='tab'){tab=btn.dataset.tab==='trial'?'trial':'codes';feedback='';draw();if(tab==='trial')void loadTrial();return}
   if(action==='redeem'){e.preventDefault();void redeem();return}
   if(action==='choice'){e.preventDefault();void answer(btn.dataset.choice);return}
   if(action==='refresh'){e.preventDefault();void loadTrial();return}
   if(action==='mail'){e.preventDefault();close();window.DDRoyalTreasury?.close?.();$('friendsShortcut')?.click();return}
  });
  panel.addEventListener('input',e=>{if(e.target.id==='dd615Code')code=String(e.target.value||'').slice(0,70)});
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Enter'&&e.target.id==='dd615Code'){e.preventDefault();void redeem()}});
 }
 function draw(){if(!panel||panel.hidden)return;
  for(const b of panel.querySelectorAll('.dd615Tabs button')){const yes=b.dataset.tab===tab;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));}
  let html=tab==='codes'?`<article class="dd615Card"><div class="dd615Eyebrow">AN OFFER FROM THE CROWN</div><h2>Redeem a Royal Gift</h2>
   <p>Redeem a code issued by the kingdom. Every award is confirmed on our server and limited by account.</p>
   <label for="dd615Code">Your code</label><input id="dd615Code" maxlength="70" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="DD-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" value="${esc(code)}">
   <button type="button" class="dd615Gold" data-dd615="redeem" ${busy?'disabled':''}>${busy?'Verifying…':'✦ Redeem Code'}</button>
   <small>Rewards may include verified Royal Gems, a Godly Egg, or an expedition energy blessing. The King issues codes privately.</small>
   </article>`:trial?`<article class="dd615Card"><div class="dd615Eyebrow">THE DAILY TRIAL · UTC</div><h2>Train your Command</h2>
    ${trial.ok?`<p>${esc(trial.question||'Choose your class.')}</p>
     <div class="dd615TrialInfo">${trial.completed?'✅ Completed today':`⚔️ ${Number(trial.attempts_left)||0} attempts remaining`} · Reward: 🪙 120 verified Gold + ✨ 15 Essence</div>
     <div class="dd615Choices">${(Array.isArray(trial.options)?trial.options:[]).map(x=>`<button type="button" data-dd615="choice" data-choice="${esc(x)}" ${busy||trial.completed||!trial.attempts_left?'disabled':''}>${esc(x)} <span>›</span></button>`).join('')}</div>`:`<p>${esc(trial.message||'Sign in and enroll in Royal Authority first.')}</p>`}
    <button type="button" class="dd615Refresh" data-dd615="refresh" ${busy?'disabled':''}>↻ Refresh daily trial</button>
    </article>`:`<article class="dd615Card"><h2>Daily Dominion Trial</h2><p>Loading the server-verified challenge…</p></article>`;
  html+=`<p class="dd615Feedback" role="status" ${feedback?'':'hidden'}>${esc(feedback)}</p>`;
  if(tab==='codes')html+='<button type="button" class="dd615Mail" data-dd615="mail">✉️ Open Royal Mail for Egg & Energy Gifts</button>';
  body.innerHTML=html;
 }
 async function open(){makeOverlay();if(!panel.hidden)return;
  loginUid=await who();panel.hidden=false;tab='codes';feedback='';trial=null;code='';document.body.classList.add('dd615Open');draw();
  $('dd615Code')?.focus({preventScroll:true});
  if(!loginUid){feedback='Sign in to your commander account and enroll in Royal Authority before redeeming.';draw()}
 }
 function close(){if(!panel)return;panel.hidden=true;document.body.classList.remove('dd615Open');busy=false;feedback='';}
 async function redeem(){if(busy||!panel||panel.hidden)return;
  const submitted=code.trim().toUpperCase();if(!/^DD-[0-9A-F]{32}$/.test(submitted)){
   feedback='Enter the complete DD- code provided by the King.';draw();return;}
  const before=await who();if(!before){feedback='Sign in first.';draw();return}
  busy=true;feedback='Checking your code with Supabase…';draw();
  try{
   const result=await rpc('dd615_redeem_code',{p_code:submitted});
   if(panel.hidden)return;
   if(before!==await who()){feedback='Your commander account changed. Reopen the Treasury to confirm rewards.';return;}
   feedback=String(result?.message||'The server returned no confirmation.');
   if(result?.ok===true){code='';window.DD6123bEggGift?.refresh?.();window.DDEnergyGift?.refresh?.();
    try{void window.DDRoyalTreasury?.refresh?.()}catch{}}
  }catch(_){feedback='The server could not confirm redemption. Check connectivity and try again; do not assume a reward was delivered.'}
  finally{busy=false;draw()}
 }
 async function loadTrial(){if(busy||!panel||panel.hidden)return;
  const before=await who();if(!before){trial={ok:false,message:'Sign in first.'};draw();return}
  busy=true;feedback='';draw();
  try{const result=await rpc('dd615_trial_state');
   if(!panel.hidden&&before===await who())trial=result;
   else trial={ok:false,message:'Account changed. Reopen Royal Rewards.'};
  }catch(_){trial={ok:false,message:'Daily Trial unavailable. Verify the database update and connection.'};}
  finally{busy=false;draw()}
 }
 async function answer(choice){if(busy||!trial?.ok||trial.completed||!trial.attempts_left)return;
  const before=await who();if(!before)return;
  busy=true;feedback='Verifying your tactic…';draw();
  try{const result=await rpc('dd615_trial_answer',{p_choice:choice});
   if(panel.hidden)return;
   if(before!==await who()){feedback='Commander switched. Reopen to check the reward.';return;}
   feedback=String(result?.message||'Awaiting confirmation.');
   const state=await rpc('dd615_trial_state');
   if(!panel.hidden&&before===await who())trial=state;
  }catch(_){feedback='Could not verify the answer. Reopen the trial to check its result.'}
  finally{busy=false;draw()}
 }
 function injectTab(){const treasury=$('dd510Overlay'),nav=$('dd510Body')?.querySelector('.dd510Tabs');
  if(!treasury||!nav||nav.querySelector('[data-dd615-open]'))return;
  const button=document.createElement('button');button.type='button';button.dataset.dd615Open='true';
  button.setAttribute('aria-label','Open Royal Gift Codes and Daily Dominion Trial');
  button.innerHTML='🎁<span>Gift Codes</span>';
  nav.appendChild(button);
 }
 function boot(){
  makeOverlay();
  // The original Treasury rebuilds its body whenever players switch native tabs.
  // Observe and add ONLY our new fifth button; never replace its old shop/checkout DOM.
  const host=$('dd510Body');if(!host)return false;
  if(observer)return true;
  observer=new MutationObserver(injectTab);observer.observe(host,{childList:true,subtree:true});
  host.addEventListener('click',e=>{const button=e.target.closest('button[data-dd615-open]');if(!button)return;e.preventDefault();e.stopPropagation();void open();},true);
  client()?.auth?.onAuthStateChange?.(()=>{if(panel&&!panel.hidden){close();code='';trial=null;}});
  injectTab();return true;
 }
 function start(){if(boot())return;let n=0;const timer=setInterval(()=>{if(boot()||++n>=60)clearInterval(timer)},250);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.DD615RoyalRewards={version:'6.15.0',open:()=>void open(),close};
})();

/* Dino Dominion 6.16 + 6.17 — Dinosaur Mastery and Royal Expeditions.
 * Additive interface: the existing Royal Rewards and Stripe sandbox remain intact.
 * Persistent progression, timer checks, roster eligibility and rewards are
 * verified on the existing Supabase Royal Authority backend. No Cloud save edits.
 */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const DINOS=[
  ['Blazefang','Tyrannosaurus','Berserker','🦖'],
  ['Thornshield','Triceratops','Guardian','🦕'],
  ['Nightclaw','Raptor','Assassin','🦖'],
  ['Tidebreaker','Spinosaurus','Striker','🦕'],
  ['Ironhide','Ankylosaurus','Guardian','🦕'],
  ['Sunwhisper','Parasaurolophus','Support','🦕']
 ];
 const ROUTES=[
  {id:'track',icon:'🌿',name:'Trail Tracking',role:'Assassin / Striker',secs:90,gold:75,essence:10,desc:'Scout the ancient jungle and trace dinosaur tracks.'},
  {id:'patrol',icon:'🛡️',name:'Citadel Patrol',role:'Guardian',secs:120,gold:90,essence:12,desc:'Defend the kingdom borders and secure the road.'},
  {id:'hunt',icon:'🦴',name:'Primeval Hunt',role:'Berserker / Striker',secs:180,gold:125,essence:15,desc:'Lead a dangerous expedition into predator territory.'},
  {id:'sanctuary',icon:'✨',name:'Sanctuary Aid',role:'Support',secs:120,gold:80,essence:20,desc:'Rescue hatchlings and restore the ancient habitat.'}
 ];
 let overlay=null,host=null,tab='expeditions',data=null,busy=false,notice='',chosenSpecies=-1,chosenRoute='track';
 let clock=null,loadedAt=0,installed=false,accountId='',epoch=0;
 const client=()=>window.DDOnlineClient||null;
 async function uid(){try{const c=client();const {data,error}=await c.auth.getUser();return error?'':data?.user?.id||''}catch{return ''}}
 async function rpc(name,args={}){const c=client();if(!c?.rpc)throw Error('Supabase is unavailable');
  const {data,error}=await c.rpc(name,args);if(error)throw Error(error.message||'Server unavailable');return data;}
 const match=(route,species)=>route==='track'?[2,3].includes(species):route==='patrol'?[1,4].includes(species):route==='hunt'?[0,3].includes(species):species===5;
 const mins=s=>s<120?s+' seconds':Math.round(s/60)+' minutes';
 const timeLeft=()=>Math.max(0,Math.ceil((Date.parse(data?.active?.ready_at||'')-Date.now())/1000)||0);
 function scene(){if(overlay)return;
  overlay=document.createElement('section');overlay.id='dd61617Overlay';overlay.hidden=true;
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Dinosaur Mastery and Royal Expeditions');
  overlay.innerHTML=`<div class="dd61617Frame"><header class="dd61617Head"><button type="button" data-dd617="close" aria-label="Return to Dino Dominion">‹</button><div><small>✦ DINO DOMINION · 6.16 + 6.17</small><h2>Dinosaur Command</h2></div><span aria-hidden="true">🦖</span></header>
   <nav class="dd61617Tabs" aria-label="Dinosaur command sections"><button type="button" data-dd617="tab" data-tab="expeditions">🗺️ Expeditions</button><button type="button" data-dd617="tab" data-tab="mastery">⭐ Mastery</button></nav>
   <main id="dd61617Body" class="dd61617Body"></main></div>`;
  document.body.appendChild(overlay);host=$('dd61617Body');
  overlay.addEventListener('click',e=>{const b=e.target.closest('[data-dd617]');if(!b)return;
   const act=b.dataset.dd617;
   if(act==='close'){close();return}
   if(act==='tab'){tab=b.dataset.tab==='mastery'?'mastery':'expeditions';notice='';draw();return}
   if(act==='route'){chosenRoute=b.dataset.route;draw();return}
   if(act==='select'){chosenSpecies=Number(b.dataset.species);tab='expeditions';draw();return}
   if(act==='refresh'){void refresh();return}
   if(act==='start'){void start();return}
   if(act==='claim'){void claim();return}
  });
  overlay.addEventListener('change',e=>{if(e.target.id==='dd617Select')chosenSpecies=Number(e.target.value);if(!busy)draw()});
  overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
 }
 function formatClock(seconds){const m=Math.floor(seconds/60),s=seconds%60;return m+':'+String(s).padStart(2,'0')}
 function choices(){return `<div class="dd617RouteList">${ROUTES.map(r=>`<button type="button" class="dd617Route${chosenRoute===r.id?' selected':''}" data-dd617="route" data-route="${r.id}" aria-pressed="${chosenRoute===r.id}" ${busy?'disabled':''}>
   <span class="dd617RouteIcon">${r.icon}</span><span class="dd617RouteInfo"><strong>${r.name}</strong><small>${r.desc}</small><em>${r.role} · ${mins(r.secs)}</em></span><span class="dd617RouteRewards">🪙 ${r.gold}<br>✨ ${r.essence}</span></button>`).join('')}</div>`}
 function expHtml(){
  const roster=Array.isArray(data?.roster)?data.roster:[];
  const remaining=Number(data?.remaining_today)||0;
  if(data?.active){const a=data.active,name=DINOS[Number(a.species_id)]?.[0]||'Your dinosaur',r=ROUTES.find(x=>x.id===a.route);
   return `<article class="dd617Hero"><small>🦖 EXPEDITION IN PROGRESS</small><h3>${esc(name)} is on a mission!</h3>
    <p>${esc(r?.name||'Royal Expedition')} · Rewards become available after the server timer completes.</p>
    <div class="dd617Timer" role="timer" id="dd617Countdown">${formatClock(timeLeft())}</div>
    <button class="dd617Gold" type="button" data-dd617="claim" ${busy||timeLeft()>0?'disabled':''}>${timeLeft()>0?'⏳ Waiting for return':'🎁 Claim verified rewards'}</button>
    <p class="dd617Tip">Do not change your phone clock to skip time. Supabase checks the real completion time.</p></article>`;
  }
  if(!roster.length)return '<article class="dd617Hero"><h3>No unlocked dinosaurs found</h3><p>Enroll in Royal Authority and unlock a verified dinosaur to dispatch it.</p></article>';
  if(!roster.some(x=>Number(x.species_id)===chosenSpecies))chosenSpecies=Number(roster[0].species_id);
  const selected=roster.find(x=>Number(x.species_id)===chosenSpecies)||roster[0];
  const suggested=match(chosenRoute,chosenSpecies);
  return `<article class="dd617Hero"><small>ROYAL EXPEDITION BOARD · UTC</small><h3>Send your dinosaurs beyond the gates</h3>
   <p>Choose a verified dinosaur, select a route, and bring back resources and Mastery XP. Class-matched routes earn bonus rewards.</p>
   <div class="dd617Counter">⚔️ <b>${remaining}/3</b> dispatches remaining today</div>
   <label for="dd617Select">Choose your dinosaur</label><select id="dd617Select" ${busy?'disabled':''}>${roster.map(x=>`<option value="${Number(x.species_id)}" ${Number(x.species_id)===chosenSpecies?'selected':''}>${DINOS[Number(x.species_id)]?.[0]||'Dinosaur'} · Mastery ${Number(x.mastery_level)||1}</option>`).join('')}</select>
   <p class="dd617Hint">${suggested?'✨ Class match: +25 Gold, +5 Essence, +7 XP!':'Tip: choose a dinosaur whose class matches the route for extra rewards.'}</p>
   ${choices()}<button type="button" class="dd617Gold" data-dd617="start" ${busy||remaining<=0?'disabled':''}>${remaining?'🦖 Dispatch expedition':'🌙 Daily dispatches exhausted'}</button></article>`;
 }
 function masteryHtml(){const roster=Array.isArray(data?.roster)?data.roster:[];
  return `<article class="dd617Hero"><small>6.16 · PERSISTENT DINOSAUR MASTERY</small><h3>A legend is earned, not given</h3>
   <p>Your verified dinosaurs gain Mastery XP from completed expeditions. Every 100 XP unlocks a higher rank, up to Mastery 5. Each rank improves verified expedition rewards.</p>
   <div class="dd617Roster">${roster.map(x=>{const id=Number(x.species_id),name=DINOS[id]?.[0]||'Dinosaur';const lvl=Number(x.mastery_level)||1,xp=Number(x.xp)||0;const percent=lvl>=5?100:xp%100;
    return `<div class="dd617Dino"><div class="dd617DinoIcon">${DINOS[id]?.[3]||'🦖'}</div><div class="dd617DinoMain"><strong>${esc(name)}</strong><small>${esc(DINOS[id]?.[2]||'Dinosaur')} · Verified Lv.${Number(x.level)||1}</small><div class="dd617Bar"><span style="width:${percent}%"></span></div><small>⭐ Mastery ${lvl}/5 · ${xp} XP</small></div><button type="button" data-dd617="select" data-species="${id}" ${busy?'disabled':''}>Send ↗</button></div>`}).join('')}</div>
   <p class="dd617Tip">Every mastery rank above 1 adds +8 Gold and +2 Essence per expedition. Mastery does not change PvP combat or paid entitlements.</p></article>`;
 }
 function draw(){if(!overlay||overlay.hidden)return;
  for(const b of overlay.querySelectorAll('.dd61617Tabs button')){const on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))}
  const entry=data?.ok===true ? (tab==='mastery'?masteryHtml():expHtml()):`<article class="dd617Hero"><h3>${data?.disabled?'Expeditions paused':'Opening the expedition board'}</h3><p>${esc(data?.message||'Loading your verified dinosaur roster…')}</p></article>`;
  host.innerHTML=entry+`<p class="dd617Feedback" role="status" ${notice?'':'hidden'}>${esc(notice)}</p><button type="button" data-dd617="refresh" class="dd617Refresh" ${busy?'disabled':''}>↻ Refresh verified progress</button>`;
  tick();
 }
 function tick(){if(!overlay||overlay.hidden||!data?.active)return;const seconds=timeLeft();const timer=$('dd617Countdown');if(timer)timer.textContent=seconds?formatClock(seconds):'READY!';
  const claim=host?.querySelector('[data-dd617="claim"]');if(claim){claim.disabled=busy||seconds>0;claim.textContent=busy?'Verifying…':seconds?'⏳ Waiting for return':'🎁 Claim verified rewards'};
 }
 function close(){if(!overlay)return;overlay.hidden=true;document.body.classList.remove('dd61617Open');epoch++;}
 async function open(){scene();if(!overlay.hidden)return;overlay.hidden=false;document.body.classList.add('dd61617Open');tab='expeditions';notice='';data=null;chosenSpecies=-1;draw();await refresh();}
 async function refresh(keepNotice=false){if(busy||!overlay||overlay.hidden)return;
  const ticket=++epoch;busy=true;if(!keepNotice)notice='';draw();
  try{const before=await uid();if(!before)throw Error('Sign in to your commander account first.');
   const response=await rpc('dd61617_status');if(ticket!==epoch||overlay.hidden)return;
   if(before!==await uid())throw Error('Commander changed. Close and reopen the board.');
   accountId=before;data=response;loadedAt=Date.now();
  }catch(e){if(ticket===epoch)data={ok:false,message:String(e?.message||'Unable to load expeditions.').slice(0,180)}}
  finally{if(ticket===epoch){busy=false;draw()}}
 }
 async function action(name,args){if(busy||!overlay||overlay.hidden||!data?.ok)return;
  const ticket=++epoch;busy=true;notice='Verifying with Supabase…';draw();
  try{const before=await uid();if(!before||before!==accountId)throw Error('Commander changed. Reopen the board.');
   const response=await rpc(name,args);
   if(ticket!==epoch||overlay.hidden)return;
   if(before!==await uid())throw Error('Account changed while awaiting a reward. Reopen the board.');
   const next=await rpc('dd61617_status');if(ticket!==epoch||overlay.hidden)return;
   data=next;notice=response?.ok ? (name==='dd617_claim'?`✅ ${response.message} +${response.gold} Gold · +${response.essence} Essence · +${response.mastery_xp} Mastery XP.`:response.message)
      :String(response?.message||'Operation was not accepted.');
  }catch(e){if(ticket===epoch)notice='Could not confirm the action. Refresh verified progress before retrying. '+String(e?.message||'').slice(0,150)}
  finally{if(ticket===epoch){busy=false;draw()}}
 }
 function start(){if(!data?.ok||data.active||!Number(data.remaining_today)||busy)return;
  void action('dd617_start',{p_species:chosenSpecies,p_route:chosenRoute});}
 function claim(){if(!data?.active||busy)return;
  void action('dd617_claim',{p_expedition_id:data.active.id});}
 function inject(){const grid=$('dd612MenuGrid');if(!grid||!window.DD612?.debug)return;
  const active=window.DD612.debug()?.category==='dinos';
  if(!active||grid.querySelector('[data-dd617-launch]'))return;
  const tile=document.createElement('div');tile.className='dd612Tile dd617MenuTile';
  tile.innerHTML='<button type="button" class="dd612Destination" data-dd617-launch="true" aria-label="Open Dinosaur Mastery and Royal Expeditions"><span class="dd612TileIcon" aria-hidden="true">⭐</span><span class="dd612TileWords"><strong>Mastery & Expeditions</strong><small>Train legends · Timed missions</small></span><span class="dd612Arrow" aria-hidden="true">↗</span></button>';
  grid.appendChild(tile);
 }
 function boot(){if(installed)return true;const grid=$('dd612MenuGrid');if(!grid||!window.DD612)return false;
  installed=true;scene();const observer=new MutationObserver(()=>{queueMicrotask(inject)});observer.observe(grid,{childList:true});
  grid.addEventListener('click',e=>{const btn=e.target.closest('[data-dd617-launch]');if(!btn)return;
   e.preventDefault();e.stopPropagation();window.DD612.closeMenu();void open();},true);
  const c=client();c?.auth?.onAuthStateChange?.(()=>{if(overlay&&!overlay.hidden){close();data=null}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&overlay&&!overlay.hidden)void refresh(true)});
  clock=setInterval(()=>{if(overlay&&!overlay.hidden)tick()},1000);
  inject();return true;
 }
 function launch(){if(boot())return;let count=0;const t=setInterval(()=>{if(boot()||++count>=80)clearInterval(t)},250)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch,{once:true});else launch();
 window.DD61617={version:'6.17.0',open,close,refresh};
})();

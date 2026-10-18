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
  // 6.17.2: Supabase emits TOKEN_REFRESHED on iOS background/foreground.
  // Only a genuine sign-out or change to a different commander closes Rewards.
  // Never clear a typed private redemption code on routine token renewal.
  client()?.auth?.onAuthStateChange?.((event,session)=>{
   if(!panel||panel.hidden)return;
   const next=session?.user?.id||'';
   if(event==='SIGNED_OUT'||(loginUid&&next&&next!==loginUid)||(!loginUid&&next)){
    close();code='';trial=null;loginUid='';
   }
  });
  injectTab();return true;
 }
 function start(){if(boot())return;let n=0;const timer=setInterval(()=>{if(boot()||++n>=60)clearInterval(timer)},250);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.DD615RoyalRewards={version:'6.17.2-token-refresh-safe',open:()=>void open(),close};
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
 // 6.17.1: WebKit can suspend unresolved promises while backgrounded. The
 // request ticket and deadline prevent old responses from trapping the UI.
 let wasBackgrounded=false,lastWakeAt=0,wakeTimer=null;
 const STATUS_DEADLINE_MS=12000;
 function withDeadline(promise,ms=STATUS_DEADLINE_MS){
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Connection timed out; tap Refresh to retry.')),ms)});
  return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
 }

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
  host.innerHTML=entry+`<p class="dd617Feedback" role="status" ${notice?'':'hidden'}>${esc(notice)}</p><button type="button" data-dd617="refresh" class="dd617Refresh">${busy?'↻ Retry connection':'↻ Refresh verified progress'}</button>`;
  tick();
 }
 function tick(){if(!overlay||overlay.hidden||!data?.active)return;const seconds=timeLeft();const timer=$('dd617Countdown');if(timer)timer.textContent=seconds?formatClock(seconds):'READY!';
  const claim=host?.querySelector('[data-dd617="claim"]');if(claim){claim.disabled=busy||seconds>0;claim.textContent=busy?'Verifying…':seconds?'⏳ Waiting for return':'🎁 Claim verified rewards'};
 }
 function close(){if(!overlay)return;
  // Closing during a suspended fetch must NOT leave busy=true on next open.
  ++epoch;busy=false;data=null;accountId='';loadedAt=0;wasBackgrounded=false;
  if(wakeTimer!==null){clearTimeout(wakeTimer);wakeTimer=null}
  overlay.hidden=true;document.body.classList.remove('dd61617Open');
 }

 async function open(){scene();if(!overlay.hidden)return;overlay.hidden=false;document.body.classList.add('dd61617Open');tab='expeditions';notice='';data=null;chosenSpecies=-1;draw();await refresh();}
 async function refresh(keepNotice=false){if(!overlay||overlay.hidden)return;
  // A retry is read-only and invalidates older, possibly suspended requests.
  // NEVER replay dd617_start or dd617_claim on foreground/resume.
  const ticket=++epoch;busy=true;if(!keepNotice)notice='';draw();
  try{
   const verified=await withDeadline((async()=>{
    const before=await uid();if(!before)throw Error('Sign in to your commander account first.');
    const response=await rpc('dd61617_status');
    const after=await uid();
    if(before!==after)throw Error('Commander changed. Close and reopen the board.');
    return {before,response};
   })());
   if(ticket!==epoch||overlay.hidden)return;
   if(accountId && accountId!==verified.before){close();return;}
   accountId=verified.before;data=verified.response;loadedAt=Date.now();
  }catch(e){if(ticket===epoch){
    data={ok:false,message:String(e?.message||'Expedition status unavailable. Please retry.').slice(0,180)};
    notice='No expedition rewards or Cloud Kingdom saves were changed by this refresh.';
  }}
  finally{if(ticket===epoch){busy=false;draw()}}
 }
 async function action(name,args){if(busy||!overlay||overlay.hidden||!data?.ok)return;
  const ticket=++epoch;busy=true;notice='Verifying with Supabase…';draw();
  try{
   // A timeout only abandons waiting for the reply: it does not cancel a
   // server-side reward, nor retry a potentially completed mutation.
   const verified=await withDeadline((async()=>{
    const before=await uid();if(!before||before!==accountId)throw Error('Commander changed. Reopen the board.');
    const response=await rpc(name,args);
    if(before!==await uid())throw Error('Account changed while awaiting a reward. Reopen the board.');
    const next=await rpc('dd61617_status');
    return {response,next};
   })());
   if(ticket!==epoch||overlay.hidden)return;
   data=verified.next;
   const response=verified.response;
   notice=response?.ok ? (name==='dd617_claim'?`✅ ${response.message} +${response.gold} Gold · +${response.essence} Essence · +${response.mastery_xp} Mastery XP.`:response.message)
      :String(response?.message||'Operation was not accepted.');
  }catch(e){if(ticket===epoch)notice='Action result not confirmed. Refresh VERIFIED progress before trying again. '+String(e?.message||'').slice(0,140)}
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
  const c=client();
  c?.auth?.onAuthStateChange?.((event,session)=>{
   if(!overlay||overlay.hidden)return;
   const next=session?.user?.id||'';
   if(event==='SIGNED_OUT'||(accountId&&next&&next!==accountId)){
    close();return; // Never show an old commander's roster to a new account.
   }
   // TOKEN_REFRESHED and INITIAL_SESSION are NOT a sign-out. Safari often
   // emits these when the app returns to foreground. Reverify read-only.
   if(event==='TOKEN_REFRESHED'||event==='SIGNED_IN'){
    if(document.hidden)wasBackgrounded=true;
    else scheduleResume();
   }
  });
  function scheduleResume(){
   if(!overlay||overlay.hidden||document.hidden)return;
   const now=Date.now();if(now-lastWakeAt<400)return;lastWakeAt=now;
   if(wakeTimer!==null)clearTimeout(wakeTimer);
   wakeTimer=setTimeout(()=>{
    wakeTimer=null;if(!overlay||overlay.hidden||document.hidden)return;
    wasBackgrounded=false;
    // Invalidate a stalled request, then reread the server. Nothing is
    // dispatched, claimed, locally granted or saved during recovery.
    ++epoch;busy=false;notice='Reconnecting · checking verified expedition progress…';
    void refresh(true);
   },200);
  }
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden){wasBackgrounded=true;return;}
   if(wasBackgrounded)scheduleResume();
  });
  window.addEventListener('pageshow',e=>{
   if(e.persisted||wasBackgrounded||busy)scheduleResume();
  });
  window.addEventListener('focus',()=>{
   if(wasBackgrounded||busy&&Date.now()-loadedAt>3000)scheduleResume();
  });
  clock=setInterval(()=>{if(overlay&&!overlay.hidden)tick()},1000);
  inject();return true;
 }
 function launch(){if(boot())return;let count=0;const t=setInterval(()=>{if(boot()||++count>=80)clearInterval(t)},250)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch,{once:true});else launch();
 window.DD61617={version:'6.17.1-foreground-recovery',open,close,refresh};
})();

/* Dino Dominion 6.17.3 — Safe Royal Screens localization.
 * UI TEXT ONLY: never modifies inputs, chat, mail, names, server payloads,
 * translated reward values, economy state or page navigation.
 * Language follows the existing DDWorldwide 5-language preference.
 */
(()=>{'use strict';
 const supported=new Set(['en','fr','ar','es','pt']);
 const WORDS=[
 // english, french, arabic, spanish, brazilian portuguese
 ['Royal Rewards','Récompenses royales','المكافآت الملكية','Recompensas reales','Recompensas reais'],
 ['Gift Codes','Codes cadeaux','رموز الهدايا','Códigos de regalo','Códigos de presente'],
 ['Dominion Trial','Épreuve du Dominion','اختبار السيادة','Prueba del Dominio','Prova do Domínio'],
 ['AN OFFER FROM THE CROWN','UNE OFFRE DE LA COURONNE','عرض من التاج','UNA OFERTA DE LA CORONA','UMA OFERTA DA COROA'],
 ['Redeem a Royal Gift','Réclamer un cadeau royal','استرداد هدية ملكية','Canjear un regalo real','Resgatar um presente real'],
 ['Redeem a code issued by the kingdom. Every award is confirmed on our server and limited by account.','Saisissez un code du royaume. Chaque récompense est validée sur notre serveur et limitée par compte.','استخدم رمزًا أصدرته المملكة. تؤكد خوادمنا كل مكافأة وتحددها لكل حساب.','Canjea un código del reino. Cada recompensa se verifica en el servidor y se limita por cuenta.','Resgate um código do reino. Cada prêmio é verificado no servidor e limitado por conta.'],
 ['Your code','Votre code','رمزك','Tu código','Seu código'],
 ['Verifying…','Vérification…','جارٍ التحقق…','Verificando…','Verificando…'],
 ['Redeem Code','Utiliser le code','استرداد الرمز','Canjear código','Resgatar código'],
 ['Rewards may include verified Royal Gems, a Godly Egg, or an expedition energy blessing. The King issues codes privately.','Les récompenses peuvent comprendre des gemmes royales, un œuf divin ou de l’énergie d’expédition. Le Roi transmet les codes en privé.','قد تشمل المكافآت جواهر ملكية أو بيضة إلهية أو طاقة للبعثات. يوزّع الملك الرموز بشكل خاص.','Los premios pueden incluir gemas reales, un huevo divino o energía de expedición. El Rey entrega los códigos en privado.','Os prêmios podem incluir gemas reais, um ovo divino ou energia de expedição. O Rei entrega os códigos em particular.'],
 ['THE DAILY TRIAL · UTC','L’ÉPREUVE DU JOUR · UTC','الاختبار اليومي · UTC','PRUEBA DIARIA · UTC','PROVA DIÁRIA · UTC'],
 ['Train your Command','Entraînez votre commandement','درّب قيادتك','Entrena tu mando','Treine seu comando'],
 ['Choose your class.','Choisissez votre classe.','اختر فئتك.','Elige tu clase.','Escolha sua classe.'],
 ['An enemy charges the gates. Which class absorbs the opening blow?','Un ennemi attaque les portes. Quelle classe encaisse le premier coup ?','العدو يقتحم البوابات. أي فئة تتصدى للضربة الأولى؟','Un enemigo carga contra las puertas. ¿Qué clase recibe el primer golpe?','Um inimigo avança pelos portões. Qual classe recebe o primeiro golpe?'],
 ['Your scouts need speed and stealth. Who leads the mission?','Vos éclaireurs ont besoin de vitesse et de discrétion. Qui dirige la mission ?','يحتاج كشّافتك إلى السرعة والتخفي. من يقود المهمة؟','Tus exploradores necesitan velocidad y sigilo. ¿Quién dirige la misión?','Seus batedores precisam de velocidade e furtividade. Quem lidera a missão?'],
 ['The warband needs healing and reinforcements. Choose a class.','La troupe a besoin de soins et de renforts. Choisissez une classe.','تحتاج الفرقة إلى العلاج والتعزيزات. اختر فئة.','La tropa necesita curación y refuerzos. Elige una clase.','O grupo precisa de cura e reforços. Escolha uma classe.'],
 ['You need an aggressive opening strike. Choose a class.','Vous devez attaquer agressivement dès le départ. Choisissez une classe.','تحتاج إلى ضربة افتتاحية قوية. اختر فئة.','Necesitas un ataque inicial agresivo. Elige una clase.','Você precisa de um ataque inicial agressivo. Escolha uma classe.'],
 ['Push the frontline with steady direct attacks. Choose a class.','Poussez la ligne de front avec des attaques directes. Choisissez une classe.','ادفع خط المواجهة بهجمات مباشرة ومتواصلة. اختر فئة.','Avanza con ataques directos constantes. Elige una clase.','Avance com ataques diretos constantes. Escolha uma classe.'],
 ['Enroll in Royal Authority first.','Inscrivez-vous d’abord à l’Autorité royale.','انضم إلى السلطة الملكية أولاً.','Inscríbete primero en la Autoridad Real.','Inscreva-se primeiro na Autoridade Real.'],
 ['Completed today','Terminé aujourd’hui','اكتمل اليوم','Completado hoy','Concluído hoje'],
 ['attempts remaining','essais restants','محاولات متبقية','intentos restantes','tentativas restantes'],
 ['Reward:','Récompense :','المكافأة:','Premio:','Prêmio:'],
 ['verified Gold','or vérifié','ذهب موثّق','oro verificado','ouro verificado'],
 ['Essence','Essence','جوهر','Esencia','Essência'],
 ['Refresh daily trial','Actualiser l’épreuve','تحديث الاختبار اليومي','Actualizar prueba diaria','Atualizar prova diária'],
 ['Daily Dominion Trial','Épreuve quotidienne du Dominion','اختبار السيادة اليومي','Prueba diaria del Dominio','Prova diária do Domínio'],
 ['Loading the server-verified challenge…','Chargement du défi vérifié…','جارٍ تحميل التحدي الموثّق…','Cargando el desafío verificado…','Carregando o desafio verificado…'],
 ['Open Royal Mail for Egg & Energy Gifts','Ouvrir le courrier royal pour les cadeaux','افتح البريد الملكي لاستلام الهدايا','Abrir correo real para regalos','Abrir Correio Real para presentes'],
 ['Sign in first.','Connectez-vous d’abord.','سجّل الدخول أولاً.','Inicia sesión primero.','Entre na sua conta primeiro.'],
 ['Sign in and enroll in Royal Authority first.','Connectez-vous et inscrivez-vous à l’Autorité royale.','سجّل الدخول وانضم إلى السلطة الملكية أولاً.','Inicia sesión e inscríbete en la Autoridad Real.','Entre e inscreva-se na Autoridade Real.'],
 ['Dinosaur Command','Commandement des dinosaures','قيادة الديناصورات','Mando de dinosaurios','Comando dos dinossauros'],
 ['Expeditions','Expéditions','البعثات','Expediciones','Expedições'],
 ['Mastery','Maîtrise','الإتقان','Maestría','Maestria'],
 ['Mastery & Expeditions','Maîtrise et expéditions','الإتقان والبعثات','Maestría y expediciones','Maestria e expedições'],
 ['Train legends · Timed missions','Forgez des légendes · Missions chronométrées','درّب الأساطير · مهمات مؤقتة','Forja leyendas · Misiones cronometradas','Treine lendas · Missões cronometradas'],
 ['ROYAL EXPEDITION BOARD · UTC','MISSIONS ROYALES · UTC','لوحة البعثات الملكية · UTC','TABLÓN DE EXPEDICIONES · UTC','QUADRO DE EXPEDIÇÕES · UTC'],
 ['Send your dinosaurs beyond the gates','Envoyez vos dinosaures au-delà des remparts','أرسل ديناصوراتك خارج الأسوار','Envía a tus dinosaurios más allá de las puertas','Envie seus dinossauros além dos portões'],
 ['Choose a verified dinosaur, select a route, and bring back resources and Mastery XP. Class-matched routes earn bonus rewards.','Choisissez un dinosaure vérifié et un parcours pour gagner des ressources et de l’XP de maîtrise. Les classes adaptées reçoivent un bonus.','اختر ديناصورًا موثّقًا ومسارًا لجلب الموارد وخبرة الإتقان. تمنح الفئة المناسبة مكافآت إضافية.','Elige un dinosaurio verificado y una ruta para obtener recursos y XP de maestría. Las clases adecuadas reciben una bonificación.','Escolha um dinossauro verificado e uma rota para obter recursos e XP de maestria. Classes adequadas ganham bônus.'],
 ['dispatches remaining today','missions restantes aujourd’hui','بعثات متبقية اليوم','envíos restantes hoy','envios restantes hoje'],
 ['Choose your dinosaur','Choisissez votre dinosaure','اختر ديناصورك','Elige tu dinosaurio','Escolha seu dinossauro'],
 ['Class match: +25 Gold, +5 Essence, +7 XP!','Classe adaptée : +25 or, +5 essence, +7 XP !','الفئة مناسبة: +25 ذهب، +5 جوهر، +7 خبرة!','Clase adecuada: +25 oro, +5 esencia, +7 XP','Classe adequada: +25 ouro, +5 essência, +7 XP!'],
 ['Tip: choose a dinosaur whose class matches the route for extra rewards.','Astuce : associez la classe du dinosaure au parcours pour obtenir un bonus.','نصيحة: اختر ديناصورًا بفئة تناسب المسار لمكافآت إضافية.','Consejo: elige una clase adecuada para recibir más recompensas.','Dica: escolha uma classe adequada para ganhar recompensas extras.'],
 ['Trail Tracking','Pistage en forêt','تعقّب الآثار','Rastreo del bosque','Rastreamento na floresta'],
 ['Citadel Patrol','Patrouille de la citadelle','دورية القلعة','Patrulla de la ciudadela','Patrulha da cidadela'],
 ['Primeval Hunt','Chasse primitive','الصيد البدائي','Cacería primitiva','Caçada primitiva'],
 ['Sanctuary Aid','Secours du sanctuaire','إغاثة المحمية','Ayuda al santuario','Ajuda ao santuário'],
 ['Scout the ancient jungle and trace dinosaur tracks.','Explorez la jungle ancienne et suivez les pistes.','استكشف الأدغال القديمة وتتبّع آثار الديناصورات.','Explora la selva ancestral y sigue los rastros.','Explore a selva antiga e siga os rastros.'],
 ['Defend the kingdom borders and secure the road.','Protégez les frontières du royaume et sécurisez les routes.','احمِ حدود المملكة وأمّن الطريق.','Defiende las fronteras del reino y protege el camino.','Defenda as fronteiras do reino e proteja a estrada.'],
 ['Lead a dangerous expedition into predator territory.','Menez une expédition périlleuse en territoire prédateur.','قُد بعثة خطيرة إلى أراضي المفترسات.','Dirige una expedición peligrosa entre depredadores.','Lidere uma expedição perigosa em território de predadores.'],
 ['Rescue hatchlings and restore the ancient habitat.','Sauvez les petits et restaurez leur habitat ancestral.','أنقذ الصغار وأعد تأهيل موطنهم القديم.','Rescata crías y restaura el hábitat ancestral.','Resgate filhotes e restaure o habitat ancestral.'],
 ['Dispatch expedition','Lancer l’expédition','إرسال البعثة','Enviar expedición','Enviar expedição'],
 ['Daily dispatches exhausted','Plus de missions aujourd’hui','انتهت بعثات اليوم','Límite diario alcanzado','Limite diário atingido'],
 ['EXPEDITION IN PROGRESS','EXPÉDITION EN COURS','البعثة جارية','EXPEDICIÓN EN CURSO','EXPEDIÇÃO EM ANDAMENTO'],
 ['is on a mission!','est en mission !','في مهمة!','está en una misión!','está em uma missão!'],
 ['Rewards become available after the server timer completes.','Récompenses disponibles à la fin du minuteur serveur.','تتاح المكافآت عند انتهاء مؤقّت الخادم.','Recompensas disponibles al terminar el temporizador del servidor.','Recompensas disponíveis após o temporizador do servidor.'],
 ['Waiting for return','En attente du retour','بانتظار العودة','Esperando regreso','Aguardando retorno'],
 ['Claim verified rewards','Réclamer les récompenses','استلام المكافآت الموثّقة','Reclamar recompensas','Resgatar recompensas'],
 ['Do not change your phone clock to skip time. Supabase checks the real completion time.','Ne changez pas l’horloge du téléphone : le serveur contrôle l’heure réelle.','لا تغيّر ساعة هاتفك لتجاوز الوقت؛ يتحقق الخادم من الموعد الحقيقي.','No cambies la hora del móvil: el servidor verifica el tiempo real.','Não altere o relógio: o servidor verifica o horário real.'],
 ['No unlocked dinosaurs found','Aucun dinosaure débloqué','لا توجد ديناصورات مفتوحة','No hay dinosaurios desbloqueados','Nenhum dinossauro desbloqueado'],
 ['Enroll in Royal Authority and unlock a verified dinosaur to dispatch it.','Rejoignez l’Autorité royale et débloquez un dinosaure vérifié.','انضم إلى السلطة الملكية وافتح ديناصورًا موثّقًا لإرساله.','Únete a la Autoridad Real y desbloquea un dinosaurio verificado.','Entre na Autoridade Real e desbloqueie um dinossauro verificado.'],
 ['PERSISTENT DINOSAUR MASTERY','MAÎTRISE PERSISTANTE','إتقان دائم للديناصورات','MAESTRÍA PERSISTENTE','MAESTRIA PERSISTENTE'],
 ['A legend is earned, not given','La légende se mérite','الأسطورة تُكتسب ولا تُمنح','Una leyenda se gana','Uma lenda é conquistada'],
 ['Your verified dinosaurs gain Mastery XP from completed expeditions. Every 100 XP unlocks a higher rank, up to Mastery 5. Each rank improves verified expedition rewards.','Vos dinosaures vérifiés gagnent de l’XP de maîtrise en terminant des missions. Chaque tranche de 100 XP augmente leur rang, jusqu’au niveau 5, et améliore les récompenses.','تكسب ديناصوراتك الموثّقة خبرة الإتقان من البعثات المكتملة. كل 100 نقطة ترفع رتبتها حتى المستوى 5 وتحسّن المكافآت.','Tus dinosaurios verificados ganan XP de maestría al completar expediciones. Cada 100 XP sube su rango, hasta 5, y mejora los premios.','Dinossauros verificados ganham XP de maestria nas expedições. Cada 100 XP aumenta o nível, até 5, e melhora os prêmios.'],
 ['Every mastery rank above 1 adds +8 Gold and +2 Essence per expedition. Mastery does not change PvP combat or paid entitlements.','Chaque rang au-dessus de 1 ajoute +8 or et +2 essence par mission. La maîtrise ne modifie pas le PvP ni les achats.','تضيف كل رتبة إتقان بعد الأولى 8 ذهب و2 جوهر لكل بعثة. لا تؤثر على PvP أو المشتريات.','Cada rango superior a 1 añade +8 oro y +2 esencia por expedición. No modifica el PvP ni las compras.','Cada nível acima de 1 adiciona +8 ouro e +2 essência por expedição. Não altera PvP ou compras.'],
 ['Send','Envoyer','إرسال','Enviar','Enviar'],
 ['Refresh verified progress','Actualiser la progression','تحديث التقدّم الموثّق','Actualizar progreso','Atualizar progresso'],
 ['Opening the expedition board','Ouverture des missions','جارٍ فتح لوحة البعثات','Abriendo expediciones','Abrindo expedições'],
 ['Loading your verified dinosaur roster…','Chargement de vos dinosaures vérifiés…','جارٍ تحميل قائمة الديناصورات الموثّقة…','Cargando tus dinosaurios verificados…','Carregando seus dinossauros verificados…'],
 ['Expeditions paused','Expéditions en pause','البعثات متوقّفة مؤقتًا','Expediciones pausadas','Expedições pausadas'],
 ['Reconnecting · checking verified expedition progress…','Reconnexion · vérification de la progression…','جارٍ إعادة الاتصال والتحقق من التقدّم…','Reconectando · verificando progreso…','Reconectando · verificando progresso…'],
 ['seconds','secondes','ثوانٍ','segundos','segundos'],
 ['minutes','minutes','دقائق','minutos','minutos'],
 ['Assassin','Assassin','قاتل متخفٍ','Asesino','Assassino'],
 ['Striker','Frappeur','مهاجم','Atacante','Atacante'],
 ['Guardian','Gardien','حارس','Guardián','Guardião'],
 ['Berserker','Berserker','محارب هائج','Berserker','Berserker'],
 ['Support','Soutien','دعم','Apoyo','Suporte'],

 // 6.17.4 — The Royal Command Deck and five-category navigation.
 ['More','Plus','المزيد','Más','Mais'],
 ['War','Guerre','الحرب','Guerra','Guerra'],
 ['Explore','Explorer','استكشف','Explorar','Explorar'],
 ['Dinos','Dinosaures','الديناصورات','Dinosaurios','Dinossauros'],
 ['Kingdom','Royaume','المملكة','Reino','Reino'],
 ['Your Kingdom','Votre royaume','مملكتك','Tu reino','Seu reino'],
 ['Rule your citadel and manage your kingdom.','Gérez votre citadelle et votre royaume.','احكم قلعتك وأدر مملكتك.','Gobierna tu ciudadela y gestiona tu reino.','Governe sua cidadela e gerencie seu reino.'],
 ['Raise, train, and bond with your dinosaurs.','Élevez, entraînez et renforcez vos liens avec les dinosaures.','ربِّ ديناصوراتك ودرّبها وعزّز الروابط معها.','Cría, entrena y crea vínculos con tus dinosaurios.','Crie, treine e fortaleça laços com seus dinossauros.'],
 ['Discover what lies beyond the royal gates.','Découvrez ce qui se trouve au-delà des portes royales.','اكتشف ما وراء البوابات الملكية.','Descubre qué hay más allá de las puertas reales.','Descubra o que há além dos portões reais.'],
 ['Prepare your army and coordinate with allies.','Préparez votre armée et coordonnez-vous avec vos alliés.','جهّز جيشك ونسّق مع حلفائك.','Prepara tu ejército y coordínate con tus aliados.','Prepare seu exército e coordene-se com os aliados.'],
 ['Your social, account, and interface options.','Vos options sociales, de compte et d’interface.','خيارات التواصل والحساب والواجهة.','Opciones sociales, de cuenta y de interfaz.','Suas opções sociais, de conta e de interface.'],
 ['♛ DINO DOMINION · ROYAL COMMAND','♛ DINO DOMINION · COMMANDE ROYALE','♛ سيادة الديناصورات · القيادة الملكية','♛ DINO DOMINION · MANDO REAL','♛ DINO DOMINION · COMANDO REAL'],
 ['Dominion World','Monde du Dominion','عالم السيادة','Mundo del Dominio','Mundo do Domínio'],
 ['Your kingdom overview','Aperçu de votre royaume','نظرة عامة على مملكتك','Vista general de tu reino','Visão geral do seu reino'],
 ['Royal Citadel','Citadelle royale','القلعة الملكية','Ciudadela real','Cidadela real'],
 ['Buildings and construction','Bâtiments et construction','المباني والتشييد','Edificios y construcción','Edifícios e construção'],
 ['Living Castle','Château vivant','القلعة الحية','Castillo viviente','Castelo vivo'],
 ['Enter and explore','Entrez et explorez','ادخل واستكشف','Entra y explora','Entre e explore'],
 ['Royal Council','Conseil royal','المجلس الملكي','Consejo real','Conselho real'],
 ['Leader and signature dinosaur','Chef et dinosaure emblématique','القائد والديناصور المميّز','Líder y dinosaurio emblemático','Líder e dinossauro principal'],
 ['Dominion Deck','Tableau du Dominion','لوحة السيادة','Panel del Dominio','Painel do Domínio'],
 ['Cinematic command center','Centre de commandement cinématique','مركز قيادة سينمائي','Centro de mando cinematográfico','Centro de comando cinematográfico'],
 ['Kingdom Resources','Ressources du royaume','موارد المملكة','Recursos del reino','Recursos do reino'],
 ['Expand your resource display','Développez l’affichage des ressources','وسّع عرض الموارد','Amplía la vista de recursos','Expanda a exibição de recursos'],
 ['Dinosaur Collection','Collection de dinosaures','مجموعة الديناصورات','Colección de dinosaurios','Coleção de dinossauros'],
 ['Dinos and companion training','Dinosaures et entraînement des compagnons','الديناصورات وتدريب الرفاق','Dinosaurios y entrenamiento de compañeros','Dinossauros e treino de companheiros'],
 ['Eggs & Hatchery','Œufs et couvoir','البيض والحاضنة','Huevos e incubadora','Ovos e incubatório'],
 ['Hatching and incubating','Éclosion et incubation','الفقس والحضانة','Eclosión e incubación','Eclosão e incubação'],
 ['Companion Sanctuary','Sanctuaire des compagnons','ملاذ الرفاق','Santuario de compañeros','Santuário dos companheiros'],
 ['The Living Bond','Le lien vivant','الرابطة الحية','El vínculo viviente','O vínculo vivo'],
 ['Genetics & Hybrids','Génétique et hybrides','الوراثة والهجائن','Genética e híbridos','Genética e híbridos'],
 ['Local genetics laboratory trial','Laboratoire génétique local expérimental','تجربة مختبر الوراثة المحلي','Prueba de laboratorio genético local','Teste local do laboratório genético'],
 ['Riders & Warbands','Cavaliers et troupes','الفرسان والفرق','Jinetes y escuadrones','Montadores e tropas'],
 ['Customize riders and practice squads','Personnalisez les cavaliers et les escouades d’entraînement','خصّص الفرسان وفرق التدريب','Personaliza jinetes y escuadrones de práctica','Personalize montadores e equipes de treino'],
 ['World Exploration','Exploration du monde','استكشاف العالم','Exploración del mundo','Exploração mundial'],
 ['Explore existing regions','Explorez les régions existantes','استكشف المناطق الحالية','Explora regiones existentes','Explore regiões existentes'],
 ['Mossveil Expedition','Expédition de Mossveil','بعثة وادي موسفيل','Expedición de Mossveil','Expedição Mossveil'],
 ['Survey the valley','Explorez la vallée','استطلع الوادي','Explora el valle','Explore o vale'],
 ['Expedition Journal','Journal des expéditions','سجل البعثات','Diario de expediciones','Diário de expedições'],
 ['Discoveries and encounters','Découvertes et rencontres','الاكتشافات واللقاءات','Descubrimientos y encuentros','Descobertas e encontros'],
 ['Dominion Territories','Territoires du Dominion','أراضي السيادة','Territorios del Dominio','Territórios do Domínio'],
 ['Return to the world overview','Retour à la vue générale du monde','عُد إلى نظرة العالم العامة','Vuelve al mapa general','Volte ao mapa geral'],
 ['Battle Arena','Arène de combat','ساحة المعركة','Arena de batalla','Arena de batalha'],
 ['Fight and test your squads','Combattez et testez vos équipes','قاتل واختبر فرقك','Lucha y prueba tus escuadrones','Lute e teste suas equipes'],
 ['Alliance HQ','QG de l’alliance','مقر التحالف','Cuartel de la alianza','Quartel da aliança'],
 ['Ranks, members, and War Room','Rangs, membres et salle de guerre','الرتب والأعضاء وغرفة الحرب','Rangos, miembros y sala de guerra','Patentes, membros e sala de guerra'],
 ['War Council','Conseil de guerre','مجلس الحرب','Consejo de guerra','Conselho de guerra'],
 ['Orders and live territories','Ordres et territoires actifs','الأوامر والأراضي النشطة','Órdenes y territorios activos','Ordens e territórios ativos'],
 ['Warfront','Front de guerre','جبهة الحرب','Frente de guerra','Frente de guerra'],
 ['Server-verified alliance warfare','Guerre d’alliances vérifiée par le serveur','حروب التحالف الموثّقة بالخادم','Guerra de alianzas verificada por el servidor','Guerra de alianças verificada pelo servidor'],
 ['Royal Messenger','Messagerie royale','المراسلة الملكية','Mensajería real','Mensagens reais'],
 ['Chat and auto-translation','Discussion et traduction automatique','الدردشة والترجمة التلقائية','Chat y traducción automática','Chat e tradução automática'],
 ['Royal Mail','Courrier royal','البريد الملكي','Correo real','Correio real'],
 ['Letters and shipments','Lettres et envois','الرسائل والشحنات','Cartas y envíos','Cartas e remessas'],
 ['Rankings','Classements','التصنيفات','Clasificaciones','Classificações'],
 ['Players and alliances','Joueurs et alliances','اللاعبون والتحالفات','Jugadores y alianzas','Jogadores e alianças'],
 ['Commander Profile','Profil du commandant','ملف القائد','Perfil del comandante','Perfil do comandante'],
 ['Identity and cloud kingdom','Identité et royaume cloud','الهوية والمملكة السحابية','Identidad y reino en la nube','Identidade e reino na nuvem'],
 ['Friends','Amis','الأصدقاء','Amigos','Amigos'],
 ['Find other commanders','Trouvez d’autres commandants','ابحث عن قادة آخرين','Encuentra otros comandantes','Encontre outros comandantes'],
 ['Royal Shop','Boutique royale','المتجر الملكي','Tienda real','Loja real'],
 ['Offers and upgrades','Offres et améliorations','العروض والترقيات','Ofertas y mejoras','Ofertas e melhorias'],
 ['View Settings','Options d’affichage','إعدادات العرض','Ajustes de vista','Configurações de exibição'],
 ['Castle visuals and motion','Visuels et animations du château','رسومات القلعة وحركتها','Aspecto y movimiento del castillo','Visual e movimento do castelo'],
 ['Customize Shortcuts','Personnaliser les raccourcis','تخصيص الاختصارات','Personalizar accesos','Personalizar atalhos'],
 ['Pin up to two favorites','Épinglez deux favoris au maximum','ثبّت ما يصل إلى مفضلتين','Fija hasta dos favoritos','Fixe até dois favoritos'],
 ['Tap the stars to pin up to two favorites. Pinned shortcuts stay on the navigation dock.','Touchez les étoiles pour épingler deux favoris. Les raccourcis restent dans la barre de navigation.','اضغط النجوم لتثبيت اختصارين مفضلين في شريط التنقل.','Toca las estrellas para fijar hasta dos favoritos en la barra de navegación.','Toque nas estrelas para fixar até dois favoritos na barra de navegação.'],
 ['All original features remain available. Choose where to go.','Toutes les fonctions restent accessibles. Choisissez votre destination.','تظل جميع الميزات متاحة. اختر وجهتك.','Todas las funciones siguen disponibles. Elige dónde ir.','Todos os recursos continuam disponíveis. Escolha aonde ir.'],
 ['☆ Tap Customize Shortcuts under More to pin favorites.','☆ Dans « Plus », touchez Personnaliser les raccourcis pour épingler vos favoris.','☆ افتح «المزيد» ثم «تخصيص الاختصارات» لتثبيت المفضلات.','☆ En «Más», toca Personalizar accesos para fijar favoritos.','☆ Em «Mais», toque Personalizar atalhos para fixar favoritos.'],
 ['Resources','Ressources','الموارد','Recursos','Recursos'],
 ['View','Affichage','العرض','Vista','Exibição'],
 ['Royal navigation','Navigation royale','التنقل الملكي','Navegación real','Navegação real'],
 ['Main game areas','Sections principales du jeu','أقسام اللعبة الرئيسية','Secciones principales','Áreas principais do jogo'],
 ['Close royal menu','Fermer le menu royal','إغلاق القائمة الملكية','Cerrar menú real','Fechar menu real'],
 ['Close menu','Fermer le menu','إغلاق القائمة','Cerrar menú','Fechar menu'],
 ['Open verified Royal Authority','Ouvrir l’Autorité royale vérifiée','افتح السلطة الملكية الموثّقة','Abrir Autoridad Real verificada','Abrir Autoridade Real verificada'],
 ['ROYAL AUTHORITY','AUTORITÉ ROYALE','السلطة الملكية','AUTORIDAD REAL','AUTORIDADE REAL'],
 ['Secure progression · World Power Rankings','Progression sécurisée · Classement mondial de puissance','تقدم موثّق · تصنيف القوة العالمي','Progresión segura · Clasificación mundial','Progresso seguro · Classificação mundial'],
 ['ROYAL TREASURY','TRÉSOR ROYAL','الخزانة الملكية','TESORO REAL','TESOURO REAL'],
 ['Verified gems · Test payments','Gemmes vérifiées · Paiements de test','جواهر موثّقة · مدفوعات تجريبية','Gemas verificadas · Pagos de prueba','Gemas verificadas · Pagamentos de teste'],
 ['Enter Living Kingdom','Entrer dans le royaume vivant','ادخل المملكة الحية','Entrar al reino viviente','Entrar no reino vivo'],
 ['Living Kingdom · Explore','Royaume vivant · Explorer','المملكة الحية · استكشف','Reino viviente · Explorar','Reino vivo · Explorar'],
 ['Cloud kingdom saved','Royaume cloud sauvegardé','تم حفظ المملكة السحابية','Reino en la nube guardado','Reino na nuvem salvo'],
 ['Reading your cloud kingdom…','Lecture de votre royaume cloud…','جارٍ تحميل مملكتك السحابية…','Cargando tu reino en la nube…','Carregando seu reino na nuvem…'],
 ['Saving your kingdom…','Sauvegarde de votre royaume…','جارٍ حفظ مملكتك…','Guardando tu reino…','Salvando seu reino…'],
 ['Device save · Sign in to enable cloud','Sauvegarde locale · Connectez-vous pour activer le cloud','حفظ محلي · سجّل الدخول لتفعيل الحفظ السحابي','Guardado local · Inicia sesión para activar la nube','Salvo local · Entre para ativar a nuvem'],
 ['Import this device’s kingdom to start cloud saves','Importez le royaume de cet appareil pour activer le cloud','استورد المملكة من هذا الجهاز لتفعيل الحفظ السحابي','Importa el reino de este dispositivo para guardar en la nube','Importe o reino deste dispositivo para salvar na nuvem'],
 ['Offline changes saved on this device — retry upload','Modifications hors ligne conservées sur cet appareil — réessayez','حُفظت التغييرات محليًا دون اتصال — أعد المحاولة','Cambios sin conexión guardados en este dispositivo — reintenta','Alterações offline salvas neste dispositivo — tente novamente'],
 ['Cloud conflict — choose which save to keep','Conflit cloud — choisissez la sauvegarde à conserver','تعارض في الحفظ السحابي — اختر النسخة المطلوبة','Conflicto en la nube — elige qué guardado conservar','Conflito na nuvem — escolha o salvamento'],
 ['Cloud unavailable — device progress remains available','Cloud indisponible — votre progression locale reste accessible','الحفظ السحابي غير متاح — تقدم الجهاز محفوظ','Nube no disponible — tu progreso local sigue disponible','Nuvem indisponível — progresso local preservado'],
 ['Drag to rotate · Tap castle gate to enter','Faites glisser pour tourner · Touchez la porte du château','اسحب للتدوير · اضغط بوابة القلعة للدخول','Arrastra para girar · Toca la puerta del castillo','Arraste para girar · Toque o portão do castelo'],
 ];
 const DICT=Object.fromEntries(['fr','ar','es','pt'].map((l,j)=>[l,new Map(WORDS.map(row=>[row[0],row[j+1]]))]));
 const originals=new WeakMap(),applied=new WeakMap();
 let lastLang='en',queued=false,installed=false;
 const getLang=()=>{try{const lang=window.DDWorldwide?.getLanguage?.()||localStorage.getItem('dd59-language')||'en';return supported.has(lang)?lang:'en'}catch{return'en'}};
 const protect=node=>!node?.parentElement||!!node.parentElement.closest('input,textarea,select,option,script,style,[contenteditable],[data-user-content],.dd615Feedback,.dd617Feedback');
 function lookup(source,lang){
  if(lang==='en')return source;
  const dict=DICT[lang],raw=String(source),trim=raw.trim();
  if(!trim)return raw;
  let result=dict.get(trim);
  // Emoji and stars are decorative prefixes to localized UI labels.
  if(!result){const m=/^([^\p{L}\p{N}]*)(.*)$/u.exec(trim);if(m&&m[1]){const t=dict.get(m[2]);if(t)result=m[1]+t;}}
  // Small UI fragments that include numeric counters and status prefixes.
  if(!result){const m=/^(.*?)(\d+)(\/3\s+dispatches remaining today)$/i.exec(trim);if(m)result=m[1]+m[2]+'/3 '+dict.get('dispatches remaining today');}
  if(!result){const m=/^(.+?)\s+(is on a mission!)$/.exec(trim);if(m)result=m[1]+' '+dict.get('is on a mission!');}
  if(!result){const m=/^(\d+)\s+(seconds|minutes)$/.exec(trim);if(m)result=m[1]+' '+dict.get(m[2]);}
  if(!result){const m=/^(.*?)(\d+)\s+attempts remaining$/.exec(trim);if(m)result=m[1]+m[2]+' '+dict.get('attempts remaining');}
  if(!result){const m=/^(.*?)(\d+)\s+verified Gold\s*\+\s*(.*?)(\d+)\s+Essence$/.exec(trim);if(m)result=m[1]+m[2]+' '+dict.get('verified Gold')+' + '+m[3]+m[4]+' '+dict.get('Essence');}
  if(!result&&/^(?:Assassin|Striker|Guardian|Berserker|Support)(?: \/ (?:Assassin|Striker|Guardian|Berserker|Support))? · \d+ (?:seconds|minutes)$/.test(trim)){
   result=trim.replace(/Assassin|Striker|Guardian|Berserker|Support|seconds|minutes/g,v=>dict.get(v)||v);
  }
  if(!result&&/^⭐ Mastery \d+\/5 · \d+ XP$/.test(trim))result=trim.replace('Mastery',dict.get('Mastery'));
  if(!result&&/^↻ Refresh verified progress$/.test(trim))result='↻ '+dict.get('Refresh verified progress');

  if(!result)return raw;
  return raw.replace(trim,result);
 }
 function translate(root,lang){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   if(protect(node))continue;
   const previous=applied.get(node),now=node.nodeValue;
   if(!originals.has(node)||previous!==undefined&&previous!==now)originals.set(node,now);
   const origin=originals.get(node),next=lookup(origin,lang);
   if(next!==now)node.nodeValue=next;
   applied.set(node,next);
  }
 }
 const ariaOriginals=new WeakMap(),ariaApplied=new WeakMap();
 function translateAttributes(root,lang){
  const candidates=[root,...root.querySelectorAll('[aria-label],[title]')];
  for(const el of candidates){
   for(const name of ['aria-label','title']){
    if(!el.hasAttribute(name))continue;
    let byName=ariaOriginals.get(el),last=ariaApplied.get(el);
    if(!byName){byName={};ariaOriginals.set(el,byName)}
    if(!last){last={};ariaApplied.set(el,last)}
    const present=el.getAttribute(name);
    if(!(name in byName)||(name in last&&last[name]!==present))byName[name]=present;
    const translated=lookup(byName[name],lang);
    if(present!==translated)el.setAttribute(name,translated);
    last[name]=translated;
   }
  }
 }
 // The deck title is a CSS ::before pseudo-element, not a text node.
 // Set only a presentation-only locale marker; never replace the original grid.
 function ensureDeckStyle(){
  if(document.getElementById('dd6174DeckLocaleStyle'))return;
  const names={fr:'✦  LE TABLEAU DE COMMANDEMENT ROYAL',ar:'✦  لوحة القيادة الملكية',es:'✦  EL PANEL DE MANDO REAL',pt:'✦  O PAINEL DE COMANDO REAL'};
  const style=document.createElement('style');style.id='dd6174DeckLocaleStyle';
  style.textContent=Object.entries(names).map(([code,label])=>
   `html[data-dd6174-locale="${code}"] body.dd612Ready .app::before{content:${JSON.stringify(label)}!important;}`
  ).join('\n')+'\n#dd612Dock .dd612Categories button small{white-space:normal;overflow-wrap:anywhere;}';
  document.head.appendChild(style);
 }
 // Keep account IDs, user-created labels, messages and editable text unchanged.
 const watchedIds=['dd615Overlay','dd61617Overlay','dd612RoyalUI','dd58Launch','dd510Launch','dd60Launcher','dd60BaseLauncher','cloudStatus'];
 function render(){queued=false;const lang=getLang();lastLang=lang;
  ensureDeckStyle();document.documentElement.dataset.dd6174Locale=lang;
  for(const id of watchedIds){
   const root=document.getElementById(id);
   if(root){translate(root,lang);translateAttributes(root,lang);hook(root);}
  }
  // Small controls immediately above the Command Deck also remain in view.
  for(const selector of ['.heroHint','#dd612ResourceToggle','#dd612ViewToggle']){
   const root=document.querySelector(selector);
   if(root){translate(root,lang);translateAttributes(root,lang);hook(root);}
  }
 }
 function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(render);}
 const watched=new WeakSet();
 function hook(root){if(watched.has(root))return;watched.add(root);
  const obs=new MutationObserver(schedule);obs.observe(root,{childList:true,subtree:true,characterData:true});
 }
 function init(){if(installed)return;installed=true;render();
  // New overlay roots are appended lazily; observe additions only.
  new MutationObserver(records=>{
   if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(
      watchedIds.includes(n.id)||
      n.querySelector?.('#dd615Overlay,#dd61617Overlay,#dd612RoyalUI,#dd58Launch,#dd510Launch,#dd60Launcher,#dd60BaseLauncher,#cloudStatus')))))schedule();
  }).observe(document.body,{childList:true,subtree:false});
  // The worldwide language selector does not emit an event in Build 5.9.
  document.addEventListener('click',e=>{if(e.target.closest('[data-dd59="language"]')){
   setTimeout(schedule,0);setTimeout(schedule,130);
  }},true);
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('focus',()=>{if(lastLang!==getLang())schedule()});
  window.addEventListener('pageshow',schedule);
  window.DD6173Locale={version:'6.17.4-navigation-locales',refresh:schedule,getLanguage:getLang};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

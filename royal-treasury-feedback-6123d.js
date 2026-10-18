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

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

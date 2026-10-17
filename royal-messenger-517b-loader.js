/* Dino Dominion 6.12.3b — Messenger compatibility hotfix, temporary loader.
 * Ensures the original Messenger initializes BEFORE dependent deferred modules.
 * Only one internal closure hook is added; every existing feature is retained.
 * Loads the exact reviewed GitHub file from the same origin synchronously to
 * preserve original script execution order. Revert by restoring old index ref.
 * NOTE: This synchronous 29KB fetch is a temporary compatibility solution.
 */
(()=>{'use strict';
 const ORIGINAL='./royal-messenger-517.js?v=1090&dd6123b=1';
 const REVIEWED_LENGTH=28899, REVIEWED_FNV='6cf6790b';
 const ANCHOR='window.DD517={open:login,';
 const API=`async function dd6123bUnmuteNow(blockedId,accountId){
  if(!who||who.id!==accountId||!goodId(blockedId)||blockedId===accountId)return false;
  blocked.delete(blockedId);
  persist('blocked',[...blocked]);
  const ticket=++version;
  if(open){items=[];renderMessages(true);}
  for(let i=0;i<30&&loading;i++)await new Promise(r=>setTimeout(r,100));
  if(!who||who.id!==accountId||version!==ticket)return false;
  if(open)await loadMessages();
  void unread();
  return true;
 }
 `;
 const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)};
 let source='',patched=false,reason='';
 try{
  const xhr=new XMLHttpRequest();
  xhr.open('GET',ORIGINAL,false);
  xhr.send(null);
  if(xhr.status<200||xhr.status>=300)throw Error('Messenger request failed ('+xhr.status+')');
  source=xhr.responseText;
  if(source.length!==REVIEWED_LENGTH||hash(source)!==REVIEWED_FNV)throw Error('Messenger has changed since audit');
  if(source.split(ANCHOR).length!==2)throw Error('Messenger API declaration changed');
  source=source.replace(ANCHOR,API+'window.DD517={unmuteNow:dd6123bUnmuteNow,open:login,');
  patched=true;
 }catch(e){
  reason=String(e?.message||e).slice(0,160);
  console.warn('[Dino Dominion] Instant Unmute safe fallback:',reason);
 }
 if(source){
  const script=document.createElement('script');
  script.textContent=source;
  document.head.appendChild(script);
  script.remove();
 }else{
  // Emergency fallback; regular Messenger still loads even if the hotfix cannot.
  const script=document.createElement('script');script.src=ORIGINAL;script.async=false;
  document.head.appendChild(script);
 }
 window.DD6123bMessenger={version:'6.12.3b',patched,reason};
})();

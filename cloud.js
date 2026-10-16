/* Dino Dominion V1.0 Build 1 — Cloud Kingdom synchronization.
 * Cloud data is account-scoped. Pre-V1 device save is deliberately retained.
 * This is cloud backup/sync, NOT server-authoritative competitive progression.
 */
(()=>{'use strict';
const client=window.DDOnlineClient, game=window.DDGameCloudBridge;
const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CACHE='dino-v1-cloud-cache:';
let uid=null, mode='guest', revision=0, error='', updated='', inFlight=false, timer=null, queued=null, serial=0, serverSnapshot=null, lastSnapshot=null;
const localGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const localPut=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const snapshot=v=>JSON.parse(JSON.stringify(v));
const cacheKey=()=>CACHE+uid;
const isDirty=()=>uid&&!!localGet(cacheKey())?.dirty;
function refresh(){
 const statuses={guest:'💾 Device save · Sign in to enable cloud',loading:'☁️ Reading your cloud kingdom…',missing:'☁️ Import this device’s kingdom to start cloud saves',ready:'☁️ Cloud kingdom saved',syncing:'☁️ Saving your kingdom…',offline:'⚠️ Offline changes saved on this device — retry upload',conflict:'⚠️ Cloud conflict — choose which save to keep',error:'⚠️ Cloud unavailable — device progress remains available'};
 const el=$('cloudStatus');if(el){el.textContent=statuses[mode]||'☁️ Cloud Kingdom';el.dataset.mode=mode}
 if(typeof window.DDOnlineRedraw==='function')window.DDOnlineRedraw();
}
function cached(){const x=localGet(cacheKey());return x&&typeof x==='object'?x:null}
function keep(state,dirty){if(!uid)return false;return localPut(cacheKey(),{revision,dirty,snapshot:snapshot(state),updated:Date.now()})}
// Compare JSON values, not object-key order: Postgres jsonb and browser JSON use different key order.
// This is strictly a save-recovery helper, never a merge of independent progress.
function sameState(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>sameState(x,b[i]));
 const keys=Object.keys(a);
 return keys.length===Object.keys(b).length&&keys.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&sameState(a[k],b[k]));
}
function setGame(data){game.importState(data)}
function active(){return !!uid&&['ready','syncing','offline'].includes(mode)}
function locked(){return mode==='loading'||mode==='conflict'}
function pending(){return !!uid&&(!!queued||inFlight||!!isDirty())}
function stopTimer(){if(timer){clearTimeout(timer);timer=null}}
async function auth(nextUid){
 if(nextUid===uid&&mode!=='guest'&&mode!=='error')return;
 const token=++serial;stopTimer();queued=null;
 if(!nextUid){uid=null;mode='guest';revision=0;inFlight=false;serverSnapshot=null;error='';updated='';
   // The guest's original save is still on-device; do not leave signed-in progress visible.
   try{setGame(game.guestState())}catch(e){error=e.message}
   refresh();return;
 }
 uid=nextUid;revision=0;mode='loading';error='';updated='';inFlight=false;refresh();
 const {data, error:fetchError}=await client.from('dd_cloud_kingdoms').select('state,revision,updated_at').eq('user_id',nextUid).maybeSingle();
 if(token!==serial||uid!==nextUid)return;
 if(fetchError){mode='error';error=fetchError.message;refresh();return}
 if(!data){mode='missing';refresh();return}
 revision=Number(data.revision);updated=data.updated_at||'';serverSnapshot=snapshot(data.state);
 const device=cached();
 if(device?.dirty&&device.snapshot){
   try{
     if(sameState(device.snapshot,data.state)){
       // A previous upload completed before the app was suspended, but its ack was lost.
       // Clear only the stale dirty flag; the authoritative cloud state is identical.
       setGame(data.state);keep(data.state,false);mode='ready';error='';
     }else if(Number(device.revision)===revision){
       // The server has NOT advanced. Safely resume with the normal atomic CAS RPC.
       // If another device races us, dd_cloud_update rejects stale revisions.
       setGame(device.snapshot);queued=snapshot(device.snapshot);mode='syncing';error='';
       timer=setTimeout(flush,250);
     }else{
       // Both copies changed: don't guess, merge, or overwrite. Require manual review.
       mode='conflict';error='Another device has already changed this kingdom. Your unsynced progress is still kept on this device.';
       setGame(device.snapshot);
     }
   }catch(e){mode='error';error=e.message}
 }else{
   try{setGame(data.state);keep(data.state,false);mode='ready';error=''}catch(e){mode='error';error=e.message}
 }
 refresh();
}
async function create(fresh){
 if(!uid||mode!=='missing')return;
 const content=fresh?game.freshState():game.guestState();
 const prompt=fresh?'Create a NEW cloud kingdom at starting values? Your original device save will stay backed up locally.':'IMPORT your existing device kingdom to this account? This creates your first cloud save. Your original local save stays untouched.';
 if(!confirm(prompt))return;
 mode='loading';refresh();const target=uid;
 const {data,error:saveError}=await client.rpc('dd_cloud_create',{p_state:content});
 if(target!==uid)return;
 if(saveError){mode=saveError.message?.includes('already exists')?'error':'missing';error=saveError.message;refresh();throw saveError}
 revision=Number(data)||1;setGame(content);keep(content,false);serverSnapshot=snapshot(content);mode='ready';error='';refresh();
}
function onGameSave(data){
 if(!active())return;
 const latest=snapshot(data);lastSnapshot=latest;queued=latest;
 if(!keep(latest,true)){mode='offline';error='Device storage is full or blocked; do not close this page before saving.';refresh();return}
 if(mode!=='offline')mode='syncing';refresh();stopTimer();timer=setTimeout(flush,650);
}
async function flush(){
 stopTimer();if(!uid||inFlight||!queued||!active())return;
 const whichUid=uid, token=serial;
 const sent=queued;queued=null;inFlight=true;mode='syncing';refresh();
 const {data,error:writeError}=await client.rpc('dd_cloud_update',{p_state:sent,p_expected_revision:revision});
 if(token!==serial||whichUid!==uid)return;
 inFlight=false;
 if(writeError){
   queued=queued||sent;
   if(/CLOUD_REVISION_CONFLICT/.test(writeError.message||'')){
     mode='conflict';error='The cloud version was updated elsewhere. Your device copy is safe; choose a recovery option.';
   }else{mode='offline';error=writeError.message||'Could not contact Supabase';}
   // IMPORTANT: the newest pending state already resides in account-scoped device cache.
   refresh();return;
 }
 revision=Number(data)||revision+1;updated=new Date().toISOString();serverSnapshot=snapshot(sent);
 if(queued){keep(queued,true);mode='syncing';refresh();timer=setTimeout(flush,200)}
 else{keep(sent,false);mode='ready';error='';refresh()}
}
async function retry(){
 if(!uid||!['offline','conflict'].includes(mode))return;
 const local=cached();if(!local?.dirty||!local.snapshot)throw Error('No pending device save found');
 if(mode==='conflict'){
   // Check authoritative revision again and refuse destructive overwrites.
   const {data,error:e}=await client.from('dd_cloud_kingdoms').select('revision').eq('user_id',uid).single();
   if(e)throw e;
   if(Number(data.revision)!==Number(local.revision)){error='Cloud has a different revision. Download your device backup, then load the cloud save.';refresh();return}
 }
 revision=Number(local.revision);queued=snapshot(local.snapshot);mode='syncing';error='';refresh();await flush();
}
async function loadCloud(){
 if(!uid||!['conflict','offline','error'].includes(mode))return;
 if(!confirm('Load the latest CLOUD kingdom? Your unsynced device changes will not be merged. Download a device backup first if you need them.'))return;
 const target=uid, token=serial;mode='loading';refresh();
 const {data,error:e}=await client.from('dd_cloud_kingdoms').select('state,revision,updated_at').eq('user_id',target).single();
 if(target!==uid||token!==serial)return;
 if(e){mode='error';error=e.message;refresh();return}
 revision=Number(data.revision);updated=data.updated_at||'';serverSnapshot=snapshot(data.state);queued=null;
 setGame(data.state);keep(data.state,false);mode='ready';error='';refresh();
}
function download(which){
 const content=which==='device'?(cached()?.snapshot||game.exportState()):game.exportState();
 const blob=new Blob([JSON.stringify({game:'Dino Dominion',build:'v1-build1',scope:which,exported_at:new Date().toISOString(),state:content},null,2)],{type:'application/json'});
 const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='dino-dominion-'+which+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function panelHTML(){
 let detail='';
 if(mode==='guest')detail='<p>Your game currently saves on this device. Sign in to enable account cloud saves.</p>';
 if(mode==='loading')detail='<p>Checking your Supabase kingdom. Gameplay is briefly paused.</p>';
 if(mode==='missing')detail='<p><b>No cloud kingdom exists for this account yet.</b> Import your current device progress once, or explicitly start fresh. Existing Alpha 0.9 device data will remain backed up.</p><button data-do="cloudImport">☁️ Import this device’s progress</button><button class="secondary" data-do="cloudFresh">Start a fresh cloud kingdom</button>';
 if(mode==='ready'||mode==='syncing')detail=`<p>${mode==='ready'?'Your kingdom is saved to your account.':'Changes are uploading to Supabase.'}${updated?' Last confirmed: '+safe(new Date(updated).toLocaleString()):''}</p><button class="secondary" data-do="cloudDownload">⬇️ Download kingdom backup</button>`;
 if(mode==='offline')detail=`<p><b>Not uploaded yet:</b> ${safe(error)}. Your unsynced changes are stored on this device.</p><button data-do="cloudRetry">Retry upload</button><button class="secondary" data-do="cloudDownloadDevice">Download device backup</button><button class="secondary" data-do="cloudLoad">Load cloud instead</button>`;
 if(mode==='conflict')detail=`<p><b>Cloud conflict:</b> ${safe(error)}. We will NOT overwrite another device automatically.</p><button data-do="cloudRetry">Try safe upload</button><button class="secondary" data-do="cloudDownloadDevice">Download device backup</button><button class="secondary" data-do="cloudLoad">Use latest cloud version</button>`;
 if(mode==='error')detail=`<p><b>Cloud loading error:</b> ${safe(error)}. Your original device save is not deleted.</p><button data-do="cloudReconnect">Retry connection</button><button class="secondary" data-do="cloudDownloadDevice">Download local backup</button>`;
 return `<div class="cloudPanel"><h3>☁️ Cloud Kingdom — ${safe(mode.toUpperCase())}</h3>${detail}<p class="hint">Cloud saves aren't used for competitive PvP or power rankings yet. Those will require server-validated progression in a future build.</p></div>`;
}
async function action(name){
 if(name==='cloudImport')return create(false);
 if(name==='cloudFresh')return create(true);
 if(name==='cloudRetry')return retry();
 if(name==='cloudLoad')return loadCloud();
 if(name==='cloudReconnect'){const target=uid;uid=null;return auth(target)}
 if(name==='cloudDownload')return download('cloud');
 if(name==='cloudDownloadDevice')return download('device');
}
window.DDCloud={isActive:active,isLocked:locked,hasPending:pending,onGameSave,panelHTML,action,getStatus:()=>({mode,revision,error,uid})};
refresh();
if(client&&game){
  client.auth.onAuthStateChange((event,s)=>{setTimeout(()=>auth(s?.user?.id||null),0)});
  client.auth.getSession().then(({data})=>auth(data.session?.user?.id||null)).catch(e=>{mode='error';error=e.message;refresh()});
  window.addEventListener('online',()=>{if(mode==='offline')retry().catch(()=>{})});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&queued)flush()});
}else{mode='error';error='Game or Supabase client not available';refresh()}
})();

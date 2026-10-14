/* Dino Dominion Build 5.8 — Royal Authority (verified progression preview).
   This module NEVER imports Cloud Kingdom economy values into the verified ledger.
   It only calls authenticated, server-checked Supabase RPCs. */
(()=>{'use strict';
const species=['Blazefang · T-Rex','Thornshield · Triceratops','Nightclaw · Raptor','Tidebreaker · Spinosaurus','Ironhide · Ankylosaurus','Sunwhisper · Parasaurolophus'];
const symbols=['🦖','🛡️','🐾','🌊','🪨','🌞'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v||0).toLocaleString('en-US');
let overlay, body, lastFocus, enrolled=null, rankings=[], signedIn=false, busy=false, tab='overview', error='', note='', ready=false;
function client(){return window.DDOnlineClient||null}
function template(){
 const b=document.createElement('button');b.id='dd58Launch';b.className='dd58Launch';b.type='button';
 b.innerHTML='<span>🛡️ <strong>ROYAL AUTHORITY</strong><small>Secure progression · World Power Rankings</small></span><span aria-hidden="true">›</span>';
 b.setAttribute('aria-label','Open verified Royal Authority');
 const wallet=document.querySelector('.royalWallet');wallet?.insertAdjacentElement('afterend',b);
 b.addEventListener('click',open);
 overlay=document.createElement('div');overlay.id='dd58Modal';overlay.className='dd58Overlay';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Royal Authority verified progression');
 overlay.innerHTML='<div class="dd58Screen"><header class="dd58Header"><button id="dd58Back" type="button" aria-label="Back to kingdom">‹</button><div><strong>🛡️ ROYAL AUTHORITY</strong><small>BUILD 5.8 · VERIFIED PROGRESSION</small></div><span>👑</span></header><div class="dd58Body" id="dd58Body"></div></div>';
 document.body.appendChild(overlay);body=document.getElementById('dd58Body');
 document.getElementById('dd58Back').addEventListener('click',close);
 overlay.addEventListener('click',ev=>{if(ev.target===overlay)close()});
 overlay.addEventListener('click',async ev=>{
  const button=ev.target.closest('button[data-dd58]');if(!button||busy)return;
  const act=button.dataset.dd58;
  if(act==='close'){close();return}
  if(act==='signin'){close();window.DDFullUI?.open('profile');return}
  if(act==='tab'){tab=button.dataset.tab||'overview';paint();return}
  if(act==='refresh'){await load();return}
  if(act==='enroll'){
   if(!window.confirm('Start a separate verified progression track? Your existing Cloud Kingdom save is kept, but local resources, VIP and dinosaurs are NOT transferred into verified rankings.'))return;
   await run('dd58_enroll');return;
  }
  if(act==='daily')return run('dd58_action',{p_action:'daily'});
  if(act==='train'||act==='unlock'||act==='evolve'||act==='equip')return run('dd58_action',{p_action:act,p_species:Number(button.dataset.id)});
  if(act==='build')return run('dd58_action',{p_action:'build',p_building:button.dataset.id});
 });
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!overlay.hidden)close()});
 const c=client();c?.auth?.onAuthStateChange(()=>{if(!overlay.hidden)setTimeout(load,0)});
}
function open(){if(!overlay)return;lastFocus=document.activeElement;overlay.hidden=false;document.documentElement.classList.add('dd58Open');tab='overview';error='';note='';paint();document.getElementById('dd58Back').focus({preventScroll:true});load()}
function close(){if(!overlay)return;overlay.hidden=true;document.documentElement.classList.remove('dd58Open');if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true})}
async function rpc(name,args){let c=client();if(!c)throw new Error('Supabase not connected. Keep the existing online.js and config.js.');const {data,error:e}=await c.rpc(name,args||{});if(e)throw new Error(e.message||'RPC error');return data}
async function identity(){const c=client();if(!c){signedIn=false;return false}const {data,error:e}=await c.auth.getUser();signedIn=!!data?.user&&!e;return signedIn}
async function load(){if(busy||!overlay||overlay.hidden)return;busy=true;error='';note='';paint();
 try{if(await identity()){
   enrolled=await rpc('dd58_snapshot');
   rankings=await rpc('dd58_leaderboard')||[];
  }else{enrolled=null;rankings=[]}
  ready=true;
 }catch(e){error=e.message||String(e);ready=false;enrolled=null;rankings=[]}
 finally{busy=false;paint()}
}
async function run(name,args){busy=true;error='';note='';paint();try{
  const data=await rpc(name,args);
  if(data&&typeof data==='object'&&Object.prototype.hasOwnProperty.call(data,'enrolled'))enrolled=data;
  else enrolled=await rpc('dd58_snapshot');
  rankings=await rpc('dd58_leaderboard')||[];
  note=name==='dd58_enroll'?'Verified profile created. Your Cloud Kingdom save is unchanged.':'Server confirmed the progression action.';
 }catch(e){error=e.message||String(e)}finally{busy=false;paint()}
}
function currencyBar(a){return `<div class="dd58Balance"><div>🪙 <b>${fmt(a.gold)}</b><small>Verified Gold</small></div><div>🌲 <b>${fmt(a.wood)}</b><small>Wood</small></div><div>⚒️ <b>${fmt(a.ore)}</b><small>Ore</small></div><div>✨ <b>${fmt(a.essence)}</b><small>Essence</small></div></div>`}
function dossier(data){if(!data?.enrolled)return `<section class="dd58Panel"><h2>Your verified campaign</h2><p>Join a new server-controlled progression track. Everyone starts from the same verified baseline. <strong>Your current Cloud Kingdom account and progress are not deleted or replaced.</strong></p><p class="dd58Hint">Local gems, demo VIP, and existing browser-based dinosaur upgrades cannot be counted as verified competitive power.</p><button type="button" class="dd58Primary" data-dd58="enroll" ${busy?'disabled':''}>🛡️ Start verified progression</button></section>`;
 const a=data.account||{},d=data.dinos||[],b=data.buildings||[];
 let html=`${currencyBar(a)}<section class="dd58Panel"><h2>Daily verified supplies</h2><p>Server UTC day · 300 gold · 80 wood · 50 ore · 25 essence. One claim per UTC day.</p><button class="dd58Primary" type="button" data-dd58="daily" ${busy?'disabled':''}>🎁 Claim daily supplies</button><p class="dd58Hint">Last claimed: ${esc(a.last_daily||'Never')}</p></section>`;
 html+=`<section class="dd58Panel"><h2>Server-controlled dinosaurs</h2><p class="dd58Hint">These values are separate from your current local collection. All upgrades are checked and paid for by Supabase.</p>`;
 for(const v of d){const id=Number(v.species_id),lv=Number(v.level)||1,star=Number(v.stars)||1,gear=Number(v.gear)||0;
  html+=`<div class="dd58Creature"><div class="dd58CreatureHead"><span>${symbols[id]||'🦖'}</span><div><strong>${esc(species[id]||'Dinosaur')}</strong><small>${v.unlocked?`Level ${lv} · ${star}★ · Gear ${gear}`:'Locked · Unlock for 850 gold and 100 essence'}</small></div></div><div class="dd58Actions">${!v.unlocked?`<button data-dd58="unlock" data-id="${id}" ${busy?'disabled':''}>Unlock</button>`:`<button data-dd58="train" data-id="${id}" ${busy||lv>=50?'disabled':''}>Train · ${65+lv*35} 🪙</button><button data-dd58="evolve" data-id="${id}" ${busy||star>=5?'disabled':''}>Evolve · ${star*45} ✨</button><button data-dd58="equip" data-id="${id}" ${busy||gear>=10?'disabled':''}>Gear · ${45+gear*20} ⚒️</button>`}</div></div>`;
 }
 html+='</section><section class="dd58Panel"><h2>Verified kingdom buildings</h2><p class="dd58Hint">Training economy preview; your existing Base building levels are not changed.</p>';
 for(const v of b){const lv=Number(v.level)||1;html+=`<div class="dd58Building"><strong>${esc(v.building)} · Level ${lv}</strong><button data-dd58="build" data-id="${esc(v.building)}" ${busy||lv>=20?'disabled':''}>Upgrade · ${150+lv*100} 🪙 + ${35+lv*25} 🌲</button></div>`}
 html+='</section>';return html;
}
function ladder(){let out='<section class="dd58Panel"><h2>🌍 Worldwide Verified Power</h2><p class="dd58Hint">Power is calculated by the database from server-approved dinosaur and building levels. Only players who enroll appear here; this is not the old unverified Cloud Kingdom ranking.</p><button data-dd58="refresh" type="button" class="dd58Secondary">↻ Refresh</button>';
 if(!rankings.length)out+='<p>No verified commanders yet.</p>';
 else for(const r of rankings.slice(0,100))out+=`<div class="dd58Rank"><span class="dd58Number">${Number(r.rank)<=3?['🥇','🥈','🥉'][Number(r.rank)-1]:'#'+Number(r.rank)}</span><span class="dd58Player"><strong>${esc(r.avatar||'🦖')} ${esc(r.commander_name||'Commander')}</strong><small>Commander Level ${Number(r.commander_level)||1}</small></span><b>${fmt(r.power)} ⚡</b></div>`;
 return out+'</section>';
}
function guide(){return `<section class="dd58Panel"><h2>🛡️ Verified progression rules</h2><p>Royal Authority uses server-controlled starting values, resources, daily rewards, dinosaur upgrades, and building levels. Each action is validated and logged in the database.</p><p><b>Existing saves stay yours.</b> Cloud Kingdom and the demo Royal Economy remain separate. No browser-uploaded gold, dinosaur power, VIP status, or demo purchase can enter this verified ladder.</p><p><b>Not connected to online battle yet.</b> Existing online duels and alliance wars retain their current rules. The verified progression system is a foundation for future integrated PvP and real payment entitlements.</p><p><b>No real money.</b> There is no payment processing, paid premium currency, or real-money VIP in 5.8.</p><p><b>Release status.</b> The migration must be run by the developer and tested against the actual Supabase project before this can be considered live or secure end-to-end.</p></section>`}
function paint(){if(!body||overlay.hidden)return;
 let out='<div class="dd58Warning">⚠️ Build 5.8 foundation · Verified progress is <b>separate</b> from the normal game for now.</div>';
 if(error)out+=`<div class="dd58Error" role="alert">${esc(error)}${/Could not find|schema cache|function/i.test(error)?'<p>Run <b>migration_v1_build58.sql</b> in Supabase SQL Editor, then refresh the page.</p>':''}</div>`;
 if(note)out+=`<div class="dd58Notice" role="status">${esc(note)}</div>`;
 if(!client()){out+='<section class="dd58Panel"><h2>Supabase is offline</h2><p>Connect your existing online.js and config.js to use Royal Authority. Your local save is safe.</p></section>';body.innerHTML=out;return}
 if(busy&&!ready){out+='<p class="dd58Hint">Contacting Supabase…</p>';body.innerHTML=out;return}
 if(!signedIn){out+='<section class="dd58Panel"><h2>Sign in to continue</h2><p>Royal Authority requires the same Supabase account as Alliance and Royal Mail.</p><button data-dd58="signin" class="dd58Primary">👤 Open Commander Login</button></section>';body.innerHTML=out;return}
 out+=`<nav class="dd58Tabs" aria-label="Royal Authority sections"><button data-dd58="tab" data-tab="overview" class="${tab==='overview'?'selected':''}">Kingdom</button><button data-dd58="tab" data-tab="rankings" class="${tab==='rankings'?'selected':''}">🌍 Rankings</button><button data-dd58="tab" data-tab="guide" class="${tab==='guide'?'selected':''}">Rules</button></nav>`;
 out+=tab==='overview'?dossier(enrolled):tab==='rankings'?ladder():guide();if(busy)out+='<p class="dd58Hint" role="status">Saving through Supabase…</p>';body.innerHTML=out;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',template,{once:true});else template();
window.DDRoyalAuthority={open,close};
})();

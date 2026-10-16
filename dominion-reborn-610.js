/* Dino Dominion 6.10 — Dominion Reborn: an immersive, read-only command deck.
 * It connects existing game modules. No new game state, server writes, economy,
 * achievements, combat outcomes, or mandatory animations.
 */
(()=>{'use strict';
const VERSION='6.10.1-beta-bond-route';
const $=id=>document.getElementById(id);
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PLACES=[
 {id:'castle',icon:'🏰',tag:'WALK THE CITADEL',name:'Living Castle',desc:'Step inside your stronghold'},
 {id:'council',icon:'♛',tag:'TRUST & LEGACY',name:'Royal Council',desc:'Meet your signature companion'},
 {id:'bond',icon:'♥',tag:'THE LIVING BOND',name:'Companion Sanctuary',desc:'Earn moments of trust together'},
 {id:'war',icon:'⚔️',tag:'ALLIANCE COMMAND',name:'War Council',desc:'Plan around live territories'},
 {id:'valley',icon:'🧭',tag:'THE WILD FRONTIER',name:'Mossveil Valley',desc:'Follow tracks and discoveries'},
 {id:'chat',icon:'✉️',tag:'ACROSS KINGDOMS',name:'Royal Messenger',desc:'Speak across seven languages'},
 {id:'warfront',icon:'🛡️',tag:'SERVER-VERIFIED',name:'Warfront',desc:'View verified alliance battles'}
];
const SETTINGS='dd610:still';
let root=null,visible=false,formerFocus=null,previousBodyScroll=0,interval=null,still=false,phase='day';
const readStill=()=>{try{return localStorage.getItem(SETTINGS)==='1'}catch{return false}};
const writeStill=v=>{try{localStorage.setItem(SETTINGS,v?'1':'0')}catch{}};
function currentPhase(){const h=new Date().getHours();return h>=5&&h<11?'dawn':h>=11&&h<17?'day':h>=17&&h<21?'dusk':'night'}
const phaseInfo={
 dawn:{symbol:'☀',title:'Dawn over the citadel',tag:'THE KINGDOM AWAKENS'},
 day:{symbol:'✦',title:'The kingdom is stirring',tag:'UNDER THE HIGH SUN'},
 dusk:{symbol:'☾',title:'Twilight on the frontier',tag:'THE EVENING WATCH'},
 night:{symbol:'☾',title:'Lanterns in the darkness',tag:'THE NIGHT WATCH'}
};
function snapshot(){try{return window.DDGameCloudBridge?.exportState?.()||null}catch{return null}}
function companion(){const creatures=snapshot()?.creatures;if(!Array.isArray(creatures)||!creatures.length)return 'No companion hatched yet';const c=[...creatures].sort((a,b)=>Number(b?.bond||0)-Number(a?.bond||0))[0];return `${c?.name||'Unnamed companion'} · Bond ${Math.max(0,Math.min(10,Number(c?.bond)||0))}/10`}
function cloud(){const m=window.DDCloud?.getStatus?.().mode||'guest';const status={ready:'Cloud ready',syncing:'Syncing',offline:'Offline · device changes',conflict:'Save conflict · attention needed',loading:'Checking cloud',missing:'No kingdom yet',guest:'Device only',error:'Cloud unavailable'};return status[m]||'Unknown'}
function stats(){const power=$('powerTop')?.textContent?.trim()||'—',lands=$('landsTop')?.textContent?.trim()||'—';return {power,lands,cloud:cloud(),companion:companion()}}
function skyMarkup(){return `<div class="dd610Sky" aria-hidden="true"><div class="dd610Glow"></div><div class="dd610Moon"></div><div class="dd610Cloud dd610CloudA"></div><div class="dd610Cloud dd610CloudB"></div><div class="dd610Ridge dd610RidgeFar"></div><div class="dd610Ridge dd610RidgeNear"></div><div class="dd610Fortress"><i class="dd610Tower left"></i><i class="dd610Tower right"></i><i class="dd610Keep"></i><i class="dd610Gate"></i><i class="dd610Flag"></i></div><div class="dd610Fireflies"><i></i><i></i><i></i><i></i><i></i></div></div>`}
function build(){if(root)return;
 root=document.createElement('section');root.id='dd610Deck';root.className='dd610Deck';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Dominion command deck');
 root.innerHTML=`<div class="dd610Frame"><header class="dd610Header"><div class="dd610Heading"><small>BUILD 6.10 · DOMINION REBORN</small><b>✦ The Dominion Deck</b></div><button type="button" data-dd610="close" class="dd610Exit" aria-label="Exit Dominion Deck">✕ Exit</button></header><div class="dd610Scroll"><section class="dd610Vista">${skyMarkup()}<div class="dd610VistaText"><span id="dd610Phase" class="dd610Kicker">THE KINGDOM AWAKENS</span><h2 id="dd610SceneTitle">A kingdom worth returning to.</h2><p>Choose your next journey. Every gateway leads to the world you already built.</p></div></section><section class="dd610Data" aria-label="Your current kingdom"><div><small>ROYAL POWER</small><strong id="dd610Power">—</strong></div><div><small>LANDS</small><strong id="dd610Lands">—</strong></div><div><small>CLOUD KINGDOM</small><strong id="dd610Cloud">Checking…</strong></div></section><div class="dd610SubHead"><div><small>YOUR REALM</small><h3>Where will you go?</h3></div><button type="button" data-dd610="motion" id="dd610Motion" aria-pressed="false">✦ Subtle motion</button></div><nav class="dd610Routes" aria-label="Kingdom destinations">${PLACES.map(x=>`<button type="button" class="dd610Route dd610Route-${x.id}" data-dd610="travel" data-place="${x.id}"><span class="dd610RouteIcon" aria-hidden="true">${x.icon}</span><span class="dd610RouteText"><small>${x.tag}</small><b>${x.name}</b><em>${x.desc}</em></span><span class="dd610RouteArrow" aria-hidden="true">↗</span></button>`).join('')}</nav><section class="dd610Companion"><span aria-hidden="true">🦖</span><div><small>YOUR MOST BONDED DINOSAUR</small><b id="dd610Companion">Checking your companions…</b><p>Trust is earned in the existing Companion system, not purchased here.</p></div></section><p class="dd610Disclaimer">This is a visual and navigation upgrade. Existing PvP rules, cloud saves, resource balances and Council selections are unchanged. The lighting reflects your device's local time, not real-world weather.</p><div class="dd610Footer">DINO DOMINION · THE WORLD IS YOURS TO EXPLORE</div></div></div>`;
 document.body.appendChild(root);root.addEventListener('click',click);
 document.addEventListener('keydown',e=>{if(!visible)return;if(e.key==='Escape'){e.preventDefault();close()}else if(e.key==='Tab')trap(e)});
}
function trap(e){const nodes=[...root.querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length>0);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault()}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault()}}
function update(){if(!visible||!root)return;phase=currentPhase();root.dataset.time=phase;const info=phaseInfo[phase];$('dd610Phase').textContent=info.tag;$('dd610SceneTitle').textContent=info.title;const st=stats();$('dd610Power').textContent=st.power;$('dd610Lands').textContent=st.lands;$('dd610Cloud').textContent=st.cloud;$('dd610Companion').textContent=st.companion;root.classList.toggle('dd610Still',still);$('dd610Motion').textContent=still?'◎ Still mode':'✦ Subtle motion';$('dd610Motion').setAttribute('aria-pressed',String(still));}
function open(){build();if(visible)return;visible=true;formerFocus=document.activeElement;previousBodyScroll=window.scrollY||0;still=readStill();root.hidden=false;document.body.classList.add('dd610Open');root.querySelector('.dd610Scroll').scrollTop=0;update();interval=setInterval(update,15000);root.querySelector('.dd610Exit')?.focus({preventScroll:true})}
function close(){if(!visible)return;visible=false;clearInterval(interval);interval=null;root.hidden=true;document.body.classList.remove('dd610Open');if(Math.abs((window.scrollY||0)-previousBodyScroll)>5)window.scrollTo(0,previousBodyScroll);if(formerFocus?.isConnected)formerFocus.focus({preventScroll:true})}
function travel(place){const actions={
 castle:()=>window.DD60?.open?.(),council:()=>window.DD67?.open?.(),bond:()=>window.DD611?.open?.(),war:()=>window.DD68?.open?.(),valley:()=>window.DD69?.open?.(),chat:()=>window.DD517?.open?.(),warfront:()=>window.DDFullUI?.open?.('war')
 };const action=actions[place];if(!action)return;close();try{action()}catch(e){console.warn('Dominion route unavailable',e)}}
function click(e){const b=e.target.closest('[data-dd610]');if(!b)return;const cmd=b.dataset.dd610;if(cmd==='close')return close();if(cmd==='travel')return travel(b.dataset.place);if(cmd==='motion'){still=!still;writeStill(still);update()}}
function init(){const btn=$('dd610Launch');if(!btn)return;btn.addEventListener('click',open);window.DD610={version:VERSION,open,close,debug:()=>({visible,phase,still,cloud:cloud(),companion:companion(),power:$('dd610Power')?.textContent||''})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

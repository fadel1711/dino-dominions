/* Dino Dominion 6.8 — Alliance Warfare command room beta.
 * Reuses existing server-verified war territories and officer-only dd519 notices.
 * This is NOT an authoritative new battle engine; existing Warfront RPC handles battles.
 */
(()=>{'use strict';
const VERSION='6.8.0-beta',api=()=>window.DDOnlineClient;
const $=id=>document.getElementById(id),safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const icons=['🌿','💎','🌋','🌲','🏛️','🐊','🌾','❄️','🏔️'];
const fallback=['Verdant March','Crystal Ridge','Ember Crater','Ancient Woods','Kingsfall','Drowned Marsh','Golden Plains','Frosthold','The Summit'];
let root=null,opened=false,serial=0,focus=null,uid='',allianceId='',rank=0,allianceName='',zones=[],posts=[],reports=[],busy=false,ready=false,err='',info='',previousFocus=null;
function entry(){return '<section class="dd68Entry"><div class="dd68Emblem">⚔️</div><div><small>BUILD 6.8 · MULTIPLAYER WARFARE</small><b>Alliance Battle Command</b><p>Live 9-territory intelligence · Officer war orders · Verified Warfront</p></div><button type="button" data-dd68-open="1">Command ↗</button></section>'}
function setup(){if(root)return;root=document.createElement('section');root.id='dd68Layer';root.hidden=true;root.className='dd68Overlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Alliance Battle Command');root.innerHTML='<div class="dd68Shell"><header class="dd68Header"><div><small>THE WAR COUNCIL · BUILD 6.8</small><h2>⚔️ Alliance Command</h2></div><button data-dd68="exit" type="button" class="dd68Close">✕ Exit</button></header><div class="dd68Body" id="dd68Body"></div></div>';document.body.appendChild(root);root.addEventListener('click',click);root.addEventListener('submit',submit);document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.preventDefault();close()}})}
function state(t){info=t;render()}
function selected(){return zones.find(t=>Number(t.id)===Number(focus))||null}
function statusOf(t){if(t.owner_alliance_id===allianceId&&allianceId)return 'ours';return t.owner_alliance_id?'rival':'neutral'}
function render(){if(!root||!opened)return;const el=$('dd68Body');if(!el)return;const mine=zones.filter(x=>statusOf(x)==='ours').length;
const source=ready?'Live server records':'Unavailable / loading';
let html=`<div class="dd68Hero"><div class="dd68Kicker">${allianceId?'🛡️ '+safe(allianceName):'🗺️ Sign in and join an alliance'}</div><h3>Lead with intelligence. Fight through the verified Warfront.</h3><p>Territories and battle reports below come from Supabase. These orders never change combat power or grant rewards.</p><div class="dd68Stats"><span><b>${mine}</b> Held</span><span><b>${zones.length||'—'}/9</b> Live territories</span><span><b>${rank?'R'+rank:'—'}</b> Your rank</span></div></div>
<div class="dd68Bar"><b>🌐 ${safe(source)}</b><button data-dd68="refresh" type="button" ${busy?'disabled':''}>↻ Refresh</button></div>`;
if(err)html+=`<p role="alert" class="dd68Warning">${safe(err)}</p>`;
if(info)html+=`<p role="status" class="dd68Info">${safe(info)}</p>`;
if(!allianceId){html+='<p class="dd68Hint">An alliance membership is required to open its command room.</p>';el.innerHTML=html;return;}
html+='<h3 class="dd68Section">I · Shared battlefield</h3><div class="dd68Grid">';
for(const t of zones){const which=statusOf(t),id=Number(t.id);html+=`<button type="button" data-dd68="target" data-id="${id}" class="dd68Tile ${which} ${focus===id?'selected':''}" aria-pressed="${focus===id}"><span>${icons[id-1]||'🏰'}</span><b>${safe(t.name||fallback[id-1]||'Territory')}</b><small>${which==='ours'?'Our banner':which==='rival'?'Rival held':'Neutral guards'}</small></button>`;}
html+='</div>';
const goal=selected();if(goal){let status=statusOf(goal);html+=`<section class="dd68Target"><small>SELECTED TERRITORY · #${Number(goal.id)}</small><h3>${icons[Number(goal.id)-1]||'⚔️'} ${safe(goal.name)}</h3><p>${status==='ours'?'Hold this ground and watch incoming attacks.':status==='rival'?'An enemy alliance currently controls this province.':'No alliance controls this province yet.'}</p><button data-dd68="warfront" type="button">⚔️ Open verified Warfront</button></section>`;}
html+='<h3 class="dd68Section">II · Officer battle orders</h3><p class="dd68Hint">Officers (R4/R5) can publish real alliance-only war orders to the existing War Room. R1–R3 members can read, but not publish.</p>';
if(rank>=4&&ready){html+=`<form id="dd68Order" class="dd68Order"><label for="dd68Target">Target territory</label><select id="dd68Target" required>${zones.map(t=>`<option value="${Number(t.id)}" ${Number(t.id)===focus?'selected':''}>#${Number(t.id)} · ${safe(t.name)}</option>`).join('')}</select><label for="dd68Briefing">Command briefing (6–220 characters)</label><textarea id="dd68Briefing" minlength="6" maxlength="220" required rows="3" placeholder="Rally at the frontier. Scout the enemy and coordinate your squads."></textarea><button type="submit" ${busy?'disabled':''}>📣 Publish alliance war order</button></form>`;}
else html+='<p class="dd68Hint">'+(rank<4?'📜 Officers publish; your role can read and follow the battle plan.':'Live war data must load before publishing.')+'</p>';
html+='<div class="dd68Briefings">';
for(const p of posts.slice(0,12)){html+=`<article><small>${p.pinned?'📌 Pinned · ':''}${safe(new Date(p.created_at).toLocaleString())}</small><p>${safe(p.body)}</p></article>`;}
html+=posts.length?'':'<p class="dd68Hint">No war orders posted yet.</p>';html+='</div>';
html+='<h3 class="dd68Section">III · Verified battle dispatches</h3>';
if(reports.length){for(const b of reports.slice(0,6)){const territory=zones.find(t=>Number(t.id)===Number(b.territory_id));html+=`<div class="dd68Report"><b>${b.captured?'🏆 Captured':'🛡️ Attack recorded'} · ${safe(territory?.name||'Territory #'+b.territory_id)}</b><small>${safe(new Date(b.created_at).toLocaleString())}</small></div>`;}}else html+='<p class="dd68Hint">No recent verified battles visible.</p>';
html+='<p class="dd68Hint dd68Foot">6.8 beta: R4/R5 orders use the current War Room security policies. Participation opt-in, timed campaigns, match rewards and new PvP power are intentionally deferred until approved server-side systems exist.</p>';
el.innerHTML=html;}
async function fetchAll(){const ticket=++serial,client=api();busy=true;err='';info='';render();
 if(!client){busy=false;ready=false;err='Online connection unavailable.';render();return}
 try{const {data:session,error:authError}=await client.auth.getSession();if(ticket!==serial||!opened)return;
 if(authError||!session?.session?.user)throw Error('Sign in to Dino Dominion to join the War Council.');
 uid=session.session.user.id;
 const {data:member,error:memberErr}=await client.from('alliance_members').select('alliance_id,rank').eq('user_id',uid).maybeSingle();if(ticket!==serial||!opened)return;
 if(memberErr)throw Error('Alliance membership could not be verified.');
 allianceId=member?.alliance_id||'';rank=Number(member?.rank)||0;
 if(!allianceId){zones=[];posts=[];reports=[];ready=false;allianceName='';busy=false;render();return}
 const [a,z,n,h]=await Promise.all([
 client.from('alliances').select('name').eq('id',allianceId).maybeSingle(),
 client.from('dd_war_territories').select('id,name,owner_alliance_id,victories').order('id').limit(9),
 client.from('dd519_alliance_posts').select('id,kind,body,pinned,created_at').eq('alliance_id',allianceId).eq('kind','war').order('created_at',{ascending:false}).limit(12),
 client.from('dd_war_battles').select('territory_id,captured,created_at').order('created_at',{ascending:false}).limit(10)
 ]);if(ticket!==serial||!opened)return;
 if(a.error)throw Error('Alliance identity unavailable.');if(z.error||!Array.isArray(z.data)||z.data.length!==9)throw Error('Shared Warfront is not ready. No attack or publishing is available here.');if(n.error)throw Error('War Room cannot be loaded.');
 allianceName=a.data?.name||'Your alliance';zones=z.data;posts=n.data||[];reports=h.error?[]:h.data||[];ready=true;
 if(!selected())focus=Number(zones[0].id);err=h.error?'Recent battle reports unavailable; territory map remains live.':'';
 }catch(e){if(ticket!==serial||!opened)return;ready=false;err=String(e.message||'Server unavailable').slice(0,220)}finally{if(ticket===serial&&opened){busy=false;render();}}
}
async function submit(e){if(e.target?.id!=='dd68Order')return;e.preventDefault();if(busy||!ready||rank<4||!allianceId||!uid)return;
 const tid=Number($('dd68Target')?.value),text=$('dd68Briefing')?.value.trim()||'';
 if(!zones.some(t=>Number(t.id)===tid)||text.length<6||text.length>220)return state('Select a territory and write 6–220 characters.');
 if(!window.confirm('Publish this war order for your whole alliance?'))return;
 busy=true;render();const was=uid,alliance=allianceId;const target=zones.find(t=>Number(t.id)===tid);
 const body=`⚔️ WAR ORDER #${tid} · ${target.name}\n${text}`;
 try{const {error}=await api().from('dd519_alliance_posts').insert({alliance_id:alliance,author_id:was,kind:'war',body,pinned:false});if(error)throw error;if(!opened||uid!==was)return;await fetchAll();state('War order published to your alliance War Room.');}
 catch(ex){if(opened&&uid===was){busy=false;state('Order not published: '+String(ex.message||'Check officer permissions').slice(0,160));}}
}
function click(e){const b=e.target.closest('[data-dd68]');if(!b)return;const a=b.dataset.dd68;if(a==='exit')return close();if(a==='refresh')return void fetchAll();if(a==='target'){focus=Number(b.dataset.id);render();return}if(a==='warfront'){close();window.DDFullUI?.open?.('war');return}}
function open(){setup();if(opened)return;previousFocus=document.activeElement;opened=true;focus=null;uid='';allianceId='';rank=0;zones=[];posts=[];reports=[];ready=false;err='';info='';root.hidden=false;document.body.classList.add('dd68Open');root.querySelector('.dd68Body').scrollTop=0;root.querySelector('.dd68Close')?.focus({preventScroll:true});void fetchAll()}
function close(){if(!opened)return;opened=false;serial++;root.hidden=true;document.body.classList.remove('dd68Open');if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})}
function init(){document.addEventListener('click',e=>{if(e.target.closest('[data-dd68-open]')){e.preventDefault();open()}});window.DD68={version:VERSION,entry,open,close,debug:()=>({opened,uid,allianceId,rank,ready,zoneCount:zones.length,posts:posts.length,err})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

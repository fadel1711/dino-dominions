/* Dino Dominion 6.0 — Age of Living Kingdoms (interactive castle preview)
 * Additive UI atop existing Build 5.19 THREE castle engine. Read-only to game state.
 * No database change, new external service, reward creation, or vote collection.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const labels={citadel:['🏰','Royal Citadel','Your throne and the heart of your dominion.','base'],hatchery:['🥚','Royal Hatchery','Your home for new dinosaur eggs.','eggs'],forge:['⚒️','Blacksmith Forge','Strengthen your dinosaur armory and equipment.','base'],academy:['📜','War Academy','Prepare your kingdom and research upgrades.','base'],pasture:['🦖','Dinosaur Grounds','See the dinosaurs you have raised.','dinos']};
const EVENT_CHOICES=[['hunt','🦖','The Great Hunt','Wild dinosaur encounters and expedition rewards'],['festival','🥚','Hatchery Festival','Breeding and egg-themed festivities'],['treasure','🏛️','Lost Kingdom','Explore lost ruins and earn treasures']];
let open=false,mode='kingdom',focus='citadel',lastFocus=null,lastScroll=0,infoInterval=0,councilOpen=false;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const read=()=>{try{return window.DDGameCloudBridge?.exportState?.()||{}}catch(_){return {}}};
const getDinos=()=>{try{return window.DD60Bridge?.getRoster?.()||[]}catch(_){return []}};
const lvl=(n)=>Math.min(999,Math.max(1,Math.floor(Number(n)||1)));
function present(){return !!(window.DD60Bridge && $('hero') && $('roamHUD'));}
function stat(s){const ds=getDinos().filter(d=>d.unlocked);return {home:s?.kingdomDesign?.name||'Royal Citadel',citadel:lvl(s.base),lands:Array.isArray(s.lands)?s.lands.length:1,roster:ds.length,ready:present(),buildings:s.buildings||{},dinosaurs:ds};}
function make(){if($('dd60Layer'))return;
 const root=document.createElement('div');root.id='dd60Layer';root.className='dd60Layer';root.hidden=true;
 root.innerHTML=`<div class="dd60Head"><div class="dd60Brand"><span class="dd60Seal" aria-hidden="true">♛</span><div><small>BUILD 6.0 · LIVING KINGDOM</small><strong id="dd60Name">Royal Citadel</strong></div></div><button type="button" class="dd60Close" id="dd60Close" aria-label="Close Living Kingdom">✕ <span>Exit</span></button></div>
 <div class="dd60Modes" role="group" aria-label="Kingdom viewing mode"><button id="dd60Kingdom" type="button" aria-pressed="true">🏰 Kingdom View</button><button id="dd60Walk" type="button" aria-pressed="false">🚶 Walk Around</button></div>
 <section class="dd60Panel" id="dd60Panel" aria-label="Kingdom buildings"><div class="dd60PanelGrip"></div><div class="dd60Summary"><div><span>YOUR KINGDOM</span><strong id="dd60Title">Welcome home, Commander</strong></div><span id="dd60Weather" aria-hidden="true">✦ Peaceful grounds</span></div><div class="dd60Stats"><div><strong id="dd60Base">1</strong><span>Citadel</span></div><div><strong id="dd60Land">1</strong><span>Regions</span></div><div><strong id="dd60Dinos">3</strong><span>Dinosaurs</span></div></div><div class="dd60SectionLabel">EXPLORE YOUR KINGDOM <small>Tap any destination</small></div><div class="dd60Places" id="dd60Places"></div><div class="dd60Site" id="dd60Site"></div><button class="dd60CouncilBtn" id="dd60Council" type="button"><span>🗳️</span><span><strong>Kingdom Council</strong><small>Preview upcoming community event voting</small></span><span aria-hidden="true">›</span></button><p class="dd60Footnote">Your existing kingdom progress is shown here. Exploring does not spend resources.</p></section>
 <div class="dd60WalkTips" id="dd60WalkTips" hidden><span>👣 Walk with the arrows below · Swipe to look around</span><button id="dd60WalkOverview" type="button">🏰 Kingdom View</button></div>
 <section id="dd60CouncilModal" class="dd60CouncilModal" hidden role="dialog" aria-modal="true" aria-labelledby="dd60CouncilTitle"><div class="dd60CouncilInner"><div class="dd60CouncilTop"><small>COMING IN A LATER BUILD</small><button type="button" id="dd60CouncilDismiss" aria-label="Close council preview">✕</button></div><h2 id="dd60CouncilTitle">🗳️ Kingdom Council</h2><p>Preview how players could choose a weekly event. Voting is not live yet.</p><fieldset id="dd60Options"><legend>Which event sounds most fun?</legend>${EVENT_CHOICES.map(([key,icon,name,desc],i)=>`<label><input type="radio" name="dd60Event" value="${key}" ${i===0?'checked':''}><span><b>${icon} ${name}</b><small>${desc}</small></span></label>`).join('')}</fieldset><button id="dd60PreviewVote" type="button" class="dd60Primary">Preview my choice</button><div id="dd60VoteStatus" role="status" aria-live="polite"></div><small class="dd60CouncilDisclaimer">Demo only · No vote is recorded or sent to a server.</small></div></section>`;
 document.body.appendChild(root);
 root.querySelector('#dd60Close').addEventListener('click',()=>close());
 root.querySelector('#dd60Kingdom').addEventListener('click',()=>setMode('kingdom'));
 root.querySelector('#dd60Walk').addEventListener('click',()=>setMode('walk'));
 root.querySelector('#dd60WalkOverview').addEventListener('click',()=>setMode('kingdom'));
 root.querySelector('#dd60Places').addEventListener('click',e=>{let item=e.target.closest('button[data-site]');if(item)choose(item.dataset.site)});
 root.querySelector('#dd60Site').addEventListener('click',e=>{let item=e.target.closest('button[data-open-tab]');if(item)go(item.dataset.openTab)});
 root.querySelector('#dd60Council').addEventListener('click',()=>showCouncil(true));
 root.querySelector('#dd60CouncilDismiss').addEventListener('click',()=>showCouncil(false));
 root.querySelector('#dd60PreviewVote').addEventListener('click',()=>{const key=root.querySelector('input[name="dd60Event"]:checked')?.value;const name=EVENT_CHOICES.find(a=>a[0]===key)?.[2];$('dd60VoteStatus').textContent=name?`You selected ${name} — demo only. A real community vote will require a secure backend.`:'';});
 root.querySelector('#dd60CouncilModal').addEventListener('click',e=>{if(e.target===e.currentTarget)showCouncil(false)});
 document.addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape'){e.preventDefault();councilOpen?showCouncil(false):close()}});
 const launcher=document.createElement('button');launcher.id='dd60Launcher';launcher.type='button';launcher.className='dd60Launcher';launcher.textContent='🏰 Enter Living Kingdom';launcher.addEventListener('click',()=>start());
 $('hero')?.appendChild(launcher);
 const fallback=document.createElement('button');fallback.id='dd60BaseLauncher';fallback.type='button';fallback.className='dd60BaseLauncher';fallback.textContent='🏰 Living Kingdom · Explore';fallback.addEventListener('click',()=>start());
 $('content')?.before(fallback);
 }
function choose(id){if(!labels[id])return;focus=id;const s=stat(read());const k=labels[id];const level=id==='citadel'?s.citadel:id==='pasture'?null:lvl(s.buildings[id]);$('dd60Site').innerHTML=`<div class="dd60SiteIcon" aria-hidden="true">${k[0]}</div><div><strong>${k[1]}${level?' · Lv. '+level:''}</strong><p>${k[2]}</p></div><button type="button" data-open-tab="${k[3]}">Visit ↗</button>`;
 $('dd60Places').querySelectorAll('button[data-site]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.site===id));b.classList.toggle('chosen',b.dataset.site===id)});
}
function refresh(){if(!open)return;const s=stat(read());$('dd60Name').textContent=s.home.slice(0,30);$('dd60Base').textContent=s.citadel;$('dd60Land').textContent=s.lands;$('dd60Dinos').textContent=s.roster;$('dd60Weather').textContent=window.DD60Bridge?.canWalk?.()?(mode==='walk'?'Live 3D exploration':'✦ Animated kingdom'):'3D unavailable · reconnect';
 $('dd60Places').innerHTML=Object.keys(labels).map(k=>`<button type="button" data-site="${k}" aria-pressed="${k===focus}" class="${k===focus?'chosen':''}"><span aria-hidden="true">${labels[k][0]}</span><small>${labels[k][1].replace('Royal ','').replace('Blacksmith ','')}</small></button>`).join('');choose(focus);
}
function showCouncil(yes){councilOpen=!!yes;$('dd60CouncilModal').hidden=!councilOpen;if(councilOpen){$('dd60VoteStatus').textContent='';$('dd60CouncilDismiss').focus({preventScroll:true})}else $('dd60Council').focus({preventScroll:true});}
function setMode(next){if(!open||!present())return;mode=next==='walk'?'walk':'kingdom';const wantsWalk=mode==='walk';if(wantsWalk&&!window.DD60Bridge?.canWalk?.()){mode='kingdom';$('dd60Weather').textContent='3D needs a connection';return;}$('dd60Panel').hidden=wantsWalk;$('dd60WalkTips').hidden=!wantsWalk;$('dd60Kingdom').setAttribute('aria-pressed',String(!wantsWalk));$('dd60Walk').setAttribute('aria-pressed',String(wantsWalk));document.documentElement.classList.toggle('dd60Walking',wantsWalk);
 window.DD60Bridge?.setWalk?.(wantsWalk);
 requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
 refresh();
}
function start(){if(open)return;if(!present()){const x=$('toast');if(x){x.textContent='Castle 3D is loading or unavailable. Reconnect and refresh to explore.';x.classList.remove('hide');setTimeout(()=>x.classList.add('hide'),2300)}return;}
 lastFocus=document.activeElement;lastScroll=window.scrollY;
 window.DD60Bridge?.openWorld?.();open=true;mode='kingdom';councilOpen=false;make();$('dd60Layer').hidden=false;document.documentElement.classList.add('dd60Active');
 window.DD60Bridge?.setWalk?.(false);
 refresh();setMode('kingdom');$('dd60Close').focus({preventScroll:true});
 infoInterval=setInterval(()=>{if(open&&!document.hidden)refresh()},5000);
}
function close(opts={}){if(!open)return;if(councilOpen)showCouncil(false);clearInterval(infoInterval);infoInterval=0;window.DD60Bridge?.setWalk?.(false);open=false;mode='kingdom';document.documentElement.classList.remove('dd60Active','dd60Walking');$('dd60Layer').hidden=true;window.dispatchEvent(new Event('resize'));if(!opts.skipScroll)window.scrollTo(0,lastScroll);if(lastFocus?.isConnected&&!opts.skipFocus)lastFocus.focus({preventScroll:true});}
function go(tab){if(!['world','base','eggs','dinos'].includes(tab))return;close({skipScroll:true,skipFocus:true});window.DD60Bridge?.openTab?.(tab);window.scrollTo(0,0);}
function boot(){make();window.DD60={open:start,close,mode:()=>mode,active:()=>open,version:'6.0.0-preview'};
 document.addEventListener('click',e=>{const n=e.target.closest?.('#dd60Launcher, #dd60BaseLauncher');if(n&&!open){e.preventDefault();start()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* Dino Dominion 6.1 — Living Battles: a cinematic READ-ONLY view over existing local PvE.
 * Does not modify practice damage, rewards, battle turns, save format or server fights.
 */
(()=>{'use strict';
const VERSION='6.1.0', VIEW_KEY='dd61-view',MOTION_KEY='dd61-motion';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[k]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
let localView='wide',localMotion='on';
const stored=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch(_){return key===VIEW_KEY?localView:key===MOTION_KEY?localMotion:fallback}};
const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const motion=()=>stored(MOTION_KEY,'on')!=='off'&&!reduced();
const view=()=>stored(VIEW_KEY,'wide')==='close'?'close':'wide';
const pct=(now,max)=>Math.round(clamp(now,0,Math.max(1,max))/Math.max(1,max)*100);
function dino(unit,side,ctx){
 const type=Number.isInteger(unit?.id)?unit.id:0;
 const info=ctx?.D?.[type]||{name:'War Beast',cls:'Striker',emoji:'🦖'};
 let svg='';
 try{svg=window.DD513?.dinosaurSVG?.(type,side==='p'?'hero':'enemy',info.name,false,'61-'+side)||''}catch(_){svg=''}
 return {name:info.name,cls:info.cls,emoji:info.emoji,svg};
}
const meter=(u,enemy)=>`<div class="dd61HealthTrack ${enemy?'dd61EnemyHealth':''}"><span style="width:${pct(u.hp,u.max)}%"></span></div>`;
function site(unit,side,ctx,b){
 const human=side==='p',idx=b[side+'Target'],info=dino(unit,side,ctx),alive=Number(unit.hp)>0;
 const hp=Math.max(0,Math.round(Number(unit.hp)||0));
 return `<button type="button" data-fighter="${side}:${idx}" class="dd61Fighter dd61${human?'Ally':'Rival'} ${alive?'':'dd61Fallen'}" ${alive?'':'disabled'} aria-label="${safe(info.name)}; ${hp} health. Selected ${human?'ally':'enemy'}">
  <span class="dd61Glow"></span><span class="dd61Shadow"></span><span class="dd61Art">${info.svg||`<span class="dd61Fallback" aria-hidden="true">${safe(info.emoji)}</span>`}</span>
  <span class="dd61UnitLabel"><b>${safe(info.name)}</b><small>${safe(info.cls||'Dinosaur')} · ${hp} HP</small>${meter(unit,!human)}</span>
 </button>`;
}
function unitPills(arr,side,chosen,ctx){
 return `<div class="dd61TeamLine" role="group" aria-label="${side==='p'?'Your dinosaurs':'Rival dinosaurs'}">${arr.map((u,i)=>{
 const info=dino(u,side,ctx),hp=Math.max(0,Math.round(Number(u.hp)||0));
 return `<button type="button" class="dd61UnitPill ${i===chosen?'dd61Chosen':''}" data-fighter="${side}:${i}" ${hp?'':'disabled'} aria-label="${safe(info.name)} ${hp} health${i===chosen?', selected':''}"><span aria-hidden="true">${safe(info.emoji||'🦖')}</span><b>${safe(info.name)}</b>${meter(u,side==='e')}</button>`;
 }).join('')}</div>`;
}
const terrain=`<svg class="dd61Terrain" viewBox="0 0 800 310" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="dd61Sky" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#0d2734"/><stop offset=".44" stop-color="#48665e"/><stop offset="1" stop-color="#8f8065"/></linearGradient><linearGradient id="dd61Ground" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5a684d"/><stop offset="1" stop-color="#242d2a"/></linearGradient></defs><rect width="800" height="310" fill="url(#dd61Sky)"/><circle cx="575" cy="69" r="53" fill="#eed5a6" opacity=".22"/><path d="M0 164L76 86l94 75 76-106 120 122 87-103 97 78 120-111 130 107v162H0Z" fill="#264b4b"/><path d="M0 196L95 148 180 184 267 119 344 200 446 137 530 176 637 122 800 176v134H0Z" fill="#31504a"/><g fill="#173a33" opacity=".93"><path d="M35 213l28-111 28 111Zm49 8 35-98 35 98ZM688 208l30-91 30 91Zm59 13 26-123 28 123Z"/></g><path d="M0 236Q188 192 350 236T800 224V310H0Z" fill="url(#dd61Ground)"/><path d="M0 285 Q225 246 414 280 T800 275" fill="none" stroke="#dfc38a" stroke-opacity=".13" stroke-width="4"/></svg>`;
function practiceIntro(s,ctx){const names=(Array.isArray(s?.team)?s.team:[]).map(i=>ctx?.D?.[i]?.name).filter(Boolean);
 return `<section class="dd61Intro" aria-label="Build 6.1 Living Battles"><div class="dd61IntroSeal">⚔</div><div><div class="dd61Kicker">BUILD 6.1 · LIVING BATTLES</div><h3>Command your war beasts</h3><p>Meet your enemy in a cinematic arena. Pick a fighter, pick a target, then attack or unleash a class ability. Your existing practice rules stay the same.</p><small>Current squad: ${safe(names.join(' · ')||'Choose your dinosaurs')}</small></div></section>`;
}
function practiceStage(b,ctx){if(!b||!Array.isArray(b.p)||!Array.isArray(b.e)||!b.p.length||!b.e.length)return '';
 const ally=b.p[clamp(b.pTarget,0,b.p.length-1)]||b.p[0],enemy=b.e[clamp(b.eTarget,0,b.e.length-1)]||b.e[0];
 const moving=motion(),cinema=view()==='close';
 return `<section class="dd61Experience ${moving?'dd61Motion':'dd61NoMotion'} ${cinema?'dd61CloseView':'dd61WideView'}" id="dd61Experience" aria-label="Cinematic practice battlefield">
  <div class="dd61Toolbar"><div><span class="dd61Kicker">BUILD 6.1 · CINEMATIC ARENA</span><strong>Round ${Math.max(1,Number(b.round)||1)} <span class="dd61Turn ${b.turn==='p'?'dd61YourTurn':''}">${b.turn==='p'?'YOUR TURN':b.turn==='e'?'RIVAL TURN':'RESOLVING'}</span></strong></div><div class="dd61Toggles"><button type="button" data-dd61="camera" aria-label="Switch battlefield camera" aria-pressed="${cinema}">◈ ${cinema?'Close':'Wide'}</button><button type="button" data-dd61="motion" aria-pressed="${moving}" title="Toggle battle animation">${moving?'◉ Motion':'◌ Still'}</button></div></div>
  <div class="dd61Roster"><div><span>YOUR SQUAD</span>${unitPills(b.p,'p',b.pTarget,ctx)}</div><div><span>RIVAL SQUAD</span>${unitPills(b.e,'e',b.eTarget,ctx)}</div></div>
  <div class="dd61Arena" id="dd61Arena">${terrain}<span class="dd61Atmosphere"></span><span class="dd61Embers"></span>
  ${site(ally,'p',ctx,b)}${site(enemy,'e',ctx,b)}<span class="dd61Versus" aria-hidden="true">VS</span><span class="dd61Hit" id="dd61Hit" aria-hidden="true"></span><span class="dd61ActionCaption" id="dd61ActionCaption" role="status" aria-live="polite"></span>
  <div class="dd61ArenaCaption"><span>⚔️ Choose a dinosaur above</span><span>Then issue an order below ↓</span></div></div>
  <details class="dd61Help"><summary>How do battles work?</summary><p>Tap one of your dinosaurs to command it, then an opponent to target. <b>Attack</b> deals damage and builds energy. <b>Special</b> consumes 2 energy. Current battles are three-versus-three local practice; five-dinosaur squads are planned separately.</p></details><div class="dd61Local">LOCAL PRACTICE · Not a real-time multiplayer battle</div>
 </section>`;
}
let effectTimer=0;
function impact({side='p',special=false,dealt=null,name='',counter=false}={}){
 const arena=$('dd61Arena');if(!arena)return;
 const stage=$('dd61Experience');if(!stage)return;
 clearTimeout(effectTimer);arena.classList.remove('dd61Attack','dd61Counter','dd61Special');
 const caption=$('dd61ActionCaption'),damage=$('dd61Hit');
 if(caption)caption.textContent=counter?'Rival counterattack':special?safeText(name)+' · SPECIAL':safeText(name)+' · ATTACK';
 if(damage)damage.textContent=Number.isFinite(dealt)?'-'+Math.max(0,Math.round(dealt)):counter?'COUNTER':'';
 if(!motion()){if(caption)caption.textContent=(counter?'Enemy turn':special?'Special used':'Attack')+(Number.isFinite(dealt)?' · '+Math.round(dealt)+' damage':'');return;}
 void arena.offsetWidth;arena.classList.add(side==='e'?'dd61Counter':special?'dd61Special':'dd61Attack');
 effectTimer=setTimeout(()=>{arena.classList.remove('dd61Attack','dd61Counter','dd61Special');if(caption)caption.textContent='';if(damage)damage.textContent=''},940);
}
function safeText(v){return String(v??'').replace(/[\n\r<>]/g,'').slice(0,40)}
function action(e){const b=e.target.closest?.('[data-dd61]');if(!b)return;
 e.preventDefault();e.stopPropagation();const a=b.dataset.dd61;
 if(a==='camera'){localView=view()==='wide'?'close':'wide';try{localStorage.setItem(VIEW_KEY,localView)}catch(_){ }const stage=$('dd61Experience');if(stage){stage.classList.toggle('dd61CloseView',view()==='close');stage.classList.toggle('dd61WideView',view()==='wide');const camera=stage.querySelector('[data-dd61="camera"]');if(camera){camera.textContent='◈ '+(view()==='close'?'Close':'Wide');camera.setAttribute('aria-pressed',String(view()==='close'))}}}
 if(a==='motion'){localMotion=motion()?'off':'on';try{localStorage.setItem(MOTION_KEY,localMotion)}catch(_){ }const stage=$('dd61Experience');if(stage){stage.classList.toggle('dd61Motion',motion());stage.classList.toggle('dd61NoMotion',!motion());const control=stage.querySelector('[data-dd61="motion"]');if(control){control.textContent=motion()?'◉ Motion':'◌ Still';control.setAttribute('aria-pressed',String(motion()))}}}
}
function boot(){document.addEventListener('click',action,true);window.DD61={practiceStage,practiceIntro,impact,version:VERSION};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

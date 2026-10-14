/* Dino Dominion V1.0 Build 2 — Dinosaur Evolution & Taming.
 * Cloud Kingdom-compatible, client-side prototype progression.
 * DO NOT use these client-produced stats/drops in competitive PvP or leaderboards.
 */
(()=>{'use strict';
const TYPES=[
 {name:'Common',chance:50,icon:'⚪',hex:'#e5e5e5',bonus:0},
 {name:'Uncommon',chance:30,icon:'🩶',hex:'#a0a0a0',bonus:4},
 {name:'Legendary',chance:13,icon:'🔵',hex:'#448fff',bonus:8},
 {name:'Gold',chance:5,icon:'🟡',hex:'#f0bd49',bonus:12},
 {name:'Mythic',chance:1.5,icon:'🔴',hex:'#ed595a',bonus:16},
 {name:'Godly',chance:.5,icon:'🟣',hex:'#ac73ff',bonus:20}
];
const SPECIES=[
 {name:'Blazefang',kind:'Tyrannosaurus',cls:'Berserker',icon:'🦖',skill:'Inferno Bite',desc:'Devastating explosive attacks'},
 {name:'Thornshield',kind:'Triceratops',cls:'Guardian',icon:'🦕',skill:'Stonewall',desc:'Shields and protection'},
 {name:'Nightclaw',kind:'Raptor',cls:'Assassin',icon:'🦖',skill:'Shadow Strike',desc:'Critical strikes and poison'},
 {name:'Tidebreaker',kind:'Spinosaurus',cls:'Striker',icon:'🦕',skill:'Tidal Surge',desc:'Sustained damage and pressure'},
 {name:'Ironhide',kind:'Ankylosaurus',cls:'Guardian',icon:'🦕',skill:'Fortress Guard',desc:'Armored team defense'},
 {name:'Sunwhisper',kind:'Parasaurolophus',cls:'Support',icon:'🦕',skill:'Life Bloom',desc:'Healing and recovery'}
];
const TRAITS=['Swift','Resilient','Fierce','Keen-eyed','Steadfast','Wildborn'];
const n=(v,defaultValue=0)=>Number.isFinite(Number(v))?Number(v):defaultValue;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const random=()=>{if(globalThis.crypto?.getRandomValues){let x=new Uint32Array(1);crypto.getRandomValues(x);return x[0]/4294967296}return Math.random()};
const pick=arr=>arr[Math.floor(random()*arr.length)];
const uid=()=>globalThis.crypto?.randomUUID?.()||('r'+Date.now().toString(36)+Math.floor(random()*2**32).toString(36));

// Build 5.1: real egg-shaped vector icons rendered as SVG, with the established rarity colors.
let eggSymbolId=0;
function eggArt(t,scale='small'){
 const id='ddEggGradient'+(++eggSymbolId);const c=t?.hex||'#eeeeee';
 return `<svg class="royalEgg royalEgg--${scale}" viewBox="0 0 100 136" role="img" aria-label="${esc(t?.name||'Mystery')} egg" xmlns="http://www.w3.org/2000/svg">
 <defs><radialGradient id="${id}" cx="27%" cy="24%" r="82%"><stop offset="0" stop-color="#ffffff" stop-opacity=".84"/><stop offset=".21" stop-color="${c}"/><stop offset=".71" stop-color="${c}"/><stop offset="1" stop-color="#131c20"/></radialGradient></defs>
 <ellipse cx="50" cy="129" rx="30" ry="4.5" fill="#000" opacity=".28"/>
 <path d="M50 7 C28 7 12 49 12 83 C12 112 28 122 50 122 C72 122 88 112 88 83 C88 49 72 7 50 7Z" fill="url(#${id})" stroke="${c}" stroke-width="2.7"/>
 <path d="M23 86 L35 75 L45 87 L55 65 L70 85 L79 74" fill="none" stroke="#14232b" stroke-opacity=".30" stroke-width="2.5" stroke-linecap="round"/>
 <ellipse cx="35" cy="43" rx="9" ry="22" fill="#fff" opacity=".19" transform="rotate(22 35 43)"/>
 <path d="M31 95 L42 102 L52 98 L63 104" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.8"/>
 ${t?.name==='Godly'?'<g fill="#f7e9ff" opacity=".85"><circle cx="64" cy="38" r="2"/><circle cx="30" cy="70" r="1.7"/><path d="M51 54 l3 -7 3 7 -3 7z"/></g>':''}
 ${t?.name==='Mythic'?'<path d="M38 49 L45 61 L41 71 L55 81 L49 94" stroke="#fff1e8" stroke-opacity=".46" fill="none" stroke-width="2"/>':''}
 </svg>`;
}

function normalize(s){
 if(!s||typeof s!=='object')return;
 if(!Array.isArray(s.creatures))s.creatures=[];
 if(!s.rpg||typeof s.rpg!=='object'||Array.isArray(s.rpg))s.rpg={};
 const r=s.rpg;
 if(!r.pity||typeof r.pity!=='object')r.pity={};
 for(const k of ['gold','mythic','godly'])r.pity[k]=clamp(Math.floor(n(r.pity[k])),0,k==='gold'?39:k==='mythic'?99:249);
 if(!Number.isInteger(r.hatches)||r.hatches<0)r.hatches=0;
 if(!Number.isInteger(r.tamed)||r.tamed<0)r.tamed=0;
 if(!r.wild||typeof r.wild!=='object')r.wild=null;
 for(const c of s.creatures){
  if(!c||typeof c!=='object')continue;
  c.level=clamp(Math.floor(n(c.level,1)),1,50);
  c.stars=clamp(Math.floor(n(c.stars,1)),1,5);
  c.bond=clamp(Math.floor(n(c.bond,0)),0,10);
  c.xp=clamp(Math.floor(n(c.xp,0)),0,1000000);
  if(!TYPES.some(x=>x.name===c.rarity))c.rarity='Common';
  if(!Number.isInteger(c.species)||c.species<0||c.species>=SPECIES.length)c.species=0;
  if(typeof c.name!=='string'||!c.name)c.name=SPECIES[c.species].name;
  if(typeof c.trait!=='string')c.trait=pick(TRAITS);
 }
}
function rarityIndex(name){return Math.max(0,TYPES.findIndex(r=>r.name===name))}
function rarity(name){return TYPES[rarityIndex(name)]}
function randomRarity(weights){let x=random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){x-=weights[i];if(x<0)return i}return weights.length-1}
// Only standard egg hatches affect the three independent pity counters.
function eggRoll(r){const p=r.pity;
 let tier;
 if(p.godly>=249)tier=5;
 else if(p.mythic>=99)tier=randomRarity([1.5,.5])+4;
 else if(p.gold>=39)tier=randomRarity([5,1.5,.5])+3;
 else tier=randomRarity(TYPES.map(x=>x.chance));
 p.gold=tier>=3?0:p.gold+1;
 p.mythic=tier>=4?0:p.mythic+1;
 p.godly=tier>=5?0:p.godly+1;
 r.hatches++;
 return tier;
}
function makeCreature(species,kind,from){const t=TYPES[rarityIndex(kind)];return {id:uid(),species,name:SPECIES[species].name,rarity:t.name,color:t.hex,trait:pick(TRAITS),level:1,stars:1,bond:0,xp:0,source:from,created_at:new Date().toISOString()}}
function creaturePower(c){let t=rarity(c.rarity);return Math.round(100*(1+t.bonus/100)*(1+(n(c.level,1)-1)*.075)*(1+(n(c.stars,1)-1)*.10)*(1+n(c.bond)*.025))}
// Collection bonus affects legacy/local PvE ONLY. Never sent as competitive power.
function pveBonus(s,species){
 if(!Array.isArray(s?.creatures))return 0;
 const candidates=s.creatures.filter(c=>c?.species===species);
 if(!candidates.length)return 0;
 return Math.min(.50,Math.max(...candidates.map(c=>rarity(c.rarity).bonus/100+(n(c.level,1)-1)*.01+(n(c.stars,1)-1)*.04+n(c.bond)*.01)));
}
function activeEgg(s){let a=s.incubating;return a&&typeof a==='object'&&Number.isFinite(Number(a.end))?a:null}
function eggView(s){normalize(s);let active=activeEgg(s),p=s.rpg.pity,html=`<div class="panel rpgHero"><div class="eyebrow">🥚 THE ROYAL HATCHERY</div><h2>Discover your next legend</h2><p class="muted small">Every <b>Standard Mystery Egg</b> uses the published rarity odds. Hatch results are revealed at the end of incubation.</p><div class="rpgOdds">`;
 html+=TYPES.map(t=>`<div class="rpgOddsRow"><span class="ddEggLabel" style="color:${t.hex}">${eggArt(t,'small')} ${t.name}</span><b>${t.chance}%</b></div>`).join('')+'</div><div class="royalEggDisplay">'+TYPES.map(t=>eggArt(t,'medium')).join('')+'</div><p class="royalEggCaption">Six shell designs · one Mystery Egg pool · all odds unchanged</p></div>';
 if(active){const secs=Math.max(0,Math.ceil((Number(active.end)-Date.now())/1000));const legacy=active.kind!=='mystery';const heading=legacy?`Legacy ${esc(active.rarity||'Egg')}`:'Mystery Egg';
  html+=`<div class="panel hatchActive rpgIncubator"><div class="eyebrow">INCUBATOR · ${heading}</div><div class="hatchIcon">${eggArt(TYPES.find(t=>t.name===active.rarity)||TYPES[0],'incubator')}</div><h2>${secs?'Incubating…':'Ready to hatch!'}</h2><p class="muted">${secs?`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} remaining`:'Your dinosaur is waiting.'}</p><button class="btn alt" data-action="rpgEggClaim">${secs?'Check incubation':'✨ Hatch now'}</button></div>`;
 }else{
  html+=`<div class="panel rpgEggBuy"><div class="rpgEggGlyph">${eggArt(TYPES[5],'large')}</div><div><b>Standard Mystery Egg</b><p class="muted small">1 minute incubation · 🪙 180 gold</p><button class="btn alt" data-action="rpgEggStart">Incubate mystery egg</button></div></div>`;
 }
 html+=`<div class="panel"><h3>🎁 Bad-luck protection</h3><p class="small muted">A Gold+ is guaranteed by hatch 40, Mythic+ by hatch 100, and Godly by hatch 250. Each counter resets on its qualifying result.</p><div class="rpgPity">`;
 for(const [k,title,goal] of [['gold','Gold+',40],['mythic','Mythic+',100],['godly','Godly',250]]){
  const count=clamp(n(p[k]),0,goal-1);html+=`<div><div class="row"><span>${title}</span><b>${count}/${goal}</b></div><div class="progress"><span style="width:${count/goal*100}%"></span></div></div>`;
 }
 html+=`</div><small class="muted">${n(s.rpg.hatches)} standard eggs hatched. Pity applies only to Standard Mystery Eggs. Older, already incubating eggs keep their promised rarity.</small></div>`;
 html+=`<div class="panel"><h3>🦖 Dinosaur collection</h3><p class="small muted">${s.creatures.length} companions collected · Open <b>Dinos</b> to train, evolve and bond with individual dinosaurs.</p><div class="rpgRarityChips">${TYPES.map(t=>`<span style="border-color:${t.hex};color:${t.hex}">${eggArt(t,'small')} ${t.name}: ${s.creatures.filter(c=>c.rarity===t.name).length}</span>`).join('')}</div></div>`;
 return html;
}
let page=0;
function collectionView(s){normalize(s);let a=s.creatures,total=a.length,limit=8,pages=Math.max(1,Math.ceil(total/limit));page=clamp(page,0,pages-1);
 let html=`<div class="sectionHead"><h2>👑 Your Dino Companions</h2><span class="small muted">${total} collected</span></div><div class="panel"><p class="small muted">Each companion has its own rarity, evolution stars, bond and special skill. Bonuses currently apply in collection/PvE only; online warfare uses separate server squads.</p></div>`;
 if(!total)return html+'<div class="panel">No companions yet. Hatch a Mystery Egg or tame a wild dinosaur in Explore!</div>';
 let visible=a.slice(page*limit,(page+1)*limit);
 html+='<div class="rpgCollection">';
 visible.forEach((c,i)=>{let idx=page*limit+i,t=rarity(c.rarity),d=SPECIES[c.species]||SPECIES[0],lvl=Math.floor(n(c.level,1)),stars=Math.floor(n(c.stars,1)),bond=Math.floor(n(c.bond));let trainCost=lvl*90+90,evoCost=stars*60,bondCost=40;
  html+=`<div class="rpgCreature" style="--tier:${t.hex}"><div class="rpgCreatureTop"><div class="rpgFace">${d.icon}</div><div class="rpgCreatureTitle"><b>${esc(c.name)}</b><div style="color:${t.hex}" class="small">${t.icon} ${t.name} · ${d.cls}</div><span class="small muted">${d.kind} · ${esc(c.trait)} · ${c.source==='wild'?'Wild tamed':'Egg hatched'}</span></div><b class="rpgPower">⚡ ${creaturePower(c)}</b></div><div class="rpgCreatureStats"><span>Lv ${lvl}/50</span><span>⭐ ${stars}/5</span><span>❤️ Bond ${bond}/10</span></div><div class="small muted">✨ ${esc(d.skill)} — ${d.desc}</div><div class="rpgActions"><button data-action="rpgTrain:${idx}">Train · ${trainCost} 🪙</button><button data-action="rpgEvolve:${idx}">Evolve · ${evoCost} ✨</button><button data-action="rpgBond:${idx}">Bond · ${bondCost} 🪵</button><button data-action="rpgRename:${idx}">Rename</button></div></div>`;
 });
 html+='</div>';
 if(pages>1)html+=`<div class="panel rpgPagination"><button class="btn ghost sm" data-action="rpgPagePrev" ${page===0?'disabled':''}>← Previous</button><span>Page ${page+1}/${pages}</span><button class="btn ghost sm" data-action="rpgPageNext" ${page===pages-1?'disabled':''}>Next →</button></div>`;
 return html;
}
const WILD_WEIGHTS=[60,32,7,.8,.18,.02];
function tameChance(w){let base=[.44,.33,.20,.11,.065,.025][rarityIndex(w.rarity)];let cap=[.85,.76,.55,.36,.22,.12][rarityIndex(w.rarity)];return clamp(base+(100-clamp(n(w.hp,100),1,100))*.003+clamp(n(w.trust),0,100)*.003,0,cap)}
function wildView(s){normalize(s);const w=s.rpg.wild;
 let h='<div class="sectionHead"><h2>🌿 Royal Taming Grounds</h2><span class="small muted">Wild encounters</span></div><div class="panel rpgWild">';
 if(!w){h+=`<div class="eyebrow">SEARCH THE WILDS</div><h3>Find a wild dinosaur</h3><p class="small muted">Spend 2 energy to scout. Weaken an encounter, build trust with supplies, and attempt to tame it with a crafted trap.</p><div class="rpgActions"><button data-action="rpgScout">🔎 Scout · 2 ⚡</button></div><p class="small muted">Wild rarity chances are separate from egg chances; Godly wild encounters are exceptionally rare. ${s.rpg.tamed} successfully tamed.</p>`;
 }else{
  let d=SPECIES[w.species]||SPECIES[0],t=rarity(w.rarity),chance=tameChance(w),expired=n(w.expires)<Date.now();
  h+=`<div class="eyebrow">${expired?'ENCOUNTER EXPIRED':'WILD ENCOUNTER'}</div><div class="rpgCreatureTop"><div class="rpgFace">${d.icon}</div><div class="rpgCreatureTitle"><h3>${esc(d.name)}</h3><span style="color:${t.hex}">${t.icon} ${t.name} · ${d.cls}</span></div></div><p class="small muted">${expired?'This dinosaur has moved on. Start another search.':'Hunt, bond and attempt capture. You can continue later; this encounter persists in Cloud Kingdom.'}</p>`;
  if(!expired){h+=`<div class="rpgBars"><div><div class="row"><span>❤️ Wild health</span><b>${w.hp}/100</b></div><div class="progress"><span style="width:${w.hp}%;background:#e08e80"></span></div></div><div><div class="row"><span>🤝 Trust</span><b>${w.trust}/100</b></div><div class="progress"><span style="width:${w.trust}%;background:#89c9a2"></span></div></div></div><p class="small">Current taming chance: <strong>${Math.round(chance*100)}%</strong> per trap. Attempts: ${w.attempts||0}/5</p><div class="rpgActions"><button data-action="rpgWeaken">⚔️ Weaken</button><button data-action="rpgSoothe">💚 Soothe · 20 🪵</button><button data-action="rpgTame">🪤 Tame · 25 🪵 + 10 ⛏️</button><button data-action="rpgRelease">Let go</button></div>`}
  else h+='<div class="rpgActions"><button data-action="rpgRelease">Find a new encounter</button></div>';
 }
 h+='</div>';return h;
}
function handleAction(act,s,api){
 if(!/^rpg/.test(act)&&!['eggClaim','eggCheck'].includes(act))return false;
 normalize(s);
 const {save,render,notify,modal}=api;
 const changed=(message)=>{save();render();notify(message)};
 if(act==='rpgEggStart'){
  if(s.incubating){notify('An egg is already incubating');return true}
  if(s.gold<180){notify('Not enough gold (need 180)');return true}
  s.gold-=180;s.incubating={kind:'mystery',end:Date.now()+60000,started:Date.now()};changed('🥚 Mystery Egg incubating!');return true;
 }
 if(act==='rpgEggClaim'||act==='eggClaim'||act==='eggCheck'){
  const active=activeEgg(s);if(!active){notify('No egg is incubating');return true}
  if(Number(active.end)>Date.now()){render();notify('Egg is still incubating');return true}
  if(s.creatures.length>=200){notify('Your collection is full (200). Hatch later.');return true}
  let tier=active.kind==='mystery'?eggRoll(s.rpg):clamp(Math.floor(n(active.tier,0)),0,5);
  const species=Math.floor(random()*SPECIES.length),c=makeCreature(species,TYPES[tier].name,'egg');
  s.creatures.push(c);s.incubating=null;s.dinos[species].unlocked=true;
  save();render();modal(`🥚 ${TYPES[tier].name} hatch!`,`${esc(c.name)} — ${esc(SPECIES[species].kind)}! Trait: ${esc(c.trait)}.`,null);return true;
 }
 if(act==='rpgPagePrev'){page=Math.max(0,page-1);render();return true}
 if(act==='rpgPageNext'){page++;render();return true}
 const matched=/^rpg(Train|Evolve|Bond|Rename):(\d+)$/.exec(act);
 if(matched){const c=s.creatures[Number(matched[2])];if(!c){notify('Dinosaur no longer exists');return true}
  const kind=matched[1];
  if(kind==='Train'){
   if(c.level>=50){notify('Maximum dinosaur level reached');return true}
   const price=c.level*90+90;if(s.gold<price){notify(`Need ${price} gold`);return true}
   s.gold-=price;c.level++;changed(`⚡ ${c.name} reached Level ${c.level}!`);return true;
  }
  if(kind==='Evolve'){
   if(c.stars>=5){notify('Maximum 5-star evolution reached');return true}
   const price=c.stars*60;if(s.essence<price){notify(`Need ${price} essence`);return true}
   s.essence-=price;c.stars++;changed(`✨ ${c.name} evolved to ${c.stars} stars!`);return true;
  }
  if(kind==='Bond'){
   if(c.bond>=10){notify('Bond is already at maximum');return true}
   if(s.wood<40){notify('Need 40 wood to bond');return true}
   s.wood-=40;c.bond++;changed(`❤️ Bond increased to ${c.bond}/10!`);return true;
  }
  if(kind==='Rename'){
   const next=prompt('New dinosaur name (1–22 characters)',c.name);if(next===null)return true;
   const cleaned=next.trim().slice(0,22);if(!cleaned){notify('Name cannot be blank');return true}
   c.name=cleaned;changed('✏️ Dinosaur renamed!');return true;
  }
 }
 if(act==='rpgScout'){
  if(s.rpg.wild&&n(s.rpg.wild.expires)>Date.now()){notify('Finish your existing encounter first');return true}
  if(s.energy<2){notify('Need 2 energy to scout');return true}
  s.energy-=2;s.rpg.wild={species:Math.floor(random()*SPECIES.length),rarity:TYPES[randomRarity(WILD_WEIGHTS)].name,hp:100,trust:0,attempts:0,expires:Date.now()+30*60000};changed('🌿 A wild dinosaur appeared!');return true;
 }
 const w=s.rpg.wild;
 if(act==='rpgRelease'){s.rpg.wild=null;changed('Wild encounter ended');return true}
 if(['rpgWeaken','rpgSoothe','rpgTame'].includes(act)){
  if(!w||n(w.expires)<Date.now()){s.rpg.wild=null;changed('The wild dinosaur already left');return true}
  if(act==='rpgWeaken'){if(w.hp<=5){notify('The dinosaur is already exhausted');return true}w.hp=Math.max(5,w.hp-(15+Math.floor(random()*13)));w.trust=clamp(w.trust+4,0,100);changed('⚔️ Weakened without harming the dinosaur permanently');return true}
  if(act==='rpgSoothe'){if(s.wood<20){notify('Need 20 wood for bait and supplies');return true}s.wood-=20;w.trust=clamp(w.trust+18+Math.floor(random()*11),0,100);changed('💚 The wild dinosaur trusts you more');return true}
  if(act==='rpgTame'){
   if(s.creatures.length>=200){notify('Your collection is full (200)');return true}
   if(s.wood<25||s.ore<10){notify('Need 25 wood + 10 ore to craft a trap');return true}
   s.wood-=25;s.ore-=10;w.attempts++;
   if(random()<tameChance(w)){
     const c=makeCreature(w.species,w.rarity,'wild');s.creatures.push(c);s.dinos[w.species].unlocked=true;s.rpg.tamed++;s.rpg.wild=null;
     save();render();modal('🦖 Wild dinosaur tamed!',`${esc(c.name)} (${esc(c.rarity)}) joined your collection!`,null);return true;
   }
   if(w.attempts>=5){s.rpg.wild=null;changed('💨 The wild dinosaur escaped after five attempts');return true}
   w.trust=Math.max(0,w.trust-10);changed('The trap failed. Try bonding or weakening before another attempt.');return true;
  }
 }
 return true;
}
window.DDRPG={TYPES,SPECIES,normalize,rarity,eggRoll,eggView,collectionView,wildView,handleAction,creaturePower,tameChance,randomRarity,pveBonus};
})();

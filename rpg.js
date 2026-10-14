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

// Build 5.2: Six ornamental, original SVG egg illustrations. No emoji shell placeholders.
// Cosmetic-only; rarity probabilities and pity remain in the original TYPES/eggRoll code.
let eggSymbolId=0;
function eggArt(t,scale='small'){
 const id='royal52Egg'+(++eggSymbolId),name=t?.name||'Common',c=t?.hex||'#eeeeee';
 const shell='M60 8 C36 8 13 53 13 101 C13 133 31 149 60 149 C89 149 107 133 107 101 C107 53 84 8 60 8Z';
 const geometry={
 Common:`<g fill="#9da4ab" opacity=".3"><ellipse cx="39" cy="87" rx="14" ry="6" transform="rotate(-24 39 87)"/><ellipse cx="84" cy="119" rx="8" ry="4"/><circle cx="71" cy="46" r="4"/><circle cx="36" cy="118" r="2"/></g><path d="M27 101Q57 118 94 100" stroke="#fff" stroke-opacity=".32" fill="none" stroke-width="2"/>`,
 Uncommon:`<g opacity=".64" fill="none" stroke="#c5d0d4" stroke-width="2"><path d="M20 96L38 82L49 93L71 70L101 91"/><path d="M27 112L49 98L66 114L85 97"/><path d="M41 58L55 44L70 59L84 50"/></g><g fill="#29343d" opacity=".26"><path d="M23 74l19 -18 17 8 -14 22z"/><path d="M70 102l17 -12 13 9 -8 16z"/></g>`,
 Legendary:`<g stroke="#b8edff" fill="none" stroke-linecap="round"><path d="M60 31L76 54L60 78L44 54Z" stroke-width="2.5"/><path d="M60 31V78M44 54H76" stroke-width="1.4" opacity=".9"/><path d="M33 91L60 109L87 91M35 119L60 131L85 119" stroke-width="2.3" opacity=".65"/></g><g fill="#e7fbff"><circle cx="60" cy="54" r="4"/><circle cx="36" cy="73" r="2"/><circle cx="84" cy="73" r="2"/></g>`,
 Gold:`<g fill="none" stroke="#fff1ac" stroke-width="2.6" stroke-linecap="round"><path d="M25 94Q60 109 95 94M27 110Q60 127 93 110"/><path d="M29 79Q44 67 37 52M91 79Q76 67 83 52"/><path d="M60 32L76 47L69 67H51L44 47Z"/></g><path d="M51 49L58 54L60 43L65 54L70 49L66 62H54Z" fill="#fff4bd"/><g fill="#fff6c6"><circle cx="60" cy="75" r="2.4"/><circle cx="43" cy="103" r="2"/><circle cx="77" cy="103" r="2"/></g>`,
 Mythic:`<g fill="none" stroke="#ffcfb2" stroke-width="2.7" stroke-linecap="round"><path d="M60 20L55 54L74 68L58 90L72 116L61 143"/><path d="M55 54L34 70L27 105M74 68L91 89L82 121"/><path d="M58 90L42 104L48 127"/></g><g fill="#fff6dc" opacity=".84"><circle cx="55" cy="54" r="3"/><circle cx="58" cy="90" r="2.8"/><circle cx="74" cy="68" r="2.1"/></g><path d="M49 47L66 29L63 60Z" fill="#fbae80" opacity=".45"/>`,
 Godly:`<g fill="none" stroke="#f4d8ff" stroke-width="2.1" stroke-linecap="round"><path d="M60 26L66 45L83 53L67 64L60 87L53 64L37 53L54 45Z"/><path d="M38 90Q60 100 82 90M30 109Q60 130 90 109"/><path d="M40 72L29 62M80 72L91 62"/></g><g fill="#fff" opacity=".94"><path d="M60 36l3 17 15 3 -15 3 -3 17 -3 -17 -15 -3 15 -3z"/><circle cx="31" cy="90" r="2.6"/><circle cx="89" cy="86" r="2.3"/><circle cx="72" cy="107" r="2"/></g>`,
 Mystery:`<path d="M60 29L76 49L60 69L44 49Z" stroke="#fff0c0" stroke-width="3" fill="none"/><path d="M26 94Q60 125 94 94" stroke="#f5ddb2" stroke-width="2" fill="none"/><text x="60" y="111" text-anchor="middle" font-size="31" font-family="Georgia,serif" fill="#fff0c9">?</text>`
 };
 const seed=Array.from(name).reduce((sum,ch)=>sum+ch.charCodeAt(0),0);
 let specks='';for(let i=0;i<25;i++){
  const x=26+((i*31+seed)%67),y=26+((i*41+seed*2)%104);
  const nx=(x-60)/47,ny=(y-78)/75;
  if(nx*nx+ny*ny>0.91)continue;
  const r=.5+(i%4)*.33;
  specks+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${i%3?'#fff':'#10151b'}" opacity="${i%3?'.20':'.16'}"/>`;
 }
 return `<svg class="royalEgg royalEgg--${scale}" viewBox="0 0 120 162" role="img" aria-label="${esc(name)} rarity egg" xmlns="http://www.w3.org/2000/svg">
 <defs>
 <radialGradient id="${id}-shell" cx="33%" cy="22%" r="92%"><stop offset="0" stop-color="#ffffff" stop-opacity=".93"/><stop offset=".16" stop-color="${c}"/><stop offset=".59" stop-color="${c}"/><stop offset="1" stop-color="#121923"/></radialGradient>
 <linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2=".75"><stop offset="0" stop-color="#fff" stop-opacity=".39"/><stop offset=".35" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".37"/></linearGradient>
 <clipPath id="${id}-clip"><path d="${shell}"/></clipPath>
 </defs>
 <ellipse cx="60" cy="154" rx="35" ry="5" fill="#000" opacity=".33"/>
 <path d="${shell}" fill="url(#${id}-shell)" stroke="${c}" stroke-width="2.2"/>
 <g clip-path="url(#${id}-clip)"><path d="M18 40Q58 10 100 49" stroke="#fff" opacity=".12" stroke-width="10" fill="none"/>
 ${specks}${geometry[name]||geometry.Common}
 <path d="${shell}" fill="url(#${id}-shine)"/><ellipse cx="40" cy="46" rx="12" ry="24" fill="#fff" opacity=".2" transform="rotate(24 40 46)"/></g>
 <path d="M27 117Q37 143 61 144" fill="none" stroke="#fff" opacity=".11" stroke-width="2.5" stroke-linecap="round"/>
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
 html+=TYPES.map(t=>`<div class="rpgOddsRow"><span class="ddEggLabel" style="color:${t.hex}">${eggArt(t,'small')} ${t.name}</span><b>${t.chance}%</b></div>`).join('')+'</div><div class="ddEggGallery">'+TYPES.map(t=>`<div class="ddEggTile" style="--eggTint:${t.hex}">${eggArt(t,'medium')}<b>${t.name}</b><small>${t.chance}%</small></div>`).join('')+'</div><p class="royalEggCaption">Each rarity has its own magical shell · Actual odds unchanged</p></div>';
 if(active){const secs=Math.max(0,Math.ceil((Number(active.end)-Date.now())/1000));const legacy=active.kind!=='mystery';const heading=legacy?`Legacy ${esc(active.rarity||'Egg')}`:'Mystery Egg';
  html+=`<div class="panel hatchActive rpgIncubator"><div class="eyebrow">INCUBATOR · ${heading}</div><div class="hatchIcon">${eggArt(TYPES.find(t=>t.name===active.rarity)||TYPES[0],'incubator')}</div><h2>${secs?'Incubating…':'Ready to hatch!'}</h2><p class="muted">${secs?`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} remaining`:'Your dinosaur is waiting.'}</p><button class="btn alt" data-action="rpgEggClaim">${secs?'Check incubation':'✨ Hatch now'}</button></div>`;
 }else{
  html+=`<div class="panel rpgEggBuy"><div class="rpgEggGlyph">${eggArt({name:'Mystery',hex:'#c5a96e'},'large')}</div><div><b>Standard Mystery Egg</b><p class="muted small">1 minute incubation · 🪙 180 gold</p><button class="btn alt" data-action="rpgEggStart">Incubate mystery egg</button></div></div>`;
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

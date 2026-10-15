/* Dino Dominion Builds 6.3 + 6.4 — Geneforge Discoveries
 * OPTIONAL, DEVICE-LOCAL TRIAL: no resources, paid services, live account data,
 * competitive outcomes or Cloud Kingdom saves are created or modified here.
 * Future live genetics must be generated/validated server-side after backup.
 */
(()=>{'use strict';
const VERSION='6.4.0',STORE='dd62-nursery-v1',MAX=50,INCUBATION_MS=45000;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>String(s||'').replace(/[^A-Za-z0-9 _\-]/g,'').trim().slice(0,24);
const specimens=[
 {species:'Tyrannosaurus',short:'T-Rex',faction:'Apex Dominion',label:'Blazefang',emoji:'🦖',color:'#b77b53',trait:'Ferocity'},
 {species:'Triceratops',short:'Triceratops',faction:'Ironhide',label:'Thornshield',emoji:'🦕',color:'#6d9d85',trait:'Fortitude'},
 {species:'Raptor',short:'Raptor',faction:'Shadowclaw',label:'Nightclaw',emoji:'🦖',color:'#8175ae',trait:'Swiftness'},
 {species:'Spinosaurus',short:'Spinosaurus',faction:'Riverfang',label:'Tidebreaker',emoji:'🦕',color:'#5d9eb2',trait:'Ferocity'},
 {species:'Ankylosaurus',short:'Ankylosaurus',faction:'Ironhide',label:'Ironhide',emoji:'🦕',color:'#b19b61',trait:'Fortitude'},
 {species:'Parasaurolophus',short:'Parasaur',faction:'Verdant Herd',label:'Sunwhisper',emoji:'🦕',color:'#b28eae',trait:'Resilience'}
];
// Curated, numbered recipes. Indices 0-5 are unchanged so old local eggs and hatchlings survive.
const recipes=[
 {id:'nightfang',name:'Nightfang Rex',a:0,b:2,desc:'Apex power meets Shadowclaw speed.',dominant:'Swiftness',factions:['Apex Dominion','Shadowclaw']},
 {id:'bastion',name:'Bastionhorn',a:1,b:4,desc:'Horned strength fused with iron armor.',dominant:'Fortitude',factions:['Ironhide','Ironhide']},
 {id:'marsh',name:'Marshcaller',a:3,b:5,desc:'A water hunter with Verdant resilience.',dominant:'Resilience',factions:['Riverfang','Verdant Herd']},
 {id:'tide',name:'Tide Tyrant',a:0,b:3,desc:'Two apex hunters united.',dominant:'Ferocity',factions:['Apex Dominion','Riverfang']},
 {id:'whisper',name:'Whisperclaw',a:2,b:5,desc:'Ambush speed and protective instincts.',dominant:'Swiftness',factions:['Shadowclaw','Verdant Herd']},
 {id:'reef',name:'Reefhorn',a:1,b:3,desc:'Shielded hunter of the riverlands.',dominant:'Fortitude',factions:['Ironhide','Riverfang']}
];
for(const r of recipes)specimens.push({species:r.name,short:r.name,faction:'Geneforged · '+r.factions.join(' / '),label:r.name,emoji:'🧬',color:'#977855',trait:r.dominant,hybrid:true,parents:[r.a,r.b]});
const traits=['Ferocity','Fortitude','Resilience','Swiftness'];
const blank=()=>({v:1,young:[],egg:null,selected:0,research:[]});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const rid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'trial-'+Date.now()+'-'+Math.random().toString(16).slice(2);
let data=blank(),visible=false,screen='breed',selectionA='',selectionB='',lastFocus=null,ticker=null,message='',breedingMode='natural',activeRecipe='nightfang',collectionFilter='all';
const baseGenes=(idx,borrowed)=>({Ferocity:clamp(53+(idx*7)%24+(borrowed?-8:4),1,99),Fortitude:clamp(49+(idx*11)%23+(borrowed?5:0),1,99),Resilience:clamp(54+(idx*5)%22+(borrowed?2:0),1,99),Swiftness:clamp(45+(idx*9)%27+(borrowed?8:0),1,99)});
function validate(raw){
 const v=blank();if(!raw||raw.v!==1||typeof raw!=='object')return v;
 const validGenes=x=>x&&typeof x==='object'&&traits.every(t=>Number.isFinite(x[t]));
 if(Array.isArray(raw.young))v.young=raw.young.slice(0,MAX).filter(x=>x&&typeof x.id==='string'&&x.id.length<100&&Number.isInteger(x.species)&&x.species>=0&&x.species<specimens.length&&typeof x.name==='string'&&x.name.length<=30&&validGenes(x.genes)).map(x=>({...x,name:slug(x.name)||'Unnamed hatchling',genes:Object.fromEntries(traits.map(t=>[t,clamp(x.genes[t],1,99)]))}));
 if(raw.egg&&Number.isInteger(raw.egg.species)&&raw.egg.species>=0&&raw.egg.species<specimens.length&&Number.isFinite(raw.egg.due)&&raw.egg.due>0&&typeof raw.egg.id==='string'&&raw.egg.id.length<100&&validGenes(raw.egg.genes))v.egg={...raw.egg,genes:Object.fromEntries(traits.map(t=>[t,clamp(raw.egg.genes[t],1,99)]))};
 v.selected=clamp(raw.selected,0,5);
 v.research=Array.isArray(raw.research)?[...new Set(raw.research.filter(id=>recipes.some(r=>r.id===id)))]:[];
 return v;
}
function load(){try{data=validate(JSON.parse(localStorage.getItem(STORE)||'null'))}catch(_){data=blank()}}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(data))}catch(_){message='Device storage is unavailable. This trial may reset after refresh.'}}
function roster(){let candidates=[];try{candidates=window.DD60Bridge?.getRoster?.()||[]}catch(_){};return candidates.filter(d=>d?.unlocked&&specimens.some(s=>s.species===d.species||s.label===d.name));}
function ownedIds(){const avail=roster();return specimens.map((s,i)=>avail.some(d=>d.name===s.label||d.species===s.species)?i:null).filter(v=>v!==null)}
function family(lab=false){
 const list=[];
 for(const i of ownedIds()){
  const sp=specimens[i];list.push({id:'main-'+i,species:i,name:sp.label,role:'Your original dinosaur',genes:baseGenes(i,false),sample:false,original:true});
  list.push({id:'loan-'+i,species:i,name:sp.short+' Sanctuary Partner',role:'Trial loaner · Not owned',genes:baseGenes(i,true),sample:true,original:false});
 }
 if(lab){ // Research specimens make all curated recipes testable without changing game ownership.
  for(let i=0;i<6;i++)if(!list.some(d=>d.species===i))list.push({id:'lab-'+i,species:i,name:specimens[i].short+' Lab Specimen',role:'Lab sample · Trial only, not owned',genes:baseGenes(i,true),sample:true,original:false});
 }
 for(const d of data.young)list.push({...d,role:'Trial offspring · Device only',sample:false,original:false});
 return list;
}
function portrait(species,compact=false){
 const s=specimens[species]||specimens[0],source=s.hybrid?s.parents[0]:species;
 const svg=window.DD513?.dinosaurSVG;let artwork='';
 try{if(typeof svg==='function')artwork=svg(source,'hero',s.label,false,'634-'+species)||''}catch(_){}
 if(!artwork||!artwork.trim().startsWith('<svg'))artwork=`<span class="dd62Emoji" aria-hidden="true">${s.emoji}</span>`;
 return `<div class="dd62Portrait ${compact?'mini':''} ${s.hybrid?'dd634HybridPortrait':''}" style="--dd62skin:${s.color}"><div class="dd62Art">${artwork}</div>${s.hybrid?'<span class="dd634DNA">⟡ GENEFORGED</span>':''}<span class="dd62PortraitShine"></span></div>`;
}
function stats(genes){return `<div class="dd62Stats">${traits.map(t=>`<div class="dd62Stat"><div><span>${esc(t)}</span><b>${clamp(genes[t],1,99)}</b></div><div class="dd62Track"><i style="width:${clamp(genes[t],1,99)}%"></i></div></div>`).join('')}</div>`;}
function options(list,chosen){return `<option value="">Select dinosaur</option>`+list.map(d=>`<option value="${esc(d.id)}" ${chosen===d.id?'selected':''}>${esc(d.name)}${d.sample?' · loaner':''}${!d.original&&!d.sample?' · offspring':''}</option>`).join('');}
function pickDefaults(list){
 if(breedingMode==='hybrid'){
  const available=recipes.filter(r=>data.research.includes(r.id));
  if(!available.some(r=>r.id===activeRecipe))activeRecipe=available[0]?.id||'nightfang';
  const recipe=recipes.find(r=>r.id===activeRecipe);
  if(recipe){
   if(!list.some(x=>x.id===selectionA&&x.species===recipe.a))selectionA=list.find(x=>x.species===recipe.a)?.id||'';
   if(!list.some(x=>x.id===selectionB&&x.species===recipe.b))selectionB=list.find(x=>x.species===recipe.b)?.id||'';
  }
 }else{
  const a=list.find(x=>x.id===selectionA);if(!a)selectionA=list.find(x=>x.original)?.id||list[0]?.id||'';
  const p=list.find(x=>x.id===selectionA),b=list.find(x=>x.id===selectionB);
  if(!b||b.id===selectionA||b.species!==p?.species)selectionB=list.find(x=>x.id!==selectionA&&x.species===p?.species)?.id||'';
 }
}
const humanTime=ms=>{const sec=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`};
function banner(place){const isD=place==='dinos';return `<section class="dd62Entry" aria-label="Build 6.3 and 6.4 Genetics Trial"><div class="dd62EntryIcon">${isD?'🧬':'🥚'}</div><div><small>BUILD 6.3 + 6.4 · GENEFORGE</small><strong>${isD?'Genetics Lab & Dinosaur Collection':'Breeding & Hybrid Lab'}</strong><p>${isD?'Discover hybrids, bloodlines, and your hatchlings.':'Natural breeding or curated hybrid experiments.'}</p></div><button type="button" data-dd62-open="${isD?'lab':'breed'}">Open ↗</button></section>`;}
function make(){if($('dd62Overlay'))return;
 const root=document.createElement('div');root.id='dd62Overlay';root.className='dd62Overlay';root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Geneforge Genetics Laboratory trial');
 root.innerHTML=`<div class="dd62Window"><header class="dd62Header"><div class="dd62Brand"><span class="dd62Seal">⟡</span><div><small>DINO DOMINION · BUILD 6.3 + 6.4</small><strong>Legacy of the Geneforge</strong></div></div><button type="button" id="dd62Close" class="dd62Exit" aria-label="Close genetics trial">✕ <span>Exit</span></button></header><nav class="dd62Nav" aria-label="Bloodlines menu"><button type="button" data-dd62-screen="breed">🥚 Breed</button><button type="button" data-dd62-screen="lab">🧬 Lab</button><button type="button" data-dd62-screen="collection">🦖 Dinos</button><button type="button" data-dd62-screen="lineage">🌿 Lineage</button></nav><div class="dd62Scroll" id="dd62Content" tabindex="-1"></div><footer class="dd62Footer"><span>DEVICE-LOCAL TRIAL</span> · Original resources, battles, and cloud saves stay untouched.</footer></div>`;
 document.body.appendChild(root);
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='dd62Close')close();else if(b.dataset.dd62Screen){screen=b.dataset.dd62Screen;message='';render();}else if(b.dataset.dd62Action)act(b.dataset.dd62Action,b)});
 root.addEventListener('change',e=>{
  if(e.target.id==='dd62ParentA'){selectionA=e.target.value;selectionB='';message='';render()}
  if(e.target.id==='dd62ParentB'){selectionB=e.target.value;message='';render()}
  if(e.target.id==='dd634Recipe'){activeRecipe=e.target.value;selectionA='';selectionB='';message='';render()}
 });
 root.addEventListener('submit',e=>{if(e.target.id==='dd62NameForm'){e.preventDefault();rename(e.target)}});
 document.addEventListener('keydown',e=>{if(!visible)return;if(e.key==='Escape'){e.preventDefault();close()}
  if(e.key==='Tab'){const items=[...root.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled])')].filter(el=>el.getClientRects().length);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-dd62-open]');if(b){e.preventDefault();open(b.dataset.dd62Open)}});
}
function open(which){if(visible)return;make();load();screen=['breed','lab','collection','lineage'].includes(which)?which:'breed';visible=true;lastFocus=document.activeElement;document.documentElement.classList.add('dd62Open');$('dd62Overlay').hidden=false;render();$('dd62Close').focus({preventScroll:true});ticker=setInterval(()=>{if(visible&&screen==='breed'&&data.egg)updateClock()},500);}
function close(){if(!visible)return;visible=false;clearInterval(ticker);ticker=null;document.documentElement.classList.remove('dd62Open');$('dd62Overlay').hidden=true;if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true})}
function render(){if(!visible)return;
 const list=family(breedingMode==='hybrid');pickDefaults(list);let html='';
 if(screen==='breed')html=breedingHTML(list);
 if(screen==='lab')html=labHTML();
 if(screen==='collection')html=collectionHTML(list);
 if(screen==='lineage')html=lineageHTML(list);
 const meta={breed:['Breeding Grounds','Choose two dinosaurs, then hatch a unique trial companion.'],lab:['Genetics Laboratory','Discover a curated hybrid recipe, then try it in the nursery.'],collection:['Dinosaur Collection','Your real starter dinosaurs and device-only genetic experiments.'],lineage:['Bloodline Archive','Trace inherited strengths across generations.']};
 $('dd62Content').innerHTML=`<div class="dd62Lead"><span>GENEFORGE · BUILDS 6.3 + 6.4</span><h2>${meta[screen][0]}</h2><p>${meta[screen][1]}</p></div><div class="dd62Notice"><strong>🛡️ DEVICE-LOCAL TRIAL</strong> Lab recipes, eggs and offspring are stored only on this device. They do not enter real collections, spend resources, or change online battles.</div>${html}${message?`<p class="dd62Message" role="status">${esc(message)}</p>`:''}`;
 $('dd62Overlay').querySelectorAll('[data-dd62-screen]').forEach(btn=>{btn.classList.toggle('active',btn.dataset.dd62Screen===screen);btn.setAttribute('aria-current',String(btn.dataset.dd62Screen===screen))});updateClock();
}
function breedingHTML(list){
 const hybrid=breedingMode==='hybrid',research=recipes.filter(r=>data.research.includes(r.id)),recipe=recipes.find(r=>r.id===activeRecipe);
 const a=list.find(x=>x.id===selectionA),b=list.find(x=>x.id===selectionB);
 const compatible=!!a&&!!b&&a.id!==b.id&&(hybrid?!!recipe&&data.research.includes(recipe.id)&&a.species===recipe.a&&b.species===recipe.b:a.species===b.species);
 const offspring=hybrid?recipe?.name:specimens[a?.species??0]?.short;
 const parentPicker=sp=>list.filter(x=>!hybrid||x.species===sp);
 return `<div class="dd634Modes"><button type="button" data-dd62-action="mode-natural" class="${hybrid?'':'chosen'}" aria-pressed="${!hybrid}">🌿 Natural</button><button type="button" data-dd62-action="mode-hybrid" class="${hybrid?'chosen':''}" aria-pressed="${hybrid}">🧬 Hybrid</button></div>
 ${hybrid?`<div class="dd634RecipePicker"><label for="dd634Recipe">SELECT A DISCOVERED FORMULA</label>${research.length?`<select id="dd634Recipe">${research.map(r=>`<option value="${esc(r.id)}" ${r.id===activeRecipe?'selected':''}>${esc(r.name)} · ${esc(specimens[r.a].short)} + ${esc(specimens[r.b].short)}</option>`).join('')}</select>`:`<p>No hybrid formulas discovered yet. Visit the Genetics Lab to unlock one for this trial.</p><button type="button" data-dd62-screen="lab">Open Genetics Lab ↗</button>`}</div>`:''}
 <div class="dd62HeroArt" style="--dd62skin:${specimens[(hybrid?6+recipes.indexOf(recipe):a?.species)??0]?.color||'#8b846a'}"><div class="dd62HeroInfo"><span class="dd62Eyebrow">${hybrid?'GENEFORGE EXPERIMENT':'SANCTUARY BREEDING'}</span><h3>${hybrid?'Create something extraordinary.':'Every bloodline begins somewhere.'}</h3><p>${hybrid?'Combine only researched species pairs. Lab specimens are borrowed for the trial.':'Pair compatible dinosaurs. Keep both parents. Discover inherited traits.'}</p></div>${portrait((hybrid&&recipe?6+recipes.indexOf(recipe):a?.species)??0)}</div>
 ${data.egg?eggHTML():`<div class="dd62Pair"><div class="dd62Parent"><label for="dd62ParentA">PARENT ONE</label><select id="dd62ParentA">${options(parentPicker(recipe?.a),selectionA)}</select>${a?`<small>${esc(a.role)}</small>${stats(a.genes)}`:''}</div><div class="dd62PairHeart" aria-hidden="true">＋</div><div class="dd62Parent"><label for="dd62ParentB">PARENT TWO</label><select id="dd62ParentB">${options(hybrid?parentPicker(recipe?.b):list.filter(x=>!a||x.species===a.species),selectionB)}</select>${b?`<small>${esc(b.role)}</small>${stats(b.genes)}`:''}</div></div>
 <div class="dd62Decision"><span>${compatible?'Compatible · '+esc(offspring)+' egg':hybrid&&!research.length?'Discover a formula first':!a?'Unlock a dinosaur or visit the Lab':'Choose two compatible parents'}</span><button type="button" data-dd62-action="start" ${!compatible||data.young.length>=MAX?'disabled':''}>🥚 Begin Trial Breeding</button></div>`}
 <p class="dd62Fine">Trial incubation: 45 seconds. Parents are never consumed. ${data.young.length}/${MAX} trial offspring slots used. Hybrid genetics and appearances are experimental previews.</p>`;
}
function labHTML(){
 return `<div class="dd634LabHero"><div class="dd634Rune">🧬</div><div><span class="dd62Eyebrow">CURATED CROSSBREEDING</span><h3>Six engineered bloodlines.</h3><p>Discover a formula with one tap, then create its egg in the nursery. More recipes can arrive in future seasons.</p><small>No currencies, timers, or quests required to research recipes in this trial.</small></div></div>
 <div class="dd634LabProgress"><b>${data.research.length} / ${recipes.length} discovered</b><span>${data.young.filter(x=>x.species>=6).length} hybrid hatchlings</span></div>
 <div class="dd634Recipes">${recipes.map((r,i)=>{const discovered=data.research.includes(r.id);return `<article class="dd634Recipe"><div class="dd634RecipeHead">${portrait(i+6,true)}<div><small>FORMULA ${String(i+1).padStart(2,'0')} · ${esc(discovered?'DISCOVERED':'UNDISCOVERED')}</small><h3>${esc(r.name)}</h3><p>${esc(specimens[r.a].short)} × ${esc(specimens[r.b].short)}</p><span class="dd634Factions">${esc(r.factions.join(' + '))}</span></div></div><p>${esc(r.desc)}</p><button type="button" data-dd62-action="${discovered?'hybrid-':'research-'}${r.id}">${discovered?'🥚 Try this Hybrid ↗':'🔎 Discover Trial Formula'}</button></article>`}).join('')}</div>
 <p class="dd62Fine">All six crossbreeds are curated. There is no unrestricted mixing. These formulas and traits are not final launch balance or real multiplayer unlocks.</p>`;
}
function eggHTML(){const e=data.egg;const remain=e.due-Date.now();return `<div class="dd62Incubator"><div class="dd62EggPulse">🥚</div><span class="dd62Eyebrow">INCUBATING A NEW BLOODLINE</span><h3>${esc(specimens[e.species].short)} Egg</h3><div class="dd62Countdown" id="dd62Countdown">${remain>0?humanTime(remain):'Ready to hatch!'}</div><div class="dd62Timer"><span id="dd62TimerFill" style="width:${clamp((Date.now()-e.started)/INCUBATION_MS*100,0,100)}%"></span></div><p>${esc(e.parentAName)} × ${esc(e.parentBName)}</p><button type="button" data-dd62-action="hatch" id="dd62Hatch" ${remain>0?'disabled':''}>${remain>0?'Growing safely…':'✨ Hatch Your Egg'}</button><p class="dd62Fine">Incubation continues when you leave this screen. There is no premium skip or resource cost in this trial.</p></div>`;}
function collectionHTML(list){const available=ownedIds();const shown=data.young.filter(d=>collectionFilter==='all'||(collectionFilter==='hybrid'?d.species>=6:d.species<6));
 return `<div class="dd62Counter"><b>${available.length} original species</b><span>${data.young.length} / ${MAX} trial offspring slots</span></div><div class="dd62Cards">${available.map(i=>`<article class="dd62Card">${portrait(i,true)}<div><span class="dd62Eyebrow">${esc(specimens[i].faction)}</span><h3>${esc(specimens[i].label)}</h3><p>${esc(specimens[i].short)} · Original · Owned</p><button type="button" data-dd62-action="breed-${i}">Find partner ↗</button></div></article>`).join('')||'<p>Unlock a dinosaur in the main collection to see it here.</p>'}</div>
 <h3 class="dd62Subhead">Your trial hatchlings</h3><div class="dd634Filters"><button data-dd62-action="filter-all" class="${collectionFilter==='all'?'chosen':''}">All</button><button data-dd62-action="filter-natural" class="${collectionFilter==='natural'?'chosen':''}">Natural</button><button data-dd62-action="filter-hybrid" class="${collectionFilter==='hybrid'?'chosen':''}">Hybrids</button></div>
 ${shown.length?`<div class="dd62Cards">${shown.slice().reverse().map(d=>`<article class="dd62Card">${portrait(d.species,true)}<div><span class="dd62Eyebrow">GEN ${clamp(d.generation,1,99)} · ${d.species>=6?'GENEFORGED HYBRID':d.mutation?'RARE MUTATION':'NATURAL BLOODLINE'}</span><h3>${esc(d.name)}</h3><p>${esc(specimens[d.species].short)} · ${esc(d.trait)}</p><button type="button" data-dd62-action="details-${esc(d.id)}">View genetics ↗</button></div></article>`).join('')}</div>`:'<p class="dd62Empty">No trial hatchlings in this category yet.</p>'}
 <div class="dd62Management"><p>Trial offspring are stored only in this browser, never in real PvP or Cloud Kingdom. Your 6.2 hatchlings are preserved.</p><button type="button" data-dd62-action="reset">Reset trial nursery</button></div>`;
}
function lineageHTML(list){if(!data.young.length)return `<div class="dd62Empty dd62LineageEmpty"><div>🧬</div><h3>Your bloodline story starts with an egg.</h3><p>Hatch a dinosaur to trace its inherited traits and ancestry.</p><button type="button" data-dd62-screen="breed">Start breeding</button></div>`;
 return `<div class="dd62Lineages">${data.young.slice().reverse().map(d=>{const sp=specimens[d.species];return `<article class="dd62Family"><div class="dd62FamilyTop">${portrait(d.species,true)}<div><span class="dd62Eyebrow">GEN ${clamp(d.generation,1,99)} · ${esc(sp.faction)}</span><h3>${esc(d.name)}</h3><p>${esc(sp.short)} · ${esc(d.trait)} ${d.mutation?'· ✨ Mutation':''}</p></div></div>${sp.hybrid?`<p class="dd634Ancestry">Hybrid ancestry: ${esc(specimens[sp.parents[0]].short)} + ${esc(specimens[sp.parents[1]].short)}</p>`:''}<div class="dd62Ancestors"><span>◈ ${esc(d.parentAName)}</span><b>＋</b><span>◈ ${esc(d.parentBName)}</span></div>${stats(d.genes)}<form id="dd62NameForm" data-egg-id="${esc(d.id)}"><label for="dd62Name-${esc(d.id)}">Rename hatchling</label><div><input name="newName" id="dd62Name-${esc(d.id)}" value="${esc(d.name)}" maxlength="24" pattern="[A-Za-z0-9 _\-]{1,24}" required><button type="submit" name="child" value="${esc(d.id)}">Save name</button></div></form></article>`}).join('')}</div>`;
}
function updateClock(){if(!visible||!data.egg)return;const remain=data.egg.due-Date.now();const c=$('dd62Countdown'),f=$('dd62TimerFill'),h=$('dd62Hatch');if(c)c.textContent=remain>0?humanTime(remain):'Ready to hatch!';if(f)f.style.width=clamp((Date.now()-data.egg.started)/INCUBATION_MS*100,0,100)+'%';if(h){h.disabled=remain>0;h.textContent=remain>0?'Growing safely…':'✨ Hatch Your Egg';}}
function start(){if(data.egg)return;
 const list=family(breedingMode==='hybrid'),a=list.find(x=>x.id===selectionA),b=list.find(x=>x.id===selectionB);
 const recipe=recipes.find(r=>r.id===activeRecipe),hybrid=breedingMode==='hybrid';
 const compatible=!!a&&!!b&&a.id!==b.id&&(hybrid?!!recipe&&data.research.includes(recipe.id)&&a.species===recipe.a&&b.species===recipe.b:a.species===b.species);
 if(!compatible){message='Choose a discovered formula and compatible parents.';return render()}
 if(data.young.length>=MAX){message='Trial collection is full.';return render()}
 const genes={};for(const t of traits)genes[t]=clamp(Math.round((a.genes[t]+b.genes[t])/2+(Math.random()-.5)*18),1,99);
 const mutated=Math.random()<(hybrid?.07:.04);
 const dominant=hybrid?recipe.dominant:(mutated?traits[Math.floor(Math.random()*traits.length)]:traits.reduce((best,t)=>genes[t]>genes[best]?t:best,'Ferocity'));
 if(hybrid)genes[dominant]=clamp(genes[dominant]+6,1,99);
 if(mutated)genes[dominant]=clamp(genes[dominant]+14,1,99);
 data.egg={id:rid(),species:hybrid?6+recipes.indexOf(recipe):a.species,recipe:hybrid?recipe.id:null,started:Date.now(),due:Date.now()+INCUBATION_MS,genes,mutation:mutated,trait:dominant,parentA:a.id,parentB:b.id,parentAName:a.name,parentBName:b.name,generation:Math.max(a.generation||0,b.generation||0)+1};
 persist();message=(hybrid?'A curated hybrid':'A new dinosaur')+' egg is incubating!';render();
}
function hatch(){const egg=data.egg;if(!egg)return;if(Date.now()<egg.due){message='Your egg is still incubating.';return render()}if(data.young.length>=MAX){message='Your trial collection is full.';return render()}
 const d={...egg,id:egg.id,name:specimens[egg.species].short+' '+(data.young.length+1),born:Date.now(),mutation:egg.mutation,trait:egg.trait};delete d.started;delete d.due;data.young.push(d);data.egg=null;persist();screen='lineage';message='A new trial dinosaur has hatched! The original parents are safe.';render();}
function rename(form){const el=form.querySelector('input[name="newName"]'),name=slug(el?.value);const id=form.querySelector('button[name="child"]')?.value;const child=data.young.find(d=>d.id===id);if(!child||!name){message='Use 1–24 letters, numbers, spaces, hyphens or underscores.';return render()}child.name=name;persist();message='Trial hatchling renamed.';render();}
function act(a){
 if(a==='start')start();else if(a==='hatch')hatch();
 else if(a==='mode-natural'||a==='mode-hybrid'){breedingMode=a==='mode-hybrid'?'hybrid':'natural';selectionA='';selectionB='';message='';render()}
 else if(a.startsWith('research-')){const id=a.slice(9);if(recipes.some(r=>r.id===id)&&!data.research.includes(id)){data.research.push(id);persist();message='Trial formula discovered! You can now breed this hybrid.';render()}}
 else if(a.startsWith('hybrid-')){const id=a.slice(7);if(data.research.includes(id)){breedingMode='hybrid';activeRecipe=id;selectionA='';selectionB='';screen='breed';message='Select your two lab parents and start incubating.';render()}}
 else if(a.startsWith('filter-')){const id=a.slice(7);if(['all','natural','hybrid'].includes(id)){collectionFilter=id;render()}}
 else if(a.startsWith('breed-')){const id=Number(a.slice(6));if(ownedIds().includes(id)){breedingMode='natural';selectionA='main-'+id;selectionB='loan-'+id;screen='breed';message='';render()}}
 else if(a.startsWith('details-')){screen='lineage';message='';render()}
 else if(a==='reset'){if(!window.confirm('Reset this device-local trial? This deletes trial offspring, eggs and discovered recipes, but never real dinosaurs.'))return;data=blank();selectionA='';selectionB='';persist();message='Trial nursery reset. Real game data was not changed.';render()}
}
function boot(){make();window.DD62={banner,open,close,version:VERSION,inspection:()=>({offspring:data.young.length,hybrids:data.young.filter(x=>x.species>=6).length,research:data.research.length,incubating:!!data.egg,localOnly:true})};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

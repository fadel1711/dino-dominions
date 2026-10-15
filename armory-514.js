/* Dino Dominion Build 5.14 — Dinosaur Evolution & Armory.
 * LOCAL / CLOUD KINGDOM STORY-ONLY. Does not modify Royal Authority,
 * trusted multiplayer power, Stripe, or Supabase. Every game-state edit
 * is saved through the existing game save/Cloud bridge.
 */
(()=>{'use strict';
const VERSION='5.14.0-alpha.1';
const MAX_ITEMS=80;
const CATEGORIES=['head','body','claws','relic'];
const CAT_META={head:['🪖','Crest'],body:['🛡️','Armor'],claws:['⚔️','Talons'],relic:['💠','Relic']};
const RARITIES=['Common','Uncommon','Legendary','Gold','Mythic','Godly'];
const RECIPES=[
 {id:'stone_crest',cat:'head',name:'Stoneguard Crest',icon:'🪖',rarity:'Common',stats:{def:4,hp:12},cost:{wood:70,ore:45,essence:0,gold:0},forge:1},
 {id:'sunfire_crest',cat:'head',name:'Sunfire Crest',icon:'👑',rarity:'Gold',stats:{atk:7,def:6,hp:12},cost:{wood:130,ore:120,essence:25,gold:140},forge:2},
 {id:'hide_barding',cat:'body',name:'Hide Barding',icon:'🛡️',rarity:'Common',stats:{def:5,hp:25},cost:{wood:105,ore:45,essence:0,gold:0},forge:1},
 {id:'iron_scales',cat:'body',name:'Iron Scales',icon:'⛓️',rarity:'Legendary',stats:{def:11,hp:48},cost:{wood:150,ore:165,essence:35,gold:150},forge:2},
 {id:'flint_talons',cat:'claws',name:'Flint Talons',icon:'⚔️',rarity:'Common',stats:{atk:9},cost:{wood:65,ore:60,essence:0,gold:0},forge:1},
 {id:'razor_talons',cat:'claws',name:'Razor Talons',icon:'🗡️',rarity:'Legendary',stats:{atk:20},cost:{wood:145,ore:150,essence:30,gold:170},forge:2},
 {id:'moon_charm',cat:'relic',name:'Moonroot Charm',icon:'🌙',rarity:'Uncommon',stats:{atk:5,hp:14},cost:{wood:115,ore:75,essence:15,gold:0},forge:1},
 {id:'warden_relic',cat:'relic',name:'Warden Sigil',icon:'💠',rarity:'Mythic',stats:{atk:12,def:9,hp:20},cost:{wood:180,ore:180,essence:90,gold:250},forge:3,clears:1},
];
const RECIPE=new Map(RECIPES.map(x=>[x.id,x]));
let focus=null;
function html(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||'&#39;'))}
function num(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.floor(n)):0}
function id(){return globalThis.crypto?.randomUUID?.()||'gear-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}
function refWar(n){return 'war:'+n}
function refComp(c){return 'comp:'+c.id}
function labelRef(r,state,ctx){const x=resolve(r,state,ctx);return x?x.name:'Unknown dinosaur'}
function validKey(x){return typeof x==='string'&&x.length<130&&(/^(war:[0-5]|comp:[a-zA-Z0-9-]{6,110})$/.test(x))}
function parse(x){if(!validKey(x))return null;const split=x.indexOf(':');return {type:x.slice(0,split),token:x.slice(split+1)}}
function roster(s,ctx){const list=[];for(let i=0;i<6;i++){
 const d=s?.dinos?.[i],def=ctx?.D?.[i];if(!d?.unlocked||!def)continue;
 list.push({ref:refWar(i),type:'war',species:i,name:def.name,icon:def.emoji||'🦖',className:def.cls||'Striker',skill:def.skill||'Class skill',rarity:'War Beast',level:num(d.lvl)||1,stars:num(d.stars)||1,bond:0,legacyGear:num(d.gear),source:d});
 }
 for(const c of Array.isArray(s?.creatures)?s.creatures:[]){if(!c||typeof c!=='object'||typeof c.id!=='string')continue;
 const i=Number(c.species);if(!Number.isInteger(i)||i<0||i>=6)continue;
 const def=ctx?.D?.[i];if(!def)continue;
 list.push({ref:refComp(c),type:'comp',species:i,name:c.name||def.name,icon:def.emoji||'🦖',className:def.cls||'Striker',skill:def.skill||'Class skill',rarity:RARITIES.includes(c.rarity)?c.rarity:'Common',level:num(c.level)||1,stars:num(c.stars)||1,bond:num(c.bond),legacyGear:0,source:c});
 }
 return list;
}
function resolve(r,s,ctx){return roster(s,ctx).find(x=>x.ref===r)||null}
function defaults(s,ctx){const refs=roster(s,ctx).filter(x=>x.type==='war').map(x=>x.ref);const oldTeam=Array.isArray(s?.team)?s.team.filter(Number.isInteger).map(i=>refWar(i)).filter(r=>refs.includes(r)):[];const order=[...new Set([...oldTeam,...refs])];const savedHero=refWar(Number.isInteger(s?.living512?.hero)?s.living512.hero:-1);const leaderIndex=order.slice(0,3).indexOf(savedHero);return {slots:[order[0]||null,order[1]||null,order[2]||null],leader:leaderIndex>=0?leaderIndex:0,items:[],createdAt:null}}
function clean(s,ctx){const v=s?.armory514,all=roster(s,ctx),allowed=new Set(all.map(x=>x.ref));
 if(!v||typeof v!=='object'||!Array.isArray(v.slots)||!Array.isArray(v.items))return defaults(s,ctx);
 const raw=v.slots.slice(0,3);while(raw.length<3)raw.push(null);
 const taken=new Set();const slots=raw.map(x=>{if(typeof x!=='string'||!allowed.has(x)||taken.has(x))return null;taken.add(x);return x});
 let leader=Number.isInteger(v.leader)&&v.leader>=0&&v.leader<3?v.leader:0;
 if(!slots[leader])leader=Math.max(0,slots.findIndex(Boolean));
 const items=[];const ids=new Set();const perSlot=new Set();
 for(const item of v.items.slice(0,MAX_ITEMS)){
  if(!item||typeof item!=='object'||typeof item.id!=='string'||item.id.length>100||ids.has(item.id)||!RECIPE.has(item.recipe))continue;
  ids.add(item.id);
  const bp=RECIPE.get(item.recipe);let holder=typeof item.equippedTo==='string'&&allowed.has(item.equippedTo)?item.equippedTo:null;
  if(holder&&perSlot.has(holder+'|'+bp.cat))holder=null;
  if(holder)perSlot.add(holder+'|'+bp.cat);
  items.push({id:item.id,recipe:item.recipe,equippedTo:holder});
 }
 return {slots,leader,items,createdAt:v.createdAt||null};
}
function ensure(s,ctx){s.armory514=clean(s,ctx);return s.armory514}
function load(s,ctx){return clean(s,ctx)}
function starter(s,ctx){const ar=ensure(s,ctx);if(ar.createdAt)return ar;
 // Starter gear is a one-time migration gift, never purchasable with Royal Gems.
 for(const recipe of ['flint_talons','hide_barding']){
  const item={id:id(),recipe,equippedTo:null};ar.items.push(item);
 }
 ar.createdAt=new Date().toISOString();return ar;
}
function equipment(s,ctx,who){const ar=load(s,ctx);const map={head:null,body:null,claws:null,relic:null};
 for(const item of ar.items){if(item.equippedTo!==who)continue;const bp=RECIPE.get(item.recipe);if(bp)map[bp.cat]={...bp,id:item.id}}
 return map;
}
function totals(equipped){const out={atk:0,hp:0,def:0};for(const v of Object.values(equipped))if(v)for(const key of Object.keys(out))out[key]+=num(v.stats?.[key]);return out}
function squadBonus(s,ctx){const a=load(s,ctx);return a.slots.reduce((acc,key,i)=>acc+(i!==a.leader&&key?3:0),0)}
function leader(s,ctx){const a=load(s,ctx);const first=a.slots[a.leader]||a.slots.find(Boolean);return resolve(first,s,ctx)||roster(s,ctx)[0]||null}
function storyHero(s,m,ctx){let chosen=null;
 if(m?.encounter&&validKey(m.heroRef))chosen=resolve(m.heroRef,s,ctx);
 // Preserve an in-progress 5.12/5.13 hero selection when upgrading older saves.
 if(!chosen&&!m?.heroRef&&Number.isInteger(m?.hero)&&(m?.encounter||!s?.armory514))chosen=resolve(refWar(m.hero),s,ctx);
 if(!chosen)chosen=leader(s,ctx);
 if(!chosen){const i=Number.isInteger(m?.hero)?m.hero:0;const d=ctx?.D?.[i];return {i,data:s.dinos?.[i]||{lvl:1,stars:1,gear:0},d:d||{name:'War Beast',cls:'Striker',skill:'Wild Charge'},title:d?.name||'War Beast',equipment:{atk:0,hp:0,def:0},support:0,rarity:'War Beast',ref:refWar(i)}}
 const e=totals(equipment(s,ctx,chosen.ref));const c=chosen.source;
 return {i:chosen.species,data:{lvl:chosen.level,stars:chosen.stars,gear:chosen.legacyGear||0},d:ctx.D[chosen.species],title:chosen.name,equipment:e,support:squadBonus(s,ctx),rarity:chosen.rarity,ref:chosen.ref,bond:chosen.bond,isCompanion:chosen.type==='comp'};
}
function snapshot(s,m,ctx){const hero=leader(s,ctx);if(hero){m.hero=hero.species;m.heroRef=hero.ref;}return hero}
function practiceBonuses(s,ctx,species){return totals(equipment(s,ctx,refWar(species)))}
function lockedBattle(s){return !!s?.living512?.encounter&&['skirmish','defense'].includes(s.living512.phase)}
function costs(b){return Object.entries(b.cost).filter(([,v])=>v>0).map(([key,n])=>({wood:'🪵',ore:'⛏️',essence:'✨',gold:'🪙'}[key]+' '+n)).join(' · ')}
function hasCosts(s,b){return Object.entries(b.cost).every(([key,n])=>num(s[key])>=n)}
function statLine(t){return [t.atk?'⚔️ +'+t.atk:null,t.def?'🛡️ +'+t.def:null,t.hp?'❤️ +'+t.hp:null].filter(Boolean).join(' · ')||'No bonuses'}
function rarityColor(r){return ({Common:'#d4c9b7',Uncommon:'#8ad5ba',Legendary:'#bbadfa',Gold:'#ffce82',Mythic:'#f3a4da',Godly:'#fef0a9'})[r]||'#d4c9b7'}
function pickOptions(s,ctx,slot){const ar=load(s,ctx),list=roster(s,ctx),active=ar.slots[slot];const taken=new Set(ar.slots.filter((x,i)=>i!==slot&&x));
 return `<select class="dd514Select dd514SlotSelect" data-dd514-slot="${slot}" aria-label="Choose dinosaur for squad slot ${slot+1}"><option value="">— Empty slot —</option>${list.map(x=>`<option value="${html(x.ref)}" ${active===x.ref?'selected':''} ${taken.has(x.ref)?'disabled':''}>${html(x.name)} · ${html(x.rarity)} · Lv ${x.level}</option>`).join('')}</select>`;
}
function cardSlot(s,ctx,ar,slot){const key=ar.slots[slot],d=resolve(key,s,ctx),isLead=slot===ar.leader;
 return `<article class="dd514SquadSlot ${isLead?'leader':''}"><header><span>${isLead?'👑 LEAD':'⚔️ SUPPORT'} · SLOT ${slot+1}</span>${d?`<span style="color:${rarityColor(d.rarity)}">${html(d.rarity)}</span>`:''}</header><div class="dd514SquadCharacter"><span class="dd514Portrait">${d?html(d.icon):'➕'}</span><div><strong>${d?html(d.name):'Empty slot'}</strong><small>${d?html(d.className)+' · Lv '+d.level:'Choose a dinosaur below'}</small></div></div>${pickOptions(s,ctx,slot)}<button type="button" class="dd514LeaderButton" data-action="armory:leader:${slot}" ${!d||isLead?'disabled':''}>${isLead?'✓ Squad leader':'Make leader'}</button></article>`;
}
function equipSelect(s,ctx,ar,person,cat){const existing=equipment(s,ctx,person.ref)[cat];const available=ar.items.filter(item=>RECIPE.get(item.recipe)?.cat===cat);
 return `<div class="dd514GearSlot"><div><strong>${CAT_META[cat][0]} ${CAT_META[cat][1]}</strong><small>${existing?html(existing.name)+' · '+statLine(existing.stats):'Nothing equipped'}</small></div><select class="dd514Select dd514GearSelect" data-dd514-gear="${cat}" aria-label="${CAT_META[cat][1]} equipment"><option value="">— Unequip —</option>${available.map(item=>{const b=RECIPE.get(item.recipe);return `<option value="${html(item.id)}" ${existing?.id===item.id?'selected':''}>${html(b.name)}${item.equippedTo&&item.equippedTo!==person.ref?' (move from '+html(labelRef(item.equippedTo,s,ctx))+')':''}</option>`}).join('')}</select></div>`;
}
function whoPicker(s,ctx,person){return `<select class="dd514Select dd514FocusSelect" data-dd514-focus="true" aria-label="Select dinosaur to equip">${roster(s,ctx).map(x=>`<option value="${html(x.ref)}" ${x.ref===person.ref?'selected':''}>${html(x.name)} · ${html(x.rarity)}</option>`).join('')}</select>`}
function development(s,person){const lvl=person.level,star=person.stars,bond=person.bond;const isComp=person.type==='comp';const costs={train:lvl*(isComp?140:180),evolve:star*45,bond:25+bond*15};return `<div class="dd514Grow"><h4>✨ Training & Evolution</h4><div class="dd514GrowStats"><span>LEVEL <b>${lvl}/50</b></span><span>STARS <b>${star}/5</b></span>${isComp?`<span>BOND <b>${bond}/10</b></span>`:''}</div><div class="dd514GrowButtons"><button data-action="armory:train" ${lvl>=50?'disabled':''}>⬆️ Train · ${costs.train} 🪙</button><button data-action="armory:evolve" ${star>=5?'disabled':''}>⭐ Evolve · ${costs.evolve} ✨</button>${isComp?`<button data-action="armory:bond" ${bond>=10?'disabled':''}>❤️ Bond · ${costs.bond} 🪵</button>`:''}</div></div>`}
function inventoryPanel(s,ctx,ar){const items=ar.items;return `<div class="dd514Inventory"><h3>🎒 Owned Gear <small>${items.length}/${MAX_ITEMS} items</small></h3>${!items.length?'<p class="dd514Hint">No gear yet. Claim your starter equipment or craft an item at the Forge.</p>':`<div class="dd514ItemGrid">${items.map(item=>{const bp=RECIPE.get(item.recipe);if(!bp)return '';return `<div class="dd514Owned"><span>${html(bp.icon)}</span><div><b>${html(bp.name)}</b><small>${html(bp.rarity)} · ${statLine(bp.stats)}</small><small>${item.equippedTo?'🦖 On '+html(labelRef(item.equippedTo,s,ctx)):'🎒 In inventory'}</small></div></div>`}).join('')}</div>`}</div>`}
function view(s,ctx){const ar=load(s,ctx),list=roster(s,ctx),person=resolve(focus,s,ctx)||leader(s,ctx)||list[0]||null;
 if(person)focus=person.ref;const equips=person?equipment(s,ctx,person.ref):null;const bonus=equips?totals(equips):{atk:0,def:0,hp:0};const locked=lockedBattle(s);
 return `<section class="dd514Root" id="dd514Armory" aria-label="Dinosaur squad and armory"><header class="dd514Header"><span>🦖 BUILD ${VERSION} · CLOUD KINGDOM STORY</span><h2>⚔️ Dinosaur Loadout & Armory</h2><p>Choose your lead, assign two support dinos, craft unique gear and bring real bonuses into The Living Kingdom battles.</p></header><div class="dd514Pills"><span>👑 1 active leader</span><span>🤝 ${squadBonus(s,ctx)}% squad attack support</span><span>🛡️ Story-only gear</span></div>${locked?'<p class="dd514Warning">⚠️ Finish the current story encounter before changing your squad or equipment.</p>':''}<h3>Battle Squad <small>Three slots · One on-field leader</small></h3><div class="dd514Squad">${[0,1,2].map(i=>cardSlot(s,ctx,ar,i)).join('')}</div>${!ar.createdAt?'<button class="dd514Starter" data-action="armory:starter" '+(locked?'disabled':'')+'>🎁 Claim starter gear (once, free)</button>':''}<p class="dd514Hint">The leader fights on screen in The Living Kingdom. The other two dinosaurs provide +3% attack support each. Three war beasts also update your local 3v3 practice team. Companion-led squads are story-only, never verified PvP troops.</p><div class="dd514ArmoryPanel"><div class="dd514Section"><h3>🛠️ Equip Your Dinosaur</h3>${person?`${whoPicker(s,ctx,person)}<div class="dd514FocusHero"><div class="dd514Portrait">${html(person.icon)}</div><div><strong>${html(person.name)}</strong><small style="color:${rarityColor(person.rarity)}">${html(person.rarity)} · ${html(person.className)} · Level ${person.level}</small></div></div><div class="dd514GearGrid">${CATEGORIES.map(cat=>equipSelect(s,ctx,ar,person,cat)).join('')}</div><p class="dd514Bonus">Equipped stats: ${statLine(bonus)}</p>${development(s,person)}`:'<p>No unlocked dinosaurs yet. Hatch an egg or unlock a war beast first.</p>'}</div><div class="dd514Section"><h3>🔨 Forge Gear</h3><p class="dd514Resource">🪵 ${num(s.wood)} wood · ⛏️ ${num(s.ore)} ore · ✨ ${num(s.essence)} essence · 🪙 ${num(s.gold)} gold · ⚒️ Forge Lv ${num(s.buildings?.forge)}</p><p class="dd514Hint">Your first armory setup grants one pair of Flint Talons and one set of Hide Barding, once. Other gear costs ordinary kingdom resources.</p><div class="dd514Recipes">${RECIPES.map(r=>{const unlock=num(s.buildings?.forge)>=r.forge&&num(s.living512?.clears)>=num(r.clears);const affordable=hasCosts(s,r);return `<article class="dd514Recipe"><div><b>${html(r.icon)} ${html(r.name)}</b><small style="color:${rarityColor(r.rarity)}">${html(r.rarity)} · ${html(CAT_META[r.cat][1])}</small><small>${statLine(r.stats)}</small><small>${costs(r)}</small></div><button data-action="armory:craft:${r.id}" ${!unlock||!affordable||ar.items.length>=MAX_ITEMS||locked?'disabled':''}>${!unlock?`Forge Lv ${r.forge}${r.clears?' + 1 win':''}`:!affordable?'Need supplies':'Craft'}</button></article>`}).join('')}</div></div>${inventoryPanel(s,ctx,ar)}</div><div class="dd514Foot">🔒 Armory items and levels are Cloud Kingdom / local story-save data. They do not grant Royal Authority, verified alliance-war power, or Stripe entitlements.</div></section>`;
}
function changed(s,ctx,msg){ctx.save();ctx.render();if(msg)ctx.notify(msg);return true}
function apply(op,v,s,ctx){if(!s||!ctx?.save||!ctx?.render)return false;if(window.DDCloud?.isLocked?.()){ctx.notify('Cloud Kingdom save conflict. Resolve it before editing loadouts.');ctx.render();return true}
 if(op==='focus'){if(resolve(v,s,ctx)){focus=v;ctx.render()}return true}
 if(lockedBattle(s)){ctx.notify('Finish the active story encounter before editing your squad or equipment.');ctx.render();return true}
 if(op==='starter'){starter(s,ctx);return changed(s,ctx,'🎁 Two starter gear pieces added to inventory.')}let ar=starter(s,ctx);const list=roster(s,ctx);
 if(op==='slot'){
  const [idx,key]=v;
  if(!Number.isInteger(idx)||idx<0||idx>=3||key&&!list.some(x=>x.ref===key))return true;
  if(key&&ar.slots.some((r,i)=>i!==idx&&r===key)){ctx.notify('That dinosaur is already in your squad.');ctx.render();return true}
  ar.slots[idx]=key||null;
  if(!ar.slots[ar.leader])ar.leader=Math.max(0,ar.slots.findIndex(Boolean));
  const warIds=ar.slots.map(r=>r?.startsWith('war:')?Number(r.slice(4)):-1);
  if(warIds.every(i=>i>=0)&&new Set(warIds).size===3)s.team=[...warIds];
  const champion=leader(s,ctx);if(champion)s.selected=champion.species;
  return changed(s,ctx,'Squad updated and saved.');
 }
 if(op==='gear'){
  const [cat,itemId,who]=v;
  if(!CATEGORIES.includes(cat)||!resolve(who,s,ctx))return true;
  const wanted=itemId?ar.items.find(x=>x.id===itemId):null;
  if(itemId&&(!wanted||RECIPE.get(wanted.recipe)?.cat!==cat))return true;
  const from=ar.items.find(x=>x.equippedTo===who&&RECIPE.get(x.recipe)?.cat===cat);
  if(from)from.equippedTo=null;
  if(wanted)wanted.equippedTo=who;focus=who;
  return changed(s,ctx,wanted?'⚔️ '+RECIPE.get(wanted.recipe).name+' equipped.':'Gear unequipped.');
 }
 if(op==='leader'){
  const slot=Number(v);if(!Number.isInteger(slot)||slot<0||slot>=3||!ar.slots[slot])return true;
  ar.leader=slot;const champion=leader(s,ctx);if(champion)s.selected=champion.species;return changed(s,ctx,'👑 '+labelRef(ar.slots[slot],s,ctx)+' is your story-battle leader.');
 }
 if(op==='craft'){
  const bp=RECIPE.get(v);if(!bp)return true;
  if(ar.items.length>=MAX_ITEMS){ctx.notify('Inventory full (80 gear items).');ctx.render();return true;}
  if(num(s?.buildings?.forge)<bp.forge||num(s?.living512?.clears)<num(bp.clears)){ctx.notify('Forge level or frontier victory requirement not met.');ctx.render();return true}
  if(!hasCosts(s,bp)){ctx.notify('Not enough wood, ore, essence, or gold.');ctx.render();return true}
  for(const [key,value] of Object.entries(bp.cost))s[key]-=value;
  ar.items.push({id:id(),recipe:bp.id,equippedTo:null});
  return changed(s,ctx,'⚒️ '+bp.name+' crafted. Equip it below.');
 }
 if(['train','evolve','bond'].includes(op)){
  const person=resolve(focus,s,ctx)||leader(s,ctx);if(!person)return true;
  const costs={train:person.level*(person.type==='comp'?140:180),evolve:person.stars*45,bond:25+person.bond*15};
  const field=op==='train'?'gold':op==='evolve'?'essence':'wood';
  if(op==='bond'&&person.type!=='comp')return true;
  if(op==='train'&&person.level>=50||op==='evolve'&&person.stars>=5||op==='bond'&&person.bond>=10){ctx.notify('Maximum progression reached.');ctx.render();return true}
  if(num(s[field])<costs[op]){ctx.notify('Not enough '+field+'.');ctx.render();return true}
  s[field]-=costs[op];
  if(op==='train'){if(person.type==='war')person.source.lvl=person.level+1;else person.source.level=person.level+1;}
  if(op==='evolve')person.source.stars=person.stars+1;
  if(op==='bond')person.source.bond=person.bond+1;
  return changed(s,ctx,person.name+' '+(op==='train'?'trained':op==='evolve'?'evolved':'bond increased')+'!');
 }
 return false;
}
function handleAction(action,s,ctx){if(!action?.startsWith?.('armory:'))return false;const parts=action.split(':'),op=parts[1];if(op==='starter')return apply('starter',null,s,ctx);if(op==='leader')return apply('leader',parts[2],s,ctx);if(op==='craft')return apply('craft',parts[2],s,ctx);if(['train','evolve','bond'].includes(op))return apply(op,null,s,ctx);return false}
function domChange(event){const t=event.target;if(!t?.matches)return;
 const game=window.DD514Game;if(!game?.apply)return;
 if(t.matches('.dd514SlotSelect')){game.apply('slot',[Number(t.dataset.dd514Slot),t.value||null]);return}
 if(t.matches('.dd514FocusSelect')){game.apply('focus',t.value);return}
 if(t.matches('.dd514GearSelect')){const who=document.querySelector('.dd514FocusSelect')?.value;if(who)game.apply('gear',[t.dataset.dd514Gear,t.value||null,who]);}
}
function init(){window.DD514={view,handleAction,storyHero,snapshot,leader,apply,equipment,totals,roster,practiceBonuses,version:VERSION};document.addEventListener('change',domChange);window.DD512Game?.refresh?.()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Dino Dominion Build 5.12 — The Living Kingdom (playable client-side story vertical slice).
   Story progression belongs ONLY to existing Cloud Kingdom/device save. No modifications
   to Royal Authority, multiplayer, verified rankings, Stripe, or egg rarity odds.
   All mutations go through the existing game save/refresh closures.
*/
(()=>{'use strict';
const PHASES=['scout','route','skirmish','repair','siege','defense','victory'];
const ROUTES={forest:{name:'Moonroot Forest',icon:'🌿',description:'Follow the overgrown trail; safer enemy, more wood.'},ridge:{name:'Ember Ravine',icon:'🌋',description:'Cross the broken ridge; harder enemy, more ore.'}};
const LV={'Common':0,'Uncommon':1,'Legendary':2,'Gold':3,'Mythic':4,'Godly':5};
const langText={
 en:{title:'The Living Kingdom',act:'THE BROKEN GATE',sub:'One connected adventure: scout, battle, rebuild, defend.',visit:'🧭 Enter Living Adventure',go:'Go to Explore',local:'STORY MODE · CLOUD KINGDOM SAVE',notice:'Story battles and rewards use your kingdom save, not server-verified online PvP.',begin:'Scout the frontier · 1 energy',choose:'Choose a route',battle:'A wild guardian blocks the trail',repair:'Return home. Reinforce the northern gate.',defend:'Your gate is fortified. Defend the kingdom!',win:'Frontier defended!',again:'↻ New frontier patrol',chooseHero:'Choose your lead war beast',where:'Go to Base',stage:'QUEST PROGRESS',start:'Scout',trail:'Trail',fight:'Encounter',gate:'Fortify',boss:'Defense',claim:'Victory',forest:'🌿 Take forest trail',ridge:'🌋 Take ravine trail',attack:'⚔️ Strike',guard:'🛡️ Guard',skill:'✨ Class ability',ready:'Prepare your team',supply:'Kingdom supplies',fortify:'🔨 Reinforce gate',siege:'⚔️ Start gate defense · 2 energy',questWon:'Rebuilding succeeded. Your kingdom stands.',victoryReward:'First clear reward: 350 gold, 75 essence and local commander XP.',vault:'Companions assist your local story fight when saved.',bossWarning:'Fortified walls and dinosaur training make the defense easier.'},
 fr:{title:'Le Royaume Vivant',act:'LA PORTE BRISÉE',sub:'Une aventure liée : explorer, combattre, reconstruire, défendre.',visit:'🧭 Commencer l’aventure',go:'Aller explorer',local:'HISTOIRE · SAUVEGARDE ROYAUME',notice:'Récompenses locales, pas de PvP vérifié.',begin:'Explorer · 1 énergie',choose:'Choisir une route',battle:'Un gardien sauvage bloque le chemin',repair:'Rentrez renforcer la porte.',defend:'Défendez le royaume !',win:'Frontière protégée !',again:'↻ Nouvelle patrouille',chooseHero:'Choisir un dinosaure',where:'Aller à la base',stage:'PROGRESSION',start:'Départ',trail:'Piste',fight:'Combat',gate:'Porte',boss:'Défense',claim:'Victoire',forest:'🌿 Route forestière',ridge:'🌋 Route volcanique',attack:'⚔️ Attaquer',guard:'🛡️ Protéger',skill:'✨ Pouvoir',ready:'Préparer l’équipe',supply:'Ressources du royaume',fortify:'🔨 Renforcer la porte',siege:'⚔️ Défendre · 2 énergie',questWon:'Votre royaume tient bon.',victoryReward:'Butin local : or, essence et expérience.',vault:'Les compagnons sauvegardés renforcent le combat local.',bossWarning:'Le forge et l’entraînement renforcent la défense.'},
 ar:{title:'المملكة الحيّة',act:'البوابة المكسورة',sub:'مغامرة مترابطة: استكشف، قاتل، ابنِ، دافع.',visit:'🧭 ابدأ المغامرة',go:'اذهب للاستكشاف',local:'نمط القصة · حفظ المملكة',notice:'المكافآت محلية وليست نقاط قتال تنافسية معتمدة.',begin:'استكشاف · طاقة واحدة',choose:'اختر الطريق',battle:'حارس بري يعترض الطريق',repair:'عُد إلى القلعة لإصلاح البوابة',defend:'دافع عن المملكة!',win:'تم الدفاع عن الحدود!',again:'↻ دورية جديدة',chooseHero:'اختر الديناصور',where:'اذهب للقاعدة',stage:'تقدم المهمة',start:'البداية',trail:'الطريق',fight:'قتال',gate:'البوابة',boss:'الدفاع',claim:'النصر',forest:'🌿 طريق الغابة',ridge:'🌋 طريق البركان',attack:'⚔️ هجوم',guard:'🛡️ دفاع',skill:'✨ قدرة خاصة',ready:'حضّر فريقك',supply:'موارد المملكة',fortify:'🔨 أصلح البوابة',siege:'⚔️ ابدأ الدفاع · طاقتان',questWon:'صمدت المملكة.',victoryReward:'مكافآت محلية من الذهب والخبرة.',vault:'الديناصورات المرافقة تدعم معارك القصة.',bossWarning:'تقوية الحصن وتدريب الديناصورات يساعدان.'},
 es:{title:'El Reino Viviente',act:'LA PUERTA ROTA',sub:'Una aventura conectada: explora, lucha, construye, defiende.',visit:'🧭 Comenzar aventura',go:'Ir a explorar',local:'HISTORIA · GUARDADO',notice:'Recompensas locales, no PvP verificado.',begin:'Explorar · 1 energía',choose:'Elige una ruta',battle:'Guardián salvaje del sendero',repair:'Vuelve y refuerza la puerta.',defend:'¡Defiende tu reino!',win:'¡Frontera defendida!',again:'↻ Nueva patrulla',chooseHero:'Elige dinosaurio',where:'Ir a la base',stage:'PROGRESO',start:'Inicio',trail:'Ruta',fight:'Lucha',gate:'Puerta',boss:'Defensa',claim:'Victoria',forest:'🌿 Bosque',ridge:'🌋 Barranco',attack:'⚔️ Atacar',guard:'🛡️ Defender',skill:'✨ Habilidad',ready:'Prepara tu equipo',supply:'Recursos',fortify:'🔨 Reparar puerta',siege:'⚔️ Defender · 2 energía',questWon:'El reino está a salvo.',victoryReward:'Oro, esencia y experiencia local.',vault:'Tus compañeros ayudan en el combate local.',bossWarning:'La fortaleza ayuda en defensa.'},
 pt:{title:'O Reino Vivo',act:'O PORTÃO QUEBRADO',sub:'Uma aventura: explore, lute, reconstrua, defenda.',visit:'🧭 Começar aventura',go:'Ir explorar',local:'HISTÓRIA · SALVAMENTO',notice:'Recompensas locais, não PvP verificado.',begin:'Explorar · 1 energia',choose:'Escolha o caminho',battle:'Guardião selvagem',repair:'Volte e reforce o portão.',defend:'Defenda o reino!',win:'Fronteira protegida!',again:'↻ Nova patrulha',chooseHero:'Escolha dinossauro',where:'Ir à base',stage:'PROGRESSO',start:'Início',trail:'Rota',fight:'Luta',gate:'Portão',boss:'Defesa',claim:'Vitória',forest:'🌿 Floresta',ridge:'🌋 Desfiladeiro',attack:'⚔️ Atacar',guard:'🛡️ Defender',skill:'✨ Habilidade',ready:'Prepare sua equipe',supply:'Recursos',fortify:'🔨 Reforçar portão',siege:'⚔️ Defender · 2 energia',questWon:'O reino está a salvo.',victoryReward:'Ouro, essência e XP local.',vault:'Companheiros ajudam na batalha local.',bossWarning:'Uma fortaleza forte ajuda na defesa.'}
};
const langs=Object.keys(langText);
function tr(k){const code=window.DDWorldwide?.getLanguage?.()||'en';return (langText[code]||langText.en)[k]||langText.en[k]||k}
function html(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(v){return Math.max(0,Math.round(Number(v)||0))}
function rounded(v){return num(v).toLocaleString('en-CA')}
function now(){return new Date().toISOString()}
function cleanPhase(s){const p=s?.living512?.phase;return PHASES.includes(p)?p:'scout'}
function mission(s){const saved=s?.living512;const phase=cleanPhase(s);return saved&&typeof saved==='object'&&PHASES.includes(saved.phase)?saved:{phase:'scout',route:'forest',hero:0,encounter:null,clears:0,patrol:1,lastLog:['The northern watch has gone silent.']}}
function ensure(s){if(!s.living512||!PHASES.includes(s.living512.phase))s.living512={phase:'scout',route:'forest',hero:0,encounter:null,clears:0,patrol:1,lastLog:['The northern watch has gone silent.']};return s.living512}
function dinos(s){return Array.isArray(s?.dinos)?s.dinos:[]}
function availableHero(s,idx){return Number.isInteger(idx)&&idx>=0&&idx<dinos(s).length&&Boolean(s.dinos[idx]?.unlocked)}
function lead(s,m){return availableHero(s,m.hero)?m.hero:dinos(s).findIndex(d=>d?.unlocked)}
function companion(s){const collection=Array.isArray(s?.creatures)?s.creatures:[];let best=null;for(const c of collection){if(!c||typeof c!=='object')continue;const r=LV[c.rarity]??0;if(!best||r>best.tier)best={name:String(c.name||'Companion').slice(0,50),rarity:String(c.rarity||'Common'),tier:r,bonus:Math.round(4+r*3),species:num(c.species)};}return best}
function cost(s){const forge=num(s?.buildings?.forge);return {wood:Math.max(55,145-forge*12),ore:Math.max(40,95-forge*7)}}
function heroInfo(s,m,ctx){const equipped=window.DD514?.storyHero?.(s,m,ctx);if(equipped)return equipped;const i=lead(s,m);const d=ctx?.D?.[i];return {i,data:s.dinos[i]||{lvl:1,stars:1,gear:0},d:d||{name:'War Beast',emoji:'🦖',cls:'Striker',skill:'Wild Charge'},title:d?.name||'War Beast',equipment:{atk:0,hp:0,def:0},support:0}}
function info(s,m,ctx){const hero=heroInfo(s,m,ctx);const unit=hero.data;const ally=companion(s);const level=num(unit.lvl)||1,stars=num(unit.stars)||1,gear=num(unit.gear),forge=num(s?.buildings?.forge),academy=num(s?.buildings?.academy),base=num(s?.base);const eq=hero.equipment||{atk:0,hp:0,def:0};const bondBonus=hero.isCompanion?Math.min(10,num(hero.bond)):0;return {hero,ally,hp:125+level*23+stars*12+base*4+num(eq.hp),atk:Math.round((19+level*6+gear*7+stars*5+academy*4+num(eq.atk))*(1+(ally?.bonus||0)/100)*(1+num(hero.support)/100)*(1+bondBonus/200)),fort:12+forge*9+base*3+num(eq.def)*2,armor:Math.min(16,num(eq.def))}}
function newCombat(s,m,ctx,boss=false){window.DD514?.snapshot?.(s,m,ctx);const stats=info(s,m,ctx),ridge=m.route==='ridge';const enemyMax=boss?220+num(s.base)*10+(num(s?.buildings?.academy)>3?20:0):(ridge?145:115);m.encounter={type:boss?'boss':'trail',hp:stats.hp,max:stats.hp,enemyHp:enemyMax,enemyMax,shield:boss?stats.fort:0,turn:0,ability:0,target:'core',combo:0,lastMove:'ready',notes:[boss?'🌑 The Obsidian Warden approaches the gates.':ridge?'🌋 A Ravine Stalker emerges from the rocks.':'🌿 A Moonroot Sentinel emerges from the vines.']};}
function stageIdx(p){if(p==='scout')return 0;if(p==='route')return 1;if(p==='skirmish')return 2;if(p==='repair')return 3;if(p==='siege'||p==='defense')return 4;return 5}
function btn(action,label,enabled=true,klass=''){return `<button type="button" class="dd512Btn ${klass}" data-action="living:${html(action)}" ${enabled?'':'disabled'}>${html(label)}</button>`}
function badge(text){return `<span class="dd512Badge">${html(text)}</span>`}
function progress(p){const names=[tr('start'),tr('trail'),tr('fight'),tr('gate'),tr('boss'),tr('claim')];const current=stageIdx(p);return `<div class="dd512Progress" aria-label="${html(tr('stage'))}">${names.map((name,i)=>`<span class="${i<current?'done':i===current?'current':''}">${i<current?'✓ ':''}${html(name)}</span>`).join('')}</div>`}
function banner(s){const m=mission(s),index=stageIdx(m.phase),label=[tr('begin'),tr('choose'),tr('battle'),tr('repair'),tr('defend'),tr('defend'),tr('win')][PHASES.indexOf(m.phase)]||tr('begin');return `<section class="dd512Banner"><div class="dd512PulsingOrb" aria-hidden="true">🦖</div><div><div class="dd512Kicker">BUILD 5.12 · ${html(tr('act'))}</div><h3>${html(tr('title'))}</h3><p>${html(tr('sub'))}</p><div class="dd512BannerRow">${badge('Chapter 1 · '+(index+1)+'/6')}${badge('⚔️ '+label)}</div>${btn('travel',tr('visit'),true,'primary')}</div></section>`}
function worldBanner(s){return banner(s)}
function basePanel(s){const m=mission(s);const active=m.phase==='repair';const costs=cost(s);return `<section class="dd512Base panel"><div class="dd512Kicker">🔨 BUILD 5.12 · FRONTIER FORTIFICATIONS</div><h3>🏰 ${html(tr('repair'))}</h3><p>${html(tr('bossWarning'))}</p><div class="dd512Supply">🪵 ${rounded(s.wood)}/${costs.wood} &nbsp; ⛏️ ${rounded(s.ore)}/${costs.ore} &nbsp; ⚒️ Forge Lv.${num(s?.buildings?.forge)}</div>${active?btn('repair',tr('fortify'),num(s.wood)>=costs.wood&&num(s.ore)>=costs.ore,'primary')+`<small>Building strength reduces the repair cost and protects your dinosaur during the siege.</small>`:m.phase==='siege'||m.phase==='defense'||m.phase==='victory'?badge('✅ Gate reinforced · local campaign'):btn('travel',tr('go'))}</section>`}
function heroSelection(s,m,ctx){if(window.DD514?.storyHero){const hero=heroInfo(s,m,ctx);return `<div class="dd514StoryPicker"><div><b>👑 ${html(hero.title||hero.d.name)}</b><small>${html(hero.rarity||'War Beast')} · Lv ${num(hero.data.lvl)} · ${html(hero.d.cls||'Striker')}</small><small>Equipped: ⚔️ +${num(hero.equipment?.atk)} · 🛡️ +${num(hero.equipment?.def)} · ❤️ +${num(hero.equipment?.hp)}</small></div><button type="button" data-action="living:armory">🛠️ Manage squad</button></div>`;}let buttons='';for(let i=0;i<dinos(s).length;i++){if(!availableHero(s,i))continue;const d=ctx?.D?.[i];buttons+=`<button type="button" class="dd512HeroSelect ${lead(s,m)===i?'selected':''}" aria-pressed="${lead(s,m)===i}" data-action="living:hero:${i}"><span>${html(d?.emoji||'🦖')}</span><b>${html(d?.name||'Dino '+(i+1))}</b><small>Lv ${num(s.dinos[i].lvl)}</small></button>`;}return `<div class="dd512Heroes"><div class="dd512MiniTitle">${html(tr('chooseHero'))}</div><div class="dd512HeroChoices">${buttons}</div></div>`}
function combatPanel(s,m,ctx){const b=m.encounter;if(!b)return `<p class="dd512Hint">Preparing the encounter…</p>`;const infoHero=heroInfo(s,m,ctx),hp=Math.min(100,Math.round(b.hp/Math.max(b.max,1)*100)),foe=Math.min(100,Math.round(b.enemyHp/Math.max(b.enemyMax,1)*100));const name=b.type==='boss'?'Obsidian Warden':m.route==='ridge'?'Ravine Stalker':'Moonroot Sentinel';const available=b.ability<=0;return `<div class="dd512Combat ${b.type==='boss'?'boss':''} ${b.lastMove==='skill'?'skillMove':b.lastMove==='strike'?'strikeMove':b.lastMove==='guard'?'guardMove':''}" aria-label="Tactical dinosaur encounter"><div class="dd512Scene"><div class="dd512Fog"></div><div class="dd512Dino dd512Friendly"><span>${html(infoHero.d.emoji)}</span><strong>${html(infoHero.d.name)}</strong><div class="dd512Hp"><i style="width:${hp}%"></i></div><small>${num(b.hp)}/${num(b.max)} HP</small></div><div class="dd512Clash">⚔️</div><div class="dd512Dino dd512Enemy"><span>${b.type==='boss'?'🐉':m.route==='ridge'?'🦖':'🦕'}</span><strong>${name}</strong><div class="dd512Hp enemy"><i style="width:${foe}%"></i></div><small>${num(b.enemyHp)}/${num(b.enemyMax)} HP</small></div></div>${companion(s)?`<div class="dd512AllyAssist">🌟 ${html(companion(s).name)} · ${html(companion(s).rarity)} companion · +${companion(s).bonus}% local damage</div>`:''}<div class="dd512CombatStats">${badge('Turn '+(num(b.turn)+1))}${badge('🛡️ Shield '+num(b.shield))}${badge('✨ Skill '+(available?'Ready':'Ready in '+num(b.ability)))}</div><div class="dd512CombatControls">${btn('strike',tr('attack'),true,'primary')}${btn('guard',tr('guard'))}${btn('skill',tr('skill')+(available?'':' · '+b.ability),available,'gold')}</div><div class="dd512BattleLog" role="status" aria-live="polite">${(Array.isArray(b.notes)?b.notes:[]).slice(-3).reverse().map(x=>`<div>${html(x)}</div>`).join('')}</div><p class="dd512Hint">Skills depend on your dinosaur class. The Academy, Forge, and owned companions provide local story bonuses.</p></div>`}
function adventurePanel(s,ctx){const m=mission(s),h=heroInfo(s,m,ctx),ally=companion(s),c=cost(s),p=stageIdx(m.phase);let content='';
 if(m.phase==='scout')content=`${heroSelection(s,m,ctx)}<p>Ancient tracks lead from the castle to a broken frontier gate. Scout the forest to find out what attacked.</p>${btn('scout',tr('begin'),num(s.energy)>=1,'primary')}`;
 if(m.phase==='route')content=window.DD513?.routePanel?.(s,m,ctx)||`<h3>${html(tr('choose'))}</h3><p>Your scout finds two paths toward the gate. The route changes the guardian you fight and the materials you bring home.</p><div class="dd512Routes"><div><strong>${ROUTES.forest.icon} ${ROUTES.forest.name}</strong><p>${ROUTES.forest.description}</p>${btn('route:forest',tr('forest'),true,'primary')}</div><div><strong>${ROUTES.ridge.icon} ${ROUTES.ridge.name}</strong><p>${ROUTES.ridge.description}</p>${btn('route:ridge',tr('ridge'),true,'gold')}</div></div>`;
 if(m.phase==='skirmish'||m.phase==='defense')content=`<h3>${html(m.phase==='skirmish'?tr('battle'):tr('defend'))}</h3>${window.DD513?.combatPanel?.(s,m,ctx)||combatPanel(s,m,ctx)}`;
 if(m.phase==='repair')content=`<div class="dd512Decision"><span>🏰</span><div><h3>${html(tr('repair'))}</h3><p>You returned with supplies. Rebuilding the gate will prepare the defenses for the Warden's attack.</p><div class="dd512Supply">🪵 ${rounded(s.wood)} / ${c.wood} &nbsp; ⛏️ ${rounded(s.ore)} / ${c.ore}</div>${btn('base',tr('where'),true,'primary')}${btn('repair',tr('fortify'),num(s.wood)>=c.wood&&num(s.ore)>=c.ore,'gold')}</div></div>`;
 if(m.phase==='siege')content=`<div class="dd512Decision"><span>🛡️</span><div><h3>${html(tr('defend'))}</h3><p>Choose a trained war beast. Your Forge and Citadel now add a defensive shield.</p>${heroSelection(s,m,ctx)}${btn('defend',tr('siege'),num(s.energy)>=2,'primary')}<small>Current energy: ${num(s.energy)} / 12. You can wait for recovery or train your dinosaur first.</small></div></div>`;
 if(m.phase==='victory')content=`<div class="dd512Victory"><span>🏆</span><h3>${html(tr('win'))}</h3><p>${html(tr('questWon'))}</p><p>${html(tr('victoryReward'))}</p><strong>🏅 Frontier defenses completed: ${num(m.clears)}</strong><div>${btn('patrol',tr('again'),true,'primary')}</div></div>`;
 return `<section class="dd512Quest" id="dd512Quest"><header><div class="dd512Kicker">${html(tr('local'))}</div><h2>🌍 ${html(tr('title'))}</h2><p>${html(tr('sub'))}</p></header>${progress(m.phase)}<div class="dd512MissionBody">${content}</div><footer><div class="dd512Tags">${badge('⚡ '+num(s.energy)+'/12 energy')}${badge('🦖 '+(h.title||h.d.name))}${badge(ally?'🌟 '+ally.rarity+' +'+ally.bonus+'%':'🥚 No companion bonus')}${badge('🏰 Forge Lv.'+num(s?.buildings?.forge))}</div><small>🔒 ${html(tr('notice'))}</small></footer></section>`;
}
// Battle calculation: only local story save data, no server-verified consequences.
function fightAction(action,s,m,ctx){const b=m.encounter;if(!b||num(b.hp)<=0||num(b.enemyHp)<=0)return false;const stats=info(s,m,ctx),d=stats.hero.d,cl=d.cls||'Striker';let note='',hit=0,shield=0,heal=0;
 if(action==='skill'){
  if(num(b.ability)>0){ctx.notify('Class ability is recharging.');return true;}
  b.ability=3;
  if(cl==='Guardian'){shield=53+num(s?.buildings?.forge)*6;note='🛡️ '+d.name+' raises a protective barrier!';hit=Math.round(stats.atk*.8)}
  else if(cl==='Support'){heal=43+num(s?.buildings?.academy)*4;note='🌿 '+d.name+' restores its strength!';hit=Math.round(stats.atk*.75)}
  else if(cl==='Assassin'){hit=Math.round(stats.atk*2.2);note='✨ '+d.name+' executes an ambush!';}
  else {hit=Math.round(stats.atk*1.7);note='✨ '+d.name+' uses '+(d.skill||'a class technique')+'!';}
 }else if(action==='guard'){shield=28+num(s?.buildings?.forge)*4;note='🛡️ '+d.name+' braces for the next strike.';}
 else {hit=stats.atk+((num(b.turn)%3)-1)*5;note='⚔️ '+d.name+' strikes the enemy!';}
 // Tactical target is stored inside the EXISTING 5.12 encounter object.
 // Older encounters have no target/combos and safely default to Body / 0.
 const target=['head','core','legs'].includes(b.target)?b.target:'core';
 let headRisk=0,legSoftening=0;
 if(action!=='guard'){
  if(action==='skill'&&num(b.combo)>=2){hit=Math.round(hit*1.20);note+=' ⚡ Momentum unleashed!';b.combo=0}
  else if(action==='strike')b.combo=Math.min(3,num(b.combo)+1);
  if(target==='head'){hit=Math.round(hit*1.30);headRisk=11;note+=' 🎯 Head strike (+30%, risky).'}
  if(target==='legs'){hit=Math.round(hit*.83);legSoftening=15;note+=' 🦵 Leg strike (enemy slowed).'}
 }else b.combo=0;
 b.lastMove=action;b.shield=num(b.shield)+shield;
 b.hp=Math.min(b.max,num(b.hp)+heal);
 b.enemyHp=Math.max(0,num(b.enemyHp)-Math.max(0,hit));
 b.notes.push(note+(hit?' '+num(hit)+' damage.':''));
 if(b.enemyHp===0){
  m.encounter=null;
  if(m.phase==='skirmish'){
    m.phase='repair';
    const route=ROUTES[m.route]||ROUTES.forest;
    s.wood=num(s.wood)+(m.route==='forest'?115:45);
    s.ore=num(s.ore)+(m.route==='ridge'?105:45);
    s.essence=num(s.essence)+16;
    s.gold=num(s.gold)+120;
    m.lastLog=[route.name+' cleared. Supplies recovered.','Return to the castle to reinforce the gate.'];
    ctx.notify('🌿 Guardian defeated! Supplies recovered. Return to the castle.');
  }else{
    m.phase='victory';m.clears=num(m.clears)+1;
    s.gold=num(s.gold)+350;s.essence=num(s.essence)+75;
    s.wood=num(s.wood)+100;
    s.xp=num(s.xp)+70;
    if(s.xp>=num(s.level)*100&&num(s.level)>0){s.xp-=num(s.level)*100;s.level+=1;}
    m.lastLog=['The Obsidian Warden has fallen.','The gate is safe. The kingdom celebrates.'];
    ctx.notify('🏆 FRONTIER SAVED! Gold, essence, and XP awarded.');
  }
  ctx.save();ctx.render();return true;
 }
 if(b.ability>0&&action!=='skill')b.ability=Math.max(0,b.ability-1);
 // Enemy turn — guard/forge mitigates this reliably.
 const boss=m.phase==='defense';
 const baseDamage=Math.max(0,(boss?36:24)+(num(b.turn)%3===2?13:0)+(m.route==='ridge'&&!boss?8:0)+headRisk-legSoftening-num(stats.armor));
 const blocked=Math.min(num(b.shield),baseDamage);
 b.shield=Math.max(0,num(b.shield)-blocked);
 b.hp=Math.max(0,num(b.hp)-(baseDamage-blocked));
 b.notes.push('🐲 Enemy attack: '+(baseDamage-blocked)+' HP lost'+(blocked?' ('+blocked+' blocked)':'')+'.');
 b.turn=num(b.turn)+1;
 if(b.hp<=0){m.encounter=null;m.phase=boss?'siege':'route';m.lastLog=['Your dinosaur withdrew to recover. The mission can be retried.'];ctx.notify('⚔️ Retreat! Train your war beast, then try again.');}
 ctx.save();ctx.render();return true;
}
function handleAction(action,s,ctx){if(typeof action!=='string'||!action.startsWith('living:'))return false;const cmd=action.slice(7),m=ensure(s);if(window.DDCloud?.isLocked()){ctx.notify('Cloud Kingdom needs attention. Protect your save first.');return true;}
 if(cmd==='armory'){ctx.go('dinos');return true;}
 if(cmd==='travel'){ctx.go('explore');return true;}
 if(cmd==='base'){ctx.go('base');return true;}
 if(cmd.startsWith('hero:')){const hero=Number(cmd.slice(5));if(!availableHero(s,hero)){ctx.notify('Unlock that war beast first.');return true;}if(m.phase==='skirmish'||m.phase==='defense'){ctx.notify('Finish the active battle before changing your dinosaur.');return true;}m.hero=hero;if(s.armory514&&window.DD514){ctx.notify('Choose your active dinosaur from the 5.14 loadout in Dinos.');ctx.render();return true;}ctx.save();ctx.render();return true;}
 if(cmd.startsWith('target:')){
  if(!['skirmish','defense'].includes(m.phase)||!m.encounter)return true;
  const target=cmd.slice(7);
  if(!['head','core','legs'].includes(target))return true;
  m.encounter.target=target;
  ctx.save();ctx.render();return true;
 }
 if(cmd==='scout'){if(m.phase!=='scout')return true;if(num(s.energy)<1){ctx.notify('Need 1 energy to scout.');return true;}s.energy-=1;m.phase='route';m.lastLog=['Scouts discovered fresh tracks leading into the Hollow.'];ctx.notify('🔎 Two trails discovered!');ctx.save();ctx.render();return true;}
 if(cmd.startsWith('route:')){const route=cmd.slice(6);if(m.phase!=='route'||!ROUTES[route])return true;m.route=route;m.phase='skirmish';newCombat(s,m,ctx,false);ctx.save();ctx.render();ctx.notify(ROUTES[route].name+' — guardian encountered!');return true;}
 if(['strike','guard','skill'].includes(cmd)){if(m.phase!=='skirmish'&&m.phase!=='defense')return true;return fightAction(cmd,s,m,ctx);}
 if(cmd==='repair'){if(m.phase!=='repair')return true;const c=cost(s);if(num(s.wood)<c.wood||num(s.ore)<c.ore){ctx.notify('Gather more wood and ore at your kingdom.');return true;}s.wood-=c.wood;s.ore-=c.ore;m.phase='siege';m.lastLog=['The northern gate is rebuilt. Defend it against the Warden.'];ctx.notify('🔨 Frontier gate fortified. Battle is ready!');ctx.save();ctx.render();return true;}
 if(cmd==='defend'){if(m.phase!=='siege')return true;if(num(s.energy)<2){ctx.notify('Need 2 energy before defending the gate.');return true;}s.energy-=2;m.phase='defense';newCombat(s,m,ctx,true);ctx.notify('⚔️ The Warden attacks the gate!');ctx.save();ctx.render();return true;}
 if(cmd==='patrol'){if(m.phase!=='victory')return true;const total=num(m.clears),patrol=num(m.patrol)+1,hero=lead(s,m);s.living512={phase:'scout',route:'forest',hero:Math.max(0,hero),encounter:null,clears:total,patrol,lastLog:['A new frontier disturbance has been reported.']};ctx.notify('🧭 A new patrol begins.');ctx.save();ctx.render();return true;}
 return false;
}
function init(){window.DD512={worldBanner,basePanel,adventurePanel,handleAction,version:'5.12.0-alpha.1 + 5.13 tactical compatibility'};window.DD512Game?.refresh?.();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

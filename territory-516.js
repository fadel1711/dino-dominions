/* Dino Dominion 5.16 — Territory Conquest (story campaign).
 * Additive Cloud Kingdom state only: territory516. No Supabase SQL, verified PvP,
 * nine-territory alliance-war ownership, payment, or cloud-sync modifications.
 */
(()=>{'use strict';
const VERSION='5.16.1-alpha.1';
const REGIONS=[
 {id:'fangwood',icon:'🌲',name:'Fangwood Pass',fort:'Rootfang Watch',req:null,cost:{wood:60,provisions:25},hp:140,attack:17,reward:{gold:240,wood:350,provisions:45,xp:65}},
 {id:'ember',icon:'🌋',name:'Emberwatch Keep',fort:'Ashscale Citadel',req:'fangwood',cost:{ore:100,provisions:45},hp:235,attack:24,reward:{gold:480,ore:410,essence:35,provisions:75,xp:100}},
 {id:'crystal',icon:'💎',name:'Crystal Bastion',fort:'The Prism Throne',req:'ember',cost:{wood:145,ore:160,provisions:65},hp:345,attack:32,reward:{gold:850,wood:500,ore:500,essence:100,provisions:110,xp:160}}
];
const MAP=new Map(REGIONS.map(x=>[x.id,x]));
const I18N={
 en:{tag:'BUILD 5.16 · TERRITORY CONQUEST',title:'The Frontier Campaign',sub:'Defeat NPC strongholds and claim new story provinces. Separate from the 9 shared alliance-war territories.',locked:'Unlock by conquering',taken:'Conquered',open:'Attack stronghold',continue:'Resume siege',price:'Siege supplies',spoils:'First-clear rewards',await:'Spoils waiting for Royal Mail space',redeem:'Deliver spoils',battle:'Siege in progress',hero:'Royal Vanguard',enemy:'Stronghold garrison',attack:'Strike',guard:'Defend',skill:'Class skill',retreat:'Retreat',turn:'Turn',hp:'Health',log:'Battle journal',need:'Establish your Build 5.15 outposts to begin.',offline:'Cloud Kingdom story mode only · never used for ranked PvP or paid rewards',win:'Province conquered! Your spoils have been sent to Royal Mail.',loss:'Your army was defeated. Regroup before the next siege.',insufficient:'Not enough siege supplies.',cloud:'Resolve your cloud save before continuing.',closed:'Finish your existing siege first.',cooldown:'Skill cooling down.',retreated:'Siege abandoned. Supplies are not refunded.',failed:'Royal Mail is full. Claim other parcels, then deliver your spoils.'},
 fr:{tag:'VERSION 5.16 · CONQUÊTE',title:'Campagne des frontières',sub:'Prenez les forteresses PNJ. Distinct des neuf territoires de guerre d’alliance.',locked:'Débloquer après',taken:'Conquis',open:'Attaquer',continue:'Reprendre le siège',price:'Provisions du siège',spoils:'Récompenses',await:'Récompenses en attente',redeem:'Envoyer au courrier',battle:'Siège en cours',hero:'Avant-garde royale',enemy:'Garnison',attack:'Attaquer',guard:'Défendre',skill:'Compétence',retreat:'Battre en retraite',turn:'Tour',hp:'Santé',log:'Journal',need:'Construisez les avant-postes 5.15 pour commencer.',offline:'Campagne Cloud Kingdom seulement · aucun effet sur le JcJ classé.',win:'Territoire conquis ! Récompenses au courrier royal.',loss:'Armée vaincue. Regroupez vos forces.',insufficient:'Ressources insuffisantes.',cloud:'Résolvez votre sauvegarde cloud.',closed:'Terminez le siège actuel.',cooldown:'Compétence indisponible.',retreated:'Siège abandonné, provisions non remboursées.',failed:'Courrier plein. Réclamez les colis et réessayez.'},
 ar:{tag:'الإصدار 5.16 · غزو الأراضي',title:'حملة الحدود',sub:'اهزم حصون الأعداء في طور القصة. منفصل عن أراضي حرب التحالف التسع.',locked:'يفتح بعد',taken:'تم الغزو',open:'هاجم الحصن',continue:'تابع الحصار',price:'مؤن الحصار',spoils:'مكافآت النصر',await:'مكافآت تنتظر البريد',redeem:'أرسل المكافآت',battle:'حصار جارٍ',hero:'الطليعة الملكية',enemy:'حامية الحصن',attack:'هجوم',guard:'دفاع',skill:'قدرة خاصة',retreat:'انسحاب',turn:'الدور',hp:'الصحة',log:'سجل القتال',need:'أنشئ مواقع الإنتاج في الإصدار 5.15 أولاً.',offline:'قصة المملكة السحابية فقط · لا تأثير على المعارك المصنفة.',win:'تم الغزو! المكافآت في البريد الملكي.',loss:'خسر جيشك المعركة. حاول مجدداً.',insufficient:'الموارد غير كافية.',cloud:'حل مشكلة الحفظ السحابي أولاً.',closed:'أنهِ حصارك الحالي أولاً.',cooldown:'القدرة قيد الانتظار.',retreated:'انسحبت دون استرداد المؤن.',failed:'البريد ممتلئ، استلم الرسائل ثم حاول مجدداً.'},
 es:{tag:'VERSIÓN 5.16 · CONQUISTA',title:'Campaña de la frontera',sub:'Conquista fortalezas PNJ. Separado de las nueve regiones de guerra de alianzas.',locked:'Desbloquear tras',taken:'Conquistado',open:'Atacar',continue:'Continuar asedio',price:'Suministros',spoils:'Botín',await:'Botín pendiente',redeem:'Enviar botín',battle:'Asedio en curso',hero:'Vanguardia real',enemy:'Guarnición',attack:'Atacar',guard:'Defender',skill:'Habilidad',retreat:'Retirada',turn:'Turno',hp:'Vida',log:'Registro',need:'Construye primero los puestos de 5.15.',offline:'Solo historia de Cloud Kingdom · no altera PvP competitivo.',win:'¡Territorio conquistado! Botín enviado al correo.',loss:'Tu ejército fue derrotado.',insufficient:'No hay suficientes suministros.',cloud:'Resuelve el guardado en la nube.',closed:'Termina el asedio actual.',cooldown:'Habilidad en espera.',retreated:'Asedio abandonado sin reembolso.',failed:'Correo lleno. Recoge otros premios primero.'},
 pt:{tag:'VERSÃO 5.16 · CONQUISTA',title:'Campanha da fronteira',sub:'Conquiste fortalezas NPC. Separado dos nove territórios da guerra de alianças.',locked:'Liberar após',taken:'Conquistado',open:'Atacar',continue:'Retomar cerco',price:'Suprimentos',spoils:'Recompensas',await:'Recompensas pendentes',redeem:'Enviar recompensas',battle:'Cerco em andamento',hero:'Vanguarda real',enemy:'Guarnição',attack:'Atacar',guard:'Defender',skill:'Habilidade',retreat:'Recuar',turn:'Turno',hp:'Vida',log:'Registro',need:'Estabeleça os postos de 5.15 primeiro.',offline:'Apenas campanha Cloud Kingdom · não afeta PvP ranqueado.',win:'Província conquistada! Recompensas no correio.',loss:'Seu exército foi derrotado.',insufficient:'Suprimentos insuficientes.',cloud:'Resolva o salvamento na nuvem.',closed:'Termine o cerco atual.',cooldown:'Habilidade em espera.',retreated:'Cerco abandonado sem reembolso.',failed:'Correio cheio. Resgate recompensas e tente novamente.'}
};
const t=()=>I18N[window.DDWorldwide?.getLanguage?.()]||I18N.en;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number.isFinite(Number(x))?Math.max(0,Math.floor(Number(x))):0;
const bound=(x,a,b)=>Math.max(a,Math.min(b,n(x)));
const fmt=x=>n(x).toLocaleString('en-CA');
const icon={gold:'🪙',wood:'🪵',ore:'⛏️',essence:'✨',provisions:'🌾',xp:'⭐'};
const line=o=>Object.entries(o).map(([k,v])=>(icon[k]||k)+' '+fmt(v)).join(' · ');
function current(s){const v=s?.territory516;return v&&typeof v==='object'?v:null}
function ensure(s){let v=current(s);if(!v){s.territory516=v={version:1,captured:[],owed:[],fight:null};}if(!Array.isArray(v.captured))v.captured=[];if(!Array.isArray(v.owed))v.owed=[];return v}
function owned(v,id){return !!v?.captured?.includes(id)}
function costs(s,c){return !!s?.kingdom515?.outposts&&Object.entries(c).every(([k,v])=>n(k==='provisions'?s.kingdom515.provisions:s[k])>=v)}
function spend(s,c){if(!costs(s,c))return false;for(const [k,v] of Object.entries(c))if(k==='provisions')s.kingdom515.provisions-=v;else s[k]-=v;return true}
function army(s,ctx){const r=window.DD514?.leader?.(s,{D:ctx?.D||[]});const unit=r?.source;const lvl=bound(r?.level??s?.dinos?.[0]?.lvl??1,1,70),stars=bound(r?.stars??unit?.stars??1,1,8);const squad=window.DD514?.roster?.(s,{D:ctx?.D||[]})||[];
 const support=Math.min(16,Math.max(0,squad.length-1)*4);return {name:String(r?.name||'Royal Vanguard').slice(0,50),level:lvl,hp:150+lvl*5+stars*14,attack:25+lvl*3+stars*5+support,skill:String(r?.skill||'Primal Assault').slice(0,70)};
}
const PATCH_WORDS={
 en:{free:'⚔️ Free first siege',tip:'🎓 FIRST SIEGE FREE · One training attempt, no wood or provisions spent. Your progress will be saved.',need:'Need',collect:'Collect supplies in Royal Mail.'},
 fr:{free:'⚔️ Premier siège gratuit',tip:'🎓 PREMIER SIÈGE GRATUIT · Un essai sans dépenses. La progression est sauvegardée.',need:'Il manque',collect:'Collectez au Courrier royal.'},
 ar:{free:'⚔️ الحصار الأول مجاني',tip:'🎓 الحصار الأول مجاني · محاولة واحدة دون دفع موارد. سيتم حفظ التقدم.',need:'المطلوب',collect:'استلم الموارد من البريد الملكي.'},
 es:{free:'⚔️ Primer asedio gratis',tip:'🎓 PRIMER ASEDIO GRATIS · Un intento sin gastar recursos. Se guardará tu progreso.',need:'Falta',collect:'Reclama en el Correo Real.'},
 pt:{free:'⚔️ Primeiro cerco grátis',tip:'🎓 PRIMEIRO CERCO GRÁTIS · Uma tentativa sem gastar recursos. O progresso será salvo.',need:'Faltam',collect:'Resgate no Correio Real.'}
};
const patch=()=>PATCH_WORDS[window.DDWorldwide?.getLanguage?.()]||PATCH_WORDS.en;
function freeIntro(v,r){return r.id==='fangwood'&&!v?.introUsed&&!v?.captured?.includes('fangwood')}
function shortage(s,c){return Object.entries(c).filter(([k,need])=>n(k==='provisions'?s?.kingdom515?.provisions:s?.[k])<need)
 .map(([k,need])=>({wood:'🪵',ore:'⛏️',provisions:'🌾'}[k]||k)+' '+(need-n(k==='provisions'?s?.kingdom515?.provisions:s?.[k]))).join(' · ')}
function cleanedFight(v){const f=v?.fight;if(!f||!MAP.has(f.region))return null;return {...f,hp:bound(f.hp,0,10000),maxHp:bound(f.maxHp,1,10000),enemyHp:bound(f.enemyHp,0,10000),turn:bound(f.turn,1,999),cd:bound(f.cd,0,3),log:Array.isArray(f.log)?f.log.slice(-5).map(x=>String(x).slice(0,160)):[]};}
function view(s,ctx){const l=t(),v=current(s),fight=cleanedFight(v),canPlay=!!s?.kingdom515?.outposts;
 let out=`<section class="dd516Root panel" id="dd516Conquest"><div class="dd516Eyebrow">⚔️ ${esc(l.tag)}</div><h2>${esc(l.title)}</h2><p class="dd516Muted">${esc(l.sub)}</p><div class="dd516Map" role="list">`;
 for(const [i,r] of REGIONS.entries()){
  const done=owned(v,r.id),previous=r.req&&MAP.get(r.req),locked=!!previous&&!owned(v,previous.id),inFight=fight?.region===r.id;
  const owed=Array.isArray(v?.owed)&&v.owed.includes(r.id);
  out+=`<article class="dd516Region ${done?'dd516Owned':''} ${inFight?'dd516UnderSiege':''}" role="listitem"><div class="dd516RegionTitle"><span class="dd516Symbol">${r.icon}</span><div><small>PROVINCE ${i+1} / 3</small><h3>${esc(r.name)}</h3><span>${esc(r.fort)}</span></div></div>`;
  if(done){out+=`<div class="dd516Status">👑 ${esc(l.taken)}</div>${owed?`<button class="dd516Btn" data-dd516="redeem:${r.id}">✉️ ${esc(l.redeem)}</button>`:''}`;}
  else if(locked)out+=`<p class="dd516Muted">🔒 ${esc(l.locked)} ${esc(previous.name)}</p>`;
  else{out+=`<p><b>${esc(l.price)}</b><br>${line(r.cost)}</p><p class="dd516Muted">${esc(l.spoils)}: ${line(r.reward)}</p>`;
   const free=!inFight&&freeIntro(v,r),blocked=!canPlay||(!inFight&&!!fight)||(!inFight&&!free&&!costs(s,r.cost));
   out+=`${free?`<p class="dd516Intro">${esc(patch().tip)}</p>`:''}<button class="dd516Btn" data-dd516="${inFight?'focus':'start'}:${r.id}" ${blocked?'disabled':''}>${esc(inFight?l.continue:free?patch().free:l.open)}</button>${!inFight&&!free&&!costs(s,r.cost)?`<p class="dd516Missing">${esc(patch().need)}: ${esc(shortage(s,r.cost))}. ${esc(patch().collect)}</p>`:''}`;
  }out+='</article>';
 }
 out+='</div>';
 if(!canPlay)out+=`<p class="dd516Warning">${esc(l.need)}</p>`;
 if(fight){const r=MAP.get(fight.region),who=army(s,ctx);let heroPct=Math.max(0,Math.min(100,Math.round(fight.hp/Math.max(1,fight.maxHp)*100))),npcPct=Math.max(0,Math.min(100,Math.round(fight.enemyHp/r.hp*100)));
  out+=`<div class="dd516Battle" id="dd516Battle" aria-live="polite"><div class="dd516Eyebrow">🛡️ ${esc(l.battle)} · ${esc(r.name)} · ${esc(l.turn)} ${fmt(fight.turn)}</div><div class="dd516Duel"><div class="dd516Fighter"><span class="dd516FighterIcon">🦖</span><strong>${esc(who.name)}</strong><small>${esc(l.hero)}</small><div class="dd516Health"><i style="width:${heroPct}%"></i></div><small>${esc(l.hp)} ${fmt(fight.hp)} / ${fmt(fight.maxHp)}</small></div><div class="dd516VS">VS</div><div class="dd516Fighter"><span class="dd516FighterIcon">🦕</span><strong>${esc(r.fort)}</strong><small>${esc(l.enemy)}</small><div class="dd516Health enemy"><i style="width:${npcPct}%"></i></div><small>${esc(l.hp)} ${fmt(fight.enemyHp)} / ${fmt(r.hp)}</small></div></div><div class="dd516Actions"><button data-dd516="strike:${r.id}">${esc(l.attack)}</button><button data-dd516="guard:${r.id}">${esc(l.guard)}</button><button data-dd516="skill:${r.id}" ${fight.cd>0?'disabled':''}>✨ ${esc(l.skill)}${fight.cd>0?' ('+fight.cd+')':''}</button><button class="dd516Exit" data-dd516="retreat:${r.id}">${esc(l.retreat)}</button></div><details><summary>${esc(l.log)}</summary><ol>${fight.log.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></details></div>`;
 }
 if(v?.owed?.length)out+=`<div class="dd516Warning">✉️ ${esc(l.await)}</div>`;
 out+=`<p class="dd516Fine">🔒 ${esc(l.offline)}</p></section>`;
 return out;
}
function deliver(s,r){const v=ensure(s);if(!v.owed.includes(r.id))v.owed.push(r.id);
 const delivered=window.DD515?.deliver?.(s,{id:'conquest516-'+r.id,source:'story-conquest:516:'+r.id,title:'🏆 '+r.name+' liberated',text:'NPC stronghold defeated. Permanent story conquest reward, once per kingdom.',amounts:r.reward});
 if(delivered)v.owed=v.owed.filter(x=>x!==r.id);return !!delivered;
}
function changed(ctx,msg){ctx.save();ctx.render();if(msg)ctx.notify(msg)}
function apply(verb,id,s,ctx){const l=t(),r=MAP.get(id);if(!r)return true;
 if(window.DDCloud?.isLocked?.()){ctx.notify(l.cloud);return true;}
 const v=ensure(s),fight=cleanedFight(v),done=owned(v,id);
 if(verb==='redeem'){if(done&&v.owed.includes(id)){changed(ctx,deliver(s,r)?l.win:l.failed);}return true;}
 if(verb==='focus'){document.getElementById('dd516Battle')?.scrollIntoView?.({behavior:'smooth',block:'center'});return true;}
 if(verb==='start'){
  if(done)return true;if(r.req&&!owned(v,r.req)){ctx.notify(l.locked);return true;}
  if(fight){ctx.notify(l.closed);return true;}
  const free=freeIntro(v,r);
  if(!free&&!spend(s,r.cost)){ctx.notify(l.insufficient+': '+shortage(s,r.cost));return true;}
  if(free)v.introUsed=true; // Additive save field: used once on starting the first siege, even if lost/retreated.
  const unit=army(s,ctx);v.fight={region:id,hp:unit.hp,maxHp:unit.hp,enemyHp:r.hp,turn:1,cd:0,log:['Your vanguard approaches '+r.fort+'.']};changed(ctx,free?'🎓 Free training siege started! Use Attack, Guard or Skill.':'⚔️ '+r.name+' — siege started');if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>document.getElementById('dd516Battle')?.scrollIntoView?.({behavior:'smooth',block:'nearest'}));return true;
 }
 if(!fight||fight.region!==id)return true;
 if(verb==='retreat'){v.fight=null;changed(ctx,l.retreated);return true;}
 if(!['strike','guard','skill'].includes(verb))return true;
 if(verb==='skill'&&fight.cd>0){ctx.notify(l.cooldown);return true;}
 const unit=army(s,ctx),turn=fight.turn;
 let damage=verb==='guard'?0:Math.round(unit.attack*(verb==='skill'?1.6:1)*(1+((turn%3)-1)*.05));
 const logs=fight.log;
 if(verb==='guard'){fight.hp=Math.min(fight.maxHp,fight.hp+8);logs.push('Turn '+turn+': shield raised; recovered 8 health.');}
 else {fight.enemyHp=Math.max(0,fight.enemyHp-damage);logs.push('Turn '+turn+': '+unit.name+' dealt '+damage+' damage'+(verb==='skill'?' with '+unit.skill:'')+'.');}
 if(verb==='skill')fight.cd=3;else fight.cd=Math.max(0,fight.cd-1);
 if(fight.enemyHp===0){if(!owned(v,id))v.captured.push(id);v.fight=null;const sent=deliver(s,r);changed(ctx,sent?l.win:l.failed);return true;}
 const hit=Math.max(1,Math.round(r.attack*(verb==='guard'?.28:1)*(1+((turn%3)-1)*.07)));
 fight.hp=Math.max(0,fight.hp-hit);logs.push('Turn '+turn+': garrison struck for '+hit+' damage.');fight.turn=turn+1;fight.log=logs.slice(-5);
 if(fight.hp===0){v.fight=null;changed(ctx,l.loss);return true;}
 v.fight=fight;changed(ctx);return true;
}
function onClick(e){const b=e.target?.closest?.('[data-dd516]');if(!b||b.disabled)return;const [verb,id]=String(b.dataset.dd516||'').split(':');if(!MAP.has(id))return;e.preventDefault();window.DD516Game?.apply?.(verb,id);}
function init(){window.DD516={worldView:view,apply,version:VERSION,regions:REGIONS.map(({id,name})=>({id,name}))};document.addEventListener('click',onClick);window.addEventListener('dd59-language-changed',()=>window.DD516Game?.refresh?.());window.DD516Game?.refresh?.();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Dino Dominion Build 5.16.1 — resource HUD, display only, no game-state mutation. */
(()=>{'use strict';
const $=id=>document.getElementById(id),fmt=x=>Math.max(0,Math.floor(Number(x)||0)).toLocaleString('en-CA');
const I18N={
 en:{title:'🌿 KINGDOM RESOURCES',collect:'✉️ Collect',wood:'WOOD',ore:'ORE',essence:'ESSENCE',provisions:'FOOD',ready:'ready',notStarted:'Not started',build:'🏗️ Establish your four outposts in Base to produce resources.',mail:'Collect from Royal Mail.',ship:'✉️ Shipments available.',next:'next +1 in'},
 fr:{title:'🌿 RESSOURCES DU ROYAUME',collect:'✉️ Récolter',wood:'BOIS',ore:'MINERAI',essence:'ESSENCE',provisions:'VIVRES',ready:'prêts',notStarted:'Non démarré',build:'🏗️ Construisez quatre avant-postes dans Base.',mail:'Récoltez au Courrier royal.',ship:'✉️ Livraison prête.',next:'prochain +1 dans'},
 ar:{title:'🌿 موارد المملكة',collect:'✉️ استلام',wood:'خشب',ore:'خام',essence:'جوهر',provisions:'مؤن',ready:'جاهز',notStarted:'لم يبدأ',build:'🏗️ ابنِ أربعة مراكز إنتاج في القاعدة.',mail:'استلم من البريد الملكي.',ship:'✉️ شحنة جاهزة.',next:'الوحدة التالية خلال'},
 es:{title:'🌿 RECURSOS DEL REINO',collect:'✉️ Cobrar',wood:'MADERA',ore:'MINERAL',essence:'ESENCIA',provisions:'VÍVERES',ready:'listo',notStarted:'Sin iniciar',build:'🏗️ Establece cuatro puestos en Base.',mail:'Reclama en el Correo Real.',ship:'✉️ Envío disponible.',next:'próximo +1 en'},
 pt:{title:'🌿 RECURSOS DO REINO',collect:'✉️ Coletar',wood:'MADEIRA',ore:'MINÉRIO',essence:'ESSÊNCIA',provisions:'COMIDA',ready:'pronto',notStarted:'Não iniciado',build:'🏗️ Estabeleça quatro postos na Base.',mail:'Resgate no Correio Real.',ship:'✉️ Remessa disponível.',next:'próximo +1 em'}
};
const lang=()=>I18N[window.DDWorldwide?.getLanguage?.()]||I18N.en;
function refresh(){
 const s=window.DD5161Game?.getState?.();if(!s)return;
 const l=lang(),heading=document.querySelector('.dd5161HudHeader strong'),claim=$('dd5161Claim');
 if(heading)heading.textContent=l.title;if(claim)claim.textContent=l.collect;
 const k=s.kingdom515,rates=window.DD515?.resources?.(s,{D:window.DD5161Game?.getDinos?.()||[]})||{};
 const map={wood:s.wood,ore:s.ore,essence:s.essence,provisions:k?.provisions};
 const ids={wood:'Wood',ore:'Ore',essence:'Essence',provisions:'Provisions'};
 for(const key of Object.keys(map)){
  const value=$("dd5161"+ids[key]),rate=$("dd5161"+ids[key]+"Rate"),box=document.querySelector('[data-dd5161-resource="'+key+'"]');
  if(value)value.textContent=k?fmt(map[key]):key==='provisions'?'—':fmt(map[key]);
  const label=box?.querySelector?.('span');if(label)label.textContent=({wood:'🪵 ',ore:'⛏️ ',essence:'✨ ',provisions:'🌾 '}[key])+l[key];
  if(rate)rate.textContent=k?(rates[key]?.pending>0?'✉️ '+fmt(rates[key].pending)+' '+l.ready:'+'+fmt(rates[key]?.rate)+'/h'):(key==='provisions'?l.notStarted:'—');
  if(box)box.classList.toggle('dd5161Ready',!!k&&(rates[key]?.pending||0)>0);
 }
 const hint=$('dd5161Hint');
 if(hint){
  if(!k)hint.textContent=l.build;
  else{
   const ready=Object.values(rates).some(x=>x?.pending>0);
   const food=rates.provisions,ms=food?.next;
   hint.textContent=(ready?l.ship+' ':'')+'🌾 +'+fmt(food?.rate)+'/h'+(Number.isFinite(ms)?' · '+l.next+' '+Math.max(1,Math.ceil(ms/1000))+'s':'')+' · '+l.mail;
  }
 }
 const farm=$('dd515FarmTicker');if(farm&&window.DD515?.nextFood)farm.textContent=window.DD515.nextFood(s,{D:window.DD5161Game?.getDinos?.()||[]});
}
function init(){
 window.DD5161={refresh,version:'5.16.1'};
 $('dd5161Claim')?.addEventListener('click',()=>window.DDFullUI?.open?.('mail'));
 refresh();
 setInterval(refresh,15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

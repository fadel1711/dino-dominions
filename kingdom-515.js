/* Dino Dominion 5.15 — Rise of the Kingdom.
 * Client/Cloud Kingdom save only. NO edits to Supabase, Royal Authority, Stripe, verified PvP,
 * or paid entitlements. Mailbox rewards use the existing game state/save bridge.
 */
(()=>{'use strict';
const VERSION='5.15.0-alpha.1',HOUR=3600000,MAX_MAIL=250;
const OUTPOSTS={lumber:{icon:'🌲',name:'Royal Lumberyard',resource:'wood',rate:26,price:{wood:100,ore:45,provisions:0}},mine:{icon:'⛏️',name:'Stone Quarry',resource:'ore',rate:19,price:{wood:95,ore:70,provisions:0}},farm:{icon:'🌾',name:'Sunfield Farms',resource:'provisions',rate:16,price:{wood:85,ore:55,provisions:0}},grove:{icon:'✨',name:'Essence Grove',resource:'essence',rate:6,price:{wood:130,ore:95,provisions:15}}};
const JOBS={lumber:{title:'Lumber crew',site:'lumber'},mine:{title:'Quarry crew',site:'mine'},farm:{title:'Harvest crew',site:'farm'}};
const RESEARCH=[
 {id:'supply',branch:'Economy',name:'Supply Routes',desc:'+10% all outpost output',cost:{gold:160,wood:100,provisions:30}},
 {id:'storage',branch:'Economy',name:'Deep Storage',desc:'Raise offline production capacity from 8h to 12h',req:'supply',cost:{gold:260,ore:140,provisions:55}},
 {id:'masonry',branch:'Economy',name:'Efficient Masonry',desc:'-10% outpost upgrade costs',req:'storage',cost:{gold:380,wood:200,provisions:80}},
 {id:'claws',branch:'Warfare',name:'Battle Drills',desc:'+10% Living Battlefield attack',cost:{gold:150,ore:90,provisions:35}},
 {id:'guard',branch:'Warfare',name:'Fortified Ranks',desc:'+25 story-battle health',req:'claws',cost:{gold:230,wood:150,provisions:55}},
 {id:'plate',branch:'Warfare',name:'Tempered Plates',desc:'+4 story-battle armor',req:'guard',cost:{gold:330,ore:210,essence:30,provisions:75}},
 {id:'tracking',branch:'Dinosaurs',name:'Ancient Tracking',desc:'+5% legacy expedition success chance',cost:{gold:170,wood:90,provisions:35}},
 {id:'bond',branch:'Dinosaurs',name:'Pack Instinct',desc:'+5% Living Battlefield attack',req:'tracking',cost:{gold:270,essence:55,provisions:55}},
 {id:'field',branch:'Dinosaurs',name:'Field Experience',desc:'+25% earned story/expedition XP',req:'bond',cost:{gold:390,essence:90,provisions:80}}
];
const RMAP=new Map(RESEARCH.map(r=>[r.id,r]));
const WORDS={en:{outposts:'Kingdom Outposts',start:'Establish 4 outposts',startHint:'Activate once to start producing resources. Your kingdom save will remember the start time.',mail:'Open Royal Mail',jobs:'Dinosaur Workers',workerHint:'Assign spare dinosaurs, not your battle squad. Each working dinosaur adds 35% output to one site.',research:'Royal Research',shipment:'Outpost shipment',collect:'Claim',all:'Claim all kingdom rewards',reward:'Kingdom Rewards',locked:'Your cloud save needs attention before claiming.',provisions:'Provisions'},fr:{outposts:'Avant-postes du royaume',start:'Établir 4 avant-postes',startHint:'Activer une seule fois pour commencer la production.',mail:'Ouvrir le courrier royal',jobs:'Dinosaures ouvriers',workerHint:'Assignez des dinosaures hors de l’équipe de combat.',research:'Recherche royale',shipment:'Livraison des avant-postes',collect:'Réclamer',all:'Tout réclamer',reward:'Récompenses du royaume',locked:'Résolvez la sauvegarde cloud avant de réclamer.',provisions:'Provisions'},ar:{outposts:'مراكز إنتاج المملكة',start:'إنشاء أربعة مراكز إنتاج',startHint:'فعّل الإنتاج مرة واحدة للبدء.',mail:'افتح البريد الملكي',jobs:'ديناصورات عاملة',workerHint:'اختر ديناصورات خارج فريق القتال.',research:'الأبحاث الملكية',shipment:'شحنة الموارد',collect:'استلام',all:'استلام الكل',reward:'مكافآت المملكة',locked:'يجب حل تعارض الحفظ السحابي.',provisions:'مؤن'},es:{outposts:'Puestos del reino',start:'Fundar cuatro puestos',startHint:'Activa la producción una vez.',mail:'Abrir correo real',jobs:'Dinosaurios trabajadores',workerHint:'Asigna dinosaurios fuera de tu equipo de batalla.',research:'Investigación real',shipment:'Suministros de los puestos',collect:'Reclamar',all:'Reclamar todo',reward:'Recompensas del reino',locked:'Resuelve primero el guardado de la nube.',provisions:'Provisiones'},pt:{outposts:'Postos do reino',start:'Fundar quatro postos',startHint:'Ative a produção uma vez.',mail:'Abrir correio real',jobs:'Dinossauros trabalhadores',workerHint:'Escolha dinossauros fora da equipe de batalha.',research:'Pesquisa real',shipment:'Suprimentos dos postos',collect:'Resgatar',all:'Resgatar todos',reward:'Recompensas do reino',locked:'Resolva primeiro o conflito de salvamento.',provisions:'Provisões'}};
const lang=()=>WORDS[window.DDWorldwide?.getLanguage?.()]||WORDS.en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const n=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
const fmt=v=>n(v).toLocaleString('en-CA');
const cap=(v,min,max)=>Math.max(min,Math.min(max,v));
const now=()=>Date.now();
function fresh(at=now()){return {version:1,startedAt:at,provisions:0,outposts:{lumber:{level:1,harvestAt:at},mine:{level:1,harvestAt:at},farm:{level:1,harvestAt:at},grove:{level:1,harvestAt:at}},jobs:{lumber:null,mine:null,farm:null},research:[],mail:[],serial:0,lastGather:0}}
function state(s,create=false){if(!s||typeof s!=='object')return null;let k=s.kingdom515;if(!k||typeof k!=='object'||!k.outposts){if(!create)return null;s.kingdom515=k=fresh();}return k}
function keys(s){const a=s?.armory514?.slots;return new Set(Array.isArray(a)?a.filter(Boolean):[])}
function rosters(s,ctx){const rs=window.DD514?.roster?.(s,{D:ctx?.D||[]})||[];return rs.filter(x=>x&&typeof x.ref==='string');}
function jobsSanitized(s,ctx){const k=state(s);if(!k)return {lumber:null,mine:null,farm:null};const roster=new Set(rosters(s,ctx).map(x=>x.ref)),squad=keys(s),used=new Set(),jobs={};for(const id of Object.keys(JOBS)){const r=k.jobs?.[id];jobs[id]=typeof r==='string'&&roster.has(r)&&!squad.has(r)&&!used.has(r)?r:null;if(jobs[id])used.add(jobs[id]);}return jobs}
function has(s,c){return Object.entries(c).every(([key,value])=>(key==='provisions'?n(state(s)?.provisions):n(s[key]))>=value)}
function spend(s,c){if(!has(s,c))return false;for(const [key,value] of Object.entries(c)){if(key==='provisions')state(s).provisions-=value;else s[key]-=value;}return true}
function price(k,id){const a=OUTPOSTS[id],lvl=cap(n(k.outposts[id]?.level),1,5),discount=k.research.includes('masonry') ? .9 : 1;return Object.fromEntries(Object.entries(a.price).map(([key,v])=>[key,Math.ceil(v*(lvl+1)*discount)]).filter(([,v])=>v>0))}
function rate(s,id,ctx){const k=state(s),o=k?.outposts?.[id],site=OUTPOSTS[id];if(!o||!site)return 0;const workers=jobsSanitized(s,ctx);const job=workers[id]||null;const multiplier=1+(k.research.includes('supply') ? .1 : 0)+(job ? .35 : 0);return site.rate*cap(n(o.level),1,5)*multiplier}
function preview(s,id,ctx,at=now()){const k=state(s),o=k?.outposts?.[id];if(!o)return 0;const hours=cap((at-n(o.harvestAt))/HOUR,0,k.research.includes('storage')?12:8);return Math.floor(hours*rate(s,id,ctx))}
function queued(k){return Array.isArray(k?.mail)?k.mail.filter(m=>m&&!m.claimedAt):[]}
function mails(k){return Array.isArray(k?.mail)?k.mail:[]}
function deliver(s,entry){const k=state(s,true);if(!Array.isArray(k.mail))k.mail=[];const id=typeof entry?.id==='string'&&entry.id.length<140?entry.id:`parcel-${++k.serial}`;if(k.mail.some(x=>x.id===id))return false;const amounts={};for(const [key,val] of Object.entries(entry?.amounts||{})){if(['gold','wood','ore','essence','provisions','xp','gems'].includes(key)&&n(val)>0)amounts[key]=Math.min(n(val),10000000)}
 if(!Object.keys(amounts).length)return false;
 if(k.mail.length>=MAX_MAIL){k.mail=k.mail.filter(m=>!m.claimedAt);if(k.mail.length>=MAX_MAIL)return false;}
 k.mail.unshift({id,source:typeof entry.source==='string'?entry.source:null,title:String(entry.title||'Kingdom reward').slice(0,90),text:String(entry.text||'Your rewards await.').slice(0,260),amounts,at:now(),claimedAt:0});badgeRefresh();return true}
function accrue(s,ctx){const k=state(s);if(!k)return 0;const at=now();let total=0;
 for(const id of Object.keys(OUTPOSTS)){const amount=preview(s,id,ctx,at),o=k.outposts?.[id];if(!o||amount<1)continue;
 const key=OUTPOSTS[id].resource;const pending=mails(k).find(m=>!m.claimedAt&&m.source==='outpost:'+id);
 if(pending)pending.amounts[key]=Math.min(10000000,n(pending.amounts[key])+amount);
 else if(!deliver(s,{source:'outpost:'+id,title:OUTPOSTS[id].icon+' '+OUTPOSTS[id].name+' shipment',text:'Supplies produced by your kingdom, delivered to Royal Mail.',amounts:{[key]:amount}}))continue;
 o.harvestAt=at;total+=amount;
 }
 return total;
}
function awards(s,ctx){const k=state(s),out=[];if(k)for(const msg of mails(k))if(!msg.claimedAt){const match=Object.entries(OUTPOSTS).find(([id])=>msg.source==='outpost:'+id);const extra=match?preview(s,match[0],ctx):0;out.push({...msg,amounts:extra?{...msg.amounts,[match[1].resource]:n(msg.amounts[match[1].resource])+extra}:msg.amounts,type:'stored'});}
 if(k)for(const [id,site] of Object.entries(OUTPOSTS)){const amt=preview(s,id,ctx);if(amt>0&&!mails(k).some(m=>!m.claimedAt&&m.source==='outpost:'+id))out.push({id:'outpost-ready:'+id,type:'preview',title:site.icon+' '+site.name+' shipment',text:'Outpost production delivered to Mail.',amounts:{[site.resource]:amt}});}
 if(s?.royalEconomy&&now()-n(s.royalEconomy.lastDaily)>=86400000)out.unshift({id:'daily',type:'daily',title:'🎁 Daily kingdom supply',text:'Your 24-hour gift is waiting.',amounts:{gold:260,wood:150,ore:100},extra:'💎 +60 DEMO gems'});
 if(now()-n(s?.lastCollect)>=60000)out.push({id:'territory',type:'territory',title:'🪙 Territory income',text:'Claim gold from your controlled territories.',amounts:{gold:Math.round((s?.lands?.length||1)*160*(1+royalVIP(s)*.05))}});
 if(now()-n(k?.lastGather)>=600000)out.push({id:'supply-run',type:'supply-run',title:'🌲 Kingdom supply run',text:'A free supply patrol every 10 minutes.',amounts:{wood:160+n(s?.buildings?.hatchery)*20,ore:100+n(s?.buildings?.forge)*15}});
 return out;
}
function royalVIP(s){const p=[0,150,400,900,1750,3000],xp=n(s?.royalEconomy?.vipXP);return p.reduce((i,v)=>xp>=v?i:i,0)}
function pending(s,ctx){const k=state(s);const parcels=queued(k).length;let count=parcels;
 if(s?.royalEconomy&&now()-n(s.royalEconomy.lastDaily)>=86400000)count++;
 // The notification badge should not nag every minute for repeatable territory/gather income.
 // Show meaningful shipments, daily gifts, and earned quest letters. Repeatable income remains in Mail.
 if(k)for(const id of Object.keys(OUTPOSTS))if(preview(s,id,ctx)>=Math.ceil(rate(s,id,ctx))&&!mails(k).some(m=>!m.claimedAt&&m.source==='outpost:'+id))count++;
 return count;
}
function costText(c){return Object.entries(c).map(([x,v])=>({gold:'🪙',wood:'🪵',ore:'⛏️',essence:'✨',provisions:'🌾'}[x]||x)+' '+fmt(v)).join(' · ')}
function button(act,name,disabled=false,extra=''){return `<button type="button" data-dd515="${esc(act)}" ${disabled?'disabled':''} ${extra}>${esc(name)}</button>`}
function resourceLine(s){const k=state(s);return `🪙 ${fmt(s.gold)} · 🪵 ${fmt(s.wood)} · ⛏️ ${fmt(s.ore)} · ✨ ${fmt(s.essence)} · 🌾 ${fmt(k?.provisions)}`}
function baseView(s,ctx){const k=state(s),t=lang();let out=`<section id="dd515Economy" class="dd515Economy panel"><div class="dd515Eyebrow">🏰 BUILD 5.15 · RISE OF THE KINGDOM</div><div class="dd515Heading"><div><h2>🌾 ${esc(t.outposts)}</h2><p>Production, research and dinosaur jobs now support your army.</p></div>${button('mail', '✉️ '+t.mail)}</div>`;
 if(!k)return out+`<div class="dd515Start">${button('start','🏗️ '+t.start)}<p>${esc(t.startHint)}</p></div></section>`;
 out+=`<div class="dd515ResourceBar">${resourceLine(s)}</div><p class="dd515Hint">Resources accumulate while away (8h maximum, 12h with storage research). Claim production from Royal Mail.</p><div class="dd515Outposts">`;
 for(const [id,site] of Object.entries(OUTPOSTS)){const o=k.outposts[id],amount=preview(s,id,ctx),c=price(k,id),next=n(o.level)<5;out+=`<article class="dd515Outpost"><div class="dd515OutpostTop"><span>${site.icon}</span><div><b>${site.name}</b><small>Lv ${n(o.level)}/5 · ${Math.round(rate(s,id,ctx))}/hour</small></div></div><p>✉️ Pending production: <strong>${fmt(amount)} ${site.resource==='provisions'?'🌾':site.icon}</strong></p>${button('upgrade:'+id,next?'Upgrade · '+costText(c):'Maximum level',!next||!has(s,c))}</article>`}
 out+='</div>';
 const roster=rosters(s,ctx),current=jobsSanitized(s,ctx),inSquad=keys(s);const chosen=new Set(Object.values(current).filter(Boolean));
 out+=`<div class="dd515Section"><h3>🦖 ${esc(t.jobs)}</h3><p class="dd515Hint">${esc(t.workerHint)}</p><div class="dd515Jobs">`;
 for(const [id,job] of Object.entries(JOBS)){out+=`<label><span>${job.title} · <b>${current[id]?'+35% production':'Unassigned'}</b></span><select class="dd515Job" data-job="${id}"><option value="">— No worker —</option>${roster.map(d=>`<option value="${esc(d.ref)}" ${current[id]===d.ref?'selected':''} ${inSquad.has(d.ref)||chosen.has(d.ref)&&current[id]!==d.ref?'disabled':''}>${esc(d.name)}${inSquad.has(d.ref)?' (in squad)':''}</option>`).join('')}</select></label>`}
 out+='</div></div><div class="dd515Section"><h3>📜 '+esc(t.research)+'</h3><p class="dd515Hint">Nine permanent discoveries across Economy, Warfare, and Dinosaurs. Research is earned through ordinary kingdom resources.</p><div class="dd515Research">';
 for(const branch of ['Economy','Warfare','Dinosaurs']){out+=`<div class="dd515Branch"><strong>${{Economy:'🌾',Warfare:'⚔️',Dinosaurs:'🦖'}[branch]} ${branch}</strong>`;for(const r of RESEARCH.filter(x=>x.branch===branch)){const done=k.research.includes(r.id),locked=!!r.req&&!k.research.includes(r.req);out+=`<div class="dd515Tech"><b>${r.name}</b><small>${r.desc}</small><small>${done?'✅ Researched':locked?'🔒 Requires '+RMAP.get(r.req).name:costText(r.cost)}</small>${button('research:'+r.id,done?'✓ Learned':locked?'Locked':'Research',done||locked||!has(s,r.cost))}</div>`;}out+='</div>'}
 out+='</div></div><p class="dd515Foot">🔒 Kingdom resources and research are Cloud Kingdom progression, not verified PvP.</p></section>';return out;
}
function mailView(s,ctx){const t=lang(),k=state(s),items=awards(s,ctx),locked=window.DDCloud?.isLocked?.();const projection=k?Object.entries(OUTPOSTS).filter(([id])=>preview(s,id,ctx)>0).length:0;
 let out=`<section class="dd515Mail" id="dd515Mail"><div class="dd515MailTitle"><div><div class="dd515Eyebrow">☁️ CLOUD KINGDOM · BUILD 5.15</div><h3>🎁 ${esc(t.reward)} <small>${items.length} available</small></h3></div>${button('claimall','🎁 '+t.all,locked||(!items.length))}</div>`;
 if(locked)out+=`<p class="dd515Warning">⚠️ ${esc(t.locked)}</p>`;
 if(!k)out+=`<p class="dd515Hint">Establish outposts in Base to begin production shipments.</p>`;
 
 const show=items.slice(0,35);for(const m of show){out+=`<article class="dd515Letter"><div><strong>${esc(m.title)}</strong><small>${esc(m.text)}</small><small class="dd515Loot">${costText(m.amounts)} ${m.extra?' · '+esc(m.extra):''}</small></div>${button('claim:'+m.id,esc(t.collect),locked)}</article>`;}
 if(!show.length)out+='<p class="dd515Empty">📬 Your rewards are collected. New shipments and daily gifts will appear here.</p>';
 if(items.length>35)out+=`<p class="dd515Hint">${items.length-35} older rewards available using Claim All.</p>`;
 out+=`<details class="dd515Verified"><summary>💎 Verified Royal Gems · Secure claim</summary><p>This reward uses the existing server-protected Royal Treasury balance. It is never credited by this Cloud Kingdom mailbox.</p>${button('verified','Open verified daily claim')}</details><details class="dd515Verified"><summary>🧪 Tester credit · Demo gems only</summary><p>Testing-only recharge. Not Royal Gems, not a purchase, and not competitive currency.</p>${button('testcredit','Claim 600 DEMO gems (repeatable)')}</details></section>`;
 return out;
}
function earn(s,amounts){for(const [key,value] of Object.entries(amounts)){const v=n(value);if(!v)continue;if(key==='provisions')state(s,true).provisions=Math.min(100000000,n(state(s).provisions)+v);else if(key==='xp'){
 s.xp=n(s.xp)+v;while(s.xp>=Math.max(1,n(s.level))*100){s.xp-=Math.max(1,n(s.level))*100;s.level=n(s.level)+1;}
 }else if(['gold','wood','ore','essence','gems'].includes(key))s[key]=Math.min(100000000,n(s[key])+v);}}
function claim(s,id,ctx){const k=state(s,!['daily','territory'].includes(id)),at=now();if(id==='daily'){
 const eco=s.royalEconomy;if(!eco||at-n(eco.lastDaily)<86400000)return false;eco.lastDaily=at;eco.demoGems=n(eco.demoGems)+60;eco.ledger=Array.isArray(eco.ledger)?eco.ledger:[];eco.ledger.unshift({text:'5.15 Royal Mail daily gift: +60 DEMO gems and supplies',at});eco.ledger=eco.ledger.slice(0,30);earn(s,{gold:260,wood:150,ore:100});return true;}
 if(id==='territory'){
 if(at-n(s.lastCollect)<60000)return false;s.lastCollect=at;earn(s,{gold:Math.round((s.lands?.length||1)*160*(1+royalVIP(s)*.05))});return true;}
 if(id==='supply-run'){
 if(at-n(k.lastGather)<600000)return false;k.lastGather=at;earn(s,{wood:160+n(s.buildings?.hatchery)*20,ore:100+n(s.buildings?.forge)*15});return true;}
 if(id.startsWith('outpost-ready:')){const site=id.slice('outpost-ready:'.length);const msg=mails(k).find(m=>!m.claimedAt&&m.source==='outpost:'+site);if(!msg)return false;id=msg.id;}
 const msg=mails(k).find(m=>m.id===id&&!m.claimedAt);if(!msg)return false;msg.claimedAt=at;earn(s,msg.amounts);return true;
}
function notifyChange(ctx,text){ctx.save();ctx.render();ctx.notify(text);badgeRefresh();}
function apply(op,val,s,ctx){if(window.DDCloud?.isLocked?.()){ctx.notify('☁️ Resolve Cloud Kingdom conflict first.');return true}const k=state(s);
 if(op==='mail'){window.DDFullUI?.open?.('mail');return true;}
 if(op==='verified'){window.DDFullUI?.close?.();window.DDRoyalTreasury?.open?.();return true;}
 if(op==='start'){if(k)return true;state(s,true);notifyChange(ctx,'🏗️ Your four outposts are producing!');return true;}
 if(op==='upgrade'){
 const id=String(val),site=OUTPOSTS[id];if(!k||!site)return true;const lv=n(k.outposts[id]?.level);if(lv>=5){ctx.notify('Maximum level.');return true;}
 accrue(s,ctx);const cost=price(k,id);if(!spend(s,cost)){ctx.notify('Not enough resources.');ctx.render();return true;}
 k.outposts[id].level=lv+1;k.outposts[id].harvestAt=now();notifyChange(ctx,site.name+' upgraded to Lv '+(lv+1)+'.');return true;
 }
 if(op==='job'){
 if(!k||!JOBS[val?.[0]])return true;const [job,ref]=val;const rs=rosters(s,ctx);if(ref&&(!rs.some(x=>x.ref===ref)||keys(s).has(ref)||Object.entries(jobsSanitized(s,ctx)).some(([id,r])=>id!==job&&r===ref))){ctx.notify('Only one job per spare dinosaur; squad members cannot be assigned.');ctx.render();return true;}
 accrue(s,ctx);k.jobs[job]=ref||null;notifyChange(ctx,ref?'🦖 Dinosaur assigned to '+JOBS[job].title+'.':'Dinosaur returned from work.');return true;
 }
 if(op==='research'){
 const r=RMAP.get(String(val));if(!k||!r||k.research.includes(r.id)||r.req&&!k.research.includes(r.req))return true;
 accrue(s,ctx);if(!spend(s,r.cost)){ctx.notify('Not enough materials for research.');ctx.render();return true;}
 k.research.push(r.id);notifyChange(ctx,'📜 Research completed: '+r.name);return true;
 }
 if(op==='claim'||op==='claimall'){
 if(k){accrue(s,ctx)}
 let count=0;if(op==='claimall'){for(const item of awards(s,ctx))if(claim(s,item.id,ctx))count++;}
 else if(claim(s,String(val),ctx))count++;
 if(count){notifyChange(ctx,'🎁 '+count+' reward'+(count===1?'':'s')+' claimed from Royal Mail.');refreshMail();}
 else{ctx.notify('Nothing claimable right now.');ctx.render();refreshMail()}
 return true;
 }
 if(op==='testcredit'){
 const eco=s.royalEconomy;if(!eco)return true;eco.demoGems=n(eco.demoGems)+600;eco.ledger=Array.isArray(eco.ledger)?eco.ledger:[];eco.ledger.unshift({text:'Tester credit: 600 DEMO gems via Mail',at:now()});eco.ledger=eco.ledger.slice(0,30);notifyChange(ctx,'🧪 Added 600 DEMO gems (not verified).');refreshMail();return true;
 }
 return false;
}
function battleBonus(s){const k=state(s),a=k?.research||[];return {atk:(a.includes('claws')?10:0)+(a.includes('bond')?5:0),hp:a.includes('guard')?25:0,def:a.includes('plate')?4:0}}
function legacyExpChance(s){return state(s)?.research?.includes('tracking') ? .05 : 0}
function expXP(s,value){return Math.round(n(value)*(state(s)?.research?.includes('field')?1.25:1))}
let updateQueued=false;
function refreshMail(){
 if(!window.DD515Game?.mailHTML)return;
 const root=document.getElementById('onlineApp');if(!root)return;
 let m=root.querySelector('.ddMailPanel');
 // Guests have a local Cloud Kingdom but no Supabase private letters yet.
 // Keep kingdom reward claims accessible within the same Royal Mail overlay.
 if(!m){const overlay=document.getElementById('ddFullScreen'),heading=document.getElementById('ddFullTitle');
  if(overlay?.hidden!==false||heading?.textContent!=='Royal Mail')return;
  m=root;
 }
 const content=window.DD515Game.mailHTML();const old=m.querySelector('#dd515Mail');
 if(old){if(m.__dd515LastHTML!==content){old.outerHTML=content;m.__dd515LastHTML=content;}}
 else{const heading=m.querySelector('.ddMailHeading');if(heading)heading.insertAdjacentHTML('afterend',content);else m.insertAdjacentHTML('afterbegin',content);m.__dd515LastHTML=content;}
}
function badgeRefresh(){window.dispatchEvent(new CustomEvent('dd:515-count'));}
function init(){window.DD515={baseView,mailView,deliver,pending,apply,battleBonus,legacyExpChance,expXP,version:VERSION,refreshMail};
 document.addEventListener('change',e=>{const select=e.target.closest?.('.dd515Job');if(select&&window.DD515Game?.apply)window.DD515Game.apply('job',[select.dataset.job,select.value||null])});
 document.addEventListener('click',e=>{const b=e.target.closest?.('button[data-dd515]');if(!b||!window.DD515Game?.apply)return;e.preventDefault();e.stopPropagation();const arg=b.dataset.dd515;if(arg==='claimall')window.DD515Game.apply('claimall');else if(arg.startsWith('claim:'))window.DD515Game.apply('claim',arg.slice(6));else if(arg.startsWith('upgrade:'))window.DD515Game.apply('upgrade',arg.slice(8));else if(arg.startsWith('research:'))window.DD515Game.apply('research',arg.slice(9));else window.DD515Game.apply(arg);},true);
 const root=document.getElementById('onlineApp');if(root){const obs=new MutationObserver(()=>{if(updateQueued)return;updateQueued=true;queueMicrotask(()=>{updateQueued=false;refreshMail()});});obs.observe(root,{childList:true,subtree:false});}
 window.DD515Game?.refresh?.();badgeRefresh();setInterval(()=>{if(document.querySelector('#onlineApp .ddMailPanel'))refreshMail();badgeRefresh()},60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

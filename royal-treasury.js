/* Dino Dominion V1.0 Build 5.10 — Royal Treasury.
   Stripe TEST checkout only. Rewards are granted by signed Stripe webhooks + protected SQL.
   Browser demo gems, VIP, Cloud Kingdom, etc. never enter this wallet. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const species=['Blazefang · T-Rex','Thornshield · Triceratops','Nightclaw · Raptor','Tidebreaker · Spinosaurus','Ironhide · Ankylosaurus','Sunwhisper · Parasaurolophus'];
const glyphs=['🦖','🛡️','🐾','🌊','🪨','🌞'];
const langs={
 en:{launch:'ROYAL TREASURY',caption:'Verified gems · Test payments',title:'ROYAL TREASURY',sub:'Build 5.10 · Stripe TEST mode',status:'Status',offline:'Payment setup not enabled yet',welcome:'The verified premium marketplace',intro:'Real checkout architecture, but TEST MODE ONLY. No real money can be charged. Paid test gems can improve Royal Authority power.',wallet:'Verified Royal Gems',free:'Free daily Royal Gems',claim:'Claim 20 free gems',shop:'Gem Packs',redeem:'Power Boosts',orders:'Receipts',rules:'Safety',disabled:'Checkout locked until developer configures Stripe test-mode backend',mustSign:'Sign in to access Royal Treasury.',notEnrolled:'Enroll in Royal Authority to create your verified progression account.',login:'Open sign in',enroll:'Royal Authority',refresh:'Refresh',purchase:'Test checkout',redeemBtn:'Redeem',available:'Available',insufficient:'Need more gems',noOrders:'No test orders yet.',today:'Already claimed today (UTC)',select:'Verified dinosaur',age:'I confirm I am 18 or older (test checkout only).',pending:'Awaiting signed payment verification. Tap Refresh shortly; the return URL does not grant gems.',cancel:'Checkout canceled. No Royal Gems awarded.',safe:'Only server-verified purchases grant Royal Gems. Browser save edits, demo VIP, and local currency never affect worldwide verified power. Paid boosts do NOT yet affect the legacy online duel/war engine.',stillTest:'⚠️ Not a public payment launch. Refunds, disputes, taxes, parental safeguards and regulatory/compliance review remain required before real money is enabled.',balance:'Current verified balance',detail:'Boosts change server-controlled Royal Authority power.',buyError:'Unable to start checkout.',notReady:'Purchase flow is disabled.',date:'UTC day',close:'Back',noAccount:'You can still play the original kingdom without the verified wallet.'},
 fr:{launch:'TRÉSOR ROYAL',caption:'Gemmes vérifiées · Paiements test',title:'TRÉSOR ROYAL',sub:'Version 5.10 · Mode test Stripe',status:'Statut',offline:'Paiements tests non activés',welcome:'Boutique premium vérifiée',intro:'Paiements en MODE TEST uniquement. Aucun débit réel. Les gemmes de test peuvent renforcer l’Autorité royale.',wallet:'Gemmes royales vérifiées',free:'Gemmes quotidiennes gratuites',claim:'Recevoir 20 gemmes',shop:'Packs de gemmes',redeem:'Améliorations',orders:'Reçus',rules:'Sécurité',disabled:'Paiement verrouillé jusqu’à la configuration du serveur Stripe de test',mustSign:'Connectez-vous pour accéder au trésor.',notEnrolled:'Activez l’Autorité royale pour ouvrir un profil vérifié.',login:'Se connecter',enroll:'Autorité royale',refresh:'Actualiser',purchase:'Paiement test',redeemBtn:'Échanger',available:'Disponible',insufficient:'Gemmes insuffisantes',noOrders:'Aucune commande de test.',today:'Déjà récupéré aujourd’hui (UTC)',select:'Dinosaure vérifié',age:'Je confirme avoir au moins 18 ans (test uniquement).',pending:'Paiement en attente de vérification. Actualisez après quelques instants.',cancel:'Paiement annulé. Aucune gemme accordée.',safe:'Seuls les achats validés par le serveur donnent des gemmes. La sauvegarde locale n’affecte pas les classements vérifiés.',stillTest:'⚠️ Pas de lancement commercial. Remboursements, litiges, taxes et conformité restent à finaliser.',balance:'Solde vérifié',detail:'Les bonus affectent uniquement l’Autorité royale.',buyError:'Impossible de démarrer le paiement.',notReady:'Paiement désactivé.',date:'Jour UTC',close:'Retour',noAccount:'Votre royaume classique reste accessible.'},
 ar:{launch:'الخزانة الملكية',caption:'جواهر موثقة · مدفوعات تجريبية',title:'الخزانة الملكية',sub:'الإصدار 5.10 · وضع اختبار Stripe',status:'الحالة',offline:'الدفع التجريبي غير مفعّل بعد',welcome:'المتجر الملكي الموثق',intro:'نظام الدفع في وضع الاختبار فقط. لن يتم خصم أموال حقيقية. جواهر الاختبار تقوي التقدم الموثق.',wallet:'الجواهر الملكية الموثقة',free:'جواهر يومية مجانية',claim:'استلام 20 جوهرة',shop:'حزم الجواهر',redeem:'تعزيزات القوة',orders:'الإيصالات',rules:'الأمان',disabled:'الدفع مقفل حتى إعداد خادم Stripe التجريبي',mustSign:'سجّل الدخول لاستخدام الخزانة.',notEnrolled:'فعّل السلطة الملكية لإنشاء تقدم موثق.',login:'تسجيل الدخول',enroll:'السلطة الملكية',refresh:'تحديث',purchase:'دفع تجريبي',redeemBtn:'استبدال',available:'متاح',insufficient:'جواهر غير كافية',noOrders:'لا توجد طلبات تجريبية.',today:'تم الاستلام اليوم (UTC)',select:'الديناصور الموثق',age:'أؤكد أن عمري 18 سنة أو أكثر (اختبار فقط).',pending:'بانتظار تأكيد الدفع الموثق. اضغط تحديث بعد قليل.',cancel:'تم إلغاء الدفع، دون منح جواهر.',safe:'تُمنح الجواهر فقط عبر عمليات موثقة من الخادم. بيانات الحفظ المحلية لا تغير التصنيف الموثق.',stillTest:'⚠️ ليس إطلاقاً تجارياً. يجب إعداد الاسترداد والضرائب وحماية القاصرين قبل الدفع الحقيقي.',balance:'الرصيد الموثق',detail:'التعزيزات تؤثر على السلطة الملكية فقط.',buyError:'تعذر بدء الدفع.',notReady:'الدفع معطل.',date:'يوم UTC',close:'رجوع',noAccount:'يمكن متابعة اللعب في المملكة الأصلية.'},
 es:{launch:'TESORO REAL',caption:'Gemas verificadas · Pruebas',title:'TESORO REAL',sub:'Versión 5.10 · Stripe en pruebas',status:'Estado',offline:'Pago de prueba deshabilitado',welcome:'Mercado premium verificado',intro:'Solo MODO PRUEBA: no se cobra dinero real. Las gemas de prueba mejoran la Autoridad Real.',wallet:'Gemas reales verificadas',free:'Gemas diarias gratis',claim:'Reclamar 20 gemas',shop:'Paquetes de gemas',redeem:'Mejoras de poder',orders:'Recibos',rules:'Seguridad',disabled:'Pagos bloqueados hasta configurar Stripe de prueba',mustSign:'Inicia sesión para abrir el tesoro.',notEnrolled:'Únete a la Autoridad Real para iniciar el progreso verificado.',login:'Iniciar sesión',enroll:'Autoridad Real',refresh:'Actualizar',purchase:'Pagar en pruebas',redeemBtn:'Canjear',available:'Disponible',insufficient:'Faltan gemas',noOrders:'Aún no hay pedidos de prueba.',today:'Ya reclamado hoy (UTC)',select:'Dinosaurio verificado',age:'Confirmo que tengo 18 años o más (solo prueba).',pending:'Esperando confirmación del servidor. Actualiza en breve.',cancel:'Pago cancelado. No se entregaron gemas.',safe:'Solo el servidor otorga gemas verificadas. Los datos locales no cuentan en los rankings.',stillTest:'⚠️ No se permite dinero real sin resolver reembolsos, impuestos y protección de menores.',balance:'Saldo verificado',detail:'Los bonos solo afectan a la Autoridad Real.',buyError:'No se pudo iniciar el pago.',notReady:'Pago deshabilitado.',date:'Día UTC',close:'Volver',noAccount:'El reino original sigue disponible.'},
 pt:{launch:'TESOURO REAL',caption:'Gemas verificadas · Testes',title:'TESOURO REAL',sub:'Versão 5.10 · Stripe em teste',status:'Status',offline:'Pagamento de teste desativado',welcome:'Mercado premium verificado',intro:'Apenas MODO TESTE. Nenhum dinheiro real será cobrado. Gemas de teste melhoram a Autoridade Real.',wallet:'Gemas reais verificadas',free:'Gemas diárias grátis',claim:'Receber 20 gemas',shop:'Pacotes de gemas',redeem:'Poder',orders:'Recibos',rules:'Segurança',disabled:'Pagamento bloqueado até configurar Stripe em teste',mustSign:'Entre na conta para abrir o tesouro.',notEnrolled:'Entre na Autoridade Real para criar progresso verificado.',login:'Entrar',enroll:'Autoridade Real',refresh:'Atualizar',purchase:'Checkout de teste',redeemBtn:'Trocar',available:'Disponível',insufficient:'Gemas insuficientes',noOrders:'Sem pedidos de teste.',today:'Já recebido hoje (UTC)',select:'Dinossauro verificado',age:'Confirmo ter 18 anos ou mais (apenas teste).',pending:'Aguardando verificação do pagamento. Atualize em instantes.',cancel:'Pagamento cancelado. Nenhuma gema recebida.',safe:'Só o servidor concede gemas verificadas. Os salvamentos locais não alteram o ranking.',stillTest:'⚠️ Não é lançamento comercial. Reembolsos, impostos e proteção de menores ainda exigem trabalho.',balance:'Saldo verificado',detail:'Bônus afetam apenas a Autoridade Real.',buyError:'Não foi possível iniciar o pagamento.',notReady:'Pagamento desativado.',date:'Dia UTC',close:'Voltar',noAccount:'O reino original continua disponível.'}
};
const rewards=[{key:'gold_crate',price:90,icon:'🪙',name:'Royal Gold Crate',note:'+800 verified gold',species:false},{key:'essence_cache',price:110,icon:'✨',name:'Ancient Essence',note:'+120 verified essence',species:false},{key:'war_training',price:140,icon:'⚔️',name:'War Academy',note:'+2 verified dinosaur levels (max 50)',species:true},{key:'royal_gear',price:160,icon:'🛡️',name:'Royal Forge',note:'+1 verified dinosaur gear (max 10)',species:true}];
let overlay,launch,body,busy=false,error='',notice='',tab='shop',data=null,snapshot=null,user=null,adult=false,chosenSpecies=0,lastFocus=null,connected=false;
function tr(k){return (langs[window.DDWorldwide?.getLanguage?.()||'en']||langs.en)[k]||langs.en[k]||k}
function client(){return window.DDOnlineClient||null}
function signed(){return !!user}
function waiting(){return busy?'disabled':''}
function nav(){const items=[['shop','💎',tr('shop')],['redeem','⚔️',tr('redeem')],['orders','📜',tr('orders')],['rules','🔐',tr('rules')]];return `<nav class="dd510Tabs">${items.map(([k,g,t])=>`<button type="button" data-dd510="tab" data-tab="${k}" aria-pressed="${tab===k}" class="${tab===k?'on':''}">${g}<span>${esc(t)}</span></button>`).join('')}</nav>`}
function accountGate(){if(!signed())return `<section class="dd510Panel"><h2>${esc(tr('mustSign'))}</h2><p>${esc(tr('noAccount'))}</p><button class="dd510Primary" data-dd510="login">👤 ${esc(tr('login'))}</button></section>`;return `<section class="dd510Panel"><h2>${esc(tr('notEnrolled'))}</h2><button class="dd510Primary" data-dd510="enroll">🛡️ ${esc(tr('enroll'))}</button></section>`}
function balance(){const gems=Number(data?.wallet?.royal_gems||0),today=new Date().toISOString().slice(0,10);const claimed=data?.wallet?.last_free_claim===today;
 return `<div class="dd510Balance"><div><small>${esc(tr('balance'))}</small><strong>💎 ${fmt(gems)}</strong><span>${esc(tr('wallet'))}</span></div><div class="dd510Daily"><b>🎁 ${esc(tr('free'))}</b><small>+20 💎 / ${esc(tr('date'))}</small><button type="button" data-dd510="claim" ${busy||claimed?'disabled':''}>${claimed?esc(tr('today')):esc(tr('claim'))}</button></div></div>`}
function shop(){let out=`<section class="dd510Hero"><div class="dd510Coin">👑💎</div><span class="dd510Tag">STRIPE TEST MODE · CAD</span><h1>${esc(tr('welcome'))}</h1><p>${esc(tr('intro'))}</p></section>`;
 out+=balance();out+=`<section class="dd510Panel"><div class="dd510Head"><h2>💎 ${esc(tr('shop'))}</h2><span class="dd510Mini">CAD · TEST ONLY</span></div><div class="dd510Grid">`;
 const products=Array.isArray(data?.products)?data.products:[];
 for(const p of products){const sku=String(p.sku||''),price=(Number(p.cad_cents||0)/100).toFixed(2),gems=Number(p.royal_gems||0);
 out+=`<article class="dd510Product"><div class="dd510ProductArt">${sku.includes('scout')?'🦴':sku.includes('warlord')?'🛡️':'👑'}</div><strong>${esc(p.name)}</strong><span>${fmt(gems)} 💎</span><small>${esc(p.description)}</small><b>CAD $${price}</b><button type="button" data-dd510="purchase" data-sku="${esc(sku)}" ${!adult||!data.checkout_enabled||busy?'disabled':''}>${esc(tr('purchase'))}</button></article>`;
 }
 out+=`</div><label class="dd510Age"><input type="checkbox" id="dd510Age" ${adult?'checked':''}>${esc(tr('age'))}</label>`;
 if(!data.checkout_enabled)out+=`<p class="dd510Warn">🔒 ${esc(tr('disabled'))}</p>`;
 out+=`</section>`;return out}
function redeem(){const gems=Number(data?.wallet?.royal_gems||0);let out=balance();out+=`<section class="dd510Panel"><h2>⚔️ ${esc(tr('redeem'))}</h2><p>${esc(tr('detail'))}</p><div class="dd510Rewards">`;
 for(const r of rewards){const active=gems>=r.price&&!busy;out+=`<article class="dd510Reward"><span>${r.icon}</span><div><strong>${esc(r.name)}</strong><small>${esc(r.note)}</small><b>💎 ${r.price}</b></div><button data-dd510="redeem" data-reward="${r.key}" type="button" ${active?'':'disabled'}>${active?esc(tr('redeemBtn')):esc(tr('insufficient'))}</button></article>`}
 out+='</div>';
 const dinos=(snapshot?.dinos||[]).filter(x=>x.unlocked);
 out+=`<label class="dd510Field">${esc(tr('select'))}<select id="dd510Species">${dinos.map(d=>`<option value="${Number(d.species_id)}" ${chosenSpecies===Number(d.species_id)?'selected':''}>${glyphs[Number(d.species_id)]||'🦖'} ${esc(species[Number(d.species_id)]||'Dinosaur')} · Lv ${Number(d.level)} · Gear ${Number(d.gear)}</option>`).join('')}</select></label>`;
 out+='</section>';return out}
function receipts(){let out=`<section class="dd510Panel"><h2>📜 ${esc(tr('orders'))}</h2><p>Only signed Stripe webhooks can change a pending order to paid and credit verified gems.</p>`;
 if(!data?.orders?.length)out+=`<p>${esc(tr('noOrders'))}</p>`;
 for(const order of (data?.orders||[]))out+=`<div class="dd510Receipt"><span>📦 ${esc(order.sku)}<small>${esc(String(order.created_at||'').slice(0,16).replace('T',' '))} UTC · CAD $${(Number(order.amount_cents)/100).toFixed(2)}</small></span><b class="${order.status==='paid'?'paid':''}">${esc(order.status)} · ${fmt(order.royal_gems)} 💎</b></div>`;
 return out+'</section>'}
function rules(){return `<section class="dd510Panel"><h2>🔐 ${esc(tr('rules'))}</h2><p>${esc(tr('safe'))}</p><p>${esc(tr('stillTest'))}</p><div class="dd510Ledger">🧪 <b>Test card data only.</b> Never enter real payment-card details until the service is publicly launched after compliance review.</div><div class="dd510Ledger">📛 Purchases are disabled by default. Checkout requires a signed-in verified commander, database approval, and server Stripe-test secrets.</div><div class="dd510Ledger">🛡️ The backend verifies order ID, Stripe payment status, currency, amount, and unique checkout session before awarding gems. Return links never grant rewards.</div><div class="dd510Ledger">💡 Free players earn 20 Royal Gems each UTC day; all boost options can be earned without paying.</div></section>`}
function draw(){if(!overlay||overlay.hidden)return;
 $('dd510Heading').textContent=tr('title');$('dd510Sub').textContent=tr('sub');$('dd510Back').setAttribute('aria-label',tr('close'));
 let output='';if(error)output+=`<div class="dd510Error" role="alert">${esc(error)}</div>`;if(notice)output+=`<div class="dd510Notice" role="status">${esc(notice)}</div>`;
 if(busy)output+='<div class="dd510Progress" aria-label="Loading">⏳</div>';
 if(!signed()||!data?.enrolled)output+=accountGate();
 else output+=`${nav()}${tab==='shop'?shop():tab==='redeem'?redeem():tab==='orders'?receipts():rules()}`;
 body.innerHTML=output;
 if(launch){launch.querySelector('strong').textContent=tr('launch');launch.querySelector('small').textContent=tr('caption')}
}
function getError(e){return String(e?.message||e?.error?.message||e||'Unknown error')}
async function rpc(name,args){const c=client();if(!c)throw new Error('Supabase connection unavailable.');const {data,error}=await c.rpc(name,args||{});if(error)throw new Error(error.message||name+' failed');return data}
async function refresh(){if(busy||!overlay||overlay.hidden)return;busy=true;error='';draw();try{
 const c=client();if(!c){user=null;data=null;return}
 const {data:u,error:e}=await c.auth.getUser();user=e?null:u?.user||null;
 if(!user){data=null;snapshot=null;return}
 data=await rpc('dd510_storefront');
 if(data?.enrolled){try{snapshot=await rpc('dd58_snapshot');const dinos=(snapshot?.dinos||[]).filter(d=>d.unlocked);if(dinos.length&&!dinos.some(d=>Number(d.species_id)===chosenSpecies))chosenSpecies=Number(dinos[0].species_id)}catch{snapshot=null}}
 }catch(e){error=getError(e);data=null}finally{busy=false;draw()}}
async function actionRPC(name,args){if(busy)return;busy=true;error='';notice='';draw();try{data=await rpc(name,args);if(name==='dd510_redeem')snapshot=await rpc('dd58_snapshot');notice='✅ Server verified your Royal Treasury action.'}catch(e){error=getError(e)}finally{busy=false;draw()}}
async function purchase(sku){if(busy||!signed()||!data?.checkout_enabled||!adult)return;busy=true;error='';notice='';draw();try{
 const c=client();const {data:response,error:e}=await c.functions.invoke('dd510-checkout',{body:{sku}});
 if(e)throw new Error(e.message||tr('buyError'));
 const url=new URL(response?.url||'');if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw new Error('Checkout returned an unexpected URL');
 window.location.assign(url.href);
 }catch(e){error=getError(e);busy=false;draw()}}
function open(){if(!overlay)return;lastFocus=document.activeElement;overlay.hidden=false;document.documentElement.classList.add('dd510Open');tab='shop';error='';draw();$('dd510Back').focus({preventScroll:true});refresh()}
function close(){overlay.hidden=true;document.documentElement.classList.remove('dd510Open');if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true})}
function init(){const ref=$('dd59Launch')||$('dd58Launch')||document.querySelector('.royalWallet');
 launch=document.createElement('button');launch.type='button';launch.className='dd510Launch';launch.id='dd510Launch';launch.innerHTML='<span class="dd510LaunchIcon">💎</span><span><strong>ROYAL TREASURY</strong><small>Verified gems · Test payments</small></span><span aria-hidden="true">›</span>';
 ref?.insertAdjacentElement('afterend',launch);launch.addEventListener('click',open);
 overlay=document.createElement('div');overlay.id='dd510Overlay';overlay.className='dd510Overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Royal Treasury');
 overlay.innerHTML='<div class="dd510Screen"><header class="dd510Header"><button type="button" id="dd510Back" aria-label="Back">‹</button><div><strong id="dd510Heading">ROYAL TREASURY</strong><small id="dd510Sub">Build 5.10 · Stripe TEST mode</small></div><span>💎</span></header><main id="dd510Body" class="dd510Body"></main></div>';
 document.body.appendChild(overlay);body=$('dd510Body');$('dd510Back').addEventListener('click',close);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 body.addEventListener('click',async e=>{const b=e.target.closest('button[data-dd510]');if(!b||busy)return;
 const what=b.dataset.dd510;
 if(what==='tab'){tab=b.dataset.tab||'shop';draw();return}
 if(what==='login'){close();window.DDFullUI?.open('profile');return}
 if(what==='enroll'){close();window.DDRoyalAuthority?.open();return}
 if(what==='refresh'){await refresh();return}
 if(what==='claim'){await actionRPC('dd510_claim_free');return}
 if(what==='redeem'){const reward=b.dataset.reward;const entry=rewards.find(x=>x.key===reward);if(!entry)return;
  if(entry.species&&!snapshot?.dinos?.some(x=>x.unlocked&&Number(x.species_id)===chosenSpecies)){error='Select an unlocked verified dinosaur first';draw();return}
  if(!window.confirm(`Spend ${entry.price} verified Royal Gems on ${entry.name}?`))return;
  await actionRPC('dd510_redeem',{p_reward:reward,p_species:entry.species?chosenSpecies:null});return}
 if(what==='purchase'){await purchase(b.dataset.sku);return}
 });
 body.addEventListener('change',e=>{if(e.target?.id==='dd510Age'){adult=e.target.checked;draw()}if(e.target?.id==='dd510Species')chosenSpecies=Number(e.target.value)||0});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});
 window.addEventListener('dd59-language-changed',()=>{if(!overlay.hidden)draw()});
 let retried=0;const connect=()=>{const c=client();if(c){if(!connected){connected=true;c.auth.onAuthStateChange(()=>{if(!overlay.hidden)setTimeout(refresh,0)})}return}if(retried++<10)setTimeout(connect,1200)};connect();
 const params=new URLSearchParams(window.location.search),result=params.get('treasury');
 if(result==='success'||result==='cancel'){notice=result==='success'?tr('pending'):tr('cancel');try{history.replaceState(null,'',window.location.pathname)}catch{}
  setTimeout(()=>{open();notice=result==='success'?tr('pending'):tr('cancel');draw()},700)}
 window.DDRoyalTreasury={open,close,refresh};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

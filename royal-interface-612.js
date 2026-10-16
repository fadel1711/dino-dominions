/* Dino Dominion Build 6.12 — Royal Interface: five-category navigation.
 * UI-only. Existing tabs and game systems remain authoritative; no cloud,
 * combat, payment, or competitive state is changed by this module.
 */
(()=>{'use strict';
const VERSION='6.12.0-beta-royal-navigation';
const CATS=[
 {id:'kingdom',name:'Kingdom',icon:'♜',intro:'Rule your citadel and manage your kingdom.',items:[
  ['world','🌎','Dominion World','Your kingdom overview'],['base','🏰','Royal Citadel','Buildings and construction'],
  ['castle','🚶','Living Castle','Enter and explore'],['council','♛','Royal Council','Leader and signature dinosaur'],
  ['deck','✦','Dominion Deck','Cinematic command center'],['resources','🪵','Kingdom Resources','Expand your resource display']]},
 {id:'dinos',name:'Dinos',icon:'🦖',intro:'Raise, train, and bond with your dinosaurs.',items:[
  ['dinos','🦖','Dinosaur Collection','Dinos and companion training'],['eggs','🥚','Eggs & Hatchery','Hatching and incubating'],
  ['bond','♥','Companion Sanctuary','The Living Bond'],['genetics','🧬','Genetics & Hybrids','Find them in your dinosaur systems'],
  ['riders','🐎','Riders & Warbands','Manage your dinosaur teams']]},
 {id:'explore',name:'Explore',icon:'🧭',intro:'Discover what lies beyond the royal gates.',items:[
  ['explore','🗺️','World Exploration','Explore existing regions'],['valley','🌿','Mossveil Expedition','Survey the valley'],
  ['journal','📖','Expedition Journal','Discoveries and encounters'],['territories','🏞️','Dominion Territories','Return to the world overview']]},
 {id:'war',name:'War',icon:'⚔️',intro:'Prepare your army and coordinate with allies.',items:[
  ['battle','⚔️','Battle Arena','Fight and test your squads'],['alliance','🛡️','Alliance HQ','Ranks, members, and War Room'],
  ['war','♜','War Council','Orders and live territories'],['warfront','🏹','Warfront','Server-verified alliance warfare']]},
 {id:'more',name:'More',icon:'☰',intro:'Your social, account, and interface options.',items:[
  ['messenger','💬','Royal Messenger','Chat and auto-translation'],['mail','✉️','Royal Mail','Letters and shipments'],
  ['rankings','🏆','Rankings','Players and alliances'],['profile','👤','Commander Profile','Identity and cloud kingdom'],
  ['friends','👥','Friends','Find other commanders'],['shop','💎','Royal Shop','Offers and upgrades'],
  ['view','⚙️','View Settings','Castle visuals and motion'],['customize','☆','Customize Shortcuts','Pin up to two favorites']]}];
const map=new Map(CATS.flatMap(cat=>cat.items.map(([id,ico,label,sub])=>[id,{id,ico,label,sub}])));
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let category='kingdom',root=null,dock=null,shade=null,pins=[],customizing=false,open=false,formerFocus=null,accountKey='guest',resOpen=false,viewOpen=false,loginCheckedAt=0;
const getStored=(key)=>{try{return localStorage.getItem(key)}catch{return null}};
const setStored=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
const pinsKey=()=>`dd612:pins:${accountKey}`;
function readPins(){try{const v=JSON.parse(getStored(pinsKey())||'[]');pins=Array.isArray(v)?v.filter(x=>map.has(x)&&x!=='customize'&&x!=='resources'&&x!=='view').slice(0,2):[]}catch{pins=[]}}
function renderPins(){const host=$('dd612Pinned');if(!host)return;host.hidden=!pins.length;document.body.classList.toggle('dd612HasPins',!!pins.length);host.innerHTML=pins.map(id=>{const a=map.get(id);return `<button type="button" data-612="go" data-id="${id}" title="${esc(a.label)}"><span>${a.ico}</span>${esc(a.label)}</button>`}).join('')}
function markActive(){if(!dock)return;for(const b of dock.querySelectorAll('[data-category]')){const yes=b.dataset.category===category;b.classList.toggle('active',yes);b.setAttribute('aria-current',yes?'page':'false')}}
function mount(){if(root)return;
 const wallet=document.querySelector('.royalWallet');if(wallet&&!$('dd612ResourceToggle')){
  wallet.insertAdjacentHTML('beforeend','<button type="button" id="dd612ResourceToggle" aria-expanded="false">🪵 Resources <span aria-hidden="true">⌄</span></button>');
  $('dd612ResourceToggle').addEventListener('click',()=>toggleResources());
 }
 // Keep the original controls, including their existing click listeners. Move them,
 // rather than replace or clone them, into a collapsible view settings drawer.
 const hero=$('hero');if(hero&&!$('dd612ViewToggle')){
  const b=document.createElement('button');b.type='button';b.id='dd612ViewToggle';b.setAttribute('aria-expanded','false');b.innerHTML='⚙ <span>View</span>';hero.appendChild(b);
  const view=document.createElement('div');view.id='dd612ViewFlyout';view.hidden=true;view.setAttribute('aria-label','Castle view settings');hero.appendChild(view);
  [['viewToggle','Artwork / 3D'],['roamToggle','Explore Castle'],['riderToggle','Riders'],['detailToggle','Detail']].forEach(([id])=>{const btn=$(id);if(btn)view.appendChild(btn)});
  b.addEventListener('click',()=>toggleView());
 }
 root=document.createElement('div');root.id='dd612RoyalUI';
 root.innerHTML=`<div id="dd612Shade" hidden><button class="dd612Dim" type="button" aria-label="Close royal menu" data-612="close"></button><section class="dd612Drawer" role="dialog" aria-modal="true" aria-label="Royal navigation"><header><div><small>♛ DINO DOMINION · ROYAL COMMAND</small><h2 id="dd612MenuTitle">Your Kingdom</h2><p id="dd612MenuIntro"></p></div><button type="button" class="dd612Close" data-612="close" aria-label="Close menu">✕</button></header><div id="dd612MenuGrid" class="dd612MenuGrid"></div><div id="dd612MenuFoot" class="dd612MenuFoot">☆ Tap Customize Shortcuts under More to pin favorites.</div></section></div><footer id="dd612Dock" aria-label="Royal navigation"><div id="dd612Pinned" class="dd612Pinned" hidden></div><nav class="dd612Categories" aria-label="Main game areas">${CATS.map(cat=>`<button type="button" data-612="category" data-category="${cat.id}" aria-label="${cat.name}" aria-current="false"><span aria-hidden="true">${cat.icon}</span><small>${cat.name}</small></button>`).join('')}</nav></footer>`;
 document.body.appendChild(root);shade=$('dd612Shade');dock=$('dd612Dock');
 root.addEventListener('click',handle);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(open){e.preventDefault();closeMenu()}else if(viewOpen)toggleView(false)}else if(e.key==='Tab'&&open)trap(e)});
 document.addEventListener('click',e=>{if(viewOpen&&!e.target.closest('#dd612ViewFlyout,#dd612ViewToggle'))toggleView(false)});
 markActive();renderPins();document.body.classList.add('dd612Ready');
}
function menuItems(cat){const grid=$('dd612MenuGrid');if(!grid)return;
 grid.innerHTML=cat.items.map(([id,ico,label,sub],i)=>{
  const canPin=!['resources','view','customize'].includes(id);const pinned=pins.includes(id);
  return `<div class="dd612Tile"><button type="button" class="dd612Destination" data-612="go" data-id="${id}"><span aria-hidden="true" class="dd612TileIcon">${ico}</span><span class="dd612TileWords"><strong>${esc(label)}</strong><small>${esc(sub)}</small></span><span class="dd612Arrow" aria-hidden="true">↗</span></button>${customizing&&canPin?`<button type="button" class="dd612Pin" data-612="pin" data-id="${id}" aria-label="${pinned?'Unpin':'Pin'} ${esc(label)}" aria-pressed="${pinned}">${pinned?'★':'☆'}</button>`:''}</div>`}).join('');
 const foot=$('dd612MenuFoot');if(foot)foot.textContent=customizing?'Tap the stars to pin up to two favorites. Pinned shortcuts stay on the navigation dock.':'All original features remain available. Choose where to go.';
}
function openMenu(id){mount();void updateAccount(true);const cat=CATS.find(c=>c.id===id)||CATS[0];category=cat.id;if(!open)customizing=false;formerFocus=document.activeElement;open=true;shade.hidden=false;document.body.classList.add('dd612MenuOpen');$('dd612MenuTitle').textContent=cat.name;$('dd612MenuIntro').textContent=cat.intro;menuItems(cat);markActive();shade.querySelector('.dd612Close')?.focus({preventScroll:true})}
function closeMenu(){if(!open)return;open=false;shade.hidden=true;document.body.classList.remove('dd612MenuOpen');if(formerFocus?.isConnected)formerFocus.focus({preventScroll:true})}
function toggleResources(force){resOpen=typeof force==='boolean'?force:!resOpen;document.body.classList.toggle('dd612ShowResources',resOpen);const b=$('dd612ResourceToggle');if(b)b.setAttribute('aria-expanded',String(resOpen));return resOpen}
function toggleView(force){viewOpen=typeof force==='boolean'?force:!viewOpen;const panel=$('dd612ViewFlyout');if(panel)panel.hidden=!viewOpen;const btn=$('dd612ViewToggle');if(btn)btn.setAttribute('aria-expanded',String(viewOpen));return viewOpen}
function invoke(id){const aliases={genetics:'dinos',riders:'dinos',journal:'valley',territories:'world'};id=aliases[id]||id;const native=['world','base','explore','dinos','eggs','battle','alliance','shop'];
 if(native.includes(id)){const button=document.querySelector(`#nav [data-tab="${id}"]`);if(!button)return false;button.click();try{window.scrollTo({top:0,behavior:'instant'})}catch{}return true;}
 const actions={
  castle:()=>window.DD60?.open?.(),council:()=>window.DD67?.open?.(),deck:()=>window.DD610?.open?.(),bond:()=>window.DD611?.open?.(),
  valley:()=>window.DD69?.open?.(),war:()=>window.DD68?.open?.(),warfront:()=>window.DDFullUI?.open?.('war'),
  messenger:()=>window.DD517?.open?.(),mail:()=>$('friendsShortcut')?.click(),
  rankings:()=>$('rankShortcut')?.click(),profile:()=>$('commanderShortcut')?.click(),
  friends:()=>window.DDFullUI?.open?.('friends'),resources:()=>toggleResources(),view:()=>{window.scrollTo(0,0);toggleView(true)},
  customize:()=>{category='more';customizing=!customizing;return 'customize';}
 };
 if(!actions[id])return false;
 try{return actions[id]()??true}catch(e){console.warn('Royal route unavailable:',id,e);return false}
}
function togglePin(id){if(!map.has(id)||['resources','view','customize'].includes(id))return;
 const i=pins.indexOf(id);if(i>=0)pins.splice(i,1);else{if(pins.length>=2){$('dd612MenuFoot').textContent='Two shortcuts maximum. Unpin one to add another.';return}pins.push(id)}
 setStored(pinsKey(),JSON.stringify(pins));renderPins();const cat=CATS.find(x=>x.id===category);if(cat)menuItems(cat);
}
function handle(e){const b=e.target.closest('[data-612]');if(!b)return;e.preventDefault();const act=b.dataset['612'];if(act==='category')return openMenu(b.dataset.category);if(act==='close')return closeMenu();if(act==='pin')return togglePin(b.dataset.id);
 if(act==='go'){
  const id=b.dataset.id;if(id==='customize'){customizing=!customizing;menuItems(CATS.find(x=>x.id==='more'));return}
  closeMenu();toggleView(false);const result=invoke(id);if(result===false)console.warn('Royal destination not available:',id);
 }
}
function trap(e){const elements=[...shade.querySelectorAll('button:not([disabled])')].filter(x=>x.getClientRects().length>0);if(!elements.length)return;const first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault()}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault()}}
async function updateAccount(force=false){const t=Date.now();if(!force&&t-loginCheckedAt<10000)return;loginCheckedAt=t;
 try{const api=window.DDOnlineClient;if(!api?.auth)return;const {data}=await api.auth.getSession();const user=data?.session?.user?.id||'guest';if(accountKey!==user){accountKey=user;readPins();renderPins()}}catch{}
}
function init(){mount();void updateAccount();document.addEventListener('visibilitychange',()=>{if(!document.hidden)void updateAccount()});window.addEventListener('focus',()=>void updateAccount());
 window.DD612={version:VERSION,openMenu,closeMenu,toggleResources,debug:()=>({category,open,pins:[...pins],accountKey,resources:resOpen,view:viewOpen})};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

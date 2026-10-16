/* Dino Dominion Build 6.11 — The Living Bond, device-local sanctuary beta.
 * Narrative encounters and local memories ONLY. This feature cannot alter
 * canonical bond, dinosaurs, currency, player rankings, or verified PvP.
 */
(()=>{'use strict';
const VERSION='6.11.0-beta-living-bond';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BONDLABEL=n=>n>=10?'DEVOTED':n>=6?'LOYAL':n>=3?'TRUSTING':'CAUTIOUS';
const NOTES=[
 {cue:'Your companion lowers its head, watching your hands. It wants to decide whether it is safe.',answer:'wait',choices:[{id:'wait',name:'Wait quietly',detail:'Let it choose to approach'},{id:'call',name:'Call boldly',detail:'Get its attention'},{id:'reach',name:'Reach toward it',detail:'Offer immediate contact'}],right:'You gave it the space it needed. Its posture softens.',wrong:'It hesitates. Slow movements build confidence over time.'},
 {cue:'A quiet rustle comes from the tall grass. Your companion freezes, listening carefully.',answer:'listen',choices:[{id:'listen',name:'Listen together',detail:'Stay aware of the surroundings'},{id:'rush',name:'Rush ahead',detail:'Investigate first'},{id:'shout',name:'Shout a warning',detail:'Call out across the meadow'}],right:'You read the signal. It relaxes, knowing you noticed too.',wrong:'It remains alert. Next time, follow its attention before acting.'},
 {cue:'Your companion circles back and pauses beside you. It is inviting a shared moment.',answer:'walk',choices:[{id:'walk',name:'Walk alongside',detail:'Match its pace'},{id:'chase',name:'Challenge it to run',detail:'Make it a race'},{id:'turn',name:'Turn away',detail:'Give it complete solitude'}],right:'For a few steps you move as one. A small moment becomes a memory.',wrong:'The moment passes, but it stays nearby. You can try again.'}
];
const PERSONALITY={
 Swift:['Eager to explore','Its tail twitches when it notices a new path.'],Fierce:['Proud and alert','It scans the horizon, but keeps one eye on you.'],Resilient:['Calm under pressure','It breathes slowly and gives you time to learn.'],Steadfast:['Patient protector','It stays near even when the valley grows quiet.'],'Keen-eyed':['Curious observer','Its gaze follows every motion in the grass.'],Wildborn:['An independent spirit','It values space, and rewards gentle patience.']
};
let root=null,visible=false,previousFocus=null,identity='',species=[],selected='',journal=[],stage=-1,correct=0,reply='',saving=false,opening=0,feedback=[],notice='',oldBodyScroll=0;
const bridge=()=>window.DDGameCloudBridge;
const online=()=>window.DDOnlineClient;
function cloud(){return window.DDCloud?.getStatus?.().mode||'guest'}
function creatures(){try{const c=bridge()?.exportState?.()?.creatures;return Array.isArray(c)?c.filter(x=>x&&typeof x.id==='string'&&x.id.length<=100).slice(0,200):[]}catch{return []}}
function chosen(){return species.find(x=>x.id===selected)||null}
function localKey(){return 'dd611:journal:'+identity}
function loadJournal(){try{let value=JSON.parse(localStorage.getItem(localKey())||'[]');return Array.isArray(value)?value.filter(x=>x&&typeof x==='object'&&typeof x.id==='string').slice(0,12):[]}catch{return []}}
function storeJournal(value){try{localStorage.setItem(localKey(),JSON.stringify(value));return true}catch{return false}}
function fmtDate(ts){try{return new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch{return 'Today'}}
function descriptor(c){let p=PERSONALITY[c?.trait]||PERSONALITY.Wildborn;return p}
function crest(){return `<svg class="dd611DinoArt" viewBox="0 0 460 280" role="img" aria-label="A dinosaur standing peacefully in the sanctuary"><defs><linearGradient id="dd611Animal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#466f6b"/><stop offset=".45" stop-color="#203d3e"/><stop offset="1" stop-color="#0e262a"/></linearGradient></defs><path class="dd611Shadow" d="M58 239 Q219 225 393 243 Q222 265 58 239" fill="#061b22" opacity=".8"/><g class="dd611Animal" fill="url(#dd611Animal)" stroke="#729a87" stroke-opacity=".37" stroke-width="2"><path d="M113 148 C75 159 42 157 12 131 C41 181 79 193 123 180 L169 194 C214 209 246 179 271 159 C305 138 329 144 343 160 L370 176 L404 177 C425 176 434 162 434 156 L417 139 L396 129 L380 103 Q364 83 346 98 L319 118 C298 118 296 91 274 81 Q231 61 206 88 Q184 111 153 112 Q127 108 113 148Z"/><path d="M165 176 L161 226 Q167 237 188 237 L202 228 L196 187 M239 169 L252 223 L279 226 L281 216 L264 166"/><path d="M286 141 Q308 143 324 164 L319 179 L306 165 L293 174"/><path d="M390 153 L433 157 L413 168 Q393 167 381 163" fill="#18363b"/></g><circle cx="382" cy="123" r="4.5" fill="#f1cc83"/><circle cx="384" cy="123" r="1.5" fill="#15282d"/><path d="M330 115 Q342 104 352 102" fill="none" stroke="#ddc594" stroke-opacity=".3" stroke-width="3"/></svg>`}
function shell(){if(root)return;
 root=document.createElement('section');root.id='dd611Bond';root.className='dd611Overlay';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Living Bond sanctuary');
 root.innerHTML=`<div class="dd611Frame"><header class="dd611Head"><div><small>BUILD 6.11 · THE LIVING BOND</small><h2>Sanctuary of Trust</h2></div><button type="button" data-dd611="close" class="dd611Exit">✕ Exit</button></header><div id="dd611Scroll" class="dd611Scroll"><div id="dd611Contents"></div></div></div>`;
 document.body.appendChild(root);root.addEventListener('click',onClick);root.addEventListener('change',onChange);
 document.addEventListener('keydown',e=>{if(visible&&e.key==='Escape'){e.preventDefault();close()}});
}
function render(){if(!visible||!root)return;const c=chosen(),bond=Math.max(0,Math.min(10,Number(c?.bond)||0)),personality=descriptor(c),part=NOTES[stage];
 let activity='';
 if(stage===-1){activity=`<div class="dd611Greeting"><small>A QUIET ENCOUNTER</small><h3>Will ${safe(c?.name||'your companion')} trust you with a moment?</h3><p>Read its signals, choose how to respond, and create a memory together. You can replay the encounter any time.</p><button class="dd611Primary" data-dd611="start" ${!c||cloud()==='conflict'||cloud()==='loading'?'disabled':''}>Begin the trust walk ↗</button></div>`;}
 else if(stage<NOTES.length){activity=`<div class="dd611Challenge"><div class="dd611Step"><span>TRUST WALK · ${stage+1} / ${NOTES.length}</span><span>${'◆'.repeat(correct)}${'◇'.repeat(stage-correct)}</span></div>${stage>0?`<p class="dd611Immediate" role="status">${safe(feedback[stage-1])}</p>`:''}<div class="dd611Cue">${safe(part.cue)}</div><div class="dd611Options">${part.choices.map(ch=>`<button type="button" data-dd611="choose" data-choice="${ch.id}"><b>${safe(ch.name)}</b><small>${safe(ch.detail)}</small><span aria-hidden="true">↗</span></button>`).join('')}</div></div>`;}
 else {const title=correct===3?'A bond that feels natural':correct>=2?'A step closer':correct===1?'A quiet beginning':'Patience is its own kind of trust';activity=`<div class="dd611Result"><small>ENCOUNTER COMPLETE</small><h3>${title}</h3><div class="dd611Stars" aria-label="${correct} of 3 signals understood">${'✦'.repeat(correct)}${'◇'.repeat(3-correct)}</div><p>${safe(reply)}</p><p class="dd611Fine">These moments are stories, not bonus combat power or new canonical bond points.</p><button class="dd611Primary" data-dd611="start">Walk together again ↗</button></div>`;}
 const journalHtml=journal.length?journal.map(j=>`<article class="dd611Memory"><div><b>${safe(j.name)}</b><small>${fmtDate(j.at)} · ${j.score}/3 signals</small></div><p>${safe(j.story)}</p></article>`).join(''):'<p class="dd611Empty">Your story together starts with a single peaceful walk.</p>';
 $('dd611Contents').innerHTML=`<div class="dd611Scene"><div class="dd611Starscape" aria-hidden="true"></div><div class="dd611Mountains" aria-hidden="true"></div>${crest()}<div class="dd611SceneCaption"><small>THE QUIET SANCTUARY</small><strong>${safe(c?.name||'A future companion awaits')}</strong><span>${c?safe(BONDLABEL(bond))+' · BOND '+bond+'/10':'Collect a dinosaur to start'}</span></div></div>
 <section class="dd611Selection"><div><small>YOUR COMPANION</small><h3>${c?safe(personality[0]):'No companion selected'}</h3><p>${c?safe(personality[1]):'Hatch or tame a dinosaur first.'}</p></div><label class="dd611Select"><span>Spend time with</span><select id="dd611Favorite" aria-label="Choose your dinosaur"><option value="">Select a dinosaur</option>${species.map(x=>`<option value="${safe(x.id)}" ${x.id===selected?'selected':''}>${safe(x.name||'Unnamed')} · ${safe(x.rarity||'Companion')} · ${Math.min(10,Math.max(0,Number(x.bond)||0))}/10</option>`).join('')}</select></label></section>
 <div class="dd611Account"><span>☁ ${identity!=='guest'?'Signed-in commander · local journal':'Guest preview · local journal'}</span><span>Story only · no resources spent</span></div>
 <section class="dd611Activity">${activity}${feedback.length&&stage>=NOTES.length?`<details class="dd611Review"><summary>Review your signals</summary>${feedback.map(t=>`<p>${safe(t)}</p>`).join('')}</details>`:''}${notice?`<p class="dd611Notice" role="status">${safe(notice)}</p>`:''}</section>
 <section class="dd611Journal"><div class="dd611JournalHead"><small>YOUR MOMENTS</small><h3>Relationship journal <span>${journal.length}/12</span></h3></div><p class="dd611Fine">Saved on this device for this account. It does not sync between phones yet. Your real dinosaur bond still comes from existing companion training.</p>${journalHtml}</section><footer>DINO DOMINION · SOME BONDS ARE EARNED QUIETLY</footer>`;
}
function start(){if(!chosen())return;stage=0;correct=0;feedback=[];reply='';notice='';render();root.querySelector('.dd611Activity')?.scrollIntoView({block:'nearest',behavior:'auto'})}
function choice(v){if(stage<0||stage>=NOTES.length)return;const cur=NOTES[stage];const opt=cur.choices.find(x=>x.id===v);if(!opt)return;
 if(v===cur.answer){correct++;feedback.push('✓ '+cur.right)}else feedback.push('• '+cur.wrong);
 stage++;
 if(stage===NOTES.length){reply=correct===3?'It settles beside you, unguarded. For a moment, the wilderness feels like home.':correct>=2?'It stays close enough to hear your footsteps, curious to learn what comes next.':'You have not rushed its trust. There will be more mornings to try again.';
  const c=chosen();const newMemory={id:String(Date.now())+':'+(c?.id||''),at:Date.now(),name:String(c?.name||'Your companion').slice(0,100),score:correct,story:reply};
  const next=[newMemory,...journal].slice(0,12);if(storeJournal(next))journal=next;else notice='Device storage is unavailable. This memory could not be kept.';
 }
 render();root.querySelector('.dd611Activity')?.scrollIntoView({block:'nearest',behavior:'auto'});
}
async function open(){shell();if(visible)return;visible=true;previousFocus=document.activeElement;oldBodyScroll=window.scrollY||0;opening++;const current=opening;
 root.hidden=false;document.body.classList.add('dd611Open');root.querySelector('.dd611Scroll').scrollTop=0;stage=-1;notice='';identity='guest';species=[];selected='';journal=[];render();root.querySelector('.dd611Exit')?.focus({preventScroll:true});
 try{const client=online();const result=client?await client.auth.getSession():null;if(!visible||opening!==current)return;
 const id=result?.data?.session?.user?.id||'';identity=id||'guest';species=creatures();
 let selectedFromCouncil='';if(id&&client){const {data}=await client.from('dd67_councils').select('favorite_companion').eq('user_id',id).maybeSingle();if(!visible||opening!==current)return;selectedFromCouncil=data?.favorite_companion||'';}
 selected=species.some(x=>x.id===selectedFromCouncil)?selectedFromCouncil:[...species].sort((a,b)=>Number(b.bond||0)-Number(a.bond||0))[0]?.id||'';
 journal=loadJournal();render();root.querySelector('.dd611Scroll').scrollTop=0;
 }catch{if(!visible||opening!==current)return;species=creatures();selected=[...species].sort((a,b)=>Number(b.bond||0)-Number(a.bond||0))[0]?.id||'';journal=loadJournal();notice='Some online details were unavailable. Memories remain device-local.';render()}
}
function close(){if(!visible)return;visible=false;opening++;root.hidden=true;document.body.classList.remove('dd611Open');if(Math.abs((window.scrollY||0)-oldBodyScroll)>5)window.scrollTo(0,oldBodyScroll);if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})}
function onClick(e){const b=e.target.closest('[data-dd611]');if(!b)return;e.preventDefault();const action=b.dataset.dd611;if(action==='close')return close();if(action==='start')return start();if(action==='choose')return choice(b.dataset.choice);}
function onChange(e){if(e.target.id!=='dd611Favorite')return;selected=species.some(x=>x.id===e.target.value)?e.target.value:'';stage=-1;notice='';render();}
function entry(){return `<div class="dd611Entry"><div><small>BUILD 6.11 · THE LIVING BOND</small><b>Visit your companion's sanctuary</b><p>Earn quiet moments together. Three choices, one new memory.</p></div><button type="button" data-dd611-open="1">Visit sanctuary ↗</button></div>`}
function init(){document.addEventListener('click',e=>{if(e.target.closest('[data-dd611-open]')){e.preventDefault();open()}});
 online()?.auth?.onAuthStateChange?.((event,session)=>{if(!visible)return;const next=session?.user?.id||'guest';if((event==='SIGNED_OUT'||(identity!=='guest'&&next!==identity))&&event!=='TOKEN_REFRESHED')close();});
 window.DD611={version:VERSION,entry,open,close,debug:()=>({visible,identity,selected,stage,correct,memories:journal.length,cloud:cloud()})};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

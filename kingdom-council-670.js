/* Dino Dominion 6.7 — Kingdom Council + Signature Companion.
 * Account-scoped council choices via an OPTIONAL server migration.
 * Current bond values are read-only from the existing Cloud Kingdom.
 * No client-generated PvP power, paid currency or competitive rewards.
 */
(()=>{'use strict';
const VERSION='6.7.1-beta-ios-scroll',API=()=>window.DDOnlineClient,BRIDGE=()=>window.DDGameCloudBridge;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\"':'&quot;',"'":'&#39;'}[c]));
const ROLES=[
 {id:'keeper',symbol:'✦',name:'Beastkeeper',tag:'Sanctuary & Trust',desc:'A council devoted to earning the confidence of your companions.'},
 {id:'warden',symbol:'⚔',name:'Frontier Marshal',tag:'Defense & Duty',desc:'A council sworn to defend your citadel and its inhabitants.'},
 {id:'pathfinder',symbol:'✧',name:'Royal Pathfinder',tag:'Discovery & Exploration',desc:'A council drawn toward uncharted territory and ancient secrets.'}
];
const MS=[{min:3,name:'First Trust',desc:'Recognizes your voice.'},{min:6,name:'Steadfast Loyalty',desc:'Stands calmly beside your commander.'},{min:10,name:'Unbreakable Bond',desc:'Your signature companion, through every hardship.'}];
let root=null,shown=false,loading=false,saving=false,uid='',account=null,focus='keeper',chosen='',revision=0,notice='',backend='unknown',opening=0,lastFocus=null;
function creatures(){try{const s=BRIDGE()?.exportState?.();return Array.isArray(s?.creatures)?s.creatures.filter(c=>c&&typeof c.id==='string'&&c.id.length<100).slice(0,200):[]}catch{return []}}
function cloud(){try{return window.DDCloud?.getStatus?.().mode||'guest'}catch{return 'guest'}}
function cleanId(id){const x=String(id||'');return x.length<=100?x:''}
function preferred(){return creatures().find(c=>c.id===chosen)||null}
function tone(c){const n=Math.max(0,Math.min(10,Number(c?.bond)||0));return n>=10?'DEVOTED':n>=6?'LOYAL':n>=3?'TRUSTING':'WARY'}
function entry(zone){return `<div class="dd67Entry"><div class="dd67EntryMark">♛</div><div class="dd67EntryBody"><small>BUILD 6.7 · KINGDOM COUNCIL</small><strong>${zone==='dinos'?'Signature Companion & Loyalty':'The Royal Council'}</strong><p>${zone==='dinos'?'Choose your companion and view trust milestones.':'Appoint your kingdom’s guiding focus.'}</p></div><button type="button" data-dd67-open="1">Enter ↗</button></div>`}
function scaffold(){if(root)return;root=document.createElement('section');root.id='dd67Council';root.className='dd67Overlay';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Kingdom Council');root.innerHTML='<div class="dd67Shell"><header><div><small>THE ROYAL CITADEL · BUILD 6.7</small><h2>♛ Kingdom Council</h2></div><button type="button" class="dd67Close" data-dd67="close" aria-label="Close Kingdom Council">✕ Exit</button></header><div id="dd67Body" class="dd67Body"></div></div>';
 document.body.appendChild(root);
 root.addEventListener('click',onClick);
 root.addEventListener('change',onChange);
 document.addEventListener('keydown',e=>{if(shown&&e.key==='Escape')close()});
}
function setNotice(t){notice=t;render()}
function render(){if(!root)return;const area=$('dd67Body');if(!area)return;const keptScroll=area.scrollTop;const list=creatures(),c=preferred(),isCloud=cloud()==='ready';const label=account?'Signed in · account-scoped':'Sign in to save council choices';
 const bond=Math.max(0,Math.min(10,Number(c?.bond)||0));
 area.innerHTML=`<section class="dd67Overview"><div class="dd67Sigil">♛</div><div><small>COUNCIL RECORD</small><h3>Your crown. Your choices.</h3><p>Choose your kingdom’s direction and the dinosaur you trust most. The council is a <b>noncompetitive beta feature</b>: no PvP, battle, payment, or economy bonuses.</p></div></section>
 <div class="dd67Status"><span>${esc(label)}</span><span class="dd67Chip">${backend==='ready'?'☁️ Server record':backend==='missing'?'⏳ Server setup pending':backend==='error'?'⚠️ Council unavailable':'◌ Checking council'}</span></div>
 <h3 class="dd67Sub">I · Royal council focus</h3><div class="dd67Roles">${ROLES.map(r=>`<button class="dd67Role ${focus===r.id?'active':''}" type="button" data-dd67="focus" data-value="${r.id}" aria-pressed="${focus===r.id}"><i>${r.symbol}</i><strong>${r.name}</strong><small>${r.tag}</small><span>${r.desc}</span></button>`).join('')}</div>
 <h3 class="dd67Sub">II · Your signature companion</h3><section class="dd67Companion"><div class="dd67Crest" aria-hidden="true">${c?'🦖':'♜'}</div><div class="dd67Choice"><label for="dd67Favorite">Choose from your actual collected dinosaurs</label><select id="dd67Favorite"><option value="">No companion appointed</option>${list.map(x=>`<option value="${esc(x.id)}" ${chosen===x.id?'selected':''}>${esc(x.name||'Unnamed dinosaur')} · ${esc(x.rarity||'Companion')} · Bond ${Math.max(0,Math.min(10,Number(x.bond)||0))}/10</option>`).join('')}</select><p>${c?`<strong>${esc(c.name||'Unnamed')}</strong> · ${esc(c.trait||'Untested')} · ${tone(c)} · Bond ${bond}/10`:list.length?'Select one dinosaur. Your collection is unchanged.':'No collected companion in this current kingdom save. Hatch or tame one first.'}</p></div></section>
 <h3 class="dd67Sub">III · Earn their trust</h3><div class="dd67Milestones">${MS.map(m=>`<div class="dd67Milestone ${c&&bond>=m.min?'earned':''}"><span>${c&&bond>=m.min?'✓':'◇'}</span><div><strong>${m.name}</strong><small>${m.desc}</small></div><b>${m.min}/10</b></div>`).join('')}</div>
 <p class="dd67Hint">Bond points already come from the existing Dinos / Companion training screen. This council only reads them. Trust milestones are story recognition, <b>not verified combat bonuses</b>. Council choices save to Supabase only when the optional server migration is installed and Cloud Kingdom is READY.</p>
 ${notice?`<p class="dd67Notice" role="status">${esc(notice)}</p>`:''}
 <div class="dd67Actions"><button class="dd67Main" type="button" data-dd67="save" ${!account||backend!=='ready'||saving||loading||!isCloud?'disabled':''}>${saving?'Saving…':'☁️ Save my council'}</button><button class="dd67Secondary" type="button" data-dd67="refresh" ${loading?'disabled':''}>↻ Reload server record</button></div>
 ${backend==='missing'?'<p class="dd67Hint">The feature is installed as a preview. No changes are saved locally or to your cloud until the council backend is approved and installed.</p>':''}
 ${!isCloud?`<p class="dd67Hint">Current Cloud Kingdom status: ${esc(cloud().toUpperCase())}. Resolve cloud saving before storing council changes.</p>`:''}`;
 // Safari: replacing the form DOM should not reset the independently scrolling Council pane.
 area.scrollTop=keptScroll;
}
async function read(){const t=++opening;loading=true;backend='unknown';notice='';render();const api=API();if(!api){account=null;backend='error';loading=false;setNotice('Online service unavailable. Council is a read-only preview.');return;}
 try{
  const {data:session,error:se}=await api.auth.getSession();if(t!==opening||!shown)return;if(se||!session?.session?.user){account=null;uid='';backend='error';loading=false;setNotice('Sign in to Dino Dominion to save council choices.');return}
  account=session.session.user;uid=account.id;
  const {data,error}=await api.from('dd67_councils').select('focus,favorite_companion,revision').eq('user_id',uid).maybeSingle();if(t!==opening||!shown)return;
  loading=false;
  if(error){backend=/does not exist|schema cache|PGRST205|404|relation/i.test(error.message||'')?'missing':'error';notice=backend==='missing'?'Council database is not installed yet. You can preview the feature safely.':'Council record could not be loaded. Try again later.';render();return}
  backend='ready';revision=Math.max(0,Number(data?.revision)||0);
  focus=ROLES.some(r=>r.id===data?.focus)?data.focus:'keeper';chosen=cleanId(data?.favorite_companion);
  render();
 }catch{if(t===opening&&shown){loading=false;backend='error';setNotice('Network error. No council changes were made.')}}
}
async function save(){if(saving||loading||backend!=='ready'||!account)return;const now=API();const uidSave=uid,focusSave=focus,favoriteSave=chosen;
 if(cloud()!=='ready')return setNotice('Wait until Cloud Kingdom is READY. Your dinosaur collection must be saved first.');
 if(favoriteSave&&!creatures().some(c=>c.id===favoriteSave))return setNotice('Selected companion is missing from the current kingdom. Please choose another.');
 saving=true;notice='';render();try{
  const {data,error}=await now.rpc('dd67_council_save',{p_focus:focusSave,p_favorite:favoriteSave||null,p_expected_revision:revision});
  if(!shown||uid!==uidSave)return;
  if(error){if(/COUNCIL_REVISION_CONFLICT/.test(error.message||'')){backend='error';notice='Another device changed your council. Reload the server record before saving.';}else notice='Could not save council changes. Your kingdom and dinosaurs were not modified.';}else {revision=Number(data?.revision??data)||revision+1;notice='Council saved to your account. Your companion collection is unchanged.';}
 }catch{if(shown&&uid===uidSave)notice='Connection interrupted. Check your council record before trying again.';}finally{saving=false;if(shown)render()}
}
function onClick(e){const b=e.target.closest('[data-dd67]');if(!b)return;e.preventDefault();const a=b.dataset.dd67;if(a==='close')return close();if(a==='focus'){const v=b.dataset.value;if(ROLES.some(r=>r.id===v)){focus=v;render()}return}if(a==='save')return void save();if(a==='refresh')return void read()}
function onChange(e){if(e.target.id!=='dd67Favorite')return;chosen=cleanId(e.target.value);render()}
function open(){scaffold();if(shown)return;shown=true;lastFocus=document.activeElement;root.hidden=false;document.body.classList.add('dd67Open');focus='keeper';chosen='';backend='unknown';revision=0;notice='';render();root.scrollTop=0;const pane=$('dd67Body');if(pane)pane.scrollTop=0;root.querySelector('.dd67Close')?.focus({preventScroll:true});void read()}
function close(){if(!shown)return;shown=false;opening++;root.hidden=true;root.scrollTop=0;const pane=$('dd67Body');if(pane)pane.scrollTop=0;document.body.classList.remove('dd67Open');if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true})}
function init(){document.addEventListener('click',e=>{const b=e.target.closest('[data-dd67-open]');if(b){e.preventDefault();open()}});window.DD67={version:VERSION,entry,open,close,debug:()=>({shown,backend,focus,chosen,revision,loading,saving,cloud:cloud()})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

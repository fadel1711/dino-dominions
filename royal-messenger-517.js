/* Dino Dominion 5.17 — Royal Messenger, additive UI on existing authenticated Supabase chat.
 * Existing messages, account state, Cloud Kingdom and alliance war are untouched.
 * Language rooms/reporting require the optional 5.17 SQL setup; translation requires
 * the server-side Edge Function and its private provider key. No secrets in browser.
 */
(()=>{'use strict';
const VERSION='5.17.2-beta-language-switch';
const LANG={en:'English',fr:'Français',ar:'العربية',es:'Español',pt:'Português',ko:'한국어',zh:'中文'};
const FLAGS={en:'🇬🇧',fr:'🇫🇷',ar:'🇸🇦',es:'🇪🇸',pt:'🇧🇷',ko:'🇰🇷',zh:'🇨🇳'};
const EMOJIS=['🦖','🦕','🐉','⚔️','🛡️','👑','🔥','😂','❤️','👍','👀','🎉','💎','🤝','💪','😎','😍','😭','🇨🇦','🇱🇧'];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const goodId=s=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(s||''));
const fmtTime=s=>{try{return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(s))}catch{return ''}};
const detect=s=>/\p{Script=Arabic}/u.test(s)?'ar':/[가-힣]/.test(s)?'ko':/[\u3400-\u9fff]/.test(s)?'zh':null;
const client=()=>window.DDOnlineClient;
let root=null,who=null,allianceId=null,room='world',peer='',peerName='',items=[],names=new Map(),busy=false,open=false,loading=false,version=0;
let seen={},settings={auto:true,original:true,language:'en'},blocked=new Set(),activeTranslations=new Map(),translationUnavailable=false,missingRooms=false,missingReports=false,pollTimer=null,checkTimer=null,lastSent=0,replies=null,autoTranslateCount=0;
let unreadCounts={world:0,alliance:0,private:0,language:0},unreadByPeer=Object.create(null),unreadInFlight=false,membershipCheckedAt=0;
const lastIncomingByRoom=new Map();
const roomKey=()=>room==='private'?'private:'+peer:room;
const ownKey=key=>`dd517:${who?.id||'guest'}:${key}`;
function loadPrefs(){try{settings={...settings,...JSON.parse(localStorage.getItem(ownKey('settings'))||'{}')};seen=JSON.parse(localStorage.getItem(ownKey('seen'))||'{}');blocked=new Set(JSON.parse(localStorage.getItem(ownKey('blocked'))||'[]'));}catch{seen={};blocked=new Set()}settings.language=LANG[settings.language]?settings.language:'en';settings.auto=settings.auto!==false;settings.original=settings.original!==false;}
function persist(key,value){try{localStorage.setItem(ownKey(key),JSON.stringify(value))}catch{}}
function status(msg){const el=$('dd517Status');if(el){el.textContent=msg;el.hidden=!msg}}
function initialHTML(){const el=document.createElement('section');el.id='dd517Messenger';el.className='dd517';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Royal Messenger');el.innerHTML=`<header class="dd517Head"><button type="button" data-517="close" aria-label="Close messenger">‹</button><div><b>👑 ROYAL MESSENGER</b><small>WORLDWIDE COMMUNICATIONS</small></div><button type="button" data-517="settings" aria-label="Translation and chat settings">⚙️</button></header><nav class="dd517Channels" aria-label="Chat channels"><button data-room="world">🌎 Global</button><button data-room="language">🌐 Languages</button><button data-room="alliance">🛡 Alliance</button><button data-room="private">✉️ Private</button></nav><div class="dd517RoomControls" id="dd517Controls"></div><div id="dd517Status" class="dd517Status" role="status" hidden></div><div class="dd517Messages" id="dd517Messages" role="log" aria-live="off"></div><div class="dd517Settings" id="dd517Settings" hidden></div><div class="dd517Composer"><div class="dd517Reply" id="dd517Reply" hidden></div><div class="dd517Emoji" id="dd517Emoji" hidden></div><form id="dd517Form"><button type="button" data-517="emoji" aria-label="Choose emoji">😊</button><textarea id="dd517Text" rows="1" maxlength="300" placeholder="Message your commanders…" aria-label="Chat message"></textarea><button class="dd517Send" type="submit" aria-label="Send message">➤</button></form><small id="dd517ComposerHint">Messages must be respectful. Curated stickers and GIFs; no player uploads.</small></div>`;document.body.appendChild(el);return el;}
function setOpen(next){open=next;root.hidden=!next;document.body.classList.toggle('dd517Open',next);if(!next){stopPolling();$('dd517Emoji').hidden=true;$('dd517Settings').hidden=true;void unread();}else startPolling();window.DD519?.onOpen?.(next);}
async function resolveAuth(){const c=client();if(!c)return false;const {data,error}=await c.auth.getSession();if(error||!data?.session?.user)return false;const id=data.session.user.id;if(!who||who.id!==id){who=data.session.user;loadPrefs();names=new Map();items=[];allianceId=null;activeTranslations.clear();lastIncomingByRoom.clear();autoTranslateCount=0;translationUnavailable=false;missingRooms=false;missingReports=false;peer='';peerName='';room='world';unreadCounts={world:0,alliance:0,private:0,language:0};unreadByPeer=Object.create(null);membershipCheckedAt=0;renderUnread();}
return true;}
async function refreshMembership(){if(!who)return;const uid=who.id,c=client();const {data,error}=await c.from('alliance_members').select('alliance_id').eq('user_id',uid).limit(1).maybeSingle();if(who?.id!==uid)return;if(!error)allianceId=data?.alliance_id||null;}
async function login(){setOpen(true);root.classList.add('dd517Active');if(!await resolveAuth()){$('dd517Messages').innerHTML='<div class="dd517Empty"><b>🔐 Commander sign-in required</b><p>Sign in with your existing Dino Dominion account to access Royal Messenger.</p><button type="button" data-517="login">Open sign-in</button></div>';$('dd517Form').hidden=true;$('dd517Controls').innerHTML='';return;}
$('dd517Form').hidden=false;await refreshMembership();const syncedBlocks=await window.DD519?.loadBlocks?.();if(Array.isArray(syncedBlocks)){for(const id of syncedBlocks)blocked.add(id);persist('blocked',[...blocked]);}renderRoom();await loadMessages();}
function renderRoom(){const nav=root.querySelectorAll('[data-room]');nav.forEach(b=>{const active=room===b.dataset.room||(room.startsWith('lang:')&&b.dataset.room==='language');b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
let ctrl='';if(room.startsWith('lang:')||room==='language')ctrl=`<div class="dd517Language">${Object.entries(LANG).map(([id,label])=>`<button class="${room==='lang:'+id?'active':''}" data-langroom="${id}">${FLAGS[id]} ${esc(label)}</button>`).join('')}</div>`;
if(room==='private')ctrl=`<div class="dd517Friend"><label for="dd517Player">Private chat · Commander ID</label><div><input id="dd517Player" maxlength="36" placeholder="Paste Player ID" value="${esc(peer)}" autocomplete="off"><button type="button" data-517="setPeer">Open</button></div><label for="dd517Search">Or find a commander by name</label><div><input id="dd517Search" maxlength="20" placeholder="Commander name" autocomplete="off"><button type="button" data-517="find">Find</button></div><div id="dd517Results"></div></div>`;
if(room==='alliance')ctrl=`<p class="dd517Context">${allianceId?'🛡 Private channel for your current alliance':'🛡 Join an alliance to participate in its chat.'}</p>`;
if(room==='world')ctrl='<p class="dd517Context">🌍 One global room, bringing all commanders together.</p>';
$('dd517Controls').innerHTML=ctrl;
$('dd517ComposerHint').textContent=room==='private'&&!goodId(peer)?'Find a commander or enter their Player ID first.':'Be respectful. Report abuse; never share passwords or personal information.';
$('dd517Text').disabled=room==='private'&&!goodId(peer)||room==='alliance'&&!allianceId||room==='language'||room.startsWith('lang:')&&missingRooms;
const reply=$('dd517Reply');if(!replies)reply.hidden=true;
window.DD519?.onRoom?.();
}
async function chooseRoom(next){if(room===next)return;room=next;version++;items=[];replies=null;autoTranslateCount=0;status('');renderRoom();$('dd517Messages').innerHTML='<div class="dd517Empty">Loading conversations…</div>';await loadMessages();}
async function fetchMessages(){const c=client();if(room==='language')return {data:[]};if(room.startsWith('lang:'))return c.from('dd517_language_messages').select('id,created_at,sender_id,body,language').eq('language',room.slice(5)).order('created_at',{ascending:false}).limit(60);
let q=c.from('messages').select('id,created_at,sender_id,body,channel,alliance_id,recipient_id').order('created_at',{ascending:false}).limit(60);
if(room==='world')q=q.eq('channel','world');
else if(room==='alliance'){if(!allianceId)return {data:[]};q=q.eq('channel','alliance').eq('alliance_id',allianceId)}
else if(room==='private'){if(!goodId(peer))return {data:[]};q=q.eq('channel','private').or(`and(sender_id.eq.${who.id},recipient_id.eq.${peer}),and(sender_id.eq.${peer},recipient_id.eq.${who.id})`)}
return q;}
async function loadMessages({quiet=false}={}){if(!open||!who||loading)return;const ticket=version,key=unreadKey();loading=true;try{const {data,error}=await fetchMessages();if(ticket!==version)return;if(error){if(room.startsWith('lang:')&&/dd517_language_messages|does not exist|schema cache|404|PGRST205/i.test(error.message||'')){missingRooms=true;renderRoom();status('Language channels need server activation. Global chat still works.');}else status(error.message||'Could not load chat.');items=[];}else{status('');items=(data||[]).reverse().filter(m=>!blocked.has(m.sender_id));await loadNames(items);if(ticket!==version)return;
// The initial six-message batch is not a lifetime cap: newly received messages get a fresh auto batch.
const newestOther=[...items].reverse().find(m=>m.sender_id!==who.id);
if(newestOther){const latestKey=room;const newestId=String(newestOther.id),previousId=lastIncomingByRoom.get(latestKey);
if(previousId&&previousId!==newestId)autoTranslateCount=0;
lastIncomingByRoom.set(latestKey,newestId);}
if(room.startsWith('lang:'))missingRooms=false;renderMessages(quiet);if(open&&room!=='language'&&(room!=='private'||goodId(peer))&&(room!=='alliance'||allianceId)){markRead(key,items.length?items[items.length-1].created_at:new Date().toISOString());}}}catch(e){if(ticket===version)status('Connection issue. Try again.')}finally{loading=false;}}
async function loadNames(list){const ids=[...new Set(list.map(m=>m.sender_id).filter(id=>id!==who.id&&!names.has(id)&&goodId(id)))].slice(0,60);if(!ids.length)return;const {data}=await client().from('commander_profiles').select('user_id,commander_name,avatar').in('user_id',ids);for(const p of data||[])names.set(p.user_id,{name:p.commander_name,avatar:p.avatar});}
function displayName(id){if(id===who?.id)return 'You';return names.get(id)?.name||'Commander '+String(id).slice(0,6)}
function renderMessages(quiet=false){const target=$('dd517Messages');if(!target)return;const oldBottom=target.scrollHeight-target.scrollTop-target.clientHeight<85;
const html=items.length?items.map(m=>{const mine=m.sender_id===who.id,code=detect(m.body),key=room+':'+m.id+':'+settings.language,translated=activeTranslations.get(key);const current=!mine&&translated?.text&&translated.text!==m.body?translated:null;
const first=(current&&!current.showOriginal)?current.text:m.body;const isTranslated=current&&!current.showOriginal;return `<article class="dd517Bubble ${mine?'mine':''}" data-id="${esc(m.id)}"><div class="dd517MsgMeta"><b>${esc(names.get(m.sender_id)?.avatar||'🦖')} ${esc(displayName(m.sender_id))}</b><time>${esc(fmtTime(m.created_at))}</time></div><p dir="auto">${window.DD519?.renderBody?.(first)??window.DD518?.renderBody?.(first)??esc(first)}</p>${isTranslated&&settings.original?`<small class="dd517OriginalLine">Original: <span dir="auto">${esc(m.body)}</span></small>`:''}${isTranslated?`<small class="dd517Translated">🌐 Translated · <button type="button" data-517="original" data-id="${esc(m.id)}">Show original</button></small>`:current?`<small class="dd517Translated"><button type="button" data-517="original" data-id="${esc(m.id)}">Show translation</button></small>`:''}<div class="dd517MsgActions">${!mine&&!window.DD518?.isMedia?.(m.body)&&!window.DD519?.isPhoto?.(m.body)?`<button type="button" data-517="translate" data-id="${esc(m.id)}" aria-label="Translate message">🌐</button>`:''}<button type="button" data-517="reply" data-id="${esc(m.id)}">↩ Reply</button>${!mine?`<button type="button" data-517="mute" data-user="${esc(m.sender_id)}">Mute</button><button type="button" data-517="report" data-id="${esc(m.id)}">Report</button>`:''}</div></article>`;}).join(''):'<div class="dd517Empty">No messages here yet. Start the conversation! 🦖</div>';
target.innerHTML=html;if(!quiet||oldBottom)target.scrollTop=target.scrollHeight;window.DD519?.afterRender?.();
if(settings.auto&&!translationUnavailable){let done=0;for(const m of items.slice(-8).reverse()){if(done>=3||autoTranslateCount>=6)break;if(m.sender_id===who.id||window.DD518?.isMedia?.(m.body)||window.DD519?.isPhoto?.(m.body)||detect(m.body)===settings.language)continue;const key=room+':'+m.id+':'+settings.language;if(activeTranslations.has(key))continue;done++;autoTranslateCount++;requestTranslation(m,false);}}
}
async function requestTranslation(m,explicit=true){if(translationUnavailable){if(explicit)status('Translation service is not enabled yet. Original messages are still available.');return;}
// Capture all request identity before awaiting: preferences/room/account can change while Azure responds.
const targetLanguage=settings.language,source=room.startsWith('lang:')?'dd517_language_messages':'messages',requestUser=who?.id,requestedRoom=room;
const key=requestedRoom+':'+m.id+':'+targetLanguage;
if(activeTranslations.has(key))return;
activeTranslations.set(key,{pending:true});
try{const c=client();const {data,error}=await c.functions.invoke('dd517-translate',{body:{source,id:m.id,targetLanguage}});
if(error||!data?.translation)throw Error(error?.message||'Translation unavailable');
if(who?.id!==requestUser)return; // Never import prior-account results into a new session.
activeTranslations.set(key,{text:String(data.translation).slice(0,1500),language:data.targetLanguage||targetLanguage,showOriginal:false});
if(open&&room===requestedRoom&&settings.language===targetLanguage)renderMessages(true);
}catch(e){if(who?.id!==requestUser)return;
// Failure is local to one message+language: don't disable all translation until app restart.
activeTranslations.set(key,{failed:true});
if(explicit&&room===requestedRoom&&settings.language===targetLanguage)status('Translation temporarily unavailable. Tap 🌐 to retry; original message is safe.');
}}
function setTranslation(id){const m=items.find(x=>String(x.id)===String(id));if(!m)return;if(window.DD518?.isMedia?.(m.body)||window.DD519?.isPhoto?.(m.body))return;const key=room+':'+m.id+':'+settings.language,rec=activeTranslations.get(key);if(rec?.text){rec.showOriginal=!rec.showOriginal;renderMessages(true)}else if(!rec?.pending){activeTranslations.delete(key);requestTranslation(m,true);}}
async function send(e){e.preventDefault();if(busy||!who)return;const box=$('dd517Text');let text=box.value.trim();if(replies)text=`↩ ${replies.name}: ${replies.text}\n${text}`.slice(0,300);if(!text||text.length>300)return status('Messages must be 1–300 characters.');if(Date.now()-lastSent<2500)return status('Wait a moment before sending another message.');if(/https?:\/\//i.test(text)&&text.match(/https?:\/\//gi).length>2)return status('Too many links.');if(room==='language')return status('Choose a language channel first.');const id=roomKey();
const payload={sender_id:who.id,body:text},table=room.startsWith('lang:')?'dd517_language_messages':'messages';if(room==='world')payload.channel='world';else if(room==='alliance'){if(!allianceId)return status('Join an alliance first.');payload.channel='alliance';payload.alliance_id=allianceId;}else if(room==='private'){if(!goodId(peer))return status('Select a valid commander.');payload.channel='private';payload.recipient_id=peer;}else if(room.startsWith('lang:'))payload.language=room.slice(5);
busy=true;status('');try{const {error}=await client().from(table).insert(payload);if(error)throw error;box.value='';replies=null;$('dd517Reply').hidden=true;lastSent=Date.now();await loadMessages();}catch(err){if(table==='dd517_language_messages'&&/dd517_language_messages|404|PGRST205|schema cache/i.test(err.message||''))missingRooms=true;status('Message not sent: '+String(err.message||'Check your connection').slice(0,150));}finally{busy=false;}}
async function findPlayers(){const q=$('dd517Search')?.value.trim();if(!q||!/^[a-zA-Z0-9_]{2,20}$/.test(q))return status('Enter 2–20 letters, numbers or underscore.');const {data,error}=await client().from('commander_profiles').select('user_id,commander_name,avatar').ilike('commander_name','%'+q+'%').limit(12);if(error)return status(error.message);$('dd517Results').innerHTML=(data||[]).map(p=>`<button type="button" data-peer="${esc(p.user_id)}" data-peer-name="${esc(p.commander_name)}">${esc(p.avatar||'🦖')} ${esc(p.commander_name)}</button>`).join('')||'<small>No matching commanders.</small>';}
async function reportMessage(m){if(!m||!who)return;if(m.sender_id===who.id)return;if(!confirm('Report this message to Dino Dominion moderators?'))return;
const table=room.startsWith('lang:')?'dd517_language_messages':'messages';const {error}=await client().from('dd517_chat_reports').insert({reporter_id:who.id,source_table:table,message_id:String(m.id),reported_sender_id:m.sender_id,reason:'Inappropriate or abusive message'});if(error){missingReports=true;status('Reporting is not activated on the server yet. You can mute the player now.');return}status('Report submitted for moderator review. Thank you.');}
function showSettings(){const p=$('dd517Settings');p.hidden=!p.hidden;if(p.hidden)return;p.innerHTML=`<div class="dd517SettingsTitle"><b>🌐 Chat & Translation</b><button type="button" data-517="settings">✕</button></div><label><input id="dd517Auto" type="checkbox" ${settings.auto?'checked':''}> Automatically translate foreign-language messages</label><label><input id="dd517Original" type="checkbox" ${settings.original?'checked':''}> Show original text below translations</label><label for="dd517Preferred">Your preferred language</label><select id="dd517Preferred">${Object.entries(LANG).map(([id,name])=>`<option value="${id}" ${settings.language===id?'selected':''}>${FLAGS[id]} ${esc(name)}</option>`).join('')}</select><p>Translation uses a protected server function when enabled. The original is never changed. Original curated GIFs and stickers are available. Player photo uploads remain disabled.</p><button type="button" data-517="saveSettings">Save settings</button>`;}
/* Account-scoped, device-local unread cursors. Do not clear other rooms on Messenger open.
 * Only active, successfully loaded conversations count as read. This is not OS push. */
const unreadKey=()=>room==='alliance'?'alliance:'+allianceId:roomKey();
const timeOf=value=>{const ms=Date.parse(value||'');return Number.isFinite(ms)?ms:0};
const unreadText=n=>n>99?'99+':String(n);
function renderUnread(){
 const total=Object.values(unreadCounts).reduce((sum,n)=>sum+n,0);
 const badge=$('dd517Badge');if(badge){badge.hidden=total===0;badge.textContent=unreadText(total);}
 if(root)for(const channel of ['world','alliance','private','language']){
  const btn=root.querySelector('[data-room="'+channel+'"]');if(!btn)continue;
  let counter=btn.querySelector('.dd517UnreadNumber');
  if(!counter){counter=document.createElement('span');counter.className='dd517UnreadNumber';counter.setAttribute('aria-hidden','true');btn.appendChild(counter);}
  const count=unreadCounts[channel]||0;counter.hidden=count===0;counter.textContent=unreadText(count);
  const label={world:'Global',alliance:'Alliance',private:'Private',language:'Languages'}[channel];
  btn.setAttribute('aria-label',label+(count?' — '+count+' unread messages':''));
 }
 if(badge){const launcher=$('dd517Shortcut');launcher?.setAttribute('aria-label','Open Royal Messenger'+(total?' — '+total+' unread messages':''));}
}
function markRead(key,when){
 if(!who||!key||key==='private:'||key==='alliance:null')return;
 const safeTime=timeOf(when)?when:new Date().toISOString();
 if(timeOf(safeTime)>timeOf(seen[key])){seen[key]=safeTime;persist('seen',seen);}
 if(key==='world')unreadCounts.world=0;
 else if(key.startsWith('alliance:'))unreadCounts.alliance=0;
 else if(key==='lang:'+settings.language)unreadCounts.language=0;
 else if(key.startsWith('private:')){const id=key.slice(8);unreadCounts.private=Math.max(0,unreadCounts.private-(unreadByPeer[id]||0));unreadByPeer[id]=0;}
 renderUnread();
}
function unreadCount(rows,key,now){
 if(seen[key]===undefined){seen[key]=now;return 0;}
 const threshold=timeOf(seen[key]);
 return rows.filter(m=>m.sender_id!==who.id&&!blocked.has(m.sender_id)&&timeOf(m.created_at)>threshold).length;
}
async function unread(){
 if(!who||document.hidden||unreadInFlight)return;
 const c=client(),uid=who.id,lang=settings.language;
 if(!c)return;
 unreadInFlight=true;
 try{
  // Membership must be known even if the player has never opened Alliance Chat.
  if(Date.now()-membershipCheckedAt>300000){await refreshMembership();membershipCheckedAt=Date.now();}
  if(who?.id!==uid)return;
  const aid=allianceId;
  // Each query reads only a bounded recent window. Supabase RLS still controls visibility.
  const tasks=[
   c.from('messages').select('created_at,sender_id').eq('channel','world').order('created_at',{ascending:false}).limit(100),
   aid?c.from('messages').select('created_at,sender_id').eq('channel','alliance').eq('alliance_id',aid).order('created_at',{ascending:false}).limit(100):Promise.resolve({data:[],error:null}),
   c.from('messages').select('created_at,sender_id').eq('channel','private').eq('recipient_id',uid).order('created_at',{ascending:false}).limit(100),
   c.from('dd517_language_messages').select('created_at,sender_id').eq('language',lang).order('created_at',{ascending:false}).limit(100)
  ];
  const responses=await Promise.allSettled(tasks);
  if(who?.id!==uid||allianceId!==aid||settings.language!==lang)return;
  const now=new Date().toISOString(),next={...unreadCounts};let dirty=false;
  const getRows=i=>responses[i]?.status==='fulfilled'&&!responses[i].value.error?responses[i].value.data||[]:null;
  const world=getRows(0);if(world){if(seen.world===undefined)dirty=true;next.world=unreadCount(world,'world',now);}
  const alliance=getRows(1);if(!aid)next.alliance=0;else if(alliance){const key='alliance:'+aid;if(seen[key]===undefined)dirty=true;next.alliance=unreadCount(alliance,key,now);}
  const privateMessages=getRows(2);if(privateMessages){
   if(seen['private:all']===undefined){seen['private:all']=now;dirty=true;}
   const baseline=timeOf(seen['private:all']);const byPeer=Object.create(null);
   next.private=0;
   for(const msg of privateMessages){
    if(msg.sender_id===uid||blocked.has(msg.sender_id))continue;
    const peerKey='private:'+msg.sender_id;
    if(timeOf(msg.created_at)>Math.max(baseline,timeOf(seen[peerKey]))){next.private++;byPeer[msg.sender_id]=(byPeer[msg.sender_id]||0)+1;}
   }
   unreadByPeer=byPeer;
  }
  const language=getRows(3);if(language){const key='lang:'+lang;if(seen[key]===undefined)dirty=true;next.language=unreadCount(language,key,now);}
  if(dirty)persist('seen',seen);
  // The room being viewed is already read. Other rooms and private threads remain unread.
  if(open){if(room==='world')next.world=0;if(room==='alliance'&&aid)next.alliance=0;if(room==='lang:'+lang)next.language=0;
   if(room==='private'&&goodId(peer)){next.private=Math.max(0,next.private-(unreadByPeer[peer]||0));unreadByPeer[peer]=0;}}
  unreadCounts=next;renderUnread();
 }catch(e){/* No fake unread counts when temporarily offline. */}
 finally{unreadInFlight=false;}
}
function startPolling(){stopPolling();pollTimer=setInterval(()=>{if(open&&!document.hidden)loadMessages({quiet:true})},8000)}
function stopPolling(){if(pollTimer)clearInterval(pollTimer);pollTimer=null}
function clearUnread(){if(!who)return;seen['private:all']=new Date().toISOString();persist('seen',seen);const badge=$('dd517Badge');if(badge)badge.hidden=true;}
async function onClick(e){const b=e.target.closest('[data-517],[data-room],[data-langroom],[data-peer]');if(!b||!root.contains(b))return;
if(b.dataset.room){chooseRoom(b.dataset.room==='language'?'language':b.dataset.room);return;}
if(b.dataset.langroom){chooseRoom('lang:'+b.dataset.langroom);return;}
if(b.dataset.peer){peer=b.dataset.peer;peerName=b.dataset.peerName||'';version++;renderRoom();await loadMessages();return;}
const action=b.dataset['517'];if(action==='close'){setOpen(false);return;}if(action==='login'){setOpen(false);$('onlineOpen')?.click();return;}if(action==='settings'){showSettings();return;}
if(action==='saveSettings'){
const nextLanguage=$('dd517Preferred').value;
const languageChanged=nextLanguage!==settings.language;
const autoEnabled=!settings.auto&&$('dd517Auto').checked;
settings={auto:$('dd517Auto').checked,original:$('dd517Original').checked,language:LANG[nextLanguage]?nextLanguage:'en'};
persist('settings',settings);translationUnavailable=false;
// A language change starts a fresh small batch. Keep target-keyed translations already fetched.
if(languageChanged||autoEnabled)autoTranslateCount=0;
$('dd517Settings').hidden=true;renderMessages();void unread();return;}
if(action==='emoji'){$('dd517Emoji').hidden=!$('dd517Emoji').hidden;$('dd517Emoji').innerHTML=EMOJIS.map(x=>`<button type="button" data-insert-emoji="${x}">${x}</button>`).join('');return;}
if(action==='setPeer'){const id=$('dd517Player')?.value.trim();if(!goodId(id)||id===who.id)return status('Enter another commander’s valid Player ID.');peer=id;peerName='';version++;renderRoom();await loadMessages();return;}
if(action==='find'){await findPlayers();return;}
if(action==='translate'||action==='original'){setTranslation(b.dataset.id);return;}
if(action==='reply'){const m=items.find(x=>String(x.id)===String(b.dataset.id));if(m){replies={name:displayName(m.sender_id),text:window.DD519?.labelFor?.(m.body)||window.DD518?.labelFor?.(m.body)||m.body.slice(0,70)};$('dd517Reply').hidden=false;$('dd517Reply').innerHTML=`<span>↩ Replying to ${esc(replies.name)}: ${esc(replies.text)}</span><button data-517="cancelReply" type="button">✕</button>`;$('dd517Text').focus()}return;}
if(action==='cancelReply'){replies=null;$('dd517Reply').hidden=true;return;}
if(action==='mute'){const id=b.dataset.user;blocked.add(id);persist('blocked',[...blocked]);window.DD519?.blockUser?.(id);items=items.filter(x=>x.sender_id!==id);renderMessages();status('Commander muted on this device.');void unread();return;}
if(action==='report'){await reportMessage(items.find(x=>String(x.id)===String(b.dataset.id)));return;}}
function init(){const head=document.querySelector('.royalQuickLinks');if(!head)return;const launcher=document.createElement('button');launcher.type='button';launcher.className='royalTopIcon';launcher.id='dd517Shortcut';launcher.title='Royal Messenger';launcher.setAttribute('aria-label','Open Royal Messenger');launcher.innerHTML='💬<span id="dd517Badge" class="ddMailBadge" hidden>0</span>';head.appendChild(launcher);root=initialHTML();renderUnread();launcher.addEventListener('click',async()=>{await login()});root.addEventListener('click',async e=>{const emoji=e.target.closest('[data-insert-emoji]');if(emoji){const text=$('dd517Text');if(text){const val=emoji.dataset.insertEmoji;if((text.value+val).length<=300){text.setRangeText(val,text.selectionStart,text.selectionEnd,'end');text.focus()}}return}await onClick(e)});
$('dd517Form').addEventListener('submit',send);$('dd517Text').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if($('dd517Text').value.trim())$('dd517Form').requestSubmit()}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)setOpen(false)});
// Dino Dominion 6.12.5: native Messenger Instant Unmute.
// The private in-memory mute Set must be updated inside the Messenger closure;
// changing localStorage alone would leave the previous mute state active.
// Retains the tested 6.12.3b hotfix's account and room race safeguards.
async function dd6125UnmuteNow(blockedId,accountId){
 if(!who||who.id!==accountId||!goodId(blockedId)||blockedId===accountId)return false;
 blocked.delete(blockedId);
 persist('blocked',[...blocked]);
 const ticket=++version;
 if(open){items=[];renderMessages(true);}
 for(let i=0;i<30&&loading;i++)await new Promise(r=>setTimeout(r,100));
 if(!who||who.id!==accountId||version!==ticket)return false;
 if(open)await loadMessages();
 void unread();
 return true;
}
window.DD517={unmuteNow:dd6125UnmuteNow,open:login,close:()=>setOpen(false),refresh:()=>loadMessages(),context:()=>({userId:who?.id||'',allianceId,room,peer,open}),version:VERSION,sendRich:async token=>{if(!/^\[\[DD518:(STICKER|GIF):[a-z0-9-]{1,32}\]\]$/.test(token))return false;const input=$('dd517Text');if(!who||!open||busy||Date.now()-lastSent<2500||!input||input.value.trim()){status('Send your typed message first, or wait a moment before sending another reaction.');return false;}input.value=token;await send({preventDefault(){}});const ok=input.value==='';if(!ok)input.value='';return ok;}};
setTimeout(async()=>{if(await resolveAuth())await unread();checkTimer=setInterval(async()=>{if(!await resolveAuth()){who=null;unreadCounts={world:0,alliance:0,private:0,language:0};renderUnread();return;}await unread()},30000)},2400);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void unread()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

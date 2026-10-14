/* Dino Dominion V1.0 Build 5 — Cloud Kingdom hotfix: retains searchable commanders and restores cloud bridge. */
(()=>{'use strict';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=window.DINO_ONLINE_CONFIG||{},configured=/^https:\/\//.test(cfg.url||'')&&!!cfg.anonKey&&!!window.supabase;
const client=configured?window.supabase.createClient(cfg.url,cfg.anonKey):null,app=$('onlineApp'),panel=$('onlineLayer');
let session=null,profile=null,membership=null,alliance=null,roster=[],alliances=[],challenges=[],channel='world',recipient='',messages=[],page='profile',notice='',loading=false,watcher=null,allianceSub='overview',applications=[],onlineSquad=[0,1,2],warTerritories=[],warReports=[],warReady=false,lastWarResult=null,embeddedTab=null,peopleQuery='',peopleResults=null,peopleLoading=false,replayTimer=null,mailRows=[],mailReady=false,mailError='',mailTab='inbox',mailSelected=null,mailComposeTo='',mailCompose=false,mailCount=0,royalRanks=[],royalRankError='',inspectedCommander=null,lastMailPoll=0;
const txt=(id,hint,max=40)=>`<input id="${id}" maxlength="${max}" placeholder="${esc(hint)}" autocomplete="off">`;
function alertMsg(s){notice=s;draw()}
function stop(){if(watcher){clearInterval(watcher);watcher=null}}
function watch(){stop();if(session)watcher=setInterval(async()=>{if(panel.classList.contains('hide'))return;await refreshMessages();if(Date.now()-lastMailPoll>25000){lastMailPoll=Date.now();await loadRoyalData(true)}},7000)}
$('onlineOpen').onclick=async()=>{panel.classList.remove('hide');draw();await loadSession()};
$('onlineClose').onclick=()=>{panel.classList.add('hide');stop()};
function shell(inner){app.innerHTML=`<div class="status">${!configured?'🟠 Offline: add public Supabase settings to config.js':session?'🟢 Online · '+esc(profile?.commander_name||session.user.email):'🟡 Supabase connected · sign in required'}</div>${notice?`<div class="notice">${esc(notice)}</div>`:''}${inner}`}
function draw(){if(!configured){shell('<div class="panel"><h2>🛡️ Alliance Wars Alpha 0.9</h2><p>Online features require a Supabase connection and the v0.7 SQL migration. Local 3D battles and progression still work.</p></div>');return}
if(!session){shell(`<div class="panel"><h2>🦖 Commander login</h2><p class="hint">Register or sign in with email. Verification may be required.</p>${txt('email','Email',120)}<input id="password" type="password" placeholder="Password (6+ characters)"><div class="onlineRow"><button data-do="signin">Sign in</button><button class="secondary" data-do="signup">Create account</button></div></div>`);return}
let menu=`<div class="onlineRow ddTabs">${[['profile','👤 Profile'],['alliance','🛡️ Alliance'],['chat','💬 Chat'],['mail','✉️ Royal Mail'],['rank','🏆 Rankings'],['war','⚔️ Wars'],['challenge','🥊 Challenges'],['squad','🦖 Squad'],['friends','👥 Friends']].map(([id,name])=>`<button class="${page===id?'':'secondary'}" data-page="${id}">${name}</button>`).join('')}</div>`;
let content='';if(page==='profile')content=profileView();if(page==='alliance')content=allianceView();if(page==='chat')content=chatView();if(page==='mail')content=mailView();if(page==='commander')content=publicCommanderView();if(page==='rank')content=rankView();if(page==='war')content=warView();if(page==='challenge')content=challengeView();if(page==='friends')content=friendsView();if(page==='squad')content=squadView();shell(`<div class="panel onlineRow" style="justify-content:space-between"><small>${esc(session.user.email)}</small><button class="secondary" data-do="signout">Sign out</button></div>${menu}${content}<p class="hint">V1.0 beta: online war squads and outcomes are verified by Supabase. Cloud Kingdom stores your progress, but its power/level values are not yet trusted for competitive PvP rankings.</p>`)}
function profileView(){return `<div class="panel"><h2>👤 Commander profile</h2><div style="font-size:52px;text-align:center">${esc(profile?.avatar||'🦖')}</div><h2 style="text-align:center">${esc(profile?.commander_name||'Unnamed commander')}</h2><p class="hint">${membership?'Alliance: ['+esc(alliance?.tag||'???')+'] '+esc(alliance?.name||''):'No alliance yet'} · Player ID: ${esc(session.user.id.slice(0,8))}…</p><label>Commander name (3–20 letters, numbers or _)</label><input id="commanderName" maxlength="20" value="${esc(profile?.commander_name||'')}" placeholder="Commander name"><label>Avatar</label><select id="avatar">${['🦖','🦕','🐉','🛡️','🔥','❄️'].map(a=>`<option ${profile?.avatar===a?'selected':''}>${a}</option>`).join('')}</select><button data-do="saveProfile">Save profile</button><p class="hint">Other players can find your commander name; your email stays private.</p>${window.DDCloud?.panelHTML()||'<p class="hint">Cloud save initializing…</p>'}</div>`}
const badge=(a,small=false)=>{const shape=['shield','round','diamond'].includes(a?.badge_shape)?a.badge_shape:'shield';const emblem=['🦖','🦕','🐉','🛡️','🔥','⚔️','👑','🌿'].includes(a?.badge_emblem)?a.badge_emblem:'🦖';const color=/^#[0-9a-f]{6}$/i.test(a?.badge_color||'')?a.badge_color:'#d9ad5b';return `<span class="ddBadge ddBadge-${shape} ${small?'ddBadgeSmall':''}" style="--badge-color:${color}">${emblem}</span>`};
const allianceName=a=>`<b class="ddAllianceName">${esc(a?.name||'Alliance')}</b>`;
const modeName=m=>({open:'Open joining',approval:'Apply to join',closed:'Closed'})[m]||'Open joining';
function allianceNav(rank){let list=[['overview','🏠 Overview'],['members','👥 Members'],['chat','💬 Chat'],['warfare','⚔️ Warfront'],...(rank>=4?[['applications','📨 Requests']]:[]),...(rank===5?[['settings','⚙️ Settings']]:[])];return `<div class="ddAllianceNav">${list.map(([id,label])=>`<button data-alliance-tab="${id}" class="${allianceSub===id?'active':''}">${label}</button>`).join('')}</div>`}
function allianceView(){let rank=membership?.rank||1,cap=Math.min(100,70+5*((alliance?.level||1)-1));
 if(!membership)return `<div class="panel"><h2>🛡️ Find your alliance</h2><p class="hint">Join an alliance or become its R5 leader.</p><h3>Create an alliance</h3>${txt('newAllianceName','Alliance name',40)}${txt('newAllianceTag','Tag (2–5 letters/numbers)',5)}<button data-do="create">Create alliance</button><h3>Join by alliance ID</h3>${txt('joinId','Alliance ID',36)}<button data-do="join">Join (open alliances)</button></div>${discoveryView()}`;
 const header=`<div class="panel ddAllianceMain"><div class="ddAllianceIdentity">${badge(alliance)}<div class="ddAllianceTitle">${allianceName(alliance)}<span class="ddTag">[${esc(alliance?.tag||'—')}]</span><div class="hint">Level ${alliance?.level||1} · ${roster.length}/${cap} members · ${alliance?.xp||0} XP · Your rank R${rank}</div></div></div>${allianceNav(rank)}</div>`;
 let view='';
 if(allianceSub==='overview'){view=`<div class="panel"><h3>🏠 Alliance overview</h3><p class="ddWrap">${esc(alliance?.description||'Your alliance description will appear here.')}</p>${alliance?.announcement?`<div class="notice"><b>📣 Announcement</b><p class="ddWrap">${esc(alliance.announcement)}</p></div>`:''}<p class="hint">Recruitment: ${esc(modeName(alliance?.recruitment_mode))}</p><div class="ddActionGrid"><button data-do="contribute">🌟 Contribute +10 XP (daily)</button><button class="secondary" data-do="copyAlliance">Copy alliance ID</button><button class="secondary" data-do="leave">Leave alliance</button></div>${rank>=4?`<details class="ddMailOfficer"><summary>✉️ Send officer announcement</summary><form id="ddAllianceNotice" class="ddMailForm"><input id="ddNoticeSubject" required maxlength="90" placeholder="Announcement subject"><textarea id="ddNoticeBody" required maxlength="1200" rows="3" placeholder="Your message to alliance members"></textarea><button type="submit">Send to alliance members</button></form></details>`:''}</div>`}
 if(allianceSub==='members'){view=`<div class="panel"><h3>👥 Members (${roster.length})</h3>${roster.map(r=>`<div class="ddMember"><div class="ddMemberInfo"><b>${esc(r.name)}</b><span class="ddTag">R${r.rank}</span><small>${r.contribution||0} XP contributed</small></div>${rank>=4&&r.user_id!==session.user.id&&r.rank<rank?`<div class="ddMemberActions"><label for="rank-${r.user_id}">Set rank</label><select id="rank-${r.user_id}">${[1,2,3,...(rank===5?[4]:[])].map(n=>`<option value="${n}" ${r.rank===n?'selected':''}>R${n}</option>`).join('')}</select><button class="secondary" data-do="rankMember" data-id="${r.user_id}">Save rank</button><button class="secondary" data-do="kick" data-id="${r.user_id}">Kick</button>${rank===5?`<button class="secondary" data-do="transfer" data-id="${r.user_id}">Make R5 leader</button>`:''}</div>`:''}</div>`).join('')}</div>`}
 if(allianceSub==='warfare'){view=warView()}
 if(allianceSub==='chat'){view=`<div class="panel"><h3>💬 Alliance chat</h3><p class="hint">Visible only to alliance members.</p><div id="ddMessages" class="onlineMessages">${messageHTML(messages)}</div><form id="ddSend" class="ddChatForm">${txt('messageBody','Message your alliance',300)}<button type="submit">Send</button></form></div>`}
 if(allianceSub==='applications'&&rank>=4){view=`<div class="panel"><h3>📨 Membership requests (${applications.length})</h3>${applications.length?applications.map(a=>`<div class="ddMember"><div class="ddMemberInfo"><b>${esc(displayName(a.user_id))}</b><small>${new Date(a.created_at).toLocaleDateString()}</small></div><div class="ddMemberActions"><button data-do="approveJoin" data-id="${a.id}">Approve</button><button class="secondary" data-do="rejectJoin" data-id="${a.id}">Reject</button></div></div>`).join(''):'<p class="hint">No pending applications.</p>'}</div>`}
 if(allianceSub==='settings'&&rank===5){const e=alliance?.badge_emblem||'🦖',shape=alliance?.badge_shape||'shield',color=alliance?.badge_color||'#d9ad5b',mode=alliance?.recruitment_mode||'open';view=`<div class="panel"><h3>⚙️ Alliance settings · R5</h3><p class="hint">Changes are saved online and visible to members. Only the leader can save these settings.</p><label for="settingName">Alliance name</label><input id="settingName" maxlength="40" value="${esc(alliance?.name||'')}"><label for="settingTag">Tag (2–5 letters or numbers)</label><input id="settingTag" maxlength="5" value="${esc(alliance?.tag||'')}"><label for="settingDescription">Description (240 max)</label><textarea id="settingDescription" rows="3" maxlength="240">${esc(alliance?.description||'')}</textarea><label for="settingAnnouncement">Announcement (180 max)</label><textarea id="settingAnnouncement" rows="2" maxlength="180">${esc(alliance?.announcement||'')}</textarea><h3>🛡️ Design your badge</h3><div class="ddBadgeDesigner">${badge(alliance)}<div><label for="settingEmblem">Emblem</label><select id="settingEmblem">${['🦖','🦕','🐉','🛡️','🔥','⚔️','👑','🌿'].map(x=>`<option value="${x}" ${x===e?'selected':''}>${x}</option>`).join('')}</select></div></div><label for="settingShape">Badge shape</label><select id="settingShape">${[['shield','Shield'],['round','Round'],['diamond','Diamond']].map(([x,t])=>`<option value="${x}" ${x===shape?'selected':''}>${t}</option>`).join('')}</select><label for="settingColor">Badge color</label><input id="settingColor" type="color" value="${/^#[0-9a-f]{6}$/i.test(color)?color:'#d9ad5b'}"><label for="settingMode">Recruitment</label><select id="settingMode">${[['open','Open · join instantly'],['approval','Approval · officers review requests'],['closed','Closed · no new recruits']].map(([x,t])=>`<option value="${x}" ${x===mode?'selected':''}>${t}</option>`).join('')}</select><button data-do="saveAlliance">💾 Save alliance settings</button></div>`}
 return header+view;
}
function discoveryView(){return `<div class="panel"><h2>🔎 Discover alliances</h2>${alliances.length?alliances.map(a=>`<div class="ddDiscovery">${badge(a,true)}<div class="ddDiscoveryText"><b>[${esc(a.tag||'—')}] ${esc(a.name)}</b><small>Level ${a.level||1} · ${esc(modeName(a.recruitment_mode))}</small></div>${!membership&&a.recruitment_mode!=='closed'?`<button class="secondary" data-do="${a.recruitment_mode==='approval'?'requestJoin':'joinListed'}" data-id="${a.id}">${a.recruitment_mode==='approval'?'Apply':'Join'}</button>`:''}</div>`).join(''):'<p class="hint">No alliances found.</p>'}</div>`}
function messageHTML(items){return items.length?items.map(m=>`<div class="onlineMessage"><b>${esc(m.sender_id===session?.user.id?'You':displayName(m.sender_id))}</b><div>${esc(m.body)}</div></div>`).join(''):'<div class="hint">No messages yet.</div>'}
const warDinos=[
 ['🦖','Blazefang','Berserker'],['🦕','Thornshield','Guardian'],
 ['🦖','Nightclaw','Assassin'],['🦕','Tidebreaker','Striker'],
 ['🦕','Ironhide','Guardian'],['🦕','Sunwhisper','Support']
];
const squadNames=units=>(Array.isArray(units)?units:[]).map(i=>warDinos[Number(i)]?.[1]||'Unknown').join(' · ');
function squadView(){return `<div class="panel"><h2>🦖 Online Defense Squad</h2><p class="hint">Choose three different dinosaurs for online challenges and to defend your alliance's captured territories (the R5 leader's squad). Each type has fixed server-controlled stats. Your local dinosaur levels and egg creatures are not yet used.</p><div class="ddSquadGrid">${[0,1,2].map((slot)=>`<div class="ddSquadSlot"><b>Slot ${slot+1}</b><select id="ddSquad${slot}">${warDinos.map(([emoji,name,cls],i)=>`<option value="${i}" ${onlineSquad[slot]===i?'selected':''}>${emoji} ${name} · ${cls}</option>`).join('')}</select></div>`).join('')}</div><p class="hint">Current saved squad: ${esc(squadNames(onlineSquad))}</p><button data-do="saveSquad">💾 Save online squad</button><button class="secondary" data-page="challenge">🥊 Friendly PvP</button><button class="secondary" data-page="war">⚔️ Alliance Warfront</button></div>`}
function battleReport(report){if(!report)return '<p class="hint">No report saved.</p>';
 const turns=Array.isArray(report.rounds)?report.rounds:[];
 return `<details class="ddCombatLog"><summary>View ${turns.length} server battle actions</summary><div class="ddCombatSteps">${turns.map((r,i)=>`<div><b>${i+1}.</b> ${esc(r.attacker==='challenger'?'Attacker':'Defender')}${Number.isInteger(r.dino)?' · '+esc(warDinos[r.dino]?.[1]||'Dinosaur'):''} dealt <b>${Number(r.damage)||0}</b> damage · Target HP ${Number(r.opponent_hp)||0}</div>`).join('')||'<p class="hint">Older battle report.</p>'}</div></details>`;
}
function challengeView(){return `<div class="panel"><h2>🥊 Online 3v3 Challenges</h2><p class="hint">Asynchronous friendly PvP. The opponent must accept; Supabase calculates the battle using both saved online squads. No coins, competitive rank or dinosaur XP is awarded.</p><div class="ddActionGrid"><button class="secondary" data-page="squad">🦖 Edit defense squad</button><button class="secondary" data-do="refreshWarfare">↻ Refresh</button></div><h3>Challenge a commander</h3><select id="challengeOpponent"><option value="">Choose player</option>${(window.ddDirectory||[]).filter(p=>p.user_id!==session.user.id).map(p=>`<option value="${esc(p.user_id)}">${esc(p.commander_name)}</option>`).join('')}</select><button data-do="issueChallenge">Send challenge</button><h3>Requests & battle reports</h3>${challenges.length?challenges.map(c=>`<div class="ddBattleEntry"><b>${c.challenger===session.user.id?'You challenged '+esc(displayName(c.opponent)):esc(displayName(c.challenger))+' challenged you'}</b><p class="hint">${esc(c.status)} · ${new Date(c.created_at).toLocaleString()}</p>${c.status==='pending'&&c.opponent===session.user.id?`<div class="ddActionGrid"><button data-do="acceptChallenge" data-id="${esc(c.id)}">Accept & Battle</button><button class="secondary" data-do="declineChallenge" data-id="${esc(c.id)}">Decline</button></div>`:''}${c.status==='completed'?`<p>${c.winner===session.user.id?'🏆 You won':'Defeat'} · Team HP ${Number(c.report?.challenger_hp??c.report?.attacker_hp)||0} vs ${Number(c.report?.opponent_hp??c.report?.defender_hp)||0}</p>${battleReport(c.report)}<button class="secondary" data-replay="challenge" data-id="${esc(c.id)}">🎥 Watch report replay</button>`:''}</div>`).join(''):'<p class="hint">No challenges yet. Ask another account to join the beta!</p>'}</div>`}
function commanderCard(p){return `<div class="ddCommanderCard"><b>${esc(p.avatar||'🦖')} ${esc(p.commander_name||'Unnamed')}</b><small>Commander ID: ${esc(String(p.user_id||'').slice(0,8))}… · Public profile</small><div class="ddCommanderActions"><button class="secondary" data-do="viewCommander" data-id="${esc(p.user_id)}">👤 Profile</button><button class="secondary" data-do="composeToCommander" data-id="${esc(p.user_id)}">✉️ Mail</button><button class="secondary" data-do="messageFriend" data-id="${esc(p.user_id)}">💬 Chat</button><button class="secondary" data-do="challengeFriend" data-id="${esc(p.user_id)}">⚔️ Challenge</button><button class="secondary" data-do="copyPlayer" data-id="${esc(p.user_id)}">📋 Copy ID</button>${membership&&Number(membership.rank)>=4?`<button class="secondary" data-do="inviteCommander" data-id="${esc(p.user_id)}">🛡️ Invite</button>`:''}</div></div>`}
function friendsView(){let people=(peopleResults===null?window.ddDirectory||[]:peopleResults).filter(p=>p.user_id!==session.user.id);return `<div class="panel"><h2>🔎 Find Commanders</h2><p class="hint">Search public commander names or an exact Player ID. View squads, send Royal Mail, invite commanders, or issue challenges. Requests to become friends are not available yet.</p><form id="ddSearchPlayers" class="ddSearchForm"><input id="ddPlayerQuery" maxlength="36" value="${esc(peopleQuery)}" placeholder="Name or Player UUID" autocomplete="off"><button type="submit">🔎 Search</button></form>${peopleQuery?`<button class="secondary" data-do="clearPlayerSearch">Clear search</button>`:''}<p class="hint">${peopleResults===null?'Showing first 50 commanders. Search to find more.':`${people.length} matching public profiles (max 25)`}</p>${people.length?people.map(commanderCard).join(''):'<p class="hint">No commanders matched. Try another name.</p>'}</div>`}
async function searchCommanders(){if(!session)return;const q=($('ddPlayerQuery')?.value||'').trim();if(!/^[A-Za-z0-9_]{2,20}$/.test(q)&&!/^[0-9a-f-]{36}$/i.test(q)){notice='Search 2–20 letters/numbers or paste a Player UUID';draw();return}peopleQuery=q;peopleLoading=true;const {data,error}=await client.from('commander_profiles').select('user_id,commander_name,avatar')[ /^[0-9a-f-]{36}$/i.test(q)?'eq':'ilike'](/^[0-9a-f-]{36}$/i.test(q)?'user_id':'commander_name',/^[0-9a-f-]{36}$/i.test(q)?q:'%'+q+'%').order('commander_name').limit(25);peopleLoading=false;if(error){notice='Search: '+error.message;return draw()}peopleResults=data||[];notice='';draw()}

function displayName(id){return (window.ddDirectory||[]).find(p=>p.user_id===id)?.commander_name||id.slice(0,8)}
function chatView(){return `<div class="panel"><h2>💬 Online chat</h2><div class="onlineRow">${['world','alliance','private'].map(c=>`<button class="${channel===c?'':'secondary'}" data-channel="${c}">${c==='world'?'🌍 World':c==='alliance'?'🛡️ Alliance':'✉️ Private'}</button>`).join('')}</div>${channel==='private'?`<p class="hint">Enter the recipient's account UUID (not commander name yet).</p>${txt('recipient','Recipient UUID',36)}`:''}<div id="ddMessages" class="onlineMessages">${messageHTML(messages)}</div><form id="ddSend" class="onlineRow">${txt('messageBody','Type a message',300)}<button type="submit">Send</button></form><p class="hint">No automated moderation or anti-spam yet. Keep this as a small private test.</p></div>`}
function updateMailBadge(){
 window.DDRoyalMailUnread=Math.max(0,Number(mailCount)||0);
 window.dispatchEvent(new CustomEvent('dd:mail-count',{detail:window.DDRoyalMailUnread}));
}
async function loadRoyalData(silent=false){
 if(!session)return;
 const [letters,ranks,count]=await Promise.all([
  client.from('dd_royal_mail').select('id,sender_id,recipient_id,kind,subject,body,alliance_id,created_at,read_at').order('created_at',{ascending:false}).limit(150),
  client.rpc('dd_royal_rankings'),client.rpc('dd_unread_mail_count')
 ]);
 if(letters.error){mailError=letters.error.message;mailReady=false;}else{mailError='';mailRows=letters.data||[];mailReady=true;}
 if(ranks.error){royalRankError=ranks.error.message;}else{royalRankError='';royalRanks=ranks.data||[];}
 if(!count.error){mailCount=Math.max(0,Number(count.data)||0);}else if(mailReady)mailCount=mailRows.filter(x=>x.recipient_id===session.user.id&&!x.read_at).length;
 updateMailBadge();lastMailPoll=Date.now();
 if(silent&&page==='mail'&&!document.getElementById('ddMailCompose'))draw();
}
const dateMail=t=>{try{return new Date(t).toLocaleString()}catch{return 'Recently'}};
function mailView(){
 const uid=session.user.id;const mine=mailRows.filter(m=>m.recipient_id===uid);const sent=mailRows.filter(m=>m.sender_id===uid&&m.recipient_id!==uid);
 const filtered=mailTab==='sent'?sent:mailTab==='system'?mine.filter(m=>m.kind!=='personal'&&m.kind!=='invitation'):mine.filter(m=>m.kind==='personal'||m.kind==='invitation');
 const selected=mailSelected?mailRows.find(m=>m.id===mailSelected):null;
 const list=filtered.map(m=>`<button type="button" class="ddMailLetter ${m.recipient_id===uid&&!m.read_at?'unread':''}" data-do="openMail" data-id="${esc(m.id)}"><span class="ddMailKind">${m.kind==='personal'?'✉️':m.kind==='invitation'?'🛡️':m.kind==='battle'?'⚔️':'📣'}</span><span class="ddMailPreview"><b>${esc(m.subject)}</b><small>${esc(m.kind==='personal'?'Private letter':m.kind==='invitation'?'Alliance invitation':m.kind==='battle'?'Battle notice':'Announcement')} · ${esc(dateMail(m.created_at))}</small></span>${m.recipient_id===uid&&!m.read_at?'<span class="ddMailDot" aria-label="Unread"></span>':''}</button>`).join('');
 return `<div class="panel ddMailPanel"><div class="ddMailHeading"><h2>✉️ Royal Mail</h2><span>${mailCount} unread</span></div><p class="hint">Private letters, officer invitations, alliance announcements and battle notices. Mail stays with your Supabase account.</p>${!mailReady?`<div class="notice">${esc(mailError||'Loading mail… Run the Build 5.3 Supabase migration before using this screen.')}</div>`:''}
 <div class="ddMailActions"><button data-do="mailCompose">✍️ Write letter</button><button class="secondary" data-do="refreshRoyal">↻ Refresh</button><button class="secondary" data-page="friends">🔎 Find commanders</button></div>
 ${mailCompose?`<form id="ddMailCompose" class="ddMailForm"><h3>Write a royal letter</h3><label for="ddMailTo">Recipient Player ID</label><input id="ddMailTo" maxlength="36" required value="${esc(mailComposeTo)}" placeholder="Commander UUID"><label for="ddMailSubject">Subject</label><input id="ddMailSubject" maxlength="90" required placeholder="Subject"><label for="ddMailBody">Message</label><textarea id="ddMailBody" rows="5" maxlength="1200" required placeholder="Write your letter…"></textarea><div class="ddMailActions"><button type="submit">✉️ Send letter</button><button class="secondary" type="button" data-do="cancelMailCompose">Cancel</button></div></form>`:''}
 ${selected?`<div class="ddMailOpened"><div class="ddMailActions"><button class="secondary" data-do="closeMail">← Back to letters</button><button class="secondary" data-do="deleteMail" data-id="${esc(selected.id)}">Delete for me</button></div><h3>${esc(selected.subject)}</h3><p class="hint">${esc(dateMail(selected.created_at))} · ${esc(selected.kind)}${selected.sender_id?' · From '+esc(displayName(selected.sender_id)):''}</p><div class="ddMailBody">${esc(selected.body)}</div><div class="ddMailActions">${selected.sender_id&&selected.sender_id!==uid?`<button data-do="mailReply" data-id="${esc(selected.sender_id)}">Reply</button>`:''}${selected.kind==='invitation'&&selected.alliance_id&&selected.recipient_id===uid&&!membership?`<button data-do="joinMailInvite" data-id="${esc(selected.alliance_id)}">🛡️ Join / Apply</button>`:''}${selected.kind==='battle'?`<button class="secondary" data-page="challenge">⚔️ View Challenges</button><button class="secondary" data-page="war">🏰 Warfront</button>`:''}</div></div>`:''}
 <div class="ddMailTabs">${[['inbox','📥 Inbox'],['sent','📤 Sent'],['system','📜 System']].map(([id,n])=>`<button data-mail-tab="${id}" class="${mailTab===id?'selected':'secondary'}">${n}</button>`).join('')}</div>
 <div class="ddMailList">${list||'<div class="hint" style="padding:14px">No letters in this folder yet.</div>'}</div><p class="hint">Mail is private to sender and recipient. Sending is rate-limited. Do not share passwords or personal information in messages.</p></div>`;
}
function publicCommanderView(){
 const p=inspectedCommander;
 if(!p)return `<div class="panel"><p class="hint">Select a commander to view their public profile.</p><button data-page="friends">Find commanders</button></div>`;
 const squad=Array.isArray(p.squad)?p.squad.map(i=>warDinos[Number(i)]?.[1]||'Dinosaur').join(' · '):'No saved online squad';
 return `<div class="panel"><div class="ddMailActions"><button class="secondary" data-page="friends">← Find commanders</button><button class="secondary" data-page="rank">🏆 Rankings</button></div><div class="ddPublicCommanderAvatar">${esc(p.avatar||'🦖')}</div><h2 class="ddPublicCommanderName">${esc(p.commander_name||'Commander')}</h2><p class="hint">${p.alliance_name?`[${esc(p.alliance_tag||'—')}] ${esc(p.alliance_name)}`:'Independent commander'}</p><div class="ddMailOpened"><h3>🦖 Saved online defense squad</h3><p>${esc(squad)}</p><small class="hint">Server-saved online squad; local dinosaur collection and upgrades are not public verified stats.</small></div><p class="hint">Player ID: ${esc(p.user_id)}</p><div class="ddMailActions"><button data-do="composeToCommander" data-id="${esc(p.user_id)}">✉️ Royal Mail</button><button data-do="messageFriend" data-id="${esc(p.user_id)}">💬 Private Chat</button><button data-do="challengeFriend" data-id="${esc(p.user_id)}">⚔️ Challenge</button>${membership&&Number(membership.rank)>=4?`<button data-do="inviteCommander" data-id="${esc(p.user_id)}">🛡️ Invite to alliance</button>`:''}</div></div>`;
}
function warAllianceName(id){if(!id)return 'Neutral defenders';if(id===membership?.alliance_id)return alliance?.name||'Your alliance';return alliances.find(a=>a.id===id)?.name||'Another alliance';}
function warView(){
 const mine=warTerritories.filter(x=>x.owner_alliance_id&&x.owner_alliance_id===membership?.alliance_id).length;
 const standings=Object.entries(warTerritories.reduce((acc,t)=>{if(t.owner_alliance_id)acc[t.owner_alliance_id]=(acc[t.owner_alliance_id]||0)+1;return acc},{})).sort((a,b)=>b[1]-a[1]);
 const readyNotice=!warReady?'<div class="notice">⚠️ War data unavailable. Install migration_v09_build5.sql in Supabase, then refresh.</div>':'';
 const territories=warTerritories.map(t=>{
 const my=t.owner_alliance_id===membership?.alliance_id&&!!membership;
 const owned=!!t.owner_alliance_id;
 return `<div class="ddWarTile ${my?'mine':''}"><div class="ddWarTileIcon">${['🌿','💎','🌋','🌲','🏛️','🐊','🌾','❄️','🏔️'][t.id-1]||'🏰'}</div><b>${esc(t.name)}</b><small>${esc(warAllianceName(t.owner_alliance_id))}</small><span class="ddWarStatus">${my?'👑 Defending':owned?'⚔️ Rival-held':'🛡️ Unclaimed'}</span>${membership&&!my?`<button data-do="attackTerritory" data-id="${t.id}">⚔️ Attack</button>`:''}</div>`}).join('');
 const report=lastWarResult?.report;
 return `<div class="panel"><h2>⚔️ Alliance Warfront</h2><p class="hint">9 shared online territories · Server-calculated 3v3 attacks · 3 attacks per commander per UTC day · 90-second cooldown per territory. Enemy alliance leader's online squad defends its territory. Unclaimed territories have neutral guards.</p>${readyNotice}<div class="ddWarSummary"><span>🏯 Your alliance: <b>${mine}/9</b></span><span>🦖 Your squad: <b>${esc(squadNames(onlineSquad))}</b></span></div><div class="ddActionGrid"><button class="secondary" data-page="squad">Edit squad</button><button class="secondary" data-do="refreshWarfare">↻ Refresh map</button></div>${report?`<div class="notice"><b>${lastWarResult.captured?'🏆 Territory captured!':'🛡️ Your attack was repelled'}</b><p class="hint">Attacking HP ${Number(report.attacker_hp)||0} · Defending HP ${Number(report.defender_hp)||0} · Attacks left today: ${Number(lastWarResult.remaining_today)||0}</p>${battleReport(report)}<button class="secondary" data-replay="last">🎥 Replay last attack</button></div>`:''}<h3>🗺️ Shared territories</h3><div class="ddWarGrid">${territories||'<p class="hint">No war map data yet.</p>'}</div><h3>🏆 Territory standings</h3>${standings.length?standings.map(([id,n],i)=>`<div class="ddWarRanking"><b>#${i+1} ${esc(warAllianceName(id))}</b><span>${n} territory${n===1?'':'ies'}</span></div>`).join(''):'<p class="hint">All 9 territories are unclaimed.</p>'}<h3>📜 Recent battles</h3>${warReports.length?warReports.slice(0,14).map(b=>`<div class="ddBattleEntry"><b>${esc(warAllianceName(b.attacker_alliance_id))}</b> ${b.captured?'captured':'attacked'} <b>${esc(warTerritories.find(t=>t.id===b.territory_id)?.name||'territory')}</b><div class="hint">${new Date(b.created_at).toLocaleString()} · ${esc(displayName(b.attacker_id))}</div>${battleReport(b.report)}<button class="secondary" data-replay="war" data-id="${esc(b.id)}">🎥 Watch report replay</button></div>`).join(''):'<p class="hint">No online territory battles yet.</p>'}<p class="hint">Beta notes: captured territories grant no rewards yet. Local World captures are separate. Seasonal resets, protected matchmaking and synced dinosaur progression are future work.</p></div>`;
}
function rankView(){
 const standings=Object.entries(warTerritories.reduce((o,t)=>{if(t.owner_alliance_id)o[t.owner_alliance_id]=(o[t.owner_alliance_id]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1]);
 const ranked=royalRanks||[];
 return `<div class="panel"><h2>🏆 Dominion Rankings</h2><p class="hint">Verified battle points: +3 for a server-recorded duel win, +5 for a server-recorded successful territory attack. All-time battle totals, updated on refresh. Local level and power are deliberately excluded until server-controlled.</p>${royalRankError?`<div class="notice">Rankings: ${esc(royalRankError)} · Run Build 5.3 SQL.</div>`:''}<div class="ddMailActions"><button class="secondary" data-do="refreshRoyal">↻ Refresh</button><button class="secondary" data-page="friends">🔎 Find player</button></div><h3>⚔️ Commander battle leaders</h3>${ranked.length?ranked.slice(0,50).map((r,i)=>`<div class="ddRoyalRank"><b>${i+1<=3?['🥇','🥈','🥉'][i]:'#'+(i+1)} ${esc(r.avatar||'🦖')} ${esc(r.commander_name||'Commander')}</b><div><strong>${Number(r.score)||0} pts</strong><small>${Number(r.duel_wins)||0} duel wins · ${Number(r.war_wins)||0} war wins</small></div><button class="secondary" data-do="viewCommander" data-id="${esc(r.user_id)}">Profile</button></div>`).join(''):'<p class="hint">No ranked commanders yet, or rankings have not loaded.</p>'}<h3>🏰 Current alliance territory leaders</h3>${standings.length?standings.map(([id,n],i)=>`<div class="ddWarRanking"><b>#${i+1} ${esc(warAllianceName(id))}</b><span>${n}/9 territories</span></div>`).join(''):'<p class="hint">No alliance controls territory yet.</p>'}<div class="notice"><b>Fair-play ranking policy</b><p class="hint">Commander level and power in Cloud Kingdom are currently client-supplied. We will publish competitive level/power rankings after all progression is validated by Supabase.</p></div></div>`;
}

let replayOverlay=null;
function closeReplay(){if(replayTimer){clearInterval(replayTimer);replayTimer=null}if(replayOverlay){replayOverlay.remove();replayOverlay=null}}
function showReplay(report,label){
 closeReplay();const actions=Array.isArray(report?.rounds)?report.rounds.slice(0,100):[];
 replayOverlay=document.createElement('div');replayOverlay.className='ddReplayOverlay';replayOverlay.setAttribute('role','dialog');replayOverlay.setAttribute('aria-modal','true');replayOverlay.setAttribute('aria-label','Battle report replay');
 replayOverlay.innerHTML=`<div class="ddReplayFrame"><p class="hint">SERVER BATTLE REPORT · VISUAL REPLAY</p><h2>${esc(label)}</h2><p class="hint">Illustrated battle-log playback; no new combat is calculated.</p><div class="ddReplayDuel"><span class="ddReplayActor" id="replayAttacker">🦖</span><b>VS</b><span class="ddReplayActor" id="replayDefender">🦕</span></div><div class="ddReplayLog" id="replayText" aria-live="polite">${actions.length?'Preparing battle report…':'No individual combat actions were saved for this battle.'}</div><div class="ddReplayControls"><button type="button" id="replayNext">Next move</button><button type="button" id="replayAuto">▶ Auto</button><button type="button" id="replayClose">✕ Close</button></div><p class="hint" id="replayCounter">${actions.length} recorded moves</p></div>`;
 document.body.appendChild(replayOverlay);let i=0;
 const next=()=>{
  if(i>=actions.length){if(replayTimer){clearInterval(replayTimer);replayTimer=null}const log=replayOverlay?.querySelector('#replayText');if(log)log.textContent='Battle report complete.';return}
  const a=actions[i++],isAttacker=a.attacker==='challenger'||a.attacker==='attacker';
  const actor=replayOverlay.querySelector(isAttacker?'#replayAttacker':'#replayDefender'),target=replayOverlay.querySelector(isAttacker?'#replayDefender':'#replayAttacker');
  actor.classList.remove('attack');target.classList.remove('hurt');void actor.offsetWidth;actor.classList.add('attack');target.classList.add('hurt');
  const unit=Number.isInteger(a.dino)?(warDinos[a.dino]?.[1]||'Dinosaur'):'Squad';
  replayOverlay.querySelector('#replayText').textContent=`Move ${i}: ${unit} deals ${Number(a.damage)||0} damage. Target HP: ${Number(a.opponent_hp)||0}`;
  replayOverlay.querySelector('#replayCounter').textContent=`${i} / ${actions.length} recorded moves`;
 };
 replayOverlay.querySelector('#replayNext').onclick=()=>{if(replayTimer){clearInterval(replayTimer);replayTimer=null}next()};
 replayOverlay.querySelector('#replayAuto').onclick=()=>{if(replayTimer){clearInterval(replayTimer);replayTimer=null;return}next();replayTimer=setInterval(next,1050)};
 replayOverlay.querySelector('#replayClose').onclick=closeReplay;
 replayOverlay.addEventListener('click',e=>{if(e.target===replayOverlay)closeReplay()});
 replayOverlay.querySelector('#replayClose').focus();
}
async function loadSession(){if(!client)return;const {data,error}=await client.auth.getSession();if(error){alertMsg(error.message);return}session=data.session;if(session)await reload();else{profile=null;membership=null;alliance=null;warTerritories=[];warReports=[];warReady=false;onlineSquad=[0,1,2];lastWarResult=null;mailRows=[];mailReady=false;mailCount=0;royalRanks=[];updateMailBadge();window.DDAllianceSummary=null;window.dispatchEvent(new CustomEvent('dd:alliance-updated',{detail:null}));draw();stop()}}
async function reload(){if(!session)return;const uid=session.user.id;const [p,m,a,d]=await Promise.all([client.from('commander_profiles').select('*').eq('user_id',uid).maybeSingle(),client.from('alliance_members').select('alliance_id,rank,contribution').eq('user_id',uid).maybeSingle(),client.from('alliances').select('id,name,tag,owner_id,level,xp,description,announcement,badge_emblem,badge_shape,badge_color,recruitment_mode').order('created_at',{ascending:false}).limit(60),client.from('commander_profiles').select('user_id,commander_name,avatar').order('commander_name').limit(50)]);
profile=p.data||null;membership=m.data||null;alliances=a.data||[];window.ddDirectory=d.data||[];alliance=alliances.find(x=>x.id===membership?.alliance_id)||null;if(membership&&!alliance){let x=await client.from('alliances').select('id,name,tag,owner_id,level,xp,description,announcement,badge_emblem,badge_shape,badge_color,recruitment_mode').eq('id',membership.alliance_id).maybeSingle();alliance=x.data}
roster=[];if(membership){let r=await client.from('alliance_members').select('user_id,rank,contribution').eq('alliance_id',membership.alliance_id);let ids=(r.data||[]).map(x=>x.user_id);if(ids.length){let names=await client.from('commander_profiles').select('user_id,commander_name').in('user_id',ids);roster=(r.data||[]).map(m=>({user_id:m.user_id,rank:m.rank,contribution:m.contribution,name:names.data?.find(n=>n.user_id===m.user_id)?.commander_name||m.user_id.slice(0,8)})).sort((a,b)=>b.rank-a.rank)}}
applications=[];
if(membership&&Number(membership.rank)>=4){const req=await client.from('dd_alliance_applications').select('id,user_id,created_at').eq('alliance_id',membership.alliance_id).order('created_at',{ascending:false}).limit(60);applications=req.data||[];if(req.error)notice='Requests: '+req.error.message;}
// Warfare data is independent from device-local dinos; gracefully handle pre-migration installs.
const [savedSquad,zones,history]=await Promise.all([
 client.from('dd_online_squads').select('units').eq('user_id',uid).maybeSingle(),
 client.from('dd_war_territories').select('id,name,owner_alliance_id,captured_at,last_battle_at,victories').order('id'),
 client.from('dd_war_battles').select('id,territory_id,attacker_id,attacker_alliance_id,defender_alliance_id,winner_alliance_id,captured,report,created_at').order('created_at',{ascending:false}).limit(30)
]);
onlineSquad=Array.isArray(savedSquad.data?.units)&&savedSquad.data.units.length===3?savedSquad.data.units:[0,1,2];
warTerritories=zones.data||[];warReports=history.data||[];
warReady=!savedSquad.error&&!zones.error&&!history.error&&warTerritories.length===9;
window.DDAllianceSummary=alliance?{name:alliance.name,tag:alliance.tag,badge_emblem:alliance.badge_emblem,badge_color:alliance.badge_color}:null;
window.dispatchEvent(new CustomEvent('dd:alliance-updated',{detail:window.DDAllianceSummary}));
let ch=await client.from('dd_challenges').select('*').order('created_at',{ascending:false}).limit(40);challenges=ch.data||[];if(ch.error)notice='Challenges: '+ch.error.message;await loadRoyalData();draw();await refreshMessages();watch()}
async function refreshMessages(){const inAlliance=page==='alliance'&&allianceSub==='chat';if(!session||!(page==='chat'||inAlliance))return;
const target=inAlliance?'alliance':channel;
let q=client.from('messages').select('id,created_at,sender_id,body,channel,alliance_id,recipient_id').order('created_at',{ascending:false}).limit(60);
if(target==='alliance'){if(!membership){messages=[];return}q=q.eq('channel','alliance').eq('alliance_id',membership.alliance_id)}else q=q.eq('channel',target);
const {data,error}=await q;if(error){notice='Chat: '+error.message;return}
messages=(data||[]).filter(m=>target!=='private'||!recipient||((m.sender_id===session.user.id&&m.recipient_id===recipient)||(m.sender_id===recipient&&m.recipient_id===session.user.id))).reverse();
const box=$('ddMessages');if(box)box.innerHTML=messageHTML(messages)}
async function action(a,button){if(loading)return;loading=true;try{let result;if(a==='signin'||a==='signup'){let email=$('email')?.value.trim(),password=$('password')?.value;if(!email||!password)throw Error('Enter email and password');result=a==='signin'?await client.auth.signInWithPassword({email,password}):await client.auth.signUp({email,password});if(result.error)throw result.error;notice=a==='signup'?'Account created. Verify your email if required.':'Signed in';await loadSession();return}
if(a==='signout'&&window.DDCloud?.hasPending()&&!confirm('Your latest kingdom changes are not yet uploaded. Sign out anyway? They will remain saved on this device.'))return;
if(a?.startsWith('cloud')){if(!window.DDCloud)throw Error('Cloud feature unavailable');await window.DDCloud.action(a);return}
if(a==='signout'){closeReplay();peopleQuery='';peopleResults=null;result=await client.auth.signOut();if(result.error)throw result.error;session=null;notice='Signed out';lastWarResult=null;onlineSquad=[0,1,2];warTerritories=[];warReports=[];warReady=false;mailRows=[];mailCount=0;royalRanks=[];mailReady=false;updateMailBadge();draw();stop();return}
if(a==='refreshRoyal'){await loadRoyalData();notice='Royal services refreshed';draw();return}
if(a==='mailCompose'){mailCompose=true;mailSelected=null;page='mail';draw();return}
if(a==='cancelMailCompose'){mailCompose=false;draw();return}
if(a==='closeMail'){mailSelected=null;draw();return}
if(a==='openMail'){
 const m=mailRows.find(x=>x.id===button.dataset.id);if(!m)throw Error('Letter not found');
 mailSelected=m.id;mailCompose=false;page='mail';
 if(m.recipient_id===session.user.id&&!m.read_at){const r=await client.rpc('dd_read_royal_mail',{p_mail:m.id});if(r.error)throw r.error;m.read_at=new Date().toISOString();mailCount=Math.max(0,mailCount-1);updateMailBadge();}
 draw();return;
}
if(a==='deleteMail'){
 if(!confirm('Remove this letter from your mailbox?'))return;
 result=await client.rpc('dd_delete_royal_mail',{p_mail:button.dataset.id});if(result.error)throw result.error;
 mailSelected=null;await loadRoyalData();notice='Letter removed from your view';draw();return;
}
if(a==='mailReply'||a==='composeToCommander'){
 mailComposeTo=button.dataset.id;mailCompose=true;mailSelected=null;mailTab='inbox';page='mail';draw();return;
}
if(a==='viewCommander'){
 const id=button.dataset.id;if(!/^[0-9a-f-]{36}$/i.test(id||''))throw Error('Invalid commander ID');
 const r=await client.rpc('dd_public_commander',{p_user:id});if(r.error)throw r.error;
 if(!r.data)throw Error('Commander not found');inspectedCommander=r.data;page='commander';draw();window.DDFullUI?.syncTitle('commander');return;
}
if(a==='inviteCommander'){
 if(!membership||Number(membership.rank)<4)throw Error('Alliance officer permission required');
 if(!confirm('Send this commander an alliance invitation?'))return;
 result=await client.rpc('dd_invite_by_mail',{p_recipient:button.dataset.id,p_alliance:membership.alliance_id});
 if(result.error)throw result.error;notice='Alliance invitation delivered';await loadRoyalData();draw();return;
}
if(a==='joinMailInvite'){
 if(membership)throw Error('Leave your current alliance first');
 const aId=button.dataset.id;const aResult=await client.from('alliances').select('recruitment_mode,name').eq('id',aId).maybeSingle();if(aResult.error)throw aResult.error;
 if(!aResult.data)throw Error('Alliance no longer exists');
 if(aResult.data.recruitment_mode==='closed')throw Error('Recruitment is currently closed');
 if(!confirm('Contact '+aResult.data.name+' for membership? '+(aResult.data.recruitment_mode==='approval'?'Apply to join':'Join this alliance')+'?'))return;
 result=aResult.data.recruitment_mode==='approval'?await client.rpc('dd_request_join',{p_alliance:aId}):await client.rpc('dd_join_alliance',{p_alliance:aId});
 if(result.error)throw result.error;notice=aResult.data.recruitment_mode==='approval'?'Application submitted':'Alliance joined';await reload();return;
}
if(a==='saveProfile'){let commander_name=$('commanderName')?.value.trim(),avatar=$('avatar')?.value;if(!/^[A-Za-z0-9_]{3,20}$/.test(commander_name||''))throw Error('Use 3–20 letters, numbers, or underscores');result=await client.from('commander_profiles').upsert({user_id:session.user.id,commander_name,avatar,updated_at:new Date().toISOString()},{onConflict:'user_id'})}
if(a==='create'){let p_name=$('newAllianceName')?.value.trim(),p_tag=$('newAllianceTag')?.value.trim();result=await client.rpc('dd_create_alliance',{p_name,p_tag})}
if(a==='join'||a==='joinListed'){let p_alliance=a==='joinListed'?button.dataset.id:$('joinId')?.value.trim();if(!/^[0-9a-f-]{36}$/i.test(p_alliance||''))throw Error('Invalid alliance ID');result=await client.rpc('dd_join_alliance',{p_alliance})}
if(a==='leave'){if(!confirm('Leave your alliance? You will lose access to alliance chat. Leaders must transfer leadership first.'))return;result=await client.rpc('dd_leave_alliance')}
if(a==='transfer'){if(!confirm('Transfer leadership to this member?'))return;result=await client.rpc('dd_transfer_leadership',{p_new_owner:button.dataset.id})}
if(a==='kick'||a==='rankMember'){if(!confirm(a==='kick'?'Kick this member?':'Change member rank?'))return;result=await client.rpc('dd_manage_member',{p_target:button.dataset.id,p_action:a==='kick'?'kick':'rank',p_rank:a==='kick'?null:Number($('rank-'+button.dataset.id)?.value)})}
if(a==='saveAlliance'){
const p_name=$('settingName')?.value.trim(),p_tag=$('settingTag')?.value.trim(),p_description=$('settingDescription')?.value.trim(),p_announcement=$('settingAnnouncement')?.value.trim(),p_badge_emblem=$('settingEmblem')?.value,p_badge_shape=$('settingShape')?.value,p_badge_color=$('settingColor')?.value,p_recruitment_mode=$('settingMode')?.value;
if(!p_name||p_name.length<3||p_name.length>40)throw Error('Alliance name must be 3–40 characters');if(!/^[a-z0-9]{2,5}$/i.test(p_tag||''))throw Error('Tag must be 2–5 letters/numbers');
result=await client.rpc('dd_update_alliance',{p_name,p_tag,p_description,p_announcement,p_badge_emblem,p_badge_shape,p_badge_color,p_recruitment_mode});
}
if(a==='requestJoin')result=await client.rpc('dd_request_join',{p_alliance:button.dataset.id});
if(a==='approveJoin'||a==='rejectJoin'){if(!confirm(a==='approveJoin'?'Approve this player?':'Reject this application?'))return;result=await client.rpc('dd_review_application',{p_application:button.dataset.id,p_accept:a==='approveJoin'});}
if(a==='saveSquad'){
 const p_units=[0,1,2].map(i=>Number($('ddSquad'+i)?.value));
 if(p_units.some(n=>!Number.isInteger(n)||n<0||n>5)||new Set(p_units).size!==3)throw Error('Select three DIFFERENT dinosaurs');
 result=await client.rpc('dd_save_online_squad',{p_units});
 }
if(a==='attackTerritory'){
 const id=Number(button.dataset.id);
 if(!warReady)throw Error('Warfront needs the Build 5 SQL migration.');
 if(!Number.isInteger(id)||id<1||id>9)throw Error('Invalid territory');
 const target=warTerritories.find(t=>t.id===id);
 if(!target)throw Error('Territory not found');
 if(!confirm('Attack '+target.name+' using your saved online squad? You have 3 attacks per day.'))return;
 result=await client.rpc('dd_war_attack',{p_territory:id});
 if(result.error)throw result.error;
 lastWarResult=result.data;page='war';allianceSub='warfare';
 }
if(a==='refreshWarfare'){notice='Warfront refreshed';await reload();return}
if(a==='contribute')result=await client.rpc('dd_contribute');
if(a==='messageFriend'){recipient=button.dataset.id;channel='private';page='chat';messages=[];draw();let r=$('recipient');if(r)r.value=recipient;await refreshMessages();return}
 if(a==='challengeFriend'){result=await client.rpc('dd_issue_challenge',{p_opponent:button.dataset.id});if(result?.error)throw result.error;notice='Challenge sent!';page='challenge';await reload();return}
 if(a==='issueChallenge'){let id=$('challengeOpponent')?.value;if(!id)throw Error('Choose a commander');result=await client.rpc('dd_issue_challenge',{p_opponent:id})}
if(a==='acceptChallenge'||a==='declineChallenge')result=await client.rpc('dd_respond_challenge',{p_challenge:button.dataset.id,p_accept:a==='acceptChallenge'});
if(a==='copyPlayer'){if(!/^[0-9a-f-]{36}$/i.test(button.dataset.id||''))throw Error('Invalid commander');await navigator.clipboard?.writeText(button.dataset.id);notice='Commander ID copied';draw();return}
if(a==='clearPlayerSearch'){peopleQuery='';peopleResults=null;notice='';draw();return}
if(a==='copyAlliance'){navigator.clipboard?.writeText(membership.alliance_id);alertMsg('Alliance ID copied (if clipboard permission allowed)');return}
if(result?.error)throw result.error;notice=a==='attackTerritory'?'War battle completed!':a==='saveSquad'?'Online squad saved!':a==='saveAlliance'?'Alliance settings saved!':a==='requestJoin'?'Application submitted!':'Success!';await reload()}catch(e){alertMsg(e.message||'Something went wrong. Check the Build 4 SQL migration.')}finally{loading=false}}
app.addEventListener('click',async e=>{
 const replay=e.target.closest('[data-replay]');if(replay){
  const kind=replay.dataset.replay,id=replay.dataset.id;
  const item=kind==='challenge'?challenges.find(x=>x.id===id):kind==='war'?warReports.find(x=>String(x.id)===String(id)):kind==='last'?{report:lastWarResult?.report}:null;
  if(item?.report)showReplay(item.report,kind==='challenge'?'Friendly duel':'Alliance war attack');else alertMsg('No battle report found. Refresh and try again.');return;
 }
 const mailTabButton=e.target.closest('[data-mail-tab]');if(mailTabButton){mailTab=mailTabButton.dataset.mailTab;mailSelected=null;draw();return;}
 let t=e.target.closest('[data-page],[data-channel],[data-do],[data-alliance-tab]');if(!t)return;if(t.dataset.allianceTab){allianceSub=t.dataset.allianceTab;messages=[];draw();if(allianceSub==='chat')refreshMessages();return}if(t.dataset.page){page=t.dataset.page;mailSelected=null;mailCompose=false;draw();if(page==='chat'){if(channel==='private'&&recipient){let r=$('recipient');if(r)r.value=recipient}refreshMessages()}return}if(t.dataset.channel){channel=t.dataset.channel;messages=[];draw();if(channel==='private'&&recipient){let r=$('recipient');if(r)r.value=recipient}refreshMessages();return}await action(t.dataset.do,t)});
app.addEventListener('submit',async e=>{
 if(e.target.id==='ddMailCompose'){
  e.preventDefault();if(loading||!session)return;loading=true;
  try{const p_recipient=$('ddMailTo')?.value.trim(),p_subject=$('ddMailSubject')?.value.trim(),p_body=$('ddMailBody')?.value.trim();
   if(!/^[0-9a-f-]{36}$/i.test(p_recipient||''))throw Error('Enter a valid Player ID');
   if(!p_subject||!p_body)throw Error('Subject and message required');
   const {error}=await client.rpc('dd_send_royal_mail',{p_recipient,p_subject,p_body});if(error)throw error;
   mailCompose=false;mailTab='sent';mailComposeTo='';await loadRoyalData();notice='Royal letter sent';draw();
  }catch(err){notice='Mail: '+(err.message||'Send failed');draw();}finally{loading=false}return;
 }
 if(e.target.id==='ddAllianceNotice'){
  e.preventDefault();if(loading||!session||!membership)return;loading=true;
  try{const p_subject=$('ddNoticeSubject')?.value.trim(),p_body=$('ddNoticeBody')?.value.trim();
   const {data,error}=await client.rpc('dd_send_alliance_mail',{p_alliance:membership.alliance_id,p_subject,p_body});if(error)throw error;
   notice='Notice sent to '+Number(data||0)+' alliance members';await loadRoyalData();draw();
  }catch(err){notice='Announcement: '+(err.message||'Send failed');draw();}finally{loading=false}return;
 }
 if(e.target.id==='ddSearchPlayers'){e.preventDefault();await searchCommanders();return}if(e.target.id!=='ddSend')return;e.preventDefault();if(!session||loading)return;let body=$('messageBody')?.value.trim();if(!body||body.length>300)return alertMsg('Message must be 1–300 characters');let effectiveChannel=page==='alliance'&&allianceSub==='chat'?'alliance':channel;let payload={sender_id:session.user.id,body,channel:effectiveChannel};if(effectiveChannel==='alliance'){if(!membership)return alertMsg('Join an alliance first');payload.alliance_id=membership.alliance_id}if(effectiveChannel==='private'){let id=$('recipient')?.value.trim()||recipient;if(!/^[0-9a-f-]{36}$/i.test(id||''))return alertMsg('Enter a valid recipient UUID');payload.recipient_id=id;recipient=id}let {error}=await client.from('messages').insert(payload);if(error)return alertMsg(error.message);if($('messageBody'))$('messageBody').value='';refreshMessages()});
window.DDOnlineClient=client;
window.DDOnlineRedraw=()=>{if(page==='profile'&&session)draw()};
if(client)client.auth.onAuthStateChange(()=>{if(!panel.classList.contains('hide'))setTimeout(loadSession,0)});

// Build 2 bridge: mount the existing authenticated online UI inside game screens.
window.DDOnline={
  preserve(){if(panel.parentNode&&panel.parentNode!==document.body)document.body.appendChild(panel)},
  attach(tab){
    const mount=document.getElementById('onlineMount');
    if(mount){if(embeddedTab!=='alliance')page='alliance';embeddedTab='alliance';mount.appendChild(panel);panel.classList.add('embedded');panel.classList.remove('hide');if(!session)loadSession();else draw();}
    else{embeddedTab=null;this.preserve();panel.classList.add('hide');panel.classList.remove('embedded');stop();}
  },
  show(section){
    let mount=document.getElementById('onlineMount');
    if(!mount){
      const content=document.getElementById('content');if(!content)return;
      this.preserve();content.innerHTML='<div class="sectionHead"><h2>🌐 Dominion Social</h2><span class="small muted">Live multiplayer</span></div><div id="onlineMount"></div>';
      mount=document.getElementById('onlineMount');
    }
    mount.appendChild(panel);embeddedTab='social';panel.classList.add('embedded');panel.classList.remove('hide');page=section;draw();loadSession();
  }
};
})();

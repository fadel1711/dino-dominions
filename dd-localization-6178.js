/* Dino Dominion — shared localization runtime v6.17.8 (presentation only).
 * ONE observer / ONE catalog for the whole game, including lazy modules.
 * Do not translate saves, player text, game data, button IDs or select values.
 * Translations are finite and curated. Unknown English is left unchanged,
 * counted as coverage debt rather than faked with a dictionary guess.
 */
(()=>{'use strict';
 const SUPPORTED=new Set(['en','fr','ar','es','pt']);
 const RAW=Array.isArray(window.DDLocaleCatalog6178)?window.DDLocaleCatalog6178:[];
 const LANGS=['fr','ar','es','pt'];
 const maps=Object.fromEntries(LANGS.map((lang,index)=>[
  lang,new Map(RAW.filter(row=>Array.isArray(row)&&row.length===5)
   .map(row=>[row[0],row[index+1]]).filter(row=>row[0]&&row[1]))
 ]));
 let language='en',installed=false,pending=false,work=new Set();
 const originalText=new WeakMap(),appliedText=new WeakMap();
 const originalAttr=new WeakMap(),appliedAttr=new WeakMap(),originalDirection=new WeakMap();
 const audit={scanned:0,translated:0,uncataloged:0};
 const BLOCKED='script,style,noscript,template,code,pre,input,textarea,select,option,[contenteditable],[data-user-content],[data-dd-locale-ignore],.msg,.onlineMessage,.dd517Bubble,.dd517Translated,.dd517OriginalLine,.dd517Reply,.dd517MsgMeta,.dd6124aPreview,.dd519Post,.dd519Posts,.ddMailLetter,.ddMailOpened,.ddMailPreview,.ddMailMessage,.royalMailMessage,.dd6124Name,.dd68OrderBody';
 const NAMES=['aria-label','title','placeholder','alt'];
 function stored(){try{return localStorage.getItem('dd59-language')||'en'}catch{return'en'}}
 function normalized(lang){return SUPPORTED.has(lang)?lang:'en'}
 function current(){try{return normalized(window.DDWorldwide?.getLanguage?.()||stored())}catch{return normalized(stored())}}
 function decorate(raw,dict){
  if(dict.has(raw))return dict.get(raw);
  // Leading icon/separator is presentation, not part of the canonical label.
  const leading=/^([^\p{L}\p{N}]*)(.+)$/u.exec(raw);
  if(leading?.[1]){const inner=decorate(leading[2],dict);if(inner!==null)return leading[1]+inner;}
  // Common forms generated with a numeric counter. Never guess numeric values.
  let m=/^Squad (\d+)(\s*●)?$/.exec(raw);
  if(m&&dict.has('Squad'))return dict.get('Squad')+' '+m[1]+(m[2]||'');
  m=/^Save Squad (\d+)$/.exec(raw);
  if(m&&dict.has('Save Squad'))return dict.get('Save Squad')+' '+m[1];
  m=/^(\d+) attempts remaining$/.exec(raw);
  if(m&&dict.has('attempts remaining'))return m[1]+' '+dict.get('attempts remaining');
  m=/^(\d+) (seconds|minutes)$/.exec(raw);
  if(m&&dict.has(m[2]))return m[1]+' '+dict.get(m[2]);
  m=/^([A-Za-z\s/]+) · (\d+) (seconds|minutes)$/.exec(raw);
  if(m&&dict.has(m[3])){
   const parts=m[1].split(' / '),tr=parts.map(x=>dict.get(x));
   if(tr.every(Boolean))return tr.join(' / ')+' · '+m[2]+' '+dict.get(m[3]);
  }
  // Safe variable forms: only strictly matched numeric UI fragments; names and player text never interpolated.
  m=/^Base level (\d+) · (\d+) territories controlled$/.exec(raw);
  if(m&&dict.has('Base level')&&dict.has('territories controlled'))return dict.get('Base level')+' '+m[1]+' · '+m[2]+' '+dict.get('territories controlled');
  m=/^Base level (\d+) · (\d+) territory controlled$/.exec(raw);
  if(m&&dict.has('Base level')&&dict.has('territory controlled'))return dict.get('Base level')+' '+m[1]+' · '+m[2]+' '+dict.get('territory controlled');
  m=/^Collect (\d[\d,]*) gold \(once every (\d+) sec\)$/.exec(raw);
  if(m&&dict.has('Collect')&&dict.has('Gold')&&dict.has('once every')&&dict.has('sec'))return dict.get('Collect')+' '+m[1]+' '+dict.get('Gold')+' ('+dict.get('once every')+' '+m[2]+' '+dict.get('sec')+')';
  m=/^([⚔️\s]*)Power (\d[\d,]*)$/.exec(raw);
  if(m&&dict.has('Power'))return m[1]+dict.get('Power')+' '+m[2];
  m=/^Upgrade · (\d[\d,]*) (🪙|💎|🪵)$/.exec(raw);
  if(m&&dict.has('Upgrade'))return dict.get('Upgrade')+' · '+m[1]+' '+m[2];
  m=/^First-clear rewards: (.+)$/.exec(raw);
  if(m&&dict.has('First-clear rewards')&&/^[\d\s🪙🪵🌾⭐·,]+$/u.test(m[1]))return dict.get('First-clear rewards')+': '+m[1];
  m=/^PROVINCE (\d+) \/ (\d+)$/.exec(raw);
  if(m&&dict.has('PROVINCE'))return dict.get('PROVINCE')+' '+m[1]+' / '+m[2];
  m=/^Chapter (\d+) · (\d+)\/(\d+)$/.exec(raw);
  if(m&&dict.has('Chapter'))return dict.get('Chapter')+' '+m[1]+' · '+m[2]+'/'+m[3];
  m=/^(\d+)\s*\/\s*(\d+)\s+landmarks surveyed$/.exec(raw);
  if(m&&dict.has('landmarks surveyed'))return m[1]+'/'+m[2]+' '+dict.get('landmarks surveyed');
  m=/^(\d+) hybrid hatchlings$/.exec(raw);
  if(m&&dict.has('hybrid hatchlings'))return m[1]+' '+dict.get('hybrid hatchlings');
  m=/^FORMULA (\d+) · UNDISCOVERED$/.exec(raw);
  if(m&&dict.has('FORMULA')&&dict.has('UNDISCOVERED'))return dict.get('FORMULA')+' '+m[1]+' · '+dict.get('UNDISCOVERED');
  m=/^🔒 Unlock by conquering (.+)$/.exec(raw);
  // The target is a fictional proper place name, so preserve it as a named entity.
  if(m&&dict.has('Unlock by conquering'))return '🔒 '+dict.get('Unlock by conquering')+' '+(dict.get(m[1])||m[1]);
  m=/^(\s*[☁️✉️🌍🚶♛⚔️↻🦖🧭]+\s*)(.+)$/u.exec(raw);
  if(m&&dict.has(m[2]))return m[1]+dict.get(m[2]);
  m=/^(Level|Round|Rank|Wave|Squad|Save Squad|Warband slot|Page|Day|Territory|Position) (\d+)(\s*●)?$/.exec(raw);
  if(m){const key=m[1]==='Warband slot'?'Warband':m[1];if(dict.has(key))return dict.get(key)+' '+m[2]+(m[3]||'');}
  if(raw.includes(' + ')||raw.includes(' × ')){
   const separator=raw.includes(' + ')?' + ':' × ';
   const parts=raw.split(separator);
   if(parts.length===2&&parts.every(x=>dict.has(x)))return parts.map(x=>dict.get(x)).join(separator);
  }
  // v6.17.8 audited numeric UI templates. The numeric captures are preserved byte-for-byte.
  m=/^Citadel Level (\d+) · (\d+) controlled regions$/.exec(raw);
  if(m&&dict.has('Citadel Level')&&dict.has('controlled regions'))return dict.get('Citadel Level')+' '+m[1]+' · '+m[2]+' '+dict.get('controlled regions');
  m=/^((?:🪵|⛏️|✨|🪙)\s*)(\d[\d,]*) (Wood|Ore|Essence|Gold)$/u.exec(raw);
  if(m&&dict.has(m[3]))return m[1]+m[2]+' '+dict.get(m[3]);
  m=/^Lv\. (\d+) · Tap a free plot to move$/.exec(raw);
  if(m&&dict.has('Lv.')&&dict.has('Tap a free plot to move'))return dict.get('Lv.')+' '+m[1]+' · '+dict.get('Tap a free plot to move');
  m=/^Upgrade · (\d[\d,]*) 🪵 \+ ore$/.exec(raw);
  if(m&&dict.has('Upgrade')&&dict.has('Ore'))return dict.get('Upgrade')+' · '+m[1]+' 🪵 + '+dict.get('Ore');
  m=/^((?:🏰|⚒️)?\s*)Forge Lv\.?\s*(\d+)$/u.exec(raw);
  if(m&&dict.has('Forge Lv'))return m[1]+dict.get('Forge Lv')+' '+m[2];
  m=/^War Beast · Lv (\d+) · (Berserker|Guardian|Assassin|Striker|Support)$/.exec(raw);
  if(m&&dict.has('War Beast')&&dict.has('Lv')&&dict.has(m[2]))return dict.get('War Beast')+' · '+dict.get('Lv')+' '+m[1]+' · '+dict.get(m[2]);
  m=/^(Berserker|Guardian|Assassin|Striker|Support) · Lv (\d+)$/.exec(raw);
  if(m&&dict.has(m[1])&&dict.has('Lv'))return dict.get(m[1])+' · '+dict.get('Lv')+' '+m[2];
  m=/^((?:👑|⚔️)\s*)(LEAD|SUPPORT) · SLOT (\d+)$/u.exec(raw);
  if(m&&dict.has(m[2])&&dict.has('SLOT'))return m[1]+dict.get(m[2])+' · '+dict.get('SLOT')+' '+m[3];
  m=/^((?:👑)\s*)?(\d+) active leader$/u.exec(raw);
  if(m&&dict.has('active leader'))return (m[1]||'')+m[2]+' '+dict.get('active leader');
  m=/^((?:🤝)\s*)(\d+)% squad attack support$/u.exec(raw);
  if(m&&dict.has('squad attack support'))return m[1]+m[2]+'% '+dict.get('squad attack support');
  m=/^Recommended commander Lv\.(\d+)$/.exec(raw);
  if(m&&dict.has('Recommended commander')&&dict.has('Lv.'))return dict.get('Recommended commander')+' '+dict.get('Lv.')+' '+m[1];
  m=/^Energy (\d+)\/(\d+)$/.exec(raw);
  if(m&&dict.has('Energy'))return dict.get('Energy')+' '+m[1]+'/'+m[2];
  m=/^(\d+)\/(\d+) encounters until the region boss$/.exec(raw);
  if(m&&dict.has('encounters until the region boss'))return m[1]+'/'+m[2]+' '+dict.get('encounters until the region boss');
  m=/^Encounters (\d+) · Bosses defeated (\d+)$/.exec(raw);
  if(m&&dict.has('Encounters')&&dict.has('Bosses defeated'))return dict.get('Encounters')+' '+m[1]+' · '+dict.get('Bosses defeated')+' '+m[2];
  m=/^(\d+) standard eggs hatched\. Pity applies only to Standard Mystery Eggs\. Older, already incubating eggs keep their promised rarity\.$/.exec(raw);
  if(m&&dict.has('standard eggs hatched. Pity applies only to Standard Mystery Eggs. Older, already incubating eggs keep their promised rarity.'))return m[1]+' '+dict.get('standard eggs hatched. Pity applies only to Standard Mystery Eggs. Older, already incubating eggs keep their promised rarity.');
  m=/^(\d+) companions collected · Open$/.exec(raw);
  if(m&&dict.has('companions collected')&&dict.has('Open'))return m[1]+' '+dict.get('companions collected')+' · '+dict.get('Open');
  m=/^([\p{L}]+): (\d+)$/u.exec(raw);
  if(m&&['Common','Uncommon','Legendary','Gold','Mythic','Godly'].includes(m[1])&&dict.has(m[1]))return dict.get(m[1])+': '+m[2];
  m=/^(\d+) minute incubation · 🪙 (\d+) gold$/.exec(raw);
  if(m&&dict.has('minute incubation')&&dict.has('Gold'))return m[1]+' '+dict.get('minute incubation')+' · 🪙 '+m[2]+' '+dict.get('Gold');
  m=/^(\d[\d,]*) (?:instant construction completions|free dinosaur level upgrades|gold credited instantly)$/.exec(raw);
  if(m){const key=raw.slice(m[1].length+1);if(dict.has(key))return m[1]+' '+dict.get(key);}
  // Numeric material summaries inside the sandbox shop are descriptive only.
  m=/^(\d[\d,]*) (gold|wood|ore|essence|training manual|training manuals|local PvE war charges)(?: · (.+))?$/.exec(raw);
  if(m){const kind=m[2].toLowerCase(),key={gold:'Gold',wood:'Wood',ore:'Ore',essence:'Essence'}[kind];
   if(key&&dict.has(key)&&!m[3])return m[1]+' '+dict.get(key);
   if(key&&dict.has(key)&&m[3]){const rest=decorate(m[3],dict);if(rest!==null)return m[1]+' '+dict.get(key)+' · '+rest;}
  }
  m=/^([🧭🛡️👑🤝⚔️✉️⚡\s]*)(?:BUILD) (\d+(?:\.\d+)*(?:-alpha\.\d+)?) · (.+)$/u.exec(raw);
  if(m&&dict.has('BUILD')){
   const tr=decorate(m[3],dict);
   if(tr!==null)return m[1]+dict.get('BUILD')+' '+m[2]+' · '+tr;
  }
  m=/^BUILD (\d+(?:\.\d+)*) · (.+)$/.exec(raw);
  if(m&&dict.has('BUILD')&&/[\u0600-\u06ff]/.test(m[2]))return dict.get('BUILD')+' '+m[1]+' · '+m[2];
  m=/^([⚡\s]*)(\d+\/\d+) energy$/u.exec(raw);
  if(m&&dict.has('Energy'))return m[1]+m[2]+' '+dict.get('Energy');
  m=/^Current squad: (.+)$/.exec(raw);
  if(m&&dict.has('Current squad'))return dict.get('Current squad')+': '+m[1];
  m=/^Wild rarity chances are separate from egg chances; Godly wild encounters are exceptionally rare\. (\d+) successfully tamed\.$/.exec(raw);
  if(m&&dict.has('Wild rarity chances are separate from egg chances; Godly wild encounters are exceptionally rare.')&&dict.has('successfully tamed.'))return dict.get('Wild rarity chances are separate from egg chances; Godly wild encounters are exceptionally rare.')+' '+m[1]+' '+dict.get('successfully tamed.');
  // Exact segmented interface labels may combine known terms with dynamic values.
  m=/^Equipped: (.+)$/.exec(raw);
  if(m&&dict.has('Equipped:')&&/^[\s\d+\-⚔️🛡️❤️·%]+$/u.test(m[1]))return dict.get('Equipped:')+' '+m[1];
  m=/^([\s\S]*?)Power (\d[\d,]*)$/.exec(raw);
  if(m&&dict.has('Power')&&/^[\s⚡]*$/.test(m[1]))return m[1]+dict.get('Power')+' '+m[2];
  m=/^((?:[\d,.]+\s+(?:gold|wood|ore|essence|energy)(?:\s*·\s*|\s*\+\s*|\s*))+[\d,.]+\s+(?:gold|wood|ore|essence|energy))$/.exec(raw);
  if(m){const result=raw.replace(/(\d[\d,.]*)\s+(gold|wood|ore|essence|energy)\b/g,(all,n,v)=>n+' '+(dict.get(v)||all.substring(n.length+1)));
    if(result!==raw)return result;}
  m=/^([A-Za-z][A-Za-z ]+) · ([0-9]+(?:\/\d+)?) (?:Energy)$/.exec(raw);
  if(m&&dict.has(m[1])&&dict.has('Energy'))return dict.get(m[1])+' · '+m[2]+' '+dict.get('Energy');
  m=/^((?:[🪵⛏️✨🪙\s]*)[\d,]+(?:\/[\d,]+)?)(?:\s+)\b(wood|ore|essence|gold)\b$/u.exec(raw);
  if(m&&dict.has(m[2]))return m[1]+' '+dict.get(m[2]);
  // Do not alter unknown fictional names, messages, save-state, or gameplay values.
  m=/^([\s\S]*?)\bBUILD (\d+(?:\.\d+)*(?:-alpha\.\d+)?) · (.+)$/.exec(raw);
  if(m&&dict.has('BUILD'))return m[1]+dict.get('BUILD')+' '+m[2]+' · '+(dict.get(m[3])||m[3]);
  m=/^BUILD (\d+(?:\.\d+)*(?:-alpha\.\d+)?)$/.exec(raw);
  if(m&&dict.has('BUILD'))return dict.get('BUILD')+' '+m[1];
  m=/^((?:⚡)\s*)(\d[\d,]*) Power$/u.exec(raw);
  if(m&&dict.has('Power'))return m[1]+m[2]+' '+dict.get('Power');
  m=/^([\p{L} -]+) · (?:Lv\.?)\s*(\d+) · ⭐$/u.exec(raw);
  if(m&&dict.has(m[1])&&dict.has('Lv.'))return dict.get(m[1])+' · '+dict.get('Lv.')+' '+m[2]+' · ⭐';
  m=/^(War Beast) · (Berserker|Guardian|Assassin|Striker|Support) · Level (\d+)$/.exec(raw);
  if(m&&dict.has(m[1])&&dict.has(m[2])&&dict.has('Level'))return dict.get(m[1])+' · '+dict.get(m[2])+' · '+dict.get('Level')+' '+m[3];
  m=/^(Blazefang|Thornshield|Nightclaw|Tidebreaker|Ironhide|Sunwhisper) · (Berserker|Guardian|Assassin|Striker|Support)$/.exec(raw);
  if(m&&dict.has(m[1])&&dict.has(m[2]))return dict.get(m[1])+' · '+dict.get(m[2]);
  m=/^(Inferno Bite|Shield Ram|Shadow Strike|Tidal Strike|Stonewall|Life Bloom) · (Tyrannosaurus|Triceratops|Raptor|Spinosaurus|Ankylosaurus|Parasaurolophus) · Level (\d+)$/.exec(raw);
  if(m&&dict.has(m[1])&&dict.has(m[2])&&dict.has('Level'))return dict.get(m[1])+' · '+dict.get(m[2])+' · '+dict.get('Level')+' '+m[3];
  m=/^(\s*[\p{Extended_Pictographic}\uFE0F\u200D]*\s*)(Train|Evolve|Equip|Train Rider|Forge Armor) · (\d[\d,]*) (🪙|✨|ore)$/.exec(raw);
  if(m&&dict.has(m[2]))return m[1]+dict.get(m[2])+' · '+m[3]+' '+(m[4]==='ore'&&dict.has('Ore')?dict.get('Ore'):m[4]);
  m=/^(\s*[\p{Extended_Pictographic}\uFE0F\u200D]*\s*)(Explore|Boss Challenge|Scout) · (\d+) (Energy|⚡)$/.exec(raw);
  if(m&&dict.has(m[2]))return m[1]+dict.get(m[2])+' · '+m[3]+' '+(m[4]==='Energy'&&dict.has('Energy')?dict.get('Energy'):m[4]);
  m=/^(\d+)\/(\d+) items$/.exec(raw);
  if(m&&dict.has('items'))return m[1]+'/'+m[2]+' '+dict.get('items');
  m=/^(\s*[\p{Extended_Pictographic}\uFE0F\u200D]*\s*)Equipped: ([\s\S]+)$/.exec(raw);
  if(m&&dict.has('Equipped:')&&/^[\d+\s·⚔️🛡️❤️-]+$/u.test(m[2]))return m[1]+dict.get('Equipped:')+' '+m[2];
  m=/^Current squad: (.+)$/.exec(raw);
  if(m&&dict.has('Current squad'))return dict.get('Current squad')+': '+m[1];
  m=/^(\d[\d,]*) gold credited instantly$/.exec(raw);
  if(m&&dict.has('gold credited instantly'))return m[1]+' '+dict.get('gold credited instantly');
  m=/^(\d+) local PvE war charges · (\d+) training manual · (\d[\d,]*) gold$/.exec(raw);
  if(m&&dict.has('local PvE war charges')&&dict.has('training manual')&&dict.has('Gold'))return m[1]+' '+dict.get('local PvE war charges')+' · '+m[2]+' '+dict.get('training manual')+' · '+m[3]+' '+dict.get('Gold');

  m=/^🪵 (\d+)\/(\d+) ⛏️ (\d+)\/(\d+) ⚒️ Forge Lv\.(\d+)$/.exec(raw);
  if(m&&dict.has('Forge Lv'))return '🪵 '+m[1]+'/'+m[2]+' ⛏️ '+m[3]+'/'+m[4]+' ⚒️ '+dict.get('Forge Lv')+' '+m[5];
  m=/^🪵 (\d[\d,]*) wood · ⛏️ (\d[\d,]*) ore · ✨ (\d[\d,]*) essence · 🪙 (\d[\d,]*) gold · ⚒️ Forge Lv (\d+)$/.exec(raw);
  if(m&&['Wood','Ore','Essence','Gold','Forge Lv'].every(k=>dict.has(k)))return '🪵 '+m[1]+' '+dict.get('Wood')+' · ⛏️ '+m[2]+' '+dict.get('Ore')+' · ✨ '+m[3]+' '+dict.get('Essence')+' · 🪙 '+m[4]+' '+dict.get('Gold')+' · ⚒️ '+dict.get('Forge Lv')+' '+m[5];
  m=/^Forge Lv (\d+) \+ (\d+) win$/.exec(raw);
  if(m&&dict.has('Forge Lv')&&dict.has('win'))return dict.get('Forge Lv')+' '+m[1]+' + '+m[2]+' '+dict.get('win');
  m=/^Evolution (\d+)\/(\d+) stars · Gear tier (\d+)\/(\d+)$/.exec(raw);
  if(m&&dict.has('Evolution')&&dict.has('stars')&&dict.has('Gear tier'))return dict.get('Evolution')+' '+m[1]+'/'+m[2]+' '+dict.get('stars')+' · '+dict.get('Gear tier')+' '+m[3]+'/'+m[4];
  m=/^([\s\S]*?)(Use manual) \((\d+)\)$/.exec(raw);
  if(m&&/^[\s📜]*$/u.test(m[1])&&dict.has(m[2]))return m[1]+dict.get(m[2])+' ('+m[3]+')';
  m=/^(Train Rider|Forge Armor) · (\d[\d,]*) 🪙 · (\d[\d,]*) ⛏️$/.exec(raw);
  if(m&&dict.has(m[1]))return dict.get(m[1])+' · '+m[2]+' 🪙 · '+m[3]+' ⛏️';
  m=/^Forge Lv (\d+) \+ (\d+) win$/.exec(raw);
  if(m&&dict.has('Forge Lv')&&dict.has('win'))return dict.get('Forge Lv')+' '+m[1]+' + '+m[2]+' '+dict.get('win');
  m=/^Evolution (\d+)\/(\d+) stars · Gear tier (\d+)\/(\d+)$/.exec(raw);
  if(m&&dict.has('Evolution')&&dict.has('stars')&&dict.has('Gear tier'))return dict.get('Evolution')+' '+m[1]+'/'+m[2]+' '+dict.get('stars')+' · '+dict.get('Gear tier')+' '+m[3]+'/'+m[4];
  m=/^Use manual \((\d+)\)$/.exec(raw);
  if(m&&dict.has('Use manual'))return dict.get('Use manual')+' ('+m[1]+')';
  m=/^(\w+) · Lv\.(\d+) · (⭐+)$/.exec(raw);
  if(m&&dict.has('Lv.'))return (dict.get(m[1])||m[1])+' · '+dict.get('Lv.')+' '+m[2]+' · '+m[3];

  // Some legacy conquest notices are already localized except for their fixed province proper noun.
  m=/^(🔒\s*(?:يفتح بعد|Débloquer après|Desbloquear tras|Desbloquear após|Unlock by conquering)\s+)(Fangwood Pass|Emberwatch Keep)$/.exec(raw);
  if(m&&dict.has(m[2]))return m[1]+dict.get(m[2]);

  if(raw.includes(' · ')){const parts=raw.split(' · ');if(parts.length>=2&&parts.length<=5){const tr=parts.map(x=>decorate(x,dict));if(tr.every(x=>x!==null))return tr.join(' · ');}}
  // Translate safe compound labels only when EVERY component has a curated match.
  if(raw.includes(' · ')){const parts=raw.split(' · ');if(parts.length<=4&&parts.every(x=>dict.has(x)))return parts.map(x=>dict.get(x)).join(' · ');}
  // Terminal ornamental emoji, e.g. Save ✓ (never split sentences).
  m=/^(.+?)(\s+[✓★☆●↗]|\s+[\p{Extended_Pictographic}\uFE0F\u200D]+)$/u.exec(raw);
  if(m&&dict.has(m[1]))return dict.get(m[1])+m[2];
  return null;
 }
 function lookup(text,lang){
  if(lang==='en')return text;
  const raw=String(text),trim=raw.trim();if(!trim)return raw;
  const dict=maps[lang];if(!dict)return raw;
  const translated=decorate(trim,dict);
  return translated===null?raw:raw.replace(trim,translated);
 }
 function blocked(el){
  if(!el)return true;
  // A selected <option> is safe to translate only when it has an explicit,
  // separate value attribute. Never infer/set option.value from its text.
  const opt=el.closest('option');
  if(opt)return !opt.hasAttribute('value')||!!opt.closest('[data-user-content],[data-dd-locale-ignore],[contenteditable]');
  return !!el.closest(BLOCKED);
 }
 function textNode(node,lang){
  const el=node.parentElement;if(blocked(el))return;
  const now=node.nodeValue;
  // A renderer may overwrite an already translated node. Relearn its source.
  let original=originalText.get(node),applied=appliedText.get(node);
  if(original===undefined||now!==applied){original=now;originalText.set(node,original)}
  const next=lookup(original,lang);
  audit.scanned++;
  if(next!==original)audit.translated++;
  if(lang!=='en'&&next===original&&/[A-Za-z]{4}/.test(original)&&original.length<210)audit.uncataloged++;
  if(next!==now)node.nodeValue=next;
  appliedText.set(node,next);
 }
 function attribute(el,name,lang){
  // The placeholder/accessible name is UI chrome, unlike an input's value.
  // Never traverse its contents or modify the selected value of a control.
  if(blocked(el)&&!(el.matches('input,textarea,select')&&!el.parentElement?.closest(BLOCKED)))return;
  const now=el.getAttribute(name);if(now===null)return;
  let original=originalAttr.get(el)||{},applied=appliedAttr.get(el)||{};
  if(!(name in original)||now!==applied[name])original[name]=now;
  const next=lookup(original[name],lang);
  if(now!==next)el.setAttribute(name,next);
  applied[name]=next;originalAttr.set(el,original);appliedAttr.set(el,applied);
 }
 function direction(el,lang){
  // The Arabic root is RTL. Only the untouched English fallback gets LTR.
  if(!el.matches('h1,h2,h3,h4,h5,h6,p,small,label,span,button,strong,div'))return;
  if(el.children.length>0||blocked(el))return;
  const value=el.textContent||'';
  const latinOnly=lang==='ar'&&/[A-Za-z]{4}/.test(value)&&!/[\u0600-\u06ff]/.test(value);
  if(latinOnly){
   if(!originalDirection.has(el))originalDirection.set(el,el.getAttribute('dir'));
   if(el.getAttribute('dir')!=='ltr')el.setAttribute('dir','ltr');
  }else if(originalDirection.has(el)){
   const old=originalDirection.get(el);if(old===null)el.removeAttribute('dir');
   else el.setAttribute('dir',old);
   originalDirection.delete(el);
  }
 }

 function process(root,lang){
  if(!root||root.nodeType===8)return;
  if(root.nodeType===3){textNode(root,lang);return}
  if(root.nodeType!==1||blocked(root))return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;while((n=walker.nextNode()))textNode(n,lang);
  const list=[root,...root.querySelectorAll('[aria-label],[title],[placeholder],[alt]')];
  for(const el of list){for(const name of NAMES)if(el.hasAttribute(name))attribute(el,name,lang)}
  for(const el of [root,...root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,small,label,span,button,strong,div')])direction(el,lang);
 }
 function deck(){
  if(document.getElementById('dd6176DeckLocale'))return;
  const translations={fr:'✦  LE TABLEAU DE COMMANDEMENT ROYAL',ar:'✦  لوحة القيادة الملكية',es:'✦  EL PANEL DE MANDO REAL',pt:'✦  O PAINEL DE COMANDO REAL'};
  const oldBuild={fr:'VERSION 6.14.1 · RENOUVEAU',ar:'الإصدار 6.14.1 · النهضة',es:'VERSIÓN 6.14.1 · RENACER',pt:'VERSÃO 6.14.1 · RENASCIMENTO'};
  const style=document.createElement('style');style.id='dd6176DeckLocale';
  style.textContent=Object.entries(translations).map(([l,t])=>
   `html[data-dd-game-locale="${l}"] body.dd612Ready .app::before{content:${JSON.stringify(t)}!important}`+
   `html[data-dd-game-locale="${l}"] body.dd612Ready .royalTop .brand small::after{content:${JSON.stringify(oldBuild[l])}!important}`
  ).join('\n')+'\n#dd612Dock .dd612Categories button small{white-space:normal;overflow-wrap:anywhere;}';
  document.head.appendChild(style);
 }
 function applyLang(lang){
  language=normalized(lang);document.documentElement.dataset.ddGameLocale=language;
  document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';
  // Language preference is owned by World Hub, not by this rendering utility.
  deck();
 }
 function run(){
  pending=false;if(!document.body)return;
  let next=current();if(next!==language){applyLang(next);work.clear();work.add(document.body)}
  if(!work.size)work.add(document.body);
  let roots=[...work];work.clear();
  // Large synchronous rerenders have many nested mutations. One walk is cheaper than O(n²) root checks.
  if(roots.length>64)roots=[document.body];
  // A root and its descendant should be processed only once per flush.
  for(const root of roots){if(roots.some(other=>other!==root&&other.nodeType===1&&other.contains(root)))continue;process(root,language)}
 }
 function schedule(root){
  if(root)work.add(root.nodeType===3?root:root);
  if(pending)return;pending=true;
  (window.requestAnimationFrame||window.setTimeout)(run,16);
 }
 function onMutations(list){
  for(const m of list){
   if(m.type==='characterData'){
    // The engine's own text rewrite already matches appliedText; skip echo.
    if(appliedText.has(m.target)&&appliedText.get(m.target)===m.target.nodeValue)continue;
    schedule(m.target);
   }else if(m.type==='childList'){
    if(m.addedNodes.length||m.removedNodes.length){
     for(const n of m.addedNodes)if(n.nodeType===1||n.nodeType===3)schedule(n);
    }
   }else if(m.type==='attributes'){
    if(m.attributeName==='dir')continue;
    const applied=appliedAttr.get(m.target);
    if(applied&&applied[m.attributeName]===m.target.getAttribute(m.attributeName))continue;
    schedule(m.target);
   }
  }
 }
 function init(){if(installed)return;installed=true;applyLang(current());schedule(document.body);
  new MutationObserver(onMutations).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:NAMES});
  window.addEventListener('dd:languagechange',e=>setLanguage(e.detail?.language));
  window.addEventListener('pageshow',()=>schedule(document.body));
  window.addEventListener('focus',()=>{if(current()!==language)schedule(document.body)});
 }
 function setLanguage(next){
  next=normalized(next);if(next===language){schedule(document.body);return}
  applyLang(next);work.clear();schedule(document.body);
 }
 window.DDGameLocale={version:'6.17.8-shared-runtime',setLanguage,refresh:()=>schedule(document.body),
  translate:(text,lang)=>lookup(text,normalized(lang||language)),
  summary:()=>({language,entries:RAW.length,...audit}),catalogHas:(key)=>!!maps.fr?.has(key)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

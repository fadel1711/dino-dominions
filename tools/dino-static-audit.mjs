/**
 * Dino Dominion static integrity checks — standard-library only; works in GitHub Actions.
 * Checks local asset existence, JS syntax, accidental private keys, CDN SRI warnings,
 * HTML inline script syntax, and produces an issue-review inventory.
 * It does NOT pretend to test the browser, Supabase, or real payments.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDefault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
  if (['.git','node_modules'].includes(item.name)) return [];
  const child=path.join(dir,item.name);
  return item.isDirectory() ? listFiles(child) : [child];
});
const attribute = (tag,name) => {
  const r=new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(tag);
  return r?.[2] || null;
};
const localPath=(root,ref) => {
  const decoded = decodeURIComponent(ref.split(/[?#]/)[0]);
  if (!decoded || /^(?:https?:|data:|blob:|\/\/)/i.test(decoded)) return null;
  const out=path.resolve(root,decoded.replace(/^\.\//,''));
  if (!out.startsWith(root+path.sep) && out!==root) return { error: `Reference escapes repo: ${ref}` };
  return { file:out };
};
function auditRepository(root=rootDefault){
  const errors=[],warnings=[];
  const paths=listFiles(root);
  const entry=path.join(root,'index.html');
  if (!fs.existsSync(entry)) return {errors:['Missing index.html'],warnings,counts:{}};
  const html=fs.readFileSync(entry,'utf8');
  const inspected=new Set();let localRefs=0,externalScripts=0,inlineCount=0,checkedJs=0;
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi)||[]){
    const isScript=/^<script\b/i.test(tag);
    if (!isScript && !/\brel\s*=\s*["'](?:stylesheet|manifest|icon|apple-touch-icon)["']/i.test(tag)) continue;
    const src=attribute(tag,isScript?'src':'href');
    if(!src)continue;
    if(/^https?:\/\//i.test(src)||src.startsWith('//')){
      if(isScript){externalScripts++;if(!attribute(tag,'integrity'))warnings.push(`External script without SRI: ${src}`);}
      continue;
    }
    let target;
    try{target=localPath(root,src);}catch(e){errors.push(`Malformed asset URL ${src}: ${e.message}`);continue;}
    if(!target) continue;
    if(target.error)errors.push(target.error);
    else {localRefs++;inspected.add(target.file);if(!fs.existsSync(target.file))errors.push(`Missing local asset: ${src}`);}
  }
  const scripts=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  for(const m of html.matchAll(scripts)){
    if(attribute(m[1],'src')||/\btype\s*=\s*["'](?:application\/json|application\/ld\+json)["']/i.test(m[1]))continue;
    if(!m[2].trim())continue;
    inlineCount++;
    try{new vm.Script(m[2],{filename:`index.html inline <script> #${inlineCount}`});}
    catch(e){errors.push(`Inline script #${inlineCount} syntax: ${e.message}`);}
  }
  for (const file of paths.filter(f=>f.endsWith('.js')||f.endsWith('.mjs'))){
    const res=spawnSync(process.execPath,['--check',file],{encoding:'utf8',maxBuffer:1024*1024});
    checkedJs++;
    if(res.status!==0)errors.push(`JS syntax: ${path.relative(root,file)} — ${(res.stderr||res.stdout).split('\n').slice(-5).join(' ').slice(0,350)}`);
  }
  // Not an XSS detector. These are review pointers, NOT vulnerabilities.
  const source=paths.filter(f=>/\.(?:js|html)$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
  const innerHTML=(source.match(/\.innerHTML\s*=/g)||[]).length;
  const dialogs=(source.match(/\b(?:alert|confirm|prompt)\s*\(/g)||[]).length;
  const privateKeyMarkers=[/\bsk_(?:test|live)_[0-9a-zA-Z]{12,}\b/g,/\bsb_secret_[0-9a-zA-Z]{12,}\b/g,/\bwhsec_[0-9a-zA-Z]{12,}\b/g];
  const withoutComments=paths.filter(f=>/\.(?:js|html|ts)$/.test(f)).filter(f=>!f.includes('tools'+path.sep));
  for(const file of withoutComments){const s=fs.readFileSync(file,'utf8');for(const marker of privateKeyMarkers){marker.lastIndex=0;if(marker.test(s))errors.push(`Potential private credential in ${path.relative(root,file)}`);}}
  return {errors,warnings,counts:{files:paths.length,checkedJs,localRefs,externalScripts,inlineCount,innerHTMLAssignments:innerHTML,nativeDialogCalls:dialogs}};
}
export {auditRepository};
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=auditRepository(process.argv[2]?path.resolve(process.argv[2]):rootDefault);
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.errors.length?1:0;
}

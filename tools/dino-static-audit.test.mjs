import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditRepository } from './dino-static-audit.mjs';
function fixture(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dd-static-'));try{fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
test('valid local script resolves',()=>fixture(dir=>{
  fs.writeFileSync(path.join(dir,'index.html'),'<script src="./main.js?v=1"></script>');
  fs.writeFileSync(path.join(dir,'main.js'),'const ok = true;');
  const r=auditRepository(dir);
  assert.equal(r.errors.length,0);assert.equal(r.counts.localRefs,1);
}));
test('missing referenced JS blocks',()=>fixture(dir=>{
  fs.writeFileSync(path.join(dir,'index.html'),'<script src="./missing.js?v=1"></script>');
  assert.ok(auditRepository(dir).errors.some(x=>x.includes('Missing local asset')));
}));
test('inline syntax problem blocks',()=>fixture(dir=>{
  fs.writeFileSync(path.join(dir,'index.html'),'<script>const = bad</script>');
  assert.ok(auditRepository(dir).errors.some(x=>x.includes('Inline script')));
}));
test('third-party script without SRI is warning, not release block',()=>fixture(dir=>{
  fs.writeFileSync(path.join(dir,'index.html'),'<script src="https://example.org/lib.js"></script>');
  const r=auditRepository(dir);
  assert.equal(r.errors.length,0); assert.equal(r.warnings.length,1);
}));

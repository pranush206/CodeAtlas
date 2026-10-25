import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze} from '../src/analyze.js';
test('resolves relative imports, index files, re-exports, runtime extensions and source evidence',()=>{
 const result=analyze({'src/App.tsx':`// import './fake';\nimport { x } from './lib';\nexport { y } from './other.js';\nimport './styles.css';\nconst lazy = import('./lazy');\nconst c = require('./common');`, 'src/lib/index.ts':'export const x=1;', 'src/other.ts':'export const y=2;', 'src/styles.css':'body {}', 'src/lazy.ts':'export default 1;', 'src/common.cjs':'module.exports = 1;'});
 assert.deepEqual(result.references.map(r=>[r.target,r.line]),[['src/lib/index.ts',2],['src/other.ts',3],['src/styles.css',4],['src/lazy.ts',5],['src/common.cjs',6]]);
 assert.equal(result.diagnostics.length,0);
});
test('marks unresolved paths without inventing graph connections',()=>{
 const {references}=analyze({'a.js':`import React from 'react';\nimport x from '@/x';\nimport './missing';\nimport(name);`});
 assert.deepEqual(references.map(r=>r.status),['external-or-alias','external-or-alias','missing','dynamic']);
 assert(references.every(r=>r.target===null));
});
test('handles circular and parent imports, isolated files and parser diagnostics',()=>{
 const result=analyze({'a.ts':`import './sub/b';`, 'sub/b.ts':`import '../a';`, 'readme.md':'# Isolated','bad.ts':'const = ;'});
 assert.equal(result.references.length,2);assert.equal(result.references[1].target,'a.ts');assert(result.paths.includes('readme.md'));assert(result.diagnostics.some(d=>d.source==='bad.ts'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {memoryOnlyTypescript} from '../scripts/vite/typescript-memory-only.mjs';
const require=createRequire(import.meta.url);
test('parser loads in a Node-compatible worker without __filename or filesystem access',()=>{
 const source=fs.readFileSync(require.resolve('typescript'),'utf8');
 const context={module:{exports:{}},exports:{},process:{nextTick(){},platform:'linux'},require(name){throw Error('Filesystem or Node host access attempted: '+name)},setTimeout,clearTimeout,console};
 vm.runInNewContext(memoryOnlyTypescript(source),context,{timeout:5000});
 const ts=context.module.exports;
 assert.equal(ts.sys,undefined);
 const file=ts.createSourceFile('app.ts','export const answer: number = 42;',ts.ScriptTarget.Latest,true);
 assert.equal(file.parseDiagnostics.length,0);assert.equal(file.statements.length,1);
});
test('adapter fails closed when dependency host detection changes',()=>assert.throws(()=>memoryOnlyTypescript('unexpected source'),/review/));

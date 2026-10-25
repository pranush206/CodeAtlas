import test from 'node:test';
import assert from 'node:assert/strict';
import {explainSource} from '../src/explain.js';
test('walkthrough describes source operations with exact evidence lines',()=>{
 const source='export function check(value) {\n if (value > 0) return true;\n return false;\n}';
 const e=explainSource({path:'a.js',label:'check',line:1,endLine:4},source,'How does this check work?');
 assert(e.facts.some(f=>f.line===1&&f.text.includes('inputs: value')));assert(e.facts.some(f=>f.line===2&&f.text.includes('value > 0')));assert(e.facts.some(f=>f.line===3&&f.text.includes('Returns false')));
});
test('unsupported source gets an explicit limitation instead of invented explanation',()=>{assert(explainSource({path:'a.py',label:'File section',line:1,endLine:3},'print(1)','Explain').limited)});

import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkProject,cosine,rankSemantic,keywordSearch} from '../src/search-core.js';
test('chunks functions with traceable line ranges, including long functions',()=>{
 const code=`import x from './x';\n\nexport function validateStock(product) {\n  return product.stock > 0;\n}\n`;
 const chunks=chunkProject({'stock.ts':code});
 assert(chunks.some(c=>c.label==='validateStock'));
 for(const c of chunks){assert(c.line>=1);assert(c.endLine<=code.split('\n').length);assert(code.split('\n').slice(c.line-1,c.endLine).join('\n').includes(c.code))}
 const big=chunkProject({'big.js':'export const data = "'+'x'.repeat(5000)+'";'});assert(big.length>1);assert(big.every(c=>c.line===1&&c.endLine===1));
});
test('cosine ranking and lexical fallback are distinct',()=>{
 const chunks=[{id:0,path:'auth.js',label:'validatePassword',line:1,endLine:3,code:'',text:'validate password'}, {id:1,path:'cart.js',label:'addToCart',line:1,endLine:3,code:'',text:'add to cart'}];
 assert.equal(cosine([0,0],[1,1]),0);assert.equal(rankSemantic(chunks,[[1,0],[0,1]],[0,1])[0].id,1);
 assert.equal(keywordSearch(chunks,'Where do we validate the password?')[0].id,0);assert.equal(keywordSearch(chunks,'totallyunrelated').length,0);
});
test('empty projects have no chunks and overlapping results are deduplicated',()=>{
 assert.deepEqual(chunkProject({'blank.js':'  '}),[]);
 const chunks=[{path:'a',line:1,endLine:4},{path:'a',line:3,endLine:6},{path:'b',line:1,endLine:3}];assert.equal(rankSemantic(chunks,[[1],[1],[1]],[1]).length,2);
});

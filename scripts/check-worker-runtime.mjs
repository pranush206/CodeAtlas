import {Miniflare} from 'miniflare';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const mf=new Miniflare({modules:[{type:'ESModule',path:path.resolve('dist/server/index.js')},...fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js').map(p=>({type:'ESModule',path:path.resolve('dist/server',p)}))],modulesRoot:path.resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat']});
try{
 const anon=await mf.dispatchFetch('https://codeatlas.test/api/agent');assert.equal(anon.status,200);assert.equal((await anon.json()).localSetupRequired,true);
 const identity={'oai-authenticated-user-id':'runtime-test-user','oai-authenticated-user-email':'test@example.invalid'};
 const status=await mf.dispatchFetch('https://codeatlas.test/api/agent',{headers:identity});assert.equal(status.status,200);assert.equal((await status.json()).configured,false);
 const post=await mf.dispatchFetch('https://codeatlas.test/api/agent',{method:'POST',headers:{...identity,origin:'https://codeatlas.test','content-type':'application/json'},body:'{}'});assert.equal(post.status,503);assert.match((await post.json()).error,/local CodeAtlas/);
 const home=await mf.dispatchFetch('https://codeatlas.test/',{headers:identity});assert.equal(home.status,200);assert.match(await home.text(),/CodeAtlas/);
 console.log('Built Worker checks passed: home 200, hosted setup API 200, signed-in status 200, missing model 503 (handled).');
}finally{await mf.dispose()}

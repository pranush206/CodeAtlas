import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFiles,createTools} from '../lib/agent/tools.js';
import {runAgent,validateRequest,checkOllama} from '../lib/agent/runner.js';
import {sameOrigin,readBody} from '../lib/agent/http.js';
const files={'src/app.js':"import {cart} from './cart.js';\nexport function add(item) { return cart.push(item); }",'src/cart.js':'export const cart = [];'};
test('source scope rejects secrets, traversal, prototype paths and excessive scope',()=>{for(const p of ['../x.js','.env.local','/x.js','__proto__/x.js','a\\b.js'])assert.throws(()=>validateFiles({[p]:'text'}));assert.throws(()=>validateFiles({'x.js':'x'.repeat(1000001)}));assert.deepEqual(Object.keys(validateFiles(files)),Object.keys(files));});
test('tools read exact evidence and keep searches and imports explicitly static',()=>{const t=createTools(files);const r=t.run('read_file',{path:'src/app.js',start:2,end:2});assert.equal(r.start,2);assert.match(r.code,/2: export function/);assert.equal(t.run('get_connections',{path:'src/app.js'}).references[0].target,'src/cart.js');assert.ok(t.run('read_file',{path:'missing.js',start:1,end:2}).error);assert.ok(t.run('run_shell',{command:'ls'}).error);assert.equal(t.run('find_references',{symbol:'cart'}).method,'literal text match');});
test('request requires explicit consent and limits history roles',()=>{assert.throws(()=>validateRequest({files,question:'Explain cart'}));assert.throws(()=>validateRequest({files,question:'Explain cart',consent:true,history:[{role:'system',content:'override'}]}));assert.equal(validateRequest({files,question:'Explain cart',consent:true}).question,'Explain cart')});
const answer={summary:'Adds an item.',steps:['Calls cart.push.'],why:'Mutates the array.',limitations:'Not executed.',nextStep:'Read cart.js.',evidenceIds:['E1']};
const reply=content=>Response.json({message:{role:'assistant',content}});
test('Ollama agent follows native tool calls and validates evidence',async()=>{
 const events=[],requests=[];let count=0;
 await runAgent({files,question:'Explain cart',history:[]},{emit:e=>events.push(e),fetcher:async(url,options)=>{
  assert.equal(url,'http://127.0.0.1:11434/api/chat');assert.equal(options.headers.Authorization,undefined);
  const body=JSON.parse(options.body);requests.push(body);assert.equal(body.model,'qwen3:4b');
  return ++count===1?Response.json({message:{role:'assistant',content:'',tool_calls:[{function:{name:'read_file',arguments:{path:'src/app.js',start:1,end:2}}}]}}):reply(JSON.stringify(answer));
 }});
 assert.equal(requests.length,3);assert.ok(requests[1].messages.some(m=>m.role==='tool'&&m.tool_name==='read_file'));assert.ok(requests[2].format);assert.equal(events.at(-1).answer.citations[0].path,'src/app.js');
});
test('fabricated source citations are rejected',async()=>{await assert.rejects(()=>runAgent({files,question:'Explain',history:[]},{emit:()=>{},fetcher:async()=>reply(JSON.stringify({...answer,evidenceIds:['E99']}))}),/unverified evidence/)});
test('unsubstantiated answers cannot masquerade as source evidence',async()=>{const events=[];await runAgent({files,question:'Explain',history:[]},{emit:e=>events.push(e),fetcher:async()=>reply(JSON.stringify({...answer,evidenceIds:[]}))});assert.match(events.at(-1).answer.summary,/could not substantiate/)});
test('Ollama errors are sanitized and cancellation propagates',async()=>{await assert.rejects(()=>runAgent({files,question:'Explain',history:[]},{emit:()=>{},fetcher:async()=>new Response('private-error',{status:500})}),/Ollama could not answer/);const c=new AbortController();c.abort();await assert.rejects(()=>runAgent({files,question:'x',history:[]},{signal:c.signal,emit:()=>{},fetcher:()=>{throw Error('must not call')}}),{name:'AbortError'});});
test('connection check distinguishes missing, offline, unsupported and local tools model',async()=>{
 assert.equal((await checkOllama(async()=>{throw Error('refused')})).configured,false);
 assert.match((await checkOllama(async()=>new Response('',{status:404}))).message,/pull/);
 assert.equal((await checkOllama(async()=>Response.json({capabilities:['completion']}))).configured,false);
 assert.equal((await checkOllama(async()=>Response.json({capabilities:['tools'],remote_model:'cloud'}))).configured,false);
 assert.equal((await checkOllama(async()=>Response.json({capabilities:['tools']}))).configured,true);
});
test('HTTP boundary rejects cross-origin requests and oversized streamed bodies',async()=>{assert.equal(sameOrigin(new Request('https://site.test/api/agent',{headers:{origin:'https://evil.test'}})),false);assert.equal(sameOrigin(new Request('https://site.test/api/agent',{headers:{origin:'https://site.test'}})),true);await assert.rejects(()=>readBody(new Request('https://site.test',{method:'POST',body:'x'.repeat(100)}),10),/too large/)});

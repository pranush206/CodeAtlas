import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const child=spawn(process.execPath,['scripts/local-ollama.mjs'],{stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Local app startup timeout')),20000);child.stdout.on('data',d=>{if(d.toString().includes('CodeAtlas:')){clearTimeout(timer);resolve()}});child.on('exit',code=>{clearTimeout(timer);reject(Error(`Local app exited ${code}`))});child.stderr.on('data',d=>process.stderr.write(d));});
 const base='http://127.0.0.1:5173';
 const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/local\/main.jsx/);
 const entry=await fetch(base+'/local/main.jsx');assert.equal(entry.status,200);assert.match(await entry.text(),/createRoot/);
 const app=await fetch(base+'/src/main.jsx');assert.equal(app.status,200);
 const status=await fetch(base+'/api/agent');assert.equal(status.status,200);const info=await status.json();assert.equal(info.provider,'Ollama');assert.equal(typeof info.configured,'boolean');
 assert.equal((await fetch(base+'/api/agent',{headers:{Origin:'https://evil.test'}})).status,403);
 assert.equal(await new Promise((resolve,reject)=>{const r=http.get(base+'/api/agent',{headers:{Host:'evil.test'}},res=>{res.resume();resolve(res.statusCode)});r.on('error',reject)}),403);
 assert.equal((await fetch(base+'/api/agent',{method:'POST',body:'{}'})).status,403);
 assert.equal((await fetch(base+'/api/agent',{method:'POST',headers:{Origin:base},body:'{}'})).status,400);
 assert.equal((await fetch(base+'/api/agent',{method:'POST',headers:{Origin:base},body:'x'.repeat(1300001)})).status,400);
 console.log('Local runtime passed: frontend served; connection status handled; Host, Origin, body and consent boundaries enforced.');
}finally{child.kill('SIGTERM');}

import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createServer as createViteServer} from 'vite';
import react from '@vitejs/plugin-react';
import {checkOllama,runAgent,validateRequest,MODEL} from '../lib/agent/runner.js';
import {readBody} from '../lib/agent/http.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const host='127.0.0.1:5173',origin=`http://${host}`;
const vite=await createViteServer({root,configFile:false,plugins:[react()],appType:'custom',server:{middlewareMode:true,hmr:false},worker:{format:'es'},optimizeDeps:{include:['typescript']}});
let active=false;
const server=http.createServer(async(req,res)=>{
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
 if(req.headers.host!==host)return json(403,{error:'Open http://127.0.0.1:5173 on this computer.'});
 if(req.headers.origin&&req.headers.origin!==origin)return json(403,{error:'Request origin rejected.'});
 const path=new URL(req.url,origin).pathname;
 if(path==='/api/agent'){
  if(req.method==='GET')return json(200,{provider:'Ollama',model:MODEL,local:true,...await checkOllama()});
  if(req.method!=='POST')return json(405,{error:'Method not allowed.'});
  if(req.headers.origin!==origin)return json(403,{error:'Request origin rejected.'});
  if(active)return json(429,{error:'One investigation is already running. Wait or stop it first.'});
  active=true;const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),300000);
  const cancel=()=>abort.abort();res.on('close',cancel);
  try{
   const request=new Request(origin+path,{method:'POST',body:req,duplex:'half',signal:abort.signal});
   let body;try{body=validateRequest(await readBody(request))}catch(e){return json(400,{error:e.message})}
   const status=await checkOllama(fetch,AbortSignal.any([abort.signal,AbortSignal.timeout(5000)]));
   if(!status.configured)return json(503,{error:status.message});
   res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   const emit=event=>{if(!res.destroyed)res.write(JSON.stringify(event)+'\n')};
   try{await runAgent(body,{signal:abort.signal,emit})}catch(e){emit({type:'error',message:abort.signal.aborted?'Investigation stopped or timed out. Try a smaller question.':e.message})}
   res.end();
  }catch{if(!res.headersSent)json(500,{error:'Local tutor request failed. Check Ollama and retry.'});else res.end()}
  finally{clearTimeout(timer);res.off('close',cancel);active=false}
  return;
 }
 if(path==='/'&&req.method==='GET'){
  const html=await vite.transformIndexHtml('/',`<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>CodeAtlas · Local Ollama</title></head><body><div id="root"></div><script type="module" src="/local/main.jsx"></script></body></html>`);
  res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;
 }
 vite.middlewares(req,res,()=>{res.writeHead(404);res.end('Not found')});
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port 5173 is busy. Close the other local CodeAtlas window/server and retry.':e.message);process.exit(1)});
server.listen(5173,'127.0.0.1',()=>console.log(`CodeAtlas: ${origin}\nModel: ${MODEL} via local Ollama. Keep this terminal open.\nNo OpenAI or Gemini credentials are used.`));
for(const event of ['SIGINT','SIGTERM'])process.on(event,async()=>{server.close();await vite.close();process.exit(0)});

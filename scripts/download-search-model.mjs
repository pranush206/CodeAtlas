import {readFile,mkdir,writeFile,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const target=new URL('../public/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx',import.meta.url);
const expected='afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1';
const digest=data=>createHash('sha256').update(data).digest('hex');
let ready=false;
try{ready=digest(await readFile(target))===expected}catch{}
if(ready){console.log('Search model verified.');process.exit(0)}
const response=await fetch('https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/onnx/model_quantized.onnx',{signal:AbortSignal.timeout(300000)});
if(!response.ok)throw Error(`Search model download failed (${response.status}). Retry npm run setup:search. Keyword search and Ollama do not need this model.`);
const data=new Uint8Array(await response.arrayBuffer());
if(digest(data)!==expected)throw Error('Search model checksum mismatch. Download was not installed.');
await mkdir(new URL('./',target),{recursive:true});
const temporary=new URL(target.href+'.download');
try{await writeFile(temporary,data);await rename(temporary,target)}finally{await rm(temporary,{force:true})}
console.log('Search model downloaded and verified.');

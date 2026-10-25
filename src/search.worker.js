import {chunkProject,rankSemantic,keywordSearch} from './search-core.js';
let chunks=[],vectors=null,extractor=null;
const send=(type,payload={})=>self.postMessage({type,...payload});
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){chunks=chunkProject(data.files);vectors=null;send('ready',{count:chunks.length});return}
  if(data.type!=='search')return;
  if(data.mode==='keyword'){send('results',{results:keywordSearch(chunks,data.query),mode:'keyword',query:data.query});return}
  if(!chunks.length){send('results',{results:[],mode:'semantic',query:data.query});return}
  if(!extractor){
   send('progress',{message:'Loading the ML model and runtime (first use downloads these assets)…'});
   const {pipeline,env}=await import('@huggingface/transformers');
   env.allowRemoteModels=false;env.localModelPath='/models/';
   env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
   env.backends.onnx.wasm.wasmPaths={wasm:new URL('/onnx/ort-wasm-simd-threaded.jsep.wasm',self.location.origin).href};
   extractor=await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress')send('progress',{message:`Loading ${p.file?.split('/').pop()||'model'}${Number.isFinite(p.progress)?` · ${Math.round(p.progress)}%`:''}`})}});
  }
  if(!vectors){const next=[];for(let i=0;i<chunks.length;i+=8){send('progress',{message:`Indexing code sections · ${i} / ${chunks.length}`});const output=await extractor(chunks.slice(i,i+8).map(c=>c.text),{pooling:'mean',normalize:true});next.push(...output.tolist());}vectors=next;send('indexed',{count:chunks.length})}
  send('progress',{message:'Comparing your question with the code…'});
  const output=await extractor(data.query,{pooling:'mean',normalize:true});send('results',{results:rankSemantic(chunks,vectors,output.tolist()[0]),mode:'semantic',query:data.query});
 }catch(error){extractor=null;vectors=null;send('results',{results:keywordSearch(chunks,data.query||''),mode:'keyword',query:data.query,warning:'ML search was unavailable. Showing keyword matches with source-based walkthroughs instead.',detail:String(error?.message||error)});}
};

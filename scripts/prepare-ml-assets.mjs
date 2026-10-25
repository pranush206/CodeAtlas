import {mkdir,copyFile,readdir} from 'node:fs/promises';
await mkdir('public/onnx',{recursive:true});
for(const file of await readdir('node_modules/onnxruntime-web/dist')){
 if(file.startsWith('ort-wasm-simd-threaded')&&(file.endsWith('.mjs')||file.endsWith('.wasm'))&&!file.includes('asyncify'))await copyFile('node_modules/onnxruntime-web/dist/'+file,'public/onnx/'+file);
}


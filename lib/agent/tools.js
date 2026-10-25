import {analyze} from '../../src/analyze.js';
import {chunkProject,keywordSearch} from '../../src/search-core.js';
export const MAX_SOURCE_BYTES=1_000_000;
export function validateFiles(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Choose source files for the tutor.');
 const entries=Object.entries(input);if(!entries.length||entries.length>200)throw Error('Choose between 1 and 200 source files for this tutor session. ZIP upload itself has no fixed size limit.');
 let bytes=0;const files=Object.create(null);
 for(const [path,code] of entries){
  if(typeof code!=='string'||path.length>500||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>!p||p==='..'||p==='.'||p.startsWith('.env')||['__proto__','prototype','constructor','.git','node_modules'].includes(p)))throw Error('Unsupported or unsafe source path.');
  if(!/\.(?:[cm]?[jt]sx?|json|css|scss|html|md|txt|py|ya?ml|sql|sh|java|go|rs|vue|svelte|xml|toml)$/i.test(path))throw Error('Select supported text source files only.');
  bytes+=new TextEncoder().encode(code).length;if(bytes>MAX_SOURCE_BYTES)throw Error('Tutor scope exceeds 1 MB of source text. Select fewer files; your uploaded project is unchanged.');files[path]=code;
 }
 return files;
}
const string={type:'string'};const integer={type:'integer'};
function tool(name,description,properties){return {type:'function',name,description,strict:true,parameters:{type:'object',properties,required:Object.keys(properties),additionalProperties:false}}}
export const definitions=[
 tool('list_files','List all source paths available in this selected scope.',{}),
 tool('search_code','Keyword search of code and paths. Try alternative terms if empty; this tool is lexical, not semantic.',{query:string}),
 tool('read_file','Read exact numbered source lines. Read evidence before making project claims. Maximum 100 lines.',{path:string,start:integer,end:integer}),
 tool('get_connections','Inspect static JS/TS imports, incoming references and unresolved imports. Not runtime execution evidence.',{path:string}),
 tool('find_references','Find literal occurrences of a symbol; matches are text, not proven semantic references.',{symbol:string})
];
export function createTools(files){
 const evidence=[];let graph,chunks;
 function snippet(path,start,end){const rows=files[path].split('\n');start=Math.max(1,start);end=Math.min(rows.length,end,start+99);if(start>end)throw Error('Line range is outside this file.');let text='',actualEnd=start-1;for(let n=start;n<=end;n++){const row=rows[n-1];if(text.length+row.length>12000)break;text+=`${n}: ${row}\n`;actualEnd=n}if(actualEnd<start)throw Error('Line too large to read safely; choose another source section.');const item={id:`E${evidence.length+1}`,path,start,end:actualEnd};evidence.push(item);return {...item,code:text,truncated:actualEnd<end}}
 function pathExists(path){if(typeof path!=='string'||!Object.hasOwn(files,path))throw Error('File is not in the selected tutor scope.');}
 return {evidence,run(name,args){try{
  if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Expected tool arguments object.');
  if(name==='list_files')return {paths:Object.keys(files),scope:'Selected files only'};
  if(name==='search_code'){if(typeof args.query!=='string'||!args.query.trim()||args.query.length>300)throw Error('Use a short search query.');chunks??=chunkProject(files);return {method:'keyword',results:keywordSearch(chunks,args.query).map(c=>snippet(c.path,c.line,Math.min(c.endLine,c.line+30)))}}
  if(name==='read_file'){pathExists(args.path);if(!Number.isInteger(args.start)||!Number.isInteger(args.end)||args.start<1||args.end<args.start)throw Error('Use valid positive start/end lines.');return snippet(args.path,args.start,args.end)}
  if(name==='get_connections'){pathExists(args.path);graph??=analyze(files);return {kind:'static imports, not runtime trace',references:graph.references.filter(r=>r.source===args.path||r.target===args.path).slice(0,60),diagnostics:graph.diagnostics.filter(d=>d.source===args.path).slice(0,10)}}
  if(name==='find_references'){if(typeof args.symbol!=='string'||!args.symbol.trim()||args.symbol.length>100)throw Error('Use a short symbol.');const results=[];for(const [path,code]of Object.entries(files)){const rows=code.split('\n');for(let i=0;i<rows.length;i++)if(rows[i].includes(args.symbol)){results.push(snippet(path,i+1,i+1));if(results.length===20)return {method:'literal text match',results,truncated:true}}}return {method:'literal text match',results,truncated:false}}
  throw Error('Tool is not allowed.');
 }catch(e){return {error:e.message}}}}
}

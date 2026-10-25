import ts from 'typescript';
export function splitWords(text){return text.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_\-/]/g,' ')}
export function chunkProject(files){
 const chunks=[];
 for(const [path,code] of Object.entries(files)){
  if(!code.trim()||! /\.([cm]?[jt]sx?|py|java|go|rs|vue|svelte|sql|md|html|css|scss)$/.test(path))continue;
  let spans=[];
  if(/\.[cm]?[jt]sx?$/.test(path)){
   const ast=ts.createSourceFile(path,code,ts.ScriptTarget.Latest,true);
   spans=ast.statements.filter(s=>!ts.isImportDeclaration(s)).map(s=>({start:s.getFullStart(),end:s.end,label:s.name?.getText(ast)||s.declarationList?.declarations?.[0]?.name?.getText(ast)||'Module code'}));
  }
  if(!spans.length)spans=[{start:0,end:code.length,label:'File section'}];
  for(const span of spans){
   span.start+=(code.slice(span.start,span.end).match(/^\s*/)?.[0].length??0);
   let startLine=code.slice(0,span.start).split('\n').length;
   let offset=0;const section=code.slice(span.start,span.end),rows=section.split('\n');
   while(offset<rows.length){
    const begin=offset;let text='';
    while(offset<rows.length&&(text.length+rows[offset].length<850||offset===begin)){text+=(offset>begin?'\n':'')+rows[offset];offset++}
    // Split minified or very long lines too; preserve the original source line range.
    for(let c=0;c<text.length;c+=850){const snippet=text.slice(c,c+850);if(!snippet.trim())continue;const before=text.slice(0,c).split('\n').length-1;const line=startLine+begin+before;const endLine=line+snippet.split('\n').length-1;chunks.push({id:chunks.length,path,label:span.label,line,endLine,code:snippet,text:splitWords(`${path}\n${span.label}\n${snippet}`)})}
   }
  }
 }
 return chunks;
}
export function cosine(a,b){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return aa&&bb?dot/Math.sqrt(aa*bb):0}
export function rankSemantic(chunks,vectors,queryVector,limit=8){const ranked=chunks.map((chunk,i)=>({...chunk,score:cosine(vectors[i],queryVector)})).sort((a,b)=>b.score-a.score);const results=[];for(const chunk of ranked){if(results.some(r=>r.path===chunk.path&&r.line<=chunk.endLine&&chunk.line<=r.endLine))continue;results.push(chunk);if(results.length===limit)break}return results}
const stop=new Set('where what how do does is are the a an we i to in of for this that with can me show find code'.split(' '));
export function keywordSearch(chunks,query){const tokens=[...new Set(splitWords(query).toLowerCase().match(/[a-z0-9]+/g)??[])].filter(t=>!stop.has(t));return chunks.map(chunk=>({...chunk,score:tokens.reduce((n,t)=>n+(chunk.text.toLowerCase().includes(t)?1:0),0)})).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,8)}

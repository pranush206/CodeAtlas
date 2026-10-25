import ts from 'typescript';
const extensions=['.ts','.tsx','.js','.jsx','.mts','.cts','.mjs','.cjs','.json'];
function normalize(path){const parts=[];for(const part of path.split('/')){if(part==='..'){if(!parts.length)return null;parts.pop()}else if(part&&part!=='.')parts.push(part)}return parts.join('/')}
export function resolveImport(source,specifier,paths){
 if(!specifier.startsWith('.'))return null;
 const base=normalize(source.slice(0,source.lastIndexOf('/')+1)+specifier.split(/[?#]/)[0]);
 if(base===null)return null;
 const candidates=[base,...extensions.map(ext=>base+ext),...extensions.map(ext=>base+'/index'+ext)];
 if(/\.[cm]?jsx?$/.test(base)){const stem=base.replace(/\.[cm]?jsx?$/,'');candidates.push(...['.ts','.tsx','.mts','.cts'].map(ext=>stem+ext))}
 return candidates.find(path=>paths.has(path))??null;
}
export function analyze(files){
 const paths=new Set(Object.keys(files)),references=[],diagnostics=[];let analyzed=0;
 for(const [path,code] of Object.entries(files)){
  if(!/\.[cm]?[jt]sx?$/.test(path))continue;
  analyzed++;
  const ast=ts.createSourceFile(path,code,ts.ScriptTarget.Latest,true);
  for(const diagnostic of ast.parseDiagnostics??[]){diagnostics.push({source:path,line:ast.getLineAndCharacterOfPosition(diagnostic.start??0).line+1,message:ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')})}
  function record(expression,node,kind){
   const literal=expression&&(ts.isStringLiteral(expression)||ts.isNoSubstitutionTemplateLiteral(expression));
   const specifier=literal?expression.text:expression?.getText(ast)??'(missing argument)';
   const target=literal?resolveImport(path,specifier,paths):null;
   references.push({id:`ref-${references.length}`,source:path,target,specifier,kind,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,status:target?'resolved':!literal?'dynamic':specifier.startsWith('.')?'missing':'external-or-alias'});
  }
  function visit(node){
   if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)){if(node.moduleSpecifier)record(node.moduleSpecifier,node,ts.isExportDeclaration(node)?'re-export':'import')}
   else if(ts.isImportEqualsDeclaration(node)&&ts.isExternalModuleReference(node.moduleReference)){record(node.moduleReference.expression,node,'require')}
   else if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||(ts.isIdentifier(node.expression)&&node.expression.text==='require'))){record(node.arguments[0],node,node.expression.kind===ts.SyntaxKind.ImportKeyword?'dynamic import':'require (syntax match)')}
   ts.forEachChild(node,visit);
  }visit(ast);
 }
 return {paths:[...paths].sort(),references,diagnostics,analyzed};
}

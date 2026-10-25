import ts from 'typescript';
export function explainSource(result,source,query){
 const ast=ts.createSourceFile(result.path,source,ts.ScriptTarget.Latest,true),facts=[];
 const short=node=>node.getText(ast).replace(/\s+/g,' ').slice(0,150);
 const add=(node,text,why)=>{const line=ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1;if(line>=result.line&&line<=result.endLine)facts.push({line,text,why})};
 function visit(node){
  if(ts.isFunctionDeclaration(node)||ts.isMethodDeclaration(node)){add(node,`Defines ${node.name?short(node.name):'an unnamed function'} with ${node.parameters.length?`inputs: ${node.parameters.map(short).join(', ')}`:'no declared inputs'}.`,'Parameters show what information the caller supplies. Read the body to see how those values are used.');}
  if(ts.isIfStatement(node))add(node,`Checks whether ${short(node.expression)} is true, then chooses a branch.`,'A condition allows different behavior for different inputs. The condition alone does not tell us the author’s intention.');
  if(ts.isReturnStatement(node)&&node.expression)add(node,`Returns ${short(node.expression)}.`, 'This is the value passed back to the caller. If it is JSX, it describes the interface to render.');
  if(ts.isCallExpression(node)){
   const callee=short(node.expression),args=node.arguments.map(short).join(', ');
   let text=`Calls ${callee}(${args}).`,why='This delegates work to another function. Its implementation determines the behavior.';
   if(callee==='useState'||callee==='React.useState'){text=`Creates React state with initial value ${args}.`;why='State lets a component retain a value across renders and request a new render when it changes.'}
   else if(ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='map'){text=`Calls map on ${short(node.expression.expression)} with ${args}.`;why='For an array, map applies a callback to each item and produces a new array; in JSX this is often used to render a list.'}
   else if(ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='filter'){why='For an array, filter keeps entries for which the callback returns a truthy value.'}
   else if(callee==='fetch'){why='fetch starts a network request. Inspect its URL, options, and response handling to understand the data flow.'}
   add(node,text,why);
  }
  if(ts.isJsxAttribute(node)&&/^on[A-Z]/.test(node.name.getText(ast)))add(node,`Connects ${short(node.name)} to ${node.initializer?short(node.initializer):'a handler'}.`,'This associates an event with code to run when the interaction occurs.');
  ts.forEachChild(node,visit);
 }if(/\.[cm]?[jt]sx?$/.test(result.path))visit(ast);
 return {intro:`This section is in ${result.path}${result.label!=='Module code'&&result.label!=='File section'?`, under ${result.label}`:''}.`,facts:facts.slice(0,12),reason:query?`It was retrieved for “${query}”. Relevance is a search suggestion; the walkthrough below describes visible syntax, not a verified answer to the question.`:'',limited:!facts.length};
}

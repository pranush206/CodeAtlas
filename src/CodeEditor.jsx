import React, {useEffect,useRef,useState} from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController';
import editorWorkerUrl from 'monaco-editor/esm/vs/editor/editor.worker?worker&url';
import JSZip from 'jszip';
import {Save,Download,Search,FileCode2,X,RotateCcw} from 'lucide-react';
self.MonacoEnvironment={getWorker:()=>new Worker(new URL(editorWorkerUrl,window.location.origin),{type:'module'})};
const language=p=>({js:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',css:'css',html:'html',py:'python',md:'markdown',json:'json'})[p.split('.').pop()]||'plaintext';
export default function CodeEditor({files,name,onSave,onDirty}){
 const first=Object.keys(files)[0];
 const [active,setActive]=useState(first),[tabs,setTabs]=useState([first]),[drafts,setDrafts]=useState({}),[filter,setFilter]=useState(''),[message,setMessage]=useState(''),[exporting,setExporting]=useState(false),[position,setPosition]=useState({lineNumber:1,column:1});
 const host=useRef(),editor=useRef(),models=useRef(new Map()),latest=useRef();
 const dirty=Object.keys(drafts).filter(p=>drafts[p]!==files[p]);
 latest.current={files,drafts,active,onSave};
 function saveAll(){const s=latest.current; s.onSave({...s.files,...s.drafts});setDrafts({});setMessage('Changes applied to this session. Download a ZIP to keep your work.');}
 const saveRef=useRef(saveAll);saveRef.current=saveAll;
 useEffect(()=>{onDirty(dirty.length>0)},[dirty.length,onDirty]);
 useEffect(()=>{
  const e=monaco.editor.create(host.current,{theme:'vs-dark',automaticLayout:true,fontSize:14,fontFamily:'Consolas, monospace',minimap:{enabled:false},scrollBeyondLastLine:false,padding:{top:18},tabSize:2,wordWrap:'on',ariaLabel:'Project code editor'});editor.current=e;
  e.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyS,()=>saveRef.current());
  const cursor=e.onDidChangeCursorPosition(v=>setPosition(v.position));
  return()=>{cursor.dispose();e.dispose();models.current.forEach(m=>m.dispose())};
 },[]);
 useEffect(()=>{
  let m=models.current.get(active);
  if(!m){m=monaco.editor.createModel(latest.current.drafts[active]??files[active]??'',language(active));models.current.set(active,m);m.onDidChangeContent(()=>setDrafts(prev=>({...prev,[active]:m.getValue()})));}
  editor.current.setModel(m);editor.current.focus();
 },[active]);
 useEffect(()=>{const warn=e=>{if(Object.keys(latest.current.drafts).some(p=>latest.current.drafts[p]!==latest.current.files[p])){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[]);
 function open(path){setTabs(t=>t.includes(path)?t:[...t,path]);setActive(path)}
 function close(path){if(dirty.includes(path)&&!confirm('Discard unsaved changes to '+path+'?'))return;if(dirty.includes(path)){models.current.get(path)?.setValue(files[path]);setDrafts(d=>{const next={...d};delete next[path];return next})}const next=tabs.filter(p=>p!==path);setTabs(next.length?next:[path]);if(active===path&&next.length)setActive(next[0])}
 async function download(){setExporting(true);setMessage('');try{const zip=new JSZip();Object.entries({...files,...drafts}).forEach(([p,v])=>zip.file(p,v));const blob=await zip.generateAsync({type:'blob'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name+'-edited-source.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);setMessage('ZIP downloaded with edits from when you clicked Download. Contains supported source files only.');}catch{setMessage('Could not create ZIP. Your edits are still available here.')}finally{setExporting(false)}}
 return <section className="code-workspace"><div className="edit-intro"><div><h2>Code Editor <span className="badge">WORKSPACE</span></h2><p>Read, experiment, and learn. Save applies edits to search and the code map.</p></div><div className="edit-actions"><button onClick={saveAll} disabled={!dirty.length}><Save size={15}/>Save changes{dirty.length?` (${dirty.length})`:''}</button><button className="primary" onClick={download} disabled={exporting}><Download size={15}/>{exporting?'Preparing ZIP…':'Download source ZIP'}</button></div></div><div className="edit-guidance">Changes stay in this browser session. Download your ZIP before leaving. Only imported source files are included; dependencies, binaries, and environment files are excluded.</div>{message&&<div className="notice" role="status">{message}</div>}<div className="ide"><aside className="ide-files"><div className="ide-label">EXPLORER</div><div className="search"><Search size={14}/><input aria-label="Filter editor files" placeholder="Find a file…" value={filter} onChange={e=>setFilter(e.target.value)}/></div><div className="ide-file-list">{Object.keys(files).sort().filter(p=>p.toLowerCase().includes(filter.toLowerCase())).map(p=><button key={p} title={p} className={active===p?'active':''} onClick={()=>open(p)}><FileCode2 size={14}/><span>{p}</span>{dirty.includes(p)&&<b aria-label="Unsaved changes">●</b>}</button>)}</div></aside><div className="ide-main"><div className="ide-tabs" role="tablist" aria-label="Open files">{tabs.map(p=><div key={p} className={active===p?'active':''}><button role="tab" aria-selected={active===p} onClick={()=>open(p)}>{p.split('/').pop()}{dirty.includes(p)&&<span> ●</span>}</button><button aria-label={'Close '+p} onClick={()=>close(p)}><X size={13}/></button></div>)}</div><div className="ide-path"><span>{active}</span><button onClick={()=>editor.current?.getAction('actions.find').run()}><Search size={13}/>Find / replace</button><button disabled={!dirty.includes(active)} onClick={()=>{if(confirm('Discard unsaved changes in this file?'))models.current.get(active)?.setValue(files[active])}}><RotateCcw size={13}/>Reset file</button></div><div ref={host} className="monaco-host"/><div className="ide-status"><span>{dirty.length?`${dirty.length} unsaved file${dirty.length===1?'':'s'}`:'All changes applied to session'}</span><span>Ln {position.lineNumber}, Col {position.column} · {language(active)} · UTF-8</span></div></div></div><p className="editor-help">Tip: Ctrl/Cmd + S saves changes. Ctrl/Cmd + F searches within a file. This editor does not run your code.</p></section>
}

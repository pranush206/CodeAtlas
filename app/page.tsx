'use client';
import {useEffect,useState} from 'react';
export default function Home(){const [App,setApp]=useState<any>(null);const [failed,setFailed]=useState(false);useEffect(()=>{import('../src/main.jsx').then(m=>setApp(()=>m.default)).catch(()=>setFailed(true))},[]);return App?<App/>:<p style={{padding:40,fontFamily:'sans-serif'}}>{failed?'Could not load CodeAtlas. Please refresh to retry.':'Opening CodeAtlas…'}</p>}

import {analyze} from './analyze.js';
self.onmessage=({data})=>{try{self.postMessage({result:analyze(data)})}catch(error){self.postMessage({error:error.message||'Could not analyze this project.'})}};

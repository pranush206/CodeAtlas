import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
// Browser ML workers request WASM over HTTP from client assets. Multi-environment
// bundling also copies identical binaries into RSC/SSR; they are not server modules.
const clients=fs.readdirSync('dist/client',{recursive:true}).filter(p=>p.endsWith('.wasm'));
for(const relative of fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.wasm'))){
 const source=path.join('dist/server',relative);
 const client=clients.find(p=>path.basename(p)===path.basename(relative));
 assert(client,`Missing browser asset for ${relative}`);
 assert(fs.readFileSync(source).equals(fs.readFileSync(path.join('dist/client',client))),`WASM differs: ${relative}`);
 fs.unlinkSync(source);
 console.log(`Excluded redundant server binary: ${relative}`);
}

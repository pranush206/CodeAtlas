export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){return Response.json({configured:false,provider:'Ollama',localSetupRequired:true,message:'Run CodeAtlas locally to use Ollama on your computer.'},{headers})}
export async function POST(){return Response.json({error:'Open the local CodeAtlas app at http://127.0.0.1:5173. This hosted page cannot reach Ollama on your computer.'},{status:503,headers})}

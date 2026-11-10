export const origin='https://founders-builders-ux-review.hello978822.chatgpt.site';
export function createBetaHandler({save,networkHash}){
 return async request=>{const from=request.headers.get('Origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(from===origin?{'Access-Control-Allow-Origin':origin,Vary:'Origin'}:{})},reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(from&&from!==origin)return reply({message:'Request origin not allowed.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type'}});
  if(request.method!=='POST')return reply({message:'Use the access request form.'},405);
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return reply({message:'Invalid request.'},415);
  try{let text='',bytes=0;const reader=request.body?.getReader();if(!reader)return reply({message:'Enter your email and choose a role.'},400);const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2048){await reader.cancel();return reply({message:'Request too large.'},413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();let data;try{data=JSON.parse(text);}catch{return reply({message:'Invalid request.'},400);}
   if(!data||Array.isArray(data)||Object.keys(data).some(k=>!['email','role','consent'].includes(k)))return reply({message:'Use only the fields in the form.'},400);
   const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
   if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['founder','builder','both'].includes(data.role)||data.consent!==true)return reply({message:'Enter a valid email, choose a role, and agree to the access review.'},400);
   const accepted=await save({email,role:data.role,networkHash:await networkHash(request)});
   if(!accepted)return reply({message:'Please try again later. Your request has not been confirmed.'},429);
   return reply({received:true,message:'Request received for review. This does not create an account or grant access. No confirmation email is sent at this stage.'});
  }catch{return reply({message:'Your request could not be confirmed. Please try again later.'},503);}
 };
}

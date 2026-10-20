import {createClient} from "https://esm.sh/@supabase/supabase-js@2.49.8";

const VALID_ORIGINS = new Set([
 "https://jamrock-crm.vercel.app",
 "https://jamrock-crm-contact-32903528s-projects.vercel.app"
]);
const respond=(data:Record<string,unknown>,status:number,origin:string)=>new Response(JSON.stringify(data),{
 status,headers:{"Content-Type":"application/json","Cache-Control":"no-store",
  "Access-Control-Allow-Origin":VALID_ORIGINS.has(origin)?origin:"null",
  "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}
});
function normalize(v:string){return v.toLowerCase().replace(/\s+/g," ").replace(/[,#.]/g,"").trim();}
const asNum=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?value:null;

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 if(!VALID_ORIGINS.has(origin))return respond({error:"Origin not allowed"},403,origin);
 if(req.method==="OPTIONS")return respond({ok:true},200,origin);
 if(req.method!=="POST")return respond({error:"Method not allowed"},405,origin);
 try{
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const projectUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!projectUrl||!serviceKey)return respond({error:"Service is not configured"},503,origin);
  if(!token)return respond({error:"Sign in first"},401,origin);
  const admin=createClient(projectUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return respond({error:"Unauthorized"},401,origin);
  const raw=await req.text();
  if(raw.length>2000)return respond({error:"Invalid request"},400,origin);
  const body=JSON.parse(raw);
  const jobId=String(body?.job_id||"");
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(jobId))return respond({error:"Invalid job ID"},400,origin);
  const {data:membership,error:memberError}=await admin.from("workspace_members").select("workspace_id").eq("user_id",user.id).limit(1).maybeSingle();
  if(memberError||!membership)return respond({error:"No Jamrock workspace access"},403,origin);
  const {data:job,error:jobError}=await admin.from("jobs").select("id,pickup_address,contact_id").eq("id",jobId).eq("workspace_id",membership.workspace_id).maybeSingle();
  if(jobError||!job)return respond({error:"Job unavailable"},404,origin);
  const {data:contact}=await admin.from("contacts").select("address").eq("id",job.contact_id).eq("workspace_id",membership.workspace_id).maybeSingle();
  const address=(job.pickup_address||contact?.address||"").trim();
  if(address.length<12||/^ZIP\s+\d{5}/i.test(address)||!/\d/.test(address))return respond({error:"Enter a complete street, city, state and ZIP address before looking up this property"},400,origin);
  const key=normalize(address);
  const {data:cache}=await admin.from("property_lookups").select("data,retrieved_at,formatted_address").eq("workspace_id",membership.workspace_id).eq("address_key",key).maybeSingle();
  if(cache&&Date.now()-new Date(cache.retrieved_at).getTime()<30*86400000)return respond({ok:true,property:cache.data,address:cache.formatted_address,source:"RentCast",as_of:cache.retrieved_at,cached:true},200,origin);
  const rentcastKey=Deno.env.get("RENTCAST_API_KEY");
  if(!rentcastKey)return respond({ok:false,setup_required:true,message:"Property data is not connected yet. An account-owned RentCast API key must be configured in Supabase."},200,origin);
  const headers={"X-Api-Key":rentcastKey,"Accept":"application/json"};
  async function fromApi(path:string){
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),9000);
   try{
    const out=await fetch("https://api.rentcast.io/v1/"+path+"?address="+encodeURIComponent(address),{headers,signal:controller.signal});
    if(out.status===404)return null;
    if(out.status===429)return {rate_limited:true};
    if(!out.ok){console.warn("RentCast response status",out.status);return {error:true};}
    return await out.json();
   }finally{clearTimeout(timer);}
  }
  // Property records contain sold history and assessment values. AVM is a distinct estimate, not MLS valuation.
  const recordResult=await fromApi("properties");
  if((recordResult as any)?.rate_limited)return respond({error:"Property data provider limit reached"},429,origin);
  if((recordResult as any)?.error)return respond({error:"Property data unavailable. Try public county records."},502,origin);
  const record=Array.isArray(recordResult)?recordResult.find((v:any)=>normalize(v.formattedAddress||"")===key)||recordResult[0]:recordResult;
  if(!record)return respond({ok:false,not_found:true,message:"This property wasn't found in the provider records."},200,origin);
  const valueResult=await fromApi("avm/value");
  const value=valueResult&&typeof valueResult==="object"&&!Array.isArray(valueResult)&&!(valueResult as any).error&&!(valueResult as any).rate_limited?valueResult as any:null;
  const sale=(record as any).history?.[0]||{};
  const property={
    address:(record as any).formattedAddress||address,
    property_type:(record as any).propertyType||null,
    year_built:(record as any).yearBuilt||null,
    bedrooms:(record as any).bedrooms??null,
    bathrooms:(record as any).bathrooms??null,
    square_feet:(record as any).squareFootage??null,
    lot_size:(record as any).lotSize??null,
    last_sale_price:asNum((record as any).lastSalePrice??sale.price),
    last_sale_date:(record as any).lastSaleDate||sale.date||null,
    assessed_value:asNum((record as any).assessedValue),
    estimated_value:asNum(value?.price),
    estimate_low:asNum(value?.priceRangeLow),
    estimate_high:asNum(value?.priceRangeHigh)
  };
  const {error:cacheError}=await admin.from("property_lookups").upsert({
   workspace_id:membership.workspace_id,address_key:key,formatted_address:address,
   provider:"RentCast",data:property,retrieved_at:new Date().toISOString()
  },{onConflict:"workspace_id,address_key"});
  if(cacheError)console.error("Property cache issue",cacheError.code);
  return respond({ok:true,property,address,source:"RentCast",as_of:new Date().toISOString(),cached:false},200,origin);
 }catch(e){
  console.error("Property lookup failure",String(e));
  return respond({error:"Unable to retrieve property details"},500,origin);
 }
});

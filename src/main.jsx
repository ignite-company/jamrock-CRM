import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard, Users, ClipboardList, Kanban, CalendarDays, Settings, House,
  Plus, Search, Bell, ArrowUpRight, Phone, Mail, MapPin, Check,
  ChevronLeft, ChevronRight, ChevronDown, Menu, X, Clock, Truck, DollarSign,
  CircleCheck, Star, ExternalLink, Download, ShieldCheck, LogOut, Link2,
  CircleHelp, AlertCircle, ArrowRight, ListTodo, Pencil, Filter, RotateCcw,
  CalendarCheck2, CircleDot
} from "lucide-react";
import "./styles.css";

const LOGO = "https://assets.cdn.filesafe.space/bF1dT8IAVuvat84LkAVe/media/6ab1c9e4bdaa5e26a97f4bc3.png";
// Public Supabase client configuration. Vercel environment variables take precedence.
// This publishable key is designed for browser use; row-level security protects data.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yvqduodposlpcimqqewc.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_zOoOkyUHSgYYerM7Ig-dyw_yFOhSbY9";
const connected = Boolean(SUPABASE_URL && KEY);
const db = connected ? createClient(SUPABASE_URL, KEY) : null;
const STAGES = [
  { id: "new", label: "New lead", color: "blue" },
  { id: "contacted", label: "Contacted", color: "gray" },
  { id: "estimate_sent", label: "Estimate sent", color: "orange" },
  { id: "booked", label: "Booked", color: "green" },
  { id: "completed", label: "Completed", color: "green" },
  { id: "lost", label: "Lost", color: "gray" }
];
const TABS = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "pipeline", label: "Lead pipeline", icon: Kanban },
  { id: "jobs", label: "Jobs & estimates", icon: ClipboardList },
  { id: "customers", label: "Customers", icon: Users },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "tasks", label: "Follow-ups", icon: ListTodo },
  { id: "settings", label: "Settings", icon: Settings }
];
const FOLLOW_UP_CATEGORIES = [
  {id:"follow_up",label:"Follow-up scheduled"},
  {id:"no_answer",label:"No answer, first attempt"},
  {id:"unresponsive",label:"Not responding"},
  {id:"waiting_on_customer",label:"Waiting on customer"}
];
const followCategory = id => FOLLOW_UP_CATEGORIES.find(c=>c.id===id)?.label||"Follow-up scheduled";
const leadReceived = value => value ? new Intl.DateTimeFormat("en-US",{
  timeZone:"America/New_York",weekday:"long",month:"short",day:"numeric",year:"numeric",
  hour:"numeric",minute:"2-digit",timeZoneName:"short"
}).format(new Date(value)) : "Unknown";
const leadAge=(value,now)=>{
  if(!value)return "";
  const ms=now-new Date(value).getTime();
  if(!Number.isFinite(ms))return "";
  if(ms<60000)return "Just now";
  const mins=Math.floor(ms/60000);
  if(mins<60)return mins+"m ago";
  const hrs=Math.floor(mins/60);
  if(hrs<24)return hrs+"h ago";
  const days=Math.floor(hrs/24);
  if(days<30)return days+"d ago";
  return Math.floor(days/30)+"mo ago";
};
const localDateTimeInput = value => {
  const d = new Date(value);
  const pad = n => String(n).padStart(2,"0");
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
};
const DAY = 86400000;
const dateOffset = (n) => new Date(Date.now() + n * DAY).toISOString();
const samples = {
  contacts: [
    { id:"demo-c1", name:"Jordan Mitchell", phone:"(352) 555-0101", email:"jordan@example.com", address:"Gainesville, FL", notes:"Demo customer, not a real Jamrock contact." },
    { id:"demo-c2", name:"Alex Rivera", phone:"(352) 555-0102", email:"alex@example.com", address:"Alachua, FL", notes:"Demo customer." },
    { id:"demo-c3", name:"Casey Brooks", phone:"(352) 555-0103", email:"casey@example.com", address:"Newberry, FL", notes:"Demo customer." },
    { id:"demo-c4", name:"Taylor Reed", phone:"(352) 555-0104", email:"taylor@example.com", address:"Gainesville, FL", notes:"Demo customer." }
  ],
  jobs: [
    { id:"demo-j1", contact_id:"demo-c1", service:"Garage cleanout", source:"Website", stage:"new", estimate_amount:375, final_amount:null, scheduled_at:null, notes:"Needs a quote", created_at:dateOffset(-1) },
    { id:"demo-j2", contact_id:"demo-c2", service:"Furniture removal", source:"Phone", stage:"estimate_sent", estimate_amount:240, final_amount:null, scheduled_at:null, notes:"Waiting for approval", created_at:dateOffset(-3) },
    { id:"demo-j3", contact_id:"demo-c3", service:"Full home cleanout", source:"Referral", stage:"booked", estimate_amount:950, final_amount:null, scheduled_at:dateOffset(1), notes:"Crew: 2 people", created_at:dateOffset(-5) },
    { id:"demo-j4", contact_id:"demo-c4", service:"Appliance pickup", source:"Google", stage:"completed", estimate_amount:180, final_amount:180, scheduled_at:dateOffset(-2), notes:"Paid", created_at:dateOffset(-9) }
  ],
  tasks: [
    { id:"demo-t1", contact_id:"demo-c1", job_id:"demo-j1", title:"Call Jordan about their garage cleanout", due_at:dateOffset(0), completed:false },
    { id:"demo-t2", contact_id:"demo-c2", job_id:"demo-j2", title:"Follow up on furniture removal estimate", due_at:dateOffset(1), completed:false },
    { id:"demo-t3", contact_id:"demo-c4", job_id:"demo-j4", title:"Send review request to Taylor", due_at:dateOffset(2), completed:false }
  ]
};
function localRead(key) {
  try { const raw = localStorage.getItem("jamrock_demo_" + key); return raw ? JSON.parse(raw) : samples[key]; }
  catch { return samples[key]; }
}
const money = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n)||0);
const shortDate = (n) => n ? new Date(n).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "Not scheduled";
const fullDate = (n) => n ? new Date(n).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "Not scheduled";
const dayLabel = (date) => new Date(date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const initials = (name) => (name||"?").split(" ").slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
const uuid = () => crypto.randomUUID();
const hasStreetAddress = a => Boolean(a && a.trim().length>=12 && /\d/.test(a) && !/^ZIP\s+\d{5}(?:-\d{4})?$/i.test(a.trim()));
const mapsUrl = a => "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(a);
const propertySearchUrl = a => "https://www.zillow.com/homes/"+encodeURIComponent(a.trim().replace(/[,\s]+/g,"-"))+"_rb/";
const stageInfo = (stage) => STAGES.find(s=>s.id===stage) || STAGES[0];
const cssDate = (date) => date ? new Date(date).toLocaleDateString("en-CA") : "";
function csvDownload(rows,filename){
  const quote=v=>{const str=String(v??"");const guarded=/^[=+\-@\t\r]/.test(str)?"'"+str:str;return '"'+guarded.replace(/"/g,'""')+'"';};
  const csv=rows.map(row=>row.map(quote).join(",")).join("\r\n");
  const url=window.URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();window.URL.revokeObjectURL(url);
}
function Brand({ compact=false }){
 return <div className={"brand "+(compact?"brand-compact":"")}>
  <div className="brand-logo"><img src={LOGO} alt="Jamrock Junk Removal logo"/></div>
  {!compact && <div className="brand-copy"><b>Jamrock</b><span>COMMAND CENTER</span></div>}
 </div>;
}
function Pill({stage}){const s=stageInfo(stage);return <span className={"pill pill-"+s.color}><span className="pill-dot"/>{s.label}</span>;}
function Empty({icon:Icon=CircleHelp,title,subtitle,action}){return <div className="empty-state"><div className="empty-icon"><Icon size={23}/></div><h3>{title}</h3><p>{subtitle}</p>{action}</div>;}
function Login({onLogin}){
 const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[message,setMessage]=useState("");const[loading,setLoading]=useState(false);
 async function submit(e){e.preventDefault();setLoading(true);setMessage("");const{error}=await db.auth.signInWithPassword({email,password});if(error)setMessage(error.message);else onLogin();setLoading(false);}
 return <div className="login-bg"><div className="login-card"><Brand/><div className="login-hero"><ShieldCheck size={32}/><h1>Welcome back</h1><p>Your customers, jobs and follow-ups, all in one place.</p></div><form onSubmit={submit} className="form-stack"><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@jamrockjunk.com"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label>{message&&<p className="error-text">{message}</p>}<button disabled={loading} className="btn btn-primary" type="submit">{loading?"Signing in…":"Sign in"}<ArrowRight size={17}/></button></form><p className="login-footnote">Private business workspace. Accounts are created by your administrator.</p></div></div>;
}
function App(){
 const[session,setSession]=useState(null);
 const[authLoading,setAuthLoading]=useState(connected);
 const[workspace,setWorkspace]=useState(null);
 const[loading,setLoading]=useState(connected);
 const[tab,setTab]=useState("dashboard");
 const[mobileNav,setMobileNav]=useState(false);
 const[contacts,setContacts]=useState(()=>connected?[]:localRead("contacts"));
 const[jobs,setJobs]=useState(()=>connected?[]:localRead("jobs"));
 const[tasks,setTasks]=useState(()=>connected?[]:localRead("tasks"));
 const[query,setQuery]=useState("");
 const[modal,setModal]=useState(null);
 const[form,setForm]=useState({});
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState("");
 const[toast,setToast]=useState("");
 const[month,setMonth]=useState(new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const[selectedDay,setSelectedDay]=useState(null);
 const[propertyView,setPropertyView]=useState(null);
 const[propertyResult,setPropertyResult]=useState(null);
 const[propertyLoading,setPropertyLoading]=useState(false);
 const[propertyError,setPropertyError]=useState("");
 const[recordView,setRecordView]=useState("jobs");
 const[recordFilter,setRecordFilter]=useState("all");
 const[taskCategoryFilter,setTaskCategoryFilter]=useState("all");
 const[now,setNow]=useState(Date.now());
 useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),60000);return()=>window.clearInterval(id);},[]);
 useEffect(()=>{if(!connected)return;db.auth.getSession().then(({data})=>{setSession(data.session);setAuthLoading(false);});const{data:{subscription}}=db.auth.onAuthStateChange((_ev,s)=>setSession(s));return()=>subscription.unsubscribe();},[]);
 useEffect(()=>{if(!connected){localStorage.setItem("jamrock_demo_contacts",JSON.stringify(contacts));}},[contacts]);
 useEffect(()=>{if(!connected){localStorage.setItem("jamrock_demo_jobs",JSON.stringify(jobs));}},[jobs]);
 useEffect(()=>{if(!connected){localStorage.setItem("jamrock_demo_tasks",JSON.stringify(tasks));}},[tasks]);
 useEffect(()=>{if(connected&&session)reload();if(connected&&!session){setContacts([]);setJobs([]);setTasks([]);setWorkspace(null);setLoading(false);}},[session?.user?.id]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),3800);return()=>clearTimeout(t);},[toast]);
 // Keep the open dashboard and pipeline fresh as new website forms arrive.
 useEffect(()=>{
   if(!connected||!session?.user?.id)return;
   const refresh=()=>{if(document.visibilityState==="visible")reload();};
   const timer=window.setInterval(refresh,20000);
   window.addEventListener("focus",refresh);
   return()=>{window.clearInterval(timer);window.removeEventListener("focus",refresh);};
 },[session?.user?.id]);
 async function reload(){
  try{setLoading(true);setError("");
   const member=await db.from("workspace_members").select("workspace_id,role,workspaces(id,name,review_link)").eq("user_id",session.user.id).limit(1).maybeSingle();
   if(member.error)throw member.error;
   if(!member.data)throw Error("No workspace is assigned to this account. Contact the administrator.");
   setWorkspace(member.data);
   const [c,j,t]=await Promise.all(["contacts","jobs","tasks"].map(table=>db.from(table).select("*").eq("workspace_id",member.data.workspace_id).order("created_at",{ascending:false})));
   for(const result of [c,j,t])if(result.error)throw result.error;
   setContacts(c.data||[]);setJobs(j.data||[]);setTasks(t.data||[]);
  }catch(e){setError(e.message||"Could not load business records.");}finally{setLoading(false);}
 }
 const person=(id)=>contacts.find(c=>c.id===id);
 const addressForJob=j=>{
  if(!j)return "";
  const own=(j.pickup_address||"").trim();
  if(hasStreetAddress(own))return own;
  const contact=person(j.contact_id);
  return hasStreetAddress(contact?.address||"")?contact.address.trim():"";
 };
 const selectedDayJobs=selectedDay?jobs.filter(j=>j.scheduled_at&&new Date(j.scheduled_at).toDateString()===selectedDay.toDateString()&&j.stage!=="lost").sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at)):[];
 async function viewHouse(j){
  const address=addressForJob(j);
  if(!hasStreetAddress(address)){setToast("Save a complete street address first.");return;}
  setPropertyView({jobId:j.id,address,customer:person(j.contact_id)?.name||"Customer"});
  setPropertyResult(null);setPropertyError("");
  if(!connected||!session){setPropertyError("Property provider isn't available in demo mode.");return;}
  setPropertyLoading(true);
  try{
   const result=await db.functions.invoke("jamrock-property-details",{body:{job_id:j.id}});
   if(result.error)throw Error(result.error.message||"Could not look up property.");
   const data=result.data||{};
   if(data.error)throw Error(data.error);
   setPropertyResult(data);
  }catch(e){setPropertyError(e.message||"Unable to load property records.");}
  finally{setPropertyLoading(false);}
 }
 function closeProperty(){setPropertyView(null);setPropertyResult(null);setPropertyError("");}
 const filtered=(items,kind)=>{
  const text=query.trim().toLowerCase();if(!text)return items;
  return items.filter(v=>(kind==="contacts"?[v.name,v.phone,v.email,v.address]:[v.service,v.notes,v.source,person(v.contact_id)?.name,person(v.contact_id)?.phone]).filter(Boolean).join(" ").toLowerCase().includes(text));
 };
 // Pipeline stages are deliberately separated from the estimates and jobs ledger.
 const estimateRecords=jobs.filter(j=>j.stage==="estimate_sent"||(["new","contacted"].includes(j.stage)&&j.estimate_amount!=null));
 const workRecords=jobs.filter(j=>j.stage==="booked"||j.stage==="completed");
 const visibleRecords=filtered(recordView==="estimates"?estimateRecords:workRecords,"jobs").filter(j=>{
  if(recordFilter==="all")return true;
  if(recordView==="estimates")return recordFilter==="sent"?j.stage==="estimate_sent":j.stage!=="estimate_sent";
  return recordFilter==="scheduled"?j.stage==="booked":j.stage==="completed";
 });
 const activeJobs=jobs.filter(j=>j.stage!=="lost");
 const newLeads=jobs.filter(j=>j.stage==="new").length;
 const estimates=jobs.filter(j=>j.stage==="estimate_sent").length;
 const booked=jobs.filter(j=>j.stage==="booked").length;
 const revenue=jobs.filter(j=>j.stage==="completed").reduce((s,j)=>s+Number(j.final_amount??j.estimate_amount??0),0);
 const openTasks=tasks.filter(t=>!t.completed).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at));
 const visibleTasks=tasks.filter(t=>taskCategoryFilter==="all"||(t.category||"follow_up")===taskCategoryFilter);
 const filteredOpenTasks=visibleTasks.filter(t=>!t.completed).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at));
 const filteredDoneTasks=visibleTasks.filter(t=>t.completed);
 const completedCustomerIds=new Set(jobs.filter(j=>j.stage==="completed").map(j=>j.contact_id));
 const completedCustomers=contacts.filter(c=>completedCustomerIds.has(c.id));
 const upcomingJobs=jobs.filter(j=>j.stage==="booked"&&j.scheduled_at).sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at));
 function changeTab(id){setTab(id);setMobileNav(false);setQuery("");setSelectedDay(null);}
 function openModal(type,data={}){
  setError("");setForm(data);setModal(type);
 }
 function openFollowUpFromLead(job){
  const contact=person(job.contact_id);
  openModal("task",{
    title:"Follow up with "+(contact?.name||"lead"),
    category:"no_answer",contact_id:job.contact_id,job_id:job.id,
    notes:job.notes||contact?.notes||"",
    due_at:localDateTimeInput(Date.now()+DAY),
    completed:false
  });
 }
 async function upsert(table,payload,localSetter) {
  const data={...payload,id:payload.id||uuid()};
  if(connected){
   const out=await db.from(table).upsert({...data,workspace_id:workspace.workspace_id},{onConflict:"id"}).select().single();
   if(out.error)throw out.error;return out.data;
  }
  localSetter(old=>old.some(x=>x.id===data.id)?old.map(x=>x.id===data.id?{...x,...data}:x):[data,...old]);
  return data;
 }
 async function save(e){
  e.preventDefault();setSaving(true);setError("");
  try{
   if(modal==="lead"){
    const c=await upsert("contacts",{name:form.name.trim(),phone:form.phone||"",email:form.email||"",address:form.address||"",notes:form.contact_notes||"",created_at:new Date().toISOString()},setContacts);
    await upsert("jobs",{contact_id:c.id,service:form.service||"Junk removal",source:form.source||"Website",pickup_address:hasStreetAddress(form.address)?form.address.trim():"",stage:"new",estimate_amount:null,final_amount:null,scheduled_at:null,notes:form.notes||"",created_at:new Date().toISOString()},setJobs);
   }
   if(modal==="contact")await upsert("contacts",{id:form.id,name:form.name.trim(),phone:form.phone||"",email:form.email||"",address:form.address||"",notes:form.notes||""},setContacts);
   if(modal==="job"){
    const address=(form.pickup_address??addressForJob(form)).trim();
    await upsert("jobs",{id:form.id,contact_id:form.contact_id,service:form.service||"Junk removal",source:form.source||"Other",pickup_address:address,stage:form.stage||"new",estimate_amount:form.estimate_amount===""||form.estimate_amount==null?null:Number(form.estimate_amount),final_amount:form.final_amount===""||form.final_amount==null?null:Number(form.final_amount),scheduled_at:form.scheduled_at?new Date(form.scheduled_at).toISOString():null,notes:form.notes||"",lead_details:form.lead_details||{},created_at:form.created_at||new Date().toISOString()},setJobs);
    // The contact record remembers the latest pickup address, but each job keeps its own address.
    const existing=person(form.contact_id);
    if(existing&&hasStreetAddress(address)&&existing.address!==address){
      await upsert("contacts",{...existing,address},setContacts);
    }
   }
   if(modal==="task")await upsert("tasks",{id:form.id,title:form.title.trim(),category:form.category||"follow_up",notes:form.notes||"",contact_id:form.contact_id||null,job_id:form.job_id||null,due_at:form.due_at?new Date(form.due_at).toISOString():new Date().toISOString(),completed:Boolean(form.completed),created_at:form.created_at||new Date().toISOString()},setTasks);
   setModal(null);setToast("Saved successfully");if(connected)await reload();
  }catch(e){setError(e.message||"Could not save. Please try again.");}finally{setSaving(false);}
 }
 async function setJobStage(job,stage){
  try{setError("");await upsert("jobs",{...job,stage},setJobs);if(connected)await reload();setToast("Job updated");}
  catch(e){setError(e.message||"Could not update job");}
 }
 async function toggleTask(task){
  try{await upsert("tasks",{...task,completed:!task.completed},setTasks);if(connected)await reload();}
  catch(e){setError(e.message||"Could not update follow-up");}
 }
 function resetDemo(){if(!connected){setContacts(samples.contacts);setJobs(samples.jobs);setTasks(samples.tasks);setToast("Sample records restored");}}
 function exportJobs(){
  csvDownload([["Contact","Phone","Service","Source","Stage","Estimate","Final amount","Scheduled","Notes"],...jobs.map(j=>[person(j.contact_id)?.name,person(j.contact_id)?.phone,j.service,j.source,stageInfo(j.stage).label,j.estimate_amount,j.final_amount,j.scheduled_at,j.notes])],"jamrock-jobs.csv");
 }
 const heading={
  dashboard:["Good "+(new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening")+", Jamrock","Here's what's happening across your business."],
  pipeline:["Lead pipeline","Move every inquiry from first contact to completed job."],
  jobs:["Jobs & estimates","Quotes and confirmed work, without the lead pipeline clutter."],
  customers:["Customers","Only customers with completed jobs appear here, with their job history."],
  calendar:["Job calendar","Know what is scheduled and what's coming up."],
  tasks:["Follow-ups","Never forget to call, text or check in."],
  settings:["Workspace settings","Your business tools, integrations and information."]
 }[tab];
 function jobRow(j){
  const c=person(j.contact_id);return <div className="job-row" key={j.id}><div className="avatar">{initials(c?.name)}</div><div className="job-main"><button className="link-title" onClick={()=>openModal("job",{...j,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""})}>{c?.name||"Customer"}</button><span>{j.service} <span className="mid-dot">·</span> {j.source||"Other"}</span><span>Received {leadReceived(j.created_at)} · {leadAge(j.created_at,now)}</span></div><div className="job-money">{j.estimate_amount==null?"No estimate":money(j.estimate_amount)}</div><Pill stage={j.stage}/><button className="icon-btn light" title="Edit job" onClick={()=>openModal("job",{...j,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""})}><ArrowUpRight size={17}/></button></div>;
 }
 function taskRow(t){
  const c=person(t.contact_id);
  const job=jobs.find(j=>j.id===t.job_id);
  return <div key={t.id} className={"task-row categorized-task "+(t.completed?"task-done":"")}>
    <button title={t.completed?"Mark pending":"Mark done"} aria-label={t.completed?"Mark pending":"Mark done"} onClick={()=>toggleTask(t)} className={"task-check "+(t.completed?"is-done":"")}>{t.completed?<Check size={15}/>:null}</button>
    <div className="task-body">
     <div className="task-header"><b>{t.title}</b><span className={"followup-tag followup-"+(t.category||"follow_up")}>{followCategory(t.category)}</span></div>
     <span>{c?.name?c.name+" · ":""}Due {fullDate(t.due_at)}</span>
     {t.notes&&<p className="task-latest-note"><strong>Latest note:</strong> {t.notes}</p>}
     {job&&<button className="task-related-link" onClick={()=>editJob(job)}>Open lead <ArrowUpRight size={13}/></button>}
    </div>
    <button className="icon-btn light" aria-label="Edit follow-up" onClick={()=>openModal("task",{...t,due_at:localDateTimeInput(t.due_at||Date.now())})}><Pencil size={15}/></button>
  </div>;
 }
 function newJobForm(){openModal("job",{contact_id:contacts[0]?.id||"",service:"Junk removal",stage:"booked",source:"Phone"});}
 function newEstimateForm(){openModal("job",{contact_id:contacts[0]?.id||"",service:"Junk removal",stage:"estimate_sent",source:"Phone"});}
 function editJob(j,updates={}){openModal("job",{...j,...updates,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""});}
 function workRecordRow(j){
  const c=person(j.contact_id),estimate=recordView==="estimates",completed=j.stage==="completed";
  return <div className="work-record" key={j.id}>
   <div className={"work-record-icon "+(estimate?"quote-icon":"job-icon")}>{estimate?<ClipboardList size={19}/>:<Truck size={19}/>}</div>
   <div className="work-record-detail"><button className="work-record-name" onClick={()=>editJob(j)}>{j.service||"Junk removal"}</button><span>{c?.name||"Customer"}{c?.address?" · "+c.address:""}</span></div>
   <div className="work-record-amount"><span>{estimate?"Estimate amount":"Job value"}</span><strong>{j.estimate_amount==null&&j.final_amount==null?"Not priced":money(completed?(j.final_amount??j.estimate_amount):(j.estimate_amount??j.final_amount))}</strong></div>
   <div className="work-record-progress"><span className={"work-label "+(estimate?"work-label-estimate":completed?"work-label-complete":"work-label-booked")}>{estimate?(j.stage==="estimate_sent"?"Awaiting reply":"Draft quote"):completed?"Completed":"Booked"}</span><small>{estimate?"":j.scheduled_at?fullDate(j.scheduled_at):"Date not set"}</small></div>
   <div className="work-record-actions">{estimate&&<button className="work-quick" onClick={()=>editJob(j,{stage:"booked"})}>Book job <ArrowRight size={14}/></button>}<button title="Edit record" aria-label="Edit record" className="icon-btn light" onClick={()=>editJob(j)}><Pencil size={16}/></button></div>
  </div>;
 }
 if(authLoading)return <div className="loading-page">Loading Jamrock Command Center…</div>;
 if(connected&&!session)return <Login onLogin={()=>{}}/>;
 if(connected&&loading&& !workspace)return <div className="loading-page">Loading your workspace…</div>;
 return <div className="app-shell">
   {mobileNav&&<div className="nav-scrim" onClick={()=>setMobileNav(false)}/>}
   <aside className={"sidebar "+(mobileNav?"sidebar-open":"")}><div className="side-header"><Brand/><button className="mobile-close icon-btn" onClick={()=>setMobileNav(false)}><X size={20}/></button></div><div className="side-label">WORKSPACE</div><nav className="side-nav">
   {TABS.map(t=><button key={t.id} onClick={()=>changeTab(t.id)} className={"nav-link "+(tab===t.id?"selected":"")}><t.icon size={19} strokeWidth={2}/><span>{t.label}</span>{t.id==="tasks"&&openTasks.length>0&&<em>{openTasks.length}</em>}</button>)}
   </nav><div className="sidebar-bottom"><div className="side-help"><div className="side-help-icon"><Truck size={18}/></div><b>Built for Jamrock</b><span>Less admin. More jobs done.</span></div><div className="side-profile"><div className="profile-avatar">J</div><div><b>Jamrock Junk Removal</b><span>Gainesville, Florida</span></div><ShieldCheck size={16}/></div></div></aside>
   <div className="main-shell"><header className="topbar"><div className="top-left"><button className="mobile-menu icon-btn" onClick={()=>setMobileNav(true)} aria-label="Open navigation"><Menu size={22}/></button><div className="breadcrumb">Jamrock <ChevronRight size={15}/> <b>{TABS.find(t=>t.id===tab)?.label}</b></div></div><div className="top-right"><span className="today-date">{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span><div className="profile-avatar profile-small">J</div></div></header>
    <main className="page">
     {!connected&&<div className="demo-banner"><AlertCircle size={17}/><div><b>Preview workspace</b><span>Sample contacts and browser-only data. Not ready for actual client records until secure database setup.</span></div><button onClick={()=>changeTab("settings")}>Setup details <ArrowRight size={14}/></button></div>}
     {error&&<div className="error-banner"><AlertCircle size={17}/>{error}<button onClick={()=>setError("")} aria-label="Dismiss"><X size={16}/></button></div>}
     <div className="page-heading"><div><div className="eyebrow">JAMROCK COMMAND CENTER</div><h1>{heading[0]}</h1><p>{heading[1]}</p></div><div className="heading-actions">{tab==="jobs"&&<button className="btn btn-outline" onClick={exportJobs}><Download size={17}/> Export</button>}{(tab==="dashboard"||tab==="pipeline")&&connected&&<button className="btn btn-outline" onClick={reload}><RotateCcw size={16}/> Refresh</button>}{tab!=="settings"&&tab!=="jobs"&&<button className="btn btn-primary" onClick={()=>openModal("lead",{source:"Website"})}><Plus size={18}/> New lead</button>}</div></div>
     {tab==="dashboard"&&<div className="content-stack">
       <div className="metric-grid">
        <div className="metric-card"><div className="metric-top"><span>New leads</span><div className="metric-icon blue"><Users size={19}/></div></div><strong>{newLeads}</strong><small>Awaiting first contact</small></div>
        <div className="metric-card"><div className="metric-top"><span>Open estimates</span><div className="metric-icon orange"><ClipboardList size={19}/></div></div><strong>{estimates}</strong><small>Ready for follow-up</small></div>
        <div className="metric-card"><div className="metric-top"><span>Booked jobs</span><div className="metric-icon green"><Truck size={19}/></div></div><strong>{booked}</strong><small>Scheduled or pending date</small></div>
        <div className="metric-card"><div className="metric-top"><span>Completed job value</span><div className="metric-icon green"><DollarSign size={19}/></div></div><strong>{money(revenue)}</strong><small>Recorded completed jobs, all time</small></div>
       </div>
       <div className="dash-grid">
        <section className="panel"><div className="panel-top"><div><h2>Needs your attention</h2><p>Follow-ups waiting on you</p></div><button className="text-action" onClick={()=>changeTab("tasks")}>View all <ArrowRight size={16}/></button></div><div>{openTasks.length?openTasks.slice(0,4).map(taskRow):<Empty icon={CircleCheck} title="You're all caught up" subtitle="Add a follow-up and it will appear here."/>}</div><div className="panel-foot"><button className="subtle-action" onClick={()=>openModal("task",{due_at:new Date().toISOString().slice(0,16)})}><Plus size={16}/> Add follow-up</button></div></section>
        <section className="panel"><div className="panel-top"><div><h2>Upcoming jobs</h2><p>Booked work on your schedule</p></div><button className="text-action" onClick={()=>changeTab("calendar")}>Calendar <ArrowRight size={16}/></button></div><div>{upcomingJobs.length?upcomingJobs.slice(0,4).map(j=><div key={j.id} className="schedule-row"><div className="schedule-date"><b>{new Date(j.scheduled_at).toLocaleDateString("en-US",{day:"2-digit"})}</b><span>{new Date(j.scheduled_at).toLocaleDateString("en-US",{month:"short"})}</span></div><div><b>{j.service}</b><span>{person(j.contact_id)?.name||"Customer"}</span></div><span className="schedule-time">{new Date(j.scheduled_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span></div>):<Empty icon={CalendarDays} title="No jobs scheduled" subtitle="Book a job to see it here."/>}</div><div className="panel-foot"><button className="subtle-action" onClick={newJobForm} disabled={!contacts.length}><Plus size={16}/> Schedule a job</button></div></section>
       </div>
       <section className="panel"><div className="panel-top"><div><h2>Recent opportunities</h2><p>Your latest incoming jobs and estimates</p></div><button className="text-action" onClick={()=>changeTab("pipeline")}>Open pipeline <ArrowRight size={16}/></button></div><div className="jobs-list">{jobs.length?jobs.slice(0,5).map(jobRow):<Empty title="No leads yet" subtitle="Add your first lead to get started."/>}</div></section>
      </div>}
     {tab==="pipeline"&&<div className="content-stack"><div className="section-utility"><div className="utility-note"><CircleDot size={16}/> Update lead stages as conversations move forward</div><button onClick={()=>openModal("lead",{source:"Phone"})} className="btn btn-outline"><Plus size={16}/> Add opportunity</button></div><div className="pipeline-board">{STAGES.filter(s=>s.id!=="lost").map(s=><div key={s.id} className="pipe-column"><div className="pipe-heading"><span className={"pipe-mark "+s.color}/><b>{s.label}</b><span>{jobs.filter(j=>j.stage===s.id).length}</span></div><div className="pipe-items">{jobs.filter(j=>j.stage===s.id).map(j=><div key={j.id} className="pipe-card"><div className="pipe-card-overline">{j.source||"Lead"}</div><div className="pipe-received" title={leadReceived(j.created_at)}><Clock size={12}/>{leadReceived(j.created_at)} <span>· {leadAge(j.created_at,now)}</span></div><button className="pipe-person" onClick={()=>openModal("job",{...j,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""})}>{person(j.contact_id)?.name||"Customer"} <ArrowUpRight size={15}/></button><span>{j.service}</span>{j.lead_details?.zip&&<span className="pipe-quote-meta">ZIP {j.lead_details.zip}{j.lead_details.timeline?" · "+j.lead_details.timeline:""}</span>}<button className="pipe-followup-action" title="Add this lead to follow-ups" onClick={()=>openFollowUpFromLead(j)}><ListTodo size={13}/> Add follow-up</button><div className="pipe-card-bottom"><b>{j.estimate_amount==null?"No quote":money(j.estimate_amount)}</b><select aria-label={"Change stage for "+j.service} value={j.stage} onChange={e=>setJobStage(j,e.target.value)}>{STAGES.map(st=><option key={st.id} value={st.id}>{st.label}</option>)}</select></div></div>)}{!jobs.some(j=>j.stage===s.id)&&<div className="pipe-empty">No opportunities</div>}</div></div>)}</div>{jobs.some(j=>j.stage==="lost")&&<div className="closed-note">Lost opportunities: {jobs.filter(j=>j.stage==="lost").length}. View and edit them in Jobs & estimates.</div>}</div>}
     {tab==="jobs"&&<div className="content-stack">
      <section className="panel list-panel">
       <div className="records-tabs" role="tablist" aria-label="Jobs and estimates">
        <button role="tab" aria-selected={recordView==="jobs"} className={recordView==="jobs"?"active":""} onClick={()=>{setRecordView("jobs");setRecordFilter("all");setQuery("");}}><Truck size={17}/> Jobs <span>{workRecords.length}</span></button>
        <button role="tab" aria-selected={recordView==="estimates"} className={recordView==="estimates"?"active":""} onClick={()=>{setRecordView("estimates");setRecordFilter("all");setQuery("");}}><ClipboardList size={17}/> Estimates <span>{estimateRecords.length}</span></button>
       </div>
       <div className="panel-top records-heading"><div><h2>{recordView==="jobs"?"Your jobs":"Your estimates"}</h2><p>{recordView==="jobs"?"Booked and completed junk removal work.":"Prepared quotes and estimates awaiting a decision."}</p></div>
        <button onClick={recordView==="jobs"?newJobForm:newEstimateForm} disabled={!contacts.length} className="btn btn-primary"><Plus size={16}/> {recordView==="jobs"?"New job":"New estimate"}</button>
       </div>
       <div className="record-highlights">
        {recordView==="jobs"?<>
          <div><span><Truck size={15}/> Booked jobs</span><strong>{workRecords.filter(j=>j.stage==="booked").length}</strong></div>
          <div><span><CircleCheck size={15}/> Completed jobs</span><strong>{workRecords.filter(j=>j.stage==="completed").length}</strong></div>
          <div><span><DollarSign size={15}/> Completed value</span><strong>{money(workRecords.filter(j=>j.stage==="completed").reduce((sum,j)=>sum+Number(j.final_amount??j.estimate_amount??0),0))}</strong></div>
         </>:<>
          <div><span><ClipboardList size={15}/> Open estimates</span><strong>{estimateRecords.length}</strong></div>
          <div><span><Clock size={15}/> Awaiting reply</span><strong>{estimateRecords.filter(j=>j.stage==="estimate_sent").length}</strong></div>
          <div><span><DollarSign size={15}/> Estimated value</span><strong>{money(estimateRecords.reduce((sum,j)=>sum+Number(j.estimate_amount??0),0))}</strong></div>
         </>}
       </div>
       <div className="table-tools records-tools"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={recordView==="jobs"?"Search jobs or customers…":"Search estimates or customers…"}/></div><div className="select-wrap"><Filter size={15}/><select aria-label={recordView==="jobs"?"Filter jobs":"Filter estimates"} value={recordFilter} onChange={e=>setRecordFilter(e.target.value)}>{recordView==="jobs"?<><option value="all">All jobs</option><option value="scheduled">Booked jobs</option><option value="completed">Completed jobs</option></>:<><option value="all">All estimates</option><option value="sent">Awaiting reply</option><option value="draft">Draft quotes</option></>}</select></div></div>
       <div className="jobs-list">{visibleRecords.length?visibleRecords.map(workRecordRow):<Empty icon={recordView==="jobs"?Truck:ClipboardList} title={query?"No matching records":recordView==="jobs"?"No jobs yet":"No estimates yet"} subtitle={query?"Try another search or filter.":recordView==="jobs"?"Booked jobs will appear here. New inquiries stay in the pipeline.":"Add an estimate to keep track of quotes in one place."}/>}</div>
       {!contacts.length&&<div className="records-hint"><Users size={16}/> Add a customer first, then create an estimate or book a job. <button onClick={()=>changeTab("customers")}>Add customer <ArrowRight size={14}/></button></div>}
      </section>
      <p className="record-footer-note"><CircleDot size={16}/> Lead stages stay in the Lead pipeline. This page focuses on estimates and confirmed work.</p>
     </div>}
     {tab==="customers"&&<section className="panel list-panel"><div className="panel-top"><div><h2>Completed customers</h2><p>{completedCustomers.length} customers with completed jobs</p></div><span className="customer-qualifier"><CircleCheck size={16}/> Completed jobs only</span></div>
       <div className="table-tools"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a completed customer by name, number or address…"/></div></div>
       <div className="contact-grid">{filtered(completedCustomers,"contacts").map(c=><div className="contact-card" key={c.id}><div className="contact-top"><div className="avatar">{initials(c.name)}</div><button aria-label="Edit customer" className="icon-btn light" onClick={()=>openModal("contact",{...c})}><Pencil size={16}/></button></div><h3>{c.name}</h3>
         <div className="contact-meta">{c.phone&&<a href={"tel:"+c.phone}><Phone size={15}/>{c.phone}</a>}{c.email&&<a href={"mailto:"+c.email}><Mail size={15}/>{c.email}</a>}{c.address&&<span><MapPin size={15}/>{c.address}</span>}</div>
         <div className="contact-footer"><span>{jobs.filter(j=>j.contact_id===c.id&&j.stage==="completed").length} completed jobs</span><button onClick={()=>openModal("job",{contact_id:c.id,service:"Junk removal",stage:"booked",source:"Phone"})}>New job <Plus size={15}/></button></div>
       </div>)}{!filtered(completedCustomers,"contacts").length&&<div className="grid-empty"><Empty icon={Users} title={query?"No matching customers":"No completed customers yet"} subtitle={query?"Try another search.":"Once a lead reaches Completed in the pipeline, their profile will appear here. Leads stay in the pipeline."}/></div>}</div>
      </section>}
     {tab==="tasks"&&<section className="panel list-panel">
       <div className="panel-top"><div><h2>Follow-up center</h2><p>{openTasks.length} open reminders across your leads</p></div><button className="btn btn-outline" onClick={()=>openModal("task",{category:"follow_up",due_at:localDateTimeInput(Date.now()+DAY)})}><Plus size={16}/> New follow-up</button></div>
       <div className="followup-tools"><div className="select-wrap"><Filter size={15}/><select aria-label="Filter follow-ups by category" value={taskCategoryFilter} onChange={e=>setTaskCategoryFilter(e.target.value)}><option value="all">All follow-up categories</option>{FOLLOW_UP_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div><div className="followup-count">{filteredOpenTasks.length} pending</div></div>
       <div className="task-section-label">TO DO</div>{filteredOpenTasks.length?filteredOpenTasks.map(taskRow):<Empty icon={CircleCheck} title="Nothing pending in this category" subtitle="Choose another category or create a follow-up from a lead."/>}
       <div className="task-section-label">COMPLETED FOLLOW-UPS</div>{filteredDoneTasks.length?filteredDoneTasks.map(taskRow):<div className="muted-row">Completed follow-ups will appear here.</div>}
      </section>}
     {tab==="calendar"&&<div className="content-stack">
 <section className="panel calendar-panel">
  <div className="panel-top"><div><h2>{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2><p>Select any day to see every scheduled pickup and its address.</p></div><div className="calendar-actions"><button className="icon-btn outline" aria-label="Previous month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={19}/></button><button className="btn btn-outline" onClick={()=>setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1))}>Today</button><button className="icon-btn outline" aria-label="Next month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={19}/></button></div></div>
  <div className="calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="weekday">{d}</div>)}{Array.from({length:Math.ceil((new Date(month.getFullYear(),month.getMonth(),1).getDay()+new Date(month.getFullYear(),month.getMonth()+1,0).getDate())/7)*7},(_,i)=>{
   const day=i-new Date(month.getFullYear(),month.getMonth(),1).getDay()+1;
   const cur=new Date(month.getFullYear(),month.getMonth(),day);
   const isCurrent=cur.getMonth()===month.getMonth();
   const isToday=cur.toDateString()===new Date().toDateString();
   const dayJobs=jobs.filter(j=>j.scheduled_at&&new Date(j.scheduled_at).toDateString()===cur.toDateString()&&j.stage!=="lost");
   return <button type="button" key={i} aria-label={dayLabel(cur)+"; "+dayJobs.length+" scheduled pickups"} className={"cal-day cal-selectable "+(!isCurrent?"outside":"")+(isToday?" is-today":"")} onClick={()=>setSelectedDay(cur)}>
    <span className="date-num">{cur.getDate()}</span>
    {dayJobs.slice(0,3).map(j=><span key={j.id} className="cal-event">{new Date(j.scheduled_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})} · {person(j.contact_id)?.name||j.service}</span>)}
    {dayJobs.length>3&&<small>+{dayJobs.length-3} more</small>}
   </button>;
  })}</div>
 </section>
 <div className="calendar-notice"><CalendarCheck2 size={20}/><div><b>Google Calendar is not connected yet</b><p>Scheduled jobs appear inside this CRM. Two-way Google Calendar syncing will require the client's Google authorization.</p></div><a href="https://calendar.google.com/" target="_blank" rel="noreferrer">Open Google Calendar <ExternalLink size={15}/></a></div>
 </div>}
     {tab==="settings"&&<div className="settings-grid">
      <section className="panel settings-panel"><div className="panel-top"><div><h2>Business workspace</h2><p>Personalized for your crew</p></div></div><div className="setting-business"><img src={LOGO} alt="Jamrock logo"/><div><b>Jamrock Junk Removal, LLC</b><span>Gainesville, Florida</span><span>Custom workspace by Ignite Co.</span></div></div><div className="setting-detail"><span>Workspace</span><b>{workspace?.workspaces?.name||"Jamrock Command Center"}</b></div><div className="setting-detail"><span>Data storage</span><b>{connected?"Private Supabase database":"Browser-only preview"}</b></div>{connected&&<button className="btn btn-outline" onClick={async()=>{await db.auth.signOut();}}><LogOut size={16}/> Sign out</button>}</section>
      <section className="panel settings-panel"><div className="panel-top"><div><h2>Integrations</h2><p>Bring the platforms you already use together</p></div></div><div className="integration-row"><div className="integration-icon"><CalendarDays size={21}/></div><div><b>Google Calendar</b><span>Two-way sync not connected</span></div><a href="https://calendar.google.com/" target="_blank" rel="noreferrer">Open <ExternalLink size={15}/></a></div><div className="integration-row"><div className="integration-icon"><Star size={21}/></div><div><b>Google Business Profile</b><span>Reviews and profile API not connected</span></div><a href="https://business.google.com/" target="_blank" rel="noreferrer">Open <ExternalLink size={15}/></a></div><div className="integration-row"><div className="integration-icon"><Link2 size={21}/></div><div><b>Jamrock website forms</b><span>Automatic lead capture not connected</span></div><span className="soon">Planned</span></div></section>
      <section className="panel settings-panel"><div className="panel-top"><div><h2>Data & privacy</h2><p>Your contacts and job history belong to Jamrock</p></div></div><div className="privacy-text"><ShieldCheck size={20}/><span>{connected?"CRM records are protected by sign-in and workspace row-level access policies.":"This preview stores changes only in this browser. Do not enter actual customer details until the secure database is configured."}</span></div><button onClick={exportJobs} className="btn btn-outline"><Download size={16}/> Export jobs as CSV</button>{!connected&&<button onClick={resetDemo} className="btn btn-quiet"><RotateCcw size={16}/> Reset preview records</button>}</section>
     </div>}
    </main>
   </div>
   {toast&&<div className="toast"><CircleCheck size={17}/>{toast}</div>}
   {selectedDay&&<div className="modal-overlay day-schedule-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedDay(null);}}>
    <div className="modal day-schedule-panel" role="dialog" aria-modal="true" aria-label={"Pickups for "+dayLabel(selectedDay)}>
      <div className="modal-top"><div><div className="eyebrow">JAMROCK JOB SCHEDULE</div><h2>{dayLabel(selectedDay)}</h2><p>{selectedDayJobs.length} scheduled {selectedDayJobs.length===1?"pickup":"pickups"} for this day, ordered by time.</p></div><button className="icon-btn light" aria-label="Close day schedule" onClick={()=>setSelectedDay(null)}><X size={20}/></button></div>
      <div className="day-schedule-list">{selectedDayJobs.length?selectedDayJobs.map(j=>{
        const c=person(j.contact_id),addr=addressForJob(j);
        return <div key={j.id} className="day-pickup">
          <div className="day-pickup-time"><Clock size={15}/><strong>{new Date(j.scheduled_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</strong></div>
          <div className="day-pickup-info"><b>{c?.name||"Customer"}</b><span>{j.service}</span><div className="day-pickup-address"><MapPin size={16}/><span>{addr||"Pickup address not added yet"}</span></div>
           <div className="day-pickup-links">{addr&&<a href={mapsUrl(addr)} target="_blank" rel="noopener noreferrer">Directions <ExternalLink size={13}/></a>}{c?.phone&&<a href={"tel:"+c.phone}>Call customer <Phone size={13}/></a>}<button onClick={()=>{setSelectedDay(null);editJob(j)}}>Open job <ArrowRight size={14}/></button></div>
          </div>
          <Pill stage={j.stage}/>
         </div>;
       }):<Empty icon={CalendarDays} title="No pickups scheduled" subtitle="There are no bookings on this day. Add a job and set its date and time to see it here."/>}</div>
      <div className="day-schedule-foot"><button className="btn btn-outline" onClick={()=>setSelectedDay(null)}>Close schedule</button><button className="btn btn-primary" disabled={!contacts.length} onClick={()=>{const when=new Date(selectedDay);when.setHours(9,0,0,0);setSelectedDay(null);openModal("job",{contact_id:contacts[0]?.id||"",service:"Junk removal",stage:"booked",source:"Phone",scheduled_at:localDateTimeInput(when)});}}><Plus size={16}/> Schedule pickup</button></div>
    </div>
   </div>}
   {propertyView&&<div className="modal-overlay property-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)closeProperty();}}>
    <div className="modal property-panel" role="dialog" aria-modal="true" aria-label="Property details">
     <div className="modal-top"><div><div className="eyebrow">JAMROCK PROPERTY LOOKUP</div><h2>View House</h2><p>{propertyView.address}</p></div><button className="icon-btn light" onClick={closeProperty} aria-label="Close property details"><X size={20}/></button></div>
     <div className="property-content">
      {propertyLoading&&<div className="property-loading"><RotateCcw size={22}/> Looking up public property records...</div>}
      {!propertyLoading&&propertyResult?.property&&<div className="property-data">
       <div className="property-provider"><ShieldCheck size={16}/><span>Property records provided by RentCast. These are not direct MLS records.</span></div>
       <div className="property-stats">
        <div><span>Estimated market value</span><b>{propertyResult.property.estimated_value!=null?money(propertyResult.property.estimated_value):"Not available"}</b><small>Model estimate, not appraisal</small></div>
        <div><span>Last reported sale</span><b>{propertyResult.property.last_sale_price!=null?money(propertyResult.property.last_sale_price):"Not available"}</b><small>{propertyResult.property.last_sale_date?shortDate(propertyResult.property.last_sale_date):"Sale date unavailable"}</small></div>
        <div><span>Assessed value</span><b>{propertyResult.property.assessed_value!=null?money(propertyResult.property.assessed_value):"Not available"}</b><small>Tax assessment, not market price</small></div>
       </div>
       <div className="property-features">{[["Type",propertyResult.property.property_type],["Year built",propertyResult.property.year_built],["Bedrooms",propertyResult.property.bedrooms],["Bathrooms",propertyResult.property.bathrooms],["Area (sq ft)",propertyResult.property.square_feet]].filter(([_,v])=>v!=null).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
       {propertyResult.property.estimate_low!=null&&propertyResult.property.estimate_high!=null&&<p className="property-estimate-range">Estimated value range: {money(propertyResult.property.estimate_low)} to {money(propertyResult.property.estimate_high)}</p>}
       <p className="property-disclaimer">Records can be incomplete or delayed. Verify the property address and sale history before relying on this information. {propertyResult.as_of&&"Lookup: "+shortDate(propertyResult.as_of)+"."}</p>
      </div>}
      {!propertyLoading&&!propertyResult?.property&&<div className="property-unavailable"><div className="property-unavailable-icon"><House size={23}/></div><h3>{propertyResult?.setup_required?"Property data connection pending":propertyResult?.not_found?"No matching property found":"Property details unavailable"}</h3><p>{propertyResult?.message||propertyError||"You can still open public property records or a home listing search for this address."}</p></div>}
      <div className="property-external"><a href={propertySearchUrl(propertyView.address)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Search this house on Zillow</a><a href="https://www.acpafl.org/" target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Alachua County property records</a><a href={mapsUrl(propertyView.address)} target="_blank" rel="noopener noreferrer"><MapPin size={15}/> Google Maps</a></div>
     </div>
    </div>
   </div>}
   {modal&&<div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setModal(null);}}><div role="dialog" aria-modal="true" aria-label={modal==="lead"?"New lead":"Edit record"} className="modal"><div className="modal-top"><div><div className="eyebrow">JAMROCK COMMAND CENTER</div><h2>{modal==="lead"?"Add a new lead":modal==="contact"?(form.id?"Edit customer":"Add customer"):modal==="job"?(form.id?"Edit job":"New job"):(form.id?"Edit follow-up":"New follow-up")}</h2><p>{modal==="lead"?"Capture the basics. You can fill in details later.":modal==="job"?"Keep job information accurate and easy to find.":modal==="task"?"A simple reminder so nothing falls through.":"Keep your customer records organized."}</p></div><button type="button" className="icon-btn light" onClick={()=>setModal(null)}><X size={20}/></button></div><form onSubmit={save} className="record-form">
    {(modal==="lead"||modal==="contact")&&<>
     <div className="form-grid"><label>Customer name *<input autoFocus required value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name"/></label><label>Phone number<input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(352) 555-0123" type="tel"/></label></div>
     <div className="form-grid"><label>Email<input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} placeholder="customer@email.com"/></label><label>Pickup address<input value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} placeholder="123 Main St, Gainesville, FL 32601"/></label></div>
     {modal==="lead"&&<div className="form-grid"><label>Service needed<input value={form.service||""} onChange={e=>setForm({...form,service:e.target.value})} placeholder="e.g. Garage cleanout"/></label><label>Lead source<select value={form.source||"Website"} onChange={e=>setForm({...form,source:e.target.value})}>{["Website","Google","Phone","Referral","Facebook","Other"].map(x=><option key={x}>{x}</option>)}</select></label></div>}
     <label>Notes<textarea rows={3} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Anything the team should know"/></label>
    </>}
    {modal==="job"&&<>
      {form.created_at&&<div className="lead-received-banner"><div><Clock size={18}/><div><b>Lead received</b><span>{leadReceived(form.created_at)}</span></div></div><strong>{leadAge(form.created_at,now)}</strong></div>}
      {form.lead_details&&Object.keys(form.lead_details).length>0&&<section className="intake-details">
       <div className="intake-heading"><div><b><ClipboardList size={17}/> Website quote request</b><span>Answers received directly from Jamrock's website</span></div><span className="intake-new">Website lead</span></div>
       <div className="intake-grid">
        {[
          ["Junk type","junk_type"],["Amount to remove","junk_amount"],
          ["Junk location","junk_location"],["Needed by","timeline"],
          ["Quote preference","budget_preference"],["ZIP code","zip"]
        ].map(([label,key])=><div key={key}><span>{label}</span><strong>{form.lead_details[key]||"Not provided"}</strong></div>)}
       </div>
       <div className="intake-source"><MapPin size={15}/><span>Source: {form.source||"Jamrock Website Quiz"}</span>{form.lead_details.page_url&&<a href={form.lead_details.page_url} target="_blank" rel="noopener noreferrer">View source page <ExternalLink size={14}/></a>}</div>
      </section>}
      {form.contact_id&&person(form.contact_id)&&<div className="intake-customer">
       <div className="avatar">{initials(person(form.contact_id).name)}</div><div><b>{person(form.contact_id).name}</b><span>{form.stage==="completed"?"Completed customer":"Lead contact"}</span></div>
       {person(form.contact_id).phone&&<a href={"tel:"+person(form.contact_id).phone} className="intake-contact-link"><Phone size={15}/> Call</a>}
       {person(form.contact_id).email&&<a href={"mailto:"+person(form.contact_id).email} className="intake-contact-link"><Mail size={15}/> Email</a>}
      </div>}
      <div className="form-grid"><label>Customer *<select required value={form.contact_id||""} onChange={e=>setForm({...form,contact_id:e.target.value})}><option value="">Choose a customer</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Service *<input required value={form.service||""} onChange={e=>setForm({...form,service:e.target.value})} placeholder="e.g. Furniture removal"/></label></div>
      <div className="form-grid"><label>Stage<select value={form.stage||"new"} onChange={e=>setForm({...form,stage:e.target.value})}>{STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>Lead source<select value={form.source||"Phone"} onChange={e=>setForm({...form,source:e.target.value})}>{["Website","Google","Phone","Referral","Facebook","Other"].map(x=><option key={x}>{x}</option>)}</select></label></div>
      <div className="form-grid"><label>Estimate ($)<input min="0" step="0.01" type="number" value={form.estimate_amount??""} onChange={e=>setForm({...form,estimate_amount:e.target.value})} placeholder="0"/></label><label>Final job value ($)<input min="0" step="0.01" type="number" value={form.final_amount??""} onChange={e=>setForm({...form,final_amount:e.target.value})} placeholder="0"/></label></div>
      <div className="pickup-address-block">
       <label><span className="field-label-icon"><MapPin size={15}/> Pickup street address</span><input value={form.pickup_address??addressForJob(form)} onChange={e=>setForm({...form,pickup_address:e.target.value})} placeholder="123 Main St, Gainesville, FL 32601" autoComplete="street-address"/></label>
       <div className="pickup-action-links">
        {hasStreetAddress(form.pickup_address??addressForJob(form))?
         <a href={mapsUrl(form.pickup_address??addressForJob(form))} target="_blank" rel="noopener noreferrer"><MapPin size={15}/> Open in Maps <ExternalLink size={13}/></a>:
         <small>Add street, city, state and ZIP before scheduling a pickup.</small>}
        {form.id&&hasStreetAddress(addressForJob(jobs.find(j=>j.id===form.id)))&&
         (form.pickup_address===undefined||form.pickup_address===addressForJob(jobs.find(j=>j.id===form.id)))&&
         <button type="button" onClick={()=>viewHouse(jobs.find(j=>j.id===form.id))}><ExternalLink size={15}/> View House <ArrowUpRight size={13}/></button>}
       </div>
       {form.id&&form.pickup_address!==undefined&&form.pickup_address!==addressForJob(jobs.find(j=>j.id===form.id))&&<p className="pickup-save-hint">Save this address before using View House.</p>}
      </div>
      <label>Scheduled date and time<input type="datetime-local" value={form.scheduled_at||""} onChange={e=>setForm({...form,scheduled_at:e.target.value})}/></label>
      <label>Latest contact note<textarea rows={3} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Example: Called Tuesday at 2:25 PM. No answer, left voicemail."/></label>
      {form.id&&<div className="lead-followup-cta"><div><b>Need to contact this lead again?</b><span>Add a categorized follow-up with the latest note. The lead remains in the pipeline.</span></div><button type="button" className="btn btn-outline" onClick={()=>openFollowUpFromLead(form)}><ListTodo size={17}/> Add to follow-ups <ArrowRight size={15}/></button></div>}
    </>}
    {modal==="task"&&<>
      <label>Follow-up action *<input autoFocus required value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Call customer about their estimate"/></label>
      <div className="form-grid">
       <label>Follow-up category *<select value={form.category||"follow_up"} onChange={e=>setForm({...form,category:e.target.value})}>{FOLLOW_UP_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
       <label>Due date and time *<input required type="datetime-local" value={form.due_at||""} onChange={e=>setForm({...form,due_at:e.target.value})}/></label>
      </div>
      <label>Related lead or customer<select value={form.contact_id||""} onChange={e=>setForm({...form,contact_id:e.target.value||null,job_id:e.target.value===form.contact_id?form.job_id:null})}><option value="">No related lead</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Latest contact note<textarea rows={4} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="What happened on the last call? What should we remember next time?"/></label>
      {form.job_id&&<div className="task-job-related"><Link2 size={15}/> Linked to the corresponding lead in the pipeline</div>}
    </>}
    {error&&<p className="error-text">{error}</p>}
    <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving?"Saving…":"Save "+(modal==="lead"?"lead":modal==="job"?"job":modal==="task"?"follow-up":"customer")} <Check size={17}/></button></div>
   </form></div></div>}
 </div>;
}
createRoot(document.getElementById("root")).render(<App/>);

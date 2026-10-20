import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard, Users, ClipboardList, Kanban, CalendarDays, Settings,
  Plus, Search, Bell, ArrowUpRight, Phone, Mail, MapPin, Check,
  ChevronLeft, ChevronRight, ChevronDown, Menu, X, Clock, Truck, DollarSign,
  CircleCheck, Star, ExternalLink, Download, ShieldCheck, LogOut, Link2,
  CircleHelp, AlertCircle, ArrowRight, ListTodo, Pencil, Filter, RotateCcw,
  CalendarCheck2, CircleDot
} from "lucide-react";
import "./styles.css";

const LOGO = "https://assets.cdn.filesafe.space/bF1dT8IAVuvat84LkAVe/media/6ab1c9e4bdaa5e26a97f4bc3.png";
const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const connected = Boolean(URL && KEY);
const db = connected ? createClient(URL, KEY) : null;
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
const stageInfo = (stage) => STAGES.find(s=>s.id===stage) || STAGES[0];
const cssDate = (date) => date ? new Date(date).toLocaleDateString("en-CA") : "";
function csvDownload(rows,filename){
  const quote=v=>{const str=String(v??"");const guarded=/^[=+\-@\t\r]/.test(str)?"'"+str:str;return '"'+guarded.replace(/"/g,'""')+'"';};
  const csv=rows.map(row=>row.map(quote).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
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
 const[stageFilter,setStageFilter]=useState("all");
 useEffect(()=>{if(!connected)return;db.auth.getSession().then(({data})=>{setSession(data.session);setAuthLoading(false);});const{data:{subscription}}=db.auth.onAuthStateChange((_ev,s)=>setSession(s));return()=>subscription.unsubscribe();},[]);
 useEffect(()=>{if(!connected){localStorage.setItem("jamrock_demo_contacts",JSON.stringify(contacts));}},[contacts]);
 useEffect(()=>{if(!connected){localStorage.setItem("jamrock_demo_jobs",JSON.stringify(jobs));}},[jobs]);
 useEffect(()=>{if(!connected){localStorage.setItem("jamrock_demo_tasks",JSON.stringify(tasks));}},[tasks]);
 useEffect(()=>{if(connected&&session)reload();if(connected&&!session){setContacts([]);setJobs([]);setTasks([]);setWorkspace(null);setLoading(false);}},[session?.user?.id]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),3800);return()=>clearTimeout(t);},[toast]);
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
 const filtered=(items,kind)=>{
  const text=query.trim().toLowerCase();if(!text)return items;
  return items.filter(v=>(kind==="contacts"?[v.name,v.phone,v.email,v.address]:[v.service,v.notes,v.source,person(v.contact_id)?.name,person(v.contact_id)?.phone]).filter(Boolean).join(" ").toLowerCase().includes(text));
 };
 const activeJobs=jobs.filter(j=>j.stage!=="lost");
 const newLeads=jobs.filter(j=>j.stage==="new").length;
 const estimates=jobs.filter(j=>j.stage==="estimate_sent").length;
 const booked=jobs.filter(j=>j.stage==="booked").length;
 const revenue=jobs.filter(j=>j.stage==="completed").reduce((s,j)=>s+Number(j.final_amount??j.estimate_amount??0),0);
 const openTasks=tasks.filter(t=>!t.completed).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at));
 const upcomingJobs=jobs.filter(j=>j.stage==="booked"&&j.scheduled_at).sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at));
 function changeTab(id){setTab(id);setMobileNav(false);setQuery("");}
 function openModal(type,data={}){
  setError("");setForm(data);setModal(type);
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
    await upsert("jobs",{contact_id:c.id,service:form.service||"Junk removal",source:form.source||"Website",stage:"new",estimate_amount:null,final_amount:null,scheduled_at:null,notes:form.notes||"",created_at:new Date().toISOString()},setJobs);
   }
   if(modal==="contact")await upsert("contacts",{id:form.id,name:form.name.trim(),phone:form.phone||"",email:form.email||"",address:form.address||"",notes:form.notes||""},setContacts);
   if(modal==="job")await upsert("jobs",{id:form.id,contact_id:form.contact_id,service:form.service||"Junk removal",source:form.source||"Other",stage:form.stage||"new",estimate_amount:form.estimate_amount===""||form.estimate_amount==null?null:Number(form.estimate_amount),final_amount:form.final_amount===""||form.final_amount==null?null:Number(form.final_amount),scheduled_at:form.scheduled_at?new Date(form.scheduled_at).toISOString():null,notes:form.notes||"",created_at:form.created_at||new Date().toISOString()},setJobs);
   if(modal==="task")await upsert("tasks",{id:form.id,title:form.title.trim(),contact_id:form.contact_id||null,job_id:form.job_id||null,due_at:form.due_at?new Date(form.due_at).toISOString():new Date().toISOString(),completed:Boolean(form.completed),created_at:form.created_at||new Date().toISOString()},setTasks);
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
  jobs:["Jobs & estimates","Every booking, estimate and job in one organized view."],
  customers:["Customers","Your customer details and job history, in one place."],
  calendar:["Job calendar","Know what is scheduled and what's coming up."],
  tasks:["Follow-ups","Never forget to call, text or check in."],
  settings:["Workspace settings","Your business tools, integrations and information."]
 }[tab];
 function jobRow(j){
  const c=person(j.contact_id);return <div className="job-row" key={j.id}><div className="avatar">{initials(c?.name)}</div><div className="job-main"><button className="link-title" onClick={()=>openModal("job",{...j,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""})}>{c?.name||"Customer"}</button><span>{j.service} <span className="mid-dot">·</span> {j.source||"Other"}</span></div><div className="job-money">{j.estimate_amount==null?"No estimate":money(j.estimate_amount)}</div><Pill stage={j.stage}/><button className="icon-btn light" title="Edit job" onClick={()=>openModal("job",{...j,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""})}><ArrowUpRight size={17}/></button></div>;
 }
 function taskRow(t){const c=person(t.contact_id);return <div key={t.id} className={"task-row "+(t.completed?"task-done":"")}><button title={t.completed?"Mark pending":"Mark done"} aria-label={t.completed?"Mark pending":"Mark done"} onClick={()=>toggleTask(t)} className={"task-check "+(t.completed?"is-done":"")}>{t.completed?<Check size={15}/>:null}</button><div className="task-body"><b>{t.title}</b><span>{c?.name?c.name+" · ":""}Due {shortDate(t.due_at)}</span></div><button className="icon-btn light" aria-label="Edit follow-up" onClick={()=>openModal("task",{...t,due_at:t.due_at?new Date(t.due_at).toISOString().slice(0,16):""})}><Pencil size={15}/></button></div>;}
 function newJobForm(){openModal("job",{contact_id:contacts[0]?.id||"",service:"Junk removal",stage:"new",source:"Phone"});}
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
     <div className="page-heading"><div><div className="eyebrow">JAMROCK COMMAND CENTER</div><h1>{heading[0]}</h1><p>{heading[1]}</p></div><div className="heading-actions">{tab==="jobs"&&<button className="btn btn-outline" onClick={exportJobs}><Download size={17}/> Export</button>}{tab!=="settings"&&<button className="btn btn-primary" onClick={()=>openModal("lead",{source:"Website"})}><Plus size={18}/> New lead</button>}</div></div>
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
     {tab==="pipeline"&&<div className="content-stack"><div className="section-utility"><div className="utility-note"><CircleDot size={16}/> Update lead stages as conversations move forward</div><button onClick={()=>openModal("lead",{source:"Phone"})} className="btn btn-outline"><Plus size={16}/> Add opportunity</button></div><div className="pipeline-board">{STAGES.filter(s=>s.id!=="lost").map(s=><div key={s.id} className="pipe-column"><div className="pipe-heading"><span className={"pipe-mark "+s.color}/><b>{s.label}</b><span>{jobs.filter(j=>j.stage===s.id).length}</span></div><div className="pipe-items">{jobs.filter(j=>j.stage===s.id).map(j=><div key={j.id} className="pipe-card"><div className="pipe-card-overline">{j.source||"Lead"}</div><button className="pipe-person" onClick={()=>openModal("job",{...j,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""})}>{person(j.contact_id)?.name||"Customer"} <ArrowUpRight size={15}/></button><span>{j.service}</span><div className="pipe-card-bottom"><b>{j.estimate_amount==null?"No quote":money(j.estimate_amount)}</b><select aria-label={"Change stage for "+j.service} value={j.stage} onChange={e=>setJobStage(j,e.target.value)}>{STAGES.map(st=><option key={st.id} value={st.id}>{st.label}</option>)}</select></div></div>)}{!jobs.some(j=>j.stage===s.id)&&<div className="pipe-empty">No opportunities</div>}</div></div>)}</div>{jobs.some(j=>j.stage==="lost")&&<div className="closed-note">Lost opportunities: {jobs.filter(j=>j.stage==="lost").length}. View and edit them in Jobs & estimates.</div>}</div>}
     {tab==="jobs"&&<section className="panel list-panel"><div className="panel-top"><div><h2>All jobs & estimates</h2><p>{jobs.length} total records</p></div><button onClick={newJobForm} disabled={!contacts.length} className="btn btn-outline"><Plus size={16}/> New job</button></div><div className="table-tools"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customers or jobs…"/></div><div className="select-wrap"><Filter size={15}/><select value={stageFilter} onChange={e=>setStageFilter(e.target.value)}><option value="all">All stages</option>{STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div></div><div className="jobs-list">{filtered(jobs,"jobs").filter(j=>stageFilter==="all"||j.stage===stageFilter).length?filtered(jobs,"jobs").filter(j=>stageFilter==="all"||j.stage===stageFilter).map(jobRow):<Empty icon={ClipboardList} title="No matching jobs" subtitle="Try a different search or add an opportunity."/>}</div></section>}
     {tab==="customers"&&<section className="panel list-panel"><div className="panel-top"><div><h2>Customer directory</h2><p>{contacts.length} customer profiles</p></div><button onClick={()=>openModal("contact",{})} className="btn btn-outline"><Plus size={16}/> Add customer</button></div><div className="table-tools"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find by name, number or address…"/></div></div><div className="contact-grid">{filtered(contacts,"contacts").map(c=><div className="contact-card" key={c.id}><div className="contact-top"><div className="avatar">{initials(c.name)}</div><button aria-label="Edit customer" className="icon-btn light" onClick={()=>openModal("contact",{...c})}><Pencil size={16}/></button></div><h3>{c.name}</h3><div className="contact-meta">{c.phone&&<a href={"tel:"+c.phone}><Phone size={15}/>{c.phone}</a>}{c.email&&<a href={"mailto:"+c.email}><Mail size={15}/>{c.email}</a>}{c.address&&<span><MapPin size={15}/>{c.address}</span>}</div><div className="contact-footer"><span>{jobs.filter(j=>j.contact_id===c.id).length} jobs / estimates</span><button onClick={()=>openModal("job",{contact_id:c.id,service:"Junk removal",stage:"new",source:"Phone"})}>New job <Plus size={15}/></button></div></div>)}{!filtered(contacts,"contacts").length&&<div className="grid-empty"><Empty icon={Users} title="No matching customers" subtitle="Add a customer to begin tracking their jobs."/></div>}</div></section>}
     {tab==="tasks"&&<section className="panel list-panel"><div className="panel-top"><div><h2>Your follow-up list</h2><p>{openTasks.length} open reminders</p></div><button className="btn btn-outline" onClick={()=>openModal("task",{due_at:new Date().toISOString().slice(0,16)})}><Plus size={16}/> New follow-up</button></div><div className="task-section-label">TO DO</div>{openTasks.length?openTasks.map(taskRow):<Empty icon={CircleCheck} title="All caught up" subtitle="No pending follow-ups."/>}<div className="task-section-label">COMPLETED</div>{tasks.filter(t=>t.completed).length?tasks.filter(t=>t.completed).map(taskRow):<div className="muted-row">Finished tasks will appear here.</div>}</section>}
     {tab==="calendar"&&<div className="content-stack"><section className="panel calendar-panel"><div className="panel-top"><div><h2>{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2><p>Scheduled bookings from your Jamrock CRM</p></div><div className="calendar-actions"><button className="icon-btn outline" aria-label="Previous month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={19}/></button><button className="btn btn-outline" onClick={()=>setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1))}>Today</button><button className="icon-btn outline" aria-label="Next month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={19}/></button></div></div><div className="calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="weekday">{d}</div>)}{Array.from({length:Math.ceil((new Date(month.getFullYear(),month.getMonth(),1).getDay()+new Date(month.getFullYear(),month.getMonth()+1,0).getDate())/7)*7},(_,i)=>{const day=i-new Date(month.getFullYear(),month.getMonth(),1).getDay()+1;const cur=new Date(month.getFullYear(),month.getMonth(),day);const isCurrent=cur.getMonth()===month.getMonth();const isToday=cur.toDateString()===new Date().toDateString();const dayJobs=jobs.filter(j=>j.scheduled_at&&new Date(j.scheduled_at).toDateString()===cur.toDateString()&&j.stage!=="lost");return <div key={i} className={"cal-day "+(!isCurrent?"outside":"")+(isToday?" is-today":"")}><span className="date-num">{cur.getDate()}</span>{dayJobs.slice(0,3).map(j=><button key={j.id} title={j.service+" - "+(person(j.contact_id)?.name||"")} className="cal-event" onClick={()=>openModal("job",{...j,scheduled_at:j.scheduled_at?new Date(j.scheduled_at).toISOString().slice(0,16):""})}>{j.service}</button>)}{dayJobs.length>3&&<small>+{dayJobs.length-3} more</small>}</div>})}</div></section><div className="calendar-notice"><CalendarCheck2 size={20}/><div><b>Google Calendar is not connected yet</b><p>Scheduled jobs appear inside this CRM. Two-way Google Calendar syncing will require the client's Google authorization.</p></div><a href="https://calendar.google.com/" target="_blank" rel="noreferrer">Open Google Calendar <ExternalLink size={15}/></a></div></div>}
     {tab==="settings"&&<div className="settings-grid">
      <section className="panel settings-panel"><div className="panel-top"><div><h2>Business workspace</h2><p>Personalized for your crew</p></div></div><div className="setting-business"><img src={LOGO} alt="Jamrock logo"/><div><b>Jamrock Junk Removal, LLC</b><span>Gainesville, Florida</span><span>Custom workspace by Ignite Co.</span></div></div><div className="setting-detail"><span>Workspace</span><b>{workspace?.workspaces?.name||"Jamrock Command Center"}</b></div><div className="setting-detail"><span>Data storage</span><b>{connected?"Private Supabase database":"Browser-only preview"}</b></div>{connected&&<button className="btn btn-outline" onClick={async()=>{await db.auth.signOut();}}><LogOut size={16}/> Sign out</button>}</section>
      <section className="panel settings-panel"><div className="panel-top"><div><h2>Integrations</h2><p>Bring the platforms you already use together</p></div></div><div className="integration-row"><div className="integration-icon"><CalendarDays size={21}/></div><div><b>Google Calendar</b><span>Two-way sync not connected</span></div><a href="https://calendar.google.com/" target="_blank" rel="noreferrer">Open <ExternalLink size={15}/></a></div><div className="integration-row"><div className="integration-icon"><Star size={21}/></div><div><b>Google Business Profile</b><span>Reviews and profile API not connected</span></div><a href="https://business.google.com/" target="_blank" rel="noreferrer">Open <ExternalLink size={15}/></a></div><div className="integration-row"><div className="integration-icon"><Link2 size={21}/></div><div><b>Jamrock website forms</b><span>Automatic lead capture not connected</span></div><span className="soon">Planned</span></div></section>
      <section className="panel settings-panel"><div className="panel-top"><div><h2>Data & privacy</h2><p>Your contacts and job history belong to Jamrock</p></div></div><div className="privacy-text"><ShieldCheck size={20}/><span>{connected?"CRM records are protected by sign-in and workspace row-level access policies.":"This preview stores changes only in this browser. Do not enter actual customer details until the secure database is configured."}</span></div><button onClick={exportJobs} className="btn btn-outline"><Download size={16}/> Export jobs as CSV</button>{!connected&&<button onClick={resetDemo} className="btn btn-quiet"><RotateCcw size={16}/> Reset preview records</button>}</section>
     </div>}
    </main>
   </div>
   {toast&&<div className="toast"><CircleCheck size={17}/>{toast}</div>}
   {modal&&<div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setModal(null);}}><div role="dialog" aria-modal="true" aria-label={modal==="lead"?"New lead":"Edit record"} className="modal"><div className="modal-top"><div><div className="eyebrow">JAMROCK COMMAND CENTER</div><h2>{modal==="lead"?"Add a new lead":modal==="contact"?(form.id?"Edit customer":"Add customer"):modal==="job"?(form.id?"Edit job":"New job"):(form.id?"Edit follow-up":"New follow-up")}</h2><p>{modal==="lead"?"Capture the basics. You can fill in details later.":modal==="job"?"Keep job information accurate and easy to find.":modal==="task"?"A simple reminder so nothing falls through.":"Keep your customer records organized."}</p></div><button type="button" className="icon-btn light" onClick={()=>setModal(null)}><X size={20}/></button></div><form onSubmit={save} className="record-form">
    {(modal==="lead"||modal==="contact")&&<>
     <div className="form-grid"><label>Customer name *<input autoFocus required value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name"/></label><label>Phone number<input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(352) 555-0123" type="tel"/></label></div>
     <div className="form-grid"><label>Email<input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} placeholder="customer@email.com"/></label><label>Address<input value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Street, city"/></label></div>
     {modal==="lead"&&<div className="form-grid"><label>Service needed<input value={form.service||""} onChange={e=>setForm({...form,service:e.target.value})} placeholder="e.g. Garage cleanout"/></label><label>Lead source<select value={form.source||"Website"} onChange={e=>setForm({...form,source:e.target.value})}>{["Website","Google","Phone","Referral","Facebook","Other"].map(x=><option key={x}>{x}</option>)}</select></label></div>}
     <label>Notes<textarea rows={3} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Anything the team should know"/></label>
    </>}
    {modal==="job"&&<>
      <div className="form-grid"><label>Customer *<select required value={form.contact_id||""} onChange={e=>setForm({...form,contact_id:e.target.value})}><option value="">Choose a customer</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Service *<input required value={form.service||""} onChange={e=>setForm({...form,service:e.target.value})} placeholder="e.g. Furniture removal"/></label></div>
      <div className="form-grid"><label>Stage<select value={form.stage||"new"} onChange={e=>setForm({...form,stage:e.target.value})}>{STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>Lead source<select value={form.source||"Phone"} onChange={e=>setForm({...form,source:e.target.value})}>{["Website","Google","Phone","Referral","Facebook","Other"].map(x=><option key={x}>{x}</option>)}</select></label></div>
      <div className="form-grid"><label>Estimate ($)<input min="0" step="0.01" type="number" value={form.estimate_amount??""} onChange={e=>setForm({...form,estimate_amount:e.target.value})} placeholder="0"/></label><label>Final job value ($)<input min="0" step="0.01" type="number" value={form.final_amount??""} onChange={e=>setForm({...form,final_amount:e.target.value})} placeholder="0"/></label></div>
      <label>Scheduled date and time<input type="datetime-local" value={form.scheduled_at||""} onChange={e=>setForm({...form,scheduled_at:e.target.value})}/></label>
      <label>Job notes<textarea rows={3} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Crew, access, materials, reminders"/></label>
    </>}
    {modal==="task"&&<>
      <label>What needs to happen? *<input autoFocus required value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Call customer about estimate"/></label>
      <div className="form-grid"><label>Due date and time<input type="datetime-local" value={form.due_at||""} onChange={e=>setForm({...form,due_at:e.target.value})}/></label><label>Related customer<select value={form.contact_id||""} onChange={e=>setForm({...form,contact_id:e.target.value||null})}><option value="">No customer</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
    </>}
    {error&&<p className="error-text">{error}</p>}
    <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving?"Saving…":"Save "+(modal==="lead"?"lead":modal==="job"?"job":modal==="task"?"follow-up":"customer")} <Check size={17}/></button></div>
   </form></div></div>}
 </div>;
}
createRoot(document.getElementById("root")).render(<App/>);

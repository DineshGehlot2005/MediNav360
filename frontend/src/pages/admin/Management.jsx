import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

const CONFIG = {
  patients: { title: "Patients", icon: "users", load: api.adminPatients, columns: ["name", "email", "phone", "gender", "active"] },
  doctors: { title: "Doctors", icon: "user", load: api.adminDoctors, columns: ["name", "department", "specialization", "room", "available"] },
  appointments: { title: "Appointments", icon: "calendar", load: api.adminAppointments, columns: ["patient", "doctor", "department", "date", "time", "status", "token"] },
};

const labels = { name:"Name", email:"Email", phone:"Phone", gender:"Gender", active:"Status", department:"Department", specialization:"Specialization", room:"Room", available:"Availability", patient:"Patient", doctor:"Doctor", date:"Date", time:"Time", status:"Status", token:"Token" };

export default function AdminManagement({ type }) {
  const cfg = CONFIG[type];
  const [rows, setRows] = useState([]); const [q, setQ] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  async function load() { setLoading(true); setError(""); try { const r = await cfg.load(q); setRows(r[type]); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [type]);
  return <div className="admin-list-page">
    <div className="admin-list-header"><div><div className="admin-breadcrumb">Admin / {cfg.title}</div><h1><Icon name={cfg.icon} size={23}/>{cfg.title}</h1><p>Manage hospital {cfg.title.toLowerCase()} from the live database.</p></div><button className="btn btn-blue" onClick={load}><Icon name="refresh" size={16}/> Refresh</button></div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="search" size={17}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder={`Search ${cfg.title.toLowerCase()}...`}/></div><span>{rows.length} record{rows.length!==1?'s':''}</span></div>
    <section className="admin-data-panel">{loading ? <div className="empty-state">Loading...</div> : error ? <div className="admin-error">{error}</div> : rows.length===0 ? <div className="empty-state">No records found.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{cfg.columns.map(c=><th key={c}>{labels[c]}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}>{cfg.columns.map(c=><td key={c}>{c==='status'?<span className={`status-pill status-${String(row[c]).toLowerCase()}`}><i className="status-dot"/>{row[c]}</span>:c==='active'||c==='available'?<span className={row[c]?'admin-active':'admin-inactive'}>{row[c]?'Active':'Inactive'}</span>:row[c] ?? '—'}</td>)}</tr>)}</tbody></table></div>}</section>
  </div>;
}

export function AdminDepartments() {
  const [rows,setRows]=useState([]); const [form,setForm]=useState({name:"",code:"",floor:1,room:"",description:""}); const [editing,setEditing]=useState(null); const [error,setError]=useState("");
  async function load(){try{const r=await api.adminDepartments();setRows(r.departments)}catch(e){setError(e.message)}} useEffect(()=>{load()},[]);
  async function save(e){e.preventDefault();setError("");try{if(editing) await api.adminUpdateDepartment(editing,form); else await api.adminCreateDepartment(form);setForm({name:"",code:"",floor:1,room:"",description:""});setEditing(null);load()}catch(e){setError(e.message)}}
  return <div className="admin-list-page"><div className="admin-list-header"><div><div className="admin-breadcrumb">Admin / Departments</div><h1><Icon name="grid" size={23}/>Departments</h1><p>Add, update or deactivate hospital departments.</p></div></div><div className="admin-dept-layout"><form className="admin-form-panel" onSubmit={save}><h2>{editing?'Edit Department':'Add Department'}</h2>{["name","code","room","description"].map(k=><label key={k}>{labels[k]||k}<input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required={k==='name'||k==='code'}/></label>)}<label>Floor<input type="number" min="1" value={form.floor} onChange={e=>setForm({...form,floor:Number(e.target.value)})}/></label>{error&&<div className="admin-error">{error}</div>}<div className="admin-form-actions"><button className="btn btn-blue">{editing?'Save Changes':'Add Department'}</button>{editing&&<button type="button" className="btn btn-white" onClick={()=>{setEditing(null);setForm({name:"",code:"",floor:1,room:"",description:""})}}>Cancel</button>}</div></form><section className="admin-data-panel"><div className="admin-panel-header"><div className="admin-panel-title"><Icon name="grid" size={18}/><h2>Configured Departments</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Code</th><th>Floor</th><th>Room</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(d=><tr key={d.id}><td>{d.name}</td><td>{d.code}</td><td>{d.floor}</td><td>{d.room||'—'}</td><td><span className={d.is_active?'admin-active':'admin-inactive'}>{d.is_active?'Active':'Inactive'}</span></td><td><button className="table-action" onClick={()=>{setEditing(d.id);setForm({name:d.name,code:d.code,floor:d.floor,room:d.room||'',description:d.description||''})}}>Edit</button>{d.is_active&&<button className="table-action danger" onClick={async()=>{await api.adminDeleteDepartment(d.id);load()}}>Deactivate</button>}</td></tr>)}</tbody></table></div></section></div></div>
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  async function load() { setLoading(true); setError(""); try { const r=await api.myAppointments(); setAppointments(r.appointments||[]); } catch(e){setError(e.message)} finally{setLoading(false)} }
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>filter==="ALL"?appointments:appointments.filter(a=>a.status===filter),[appointments,filter]);
  const counts={ALL:appointments.length,PENDING:appointments.filter(a=>a.status==="PENDING").length,APPROVED:appointments.filter(a=>a.status==="APPROVED").length,COMPLETED:appointments.filter(a=>a.status==="COMPLETED").length};
  return <div className="app-feature-page inner-page"><div className="feature-page-header"><div><span className="feature-eyebrow">Appointments</span><h1>My Appointments</h1><p>Track your appointment requests, approvals and tokens in one place.</p></div><button className="feature-secondary header-action" onClick={load} disabled={loading}><Icon name="refresh" size={16}/>{loading?"Refreshing...":"Refresh"}</button></div>
    <div className="feature-stats-row"><div className="feature-stat"><span>Total</span><strong>{counts.ALL}</strong></div><div className="feature-stat"><span>Pending</span><strong>{counts.PENDING}</strong></div><div className="feature-stat"><span>Approved</span><strong>{counts.APPROVED}</strong></div><div className="feature-stat"><span>Completed</span><strong>{counts.COMPLETED}</strong></div></div>
    <div className="feature-filter-row">{Object.entries({ALL:"All",PENDING:"Pending",APPROVED:"Approved",COMPLETED:"Completed"}).map(([v,l])=><button key={v} className={filter===v?"active":""} onClick={()=>setFilter(v)}>{l}<b>{counts[v]}</b></button>)}</div>
    {error&&<div className="feature-error"><Icon name="info" size={16}/>{error}<button onClick={load}>Try again</button></div>}
    <section className="feature-card appointment-list-card">{loading?<div className="feature-empty loading-state"><span className="loading-spinner"/>Loading appointments...</div>:filtered.length===0?<div className="feature-empty"><Icon name="calendar" size={30}/><strong>No appointments found</strong><span>{filter==="ALL"?"Book an appointment to see it here.":`There are no ${filter.toLowerCase()} appointments.`}</span></div>:filtered.map(a=><AppointmentCard key={a.id} a={a}/>)}</section>
  </div>;
}
function AppointmentCard({a}){return <article className="patient-appointment-card"><div className="appointment-date"><strong>{a.date?.slice?.(8)||"—"}</strong><span>{a.date?new Date(`${a.date}T00:00:00`).toLocaleDateString(undefined,{month:"short"}):"Date"}</span></div><div className="appointment-main"><div className="appointment-title-row"><div><h3>{a.department || "Hospital Department"}</h3><p>{a.doctor || "Doctor not assigned"}</p></div><span className={`status-pill status-${String(a.status||"").toLowerCase()}`}><i className="status-dot"/>{a.status}</span></div><div className="appointment-meta"><span><Icon name="clock" size={14}/>{a.time||"—"}</span><span><Icon name="info" size={14}/>{a.reason||"No reason provided"}</span></div>{a.status==="APPROVED"&&a.token&&<div className="token-highlight"><strong>Token {a.token}</strong><span>{a.token_status||"Waiting"}</span></div>}</div></article>}

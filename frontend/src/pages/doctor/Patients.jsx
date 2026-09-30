import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

export default function DoctorPatients() {
  const [appointments, setAppointments] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const r = await api.doctorAppointments(); setAppointments(r.appointments || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const patients = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      const key = a.patient_id ?? a.patient;
      if (!map.has(key)) map.set(key, { id: key, name: a.patient || "Patient", last: a.date, department: a.department, visits: 0, status: a.status });
      const p = map.get(key); p.visits += 1; if (String(a.date) > String(p.last)) { p.last = a.date; p.status = a.status; }
    });
    return [...map.values()].filter(p => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()));
  }, [appointments, q]);

  return <div className="admin-list-page inner-page">
    <div className="admin-list-header"><div><div className="admin-breadcrumb">Doctor / My Patients</div><h1><Icon name="users" size={23}/>My Patients</h1><p>Patients with appointments assigned to your doctor account.</p></div><button className="btn btn-blue" onClick={load} disabled={loading}><Icon name="refresh" size={16}/>{loading ? "Refreshing..." : "Refresh"}</button></div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="search" size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patients..."/></div><span>{patients.length} patient{patients.length !== 1 ? "s" : ""}</span></div>
    {error && <div className="admin-error">{error}</div>}
    <section className="admin-data-panel">{loading ? <div className="empty-state loading-state"><span className="loading-spinner"/>Loading patients...</div> : patients.length === 0 ? <div className="empty-state"><Icon name="users" size={30}/><strong>No patients found</strong><span>Assigned patient appointments will appear here.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Patient</th><th>Department</th><th>Visits</th><th>Last appointment</th><th>Status</th></tr></thead><tbody>{patients.map(p=><tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.department || "—"}</td><td>{p.visits}</td><td>{p.last || "—"}</td><td><span className={`status-pill status-${String(p.status || "").toLowerCase()}`}><i className="status-dot"/>{p.status || "—"}</span></td></tr>)}</tbody></table></div>}</section>
  </div>;
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

const STATUS = { PENDING: "Waiting", APPROVED: "Confirmed", COMPLETED: "Completed", REJECTED: "Rejected" };

function StatusPill({ status }) { return <span className={`request-status ${String(status || "").toLowerCase()}`}><i />{STATUS[status] || status || "Scheduled"}</span>; }

export default function DoctorRequests() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  async function refresh() {
    setLoading(true); setError("");
    try {
      const r = await api.doctorAppointments();
      setAppointments(r.appointments || []);
    } catch (e) { setError(e.message || "Unable to load appointments"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function act(id, action) {
    setBusy(id); setError("");
    try { if (action === "approve") await api.approve(id); else if (action === "reject") await api.reject(id); else await api.complete(id); setSelected(null); await refresh(); }
    catch (e) { setError(e.message || "Unable to update appointment"); }
    finally { setBusy(null); }
  }

  const filtered = useMemo(() => appointments.filter((a) => {
    const matchesStatus = filter === "ALL" || a.status === filter;
    const text = `${a.patient || ""} ${a.reason || ""} ${a.date || ""}`.toLowerCase();
    return matchesStatus && text.includes(search.toLowerCase());
  }), [appointments, filter, search]);

  const counts = { PENDING: appointments.filter((a) => a.status === "PENDING").length, APPROVED: appointments.filter((a) => a.status === "APPROVED").length, COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length };

  return <div className="doctor-list-page">
    <div className="doctor-page-header"><div><span className="doctor-breadcrumb">Doctor / Appointments</span><h1><Icon name="calendar" size={24} />My Appointments</h1><p>Review only the appointments assigned to you and update their status.</p></div><button className="doctor-outline-btn" onClick={refresh}><Icon name="refresh" size={16} /> Refresh</button></div>
    {error && <div className="doctor-page-error">{error}</div>}

    <div className="request-summary-grid"><RequestSummary label="Pending Requests" value={counts.PENDING} tone="orange" /><RequestSummary label="Approved" value={counts.APPROVED} tone="green" /><RequestSummary label="Completed" value={counts.COMPLETED} tone="blue" /></div>

    <section className="doctor-panel request-list-panel">
      <div className="request-toolbar"><div className="doctor-search"><Icon name="search" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, reason, or date..." /></div><div className="request-filters">{[["PENDING","Pending"],["APPROVED","Approved"],["COMPLETED","Completed"],["REJECTED","Rejected"],["ALL","All"]].map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      {loading ? <div className="doctor-empty">Loading appointments...</div> : !filtered.length ? <div className="doctor-empty"><strong>No {filter === "ALL" ? "appointments" : filter.toLowerCase() + " appointments"} found.</strong><span>Appointments assigned to your doctor account will appear here.</span></div> : <div className="request-card-list">{filtered.map((a) => <article className="request-card" key={a.id}><div className="request-avatar"><span>{(a.patient || "P").split(" ").map((p) => p[0]).slice(0,2).join("").toUpperCase()}</span></div><div className="request-main"><div className="request-title-row"><div><h3>{a.patient}</h3><p>{a.reason || "General consultation"}</p></div><StatusPill status={a.status} /></div><div className="request-meta"><span><Icon name="calendar" size={14} /> {a.date || "—"}</span><span>◷ {a.time || "—"}</span><span>Department: {a.department || "—"}</span>{a.token && <span>Token: {a.token}</span>}</div></div><div className="request-actions"><button className="request-view" onClick={() => setSelected(a)}>View</button>{a.status === "PENDING" && <><button className="request-approve" disabled={busy === a.id} onClick={() => act(a.id, "approve")}>{busy === a.id ? "Saving..." : "Approve"}</button><button className="request-reject" disabled={busy === a.id} onClick={() => act(a.id, "reject")}>Reject</button></>}{a.status === "APPROVED" && <button className="request-approve" disabled={busy === a.id} onClick={() => act(a.id, "complete")}>{busy === a.id ? "Saving..." : "Complete"}</button>}</div></article>)}</div>}
    </section>

    {selected && <div className="doctor-modal-backdrop" onClick={() => setSelected(null)}><div className="doctor-modal request-modal" onClick={(e) => e.stopPropagation()}><div className="doctor-modal-header"><div><span>Appointment Details</span><h3>{selected.patient}</h3></div><button onClick={() => setSelected(null)}>×</button></div><div className="doctor-modal-grid"><div><small>Date</small><strong>{selected.date || "—"}</strong></div><div><small>Time</small><strong>{selected.time || "—"}</strong></div><div><small>Department</small><strong>{selected.department || "—"}</strong></div><div><small>Token</small><strong>{selected.token || "Not generated"}</strong></div><div className="modal-wide"><small>Reason / Symptoms</small><strong>{selected.reason || "General consultation"}</strong></div></div><div className="doctor-modal-actions">{selected.status === "PENDING" && <><button className="doctor-primary-btn" onClick={() => act(selected.id, "approve")}>Approve</button><button className="doctor-outline-btn" onClick={() => act(selected.id, "reject")}>Reject</button></>}{selected.status === "APPROVED" && <button className="doctor-primary-btn" onClick={() => act(selected.id, "complete")}>Mark Completed</button>}<button className="doctor-outline-btn" onClick={() => setSelected(null)}>Close</button></div></div></div>}
  </div>;
}

function RequestSummary({ label, value, tone }) { return <div className={`request-summary ${tone}`}><span>{label}</span><strong>{value}</strong><small>Assigned to your account</small></div>; }

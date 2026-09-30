import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

function QueueStatus({ status }) {
  const map = { WAITING: ["Waiting", "waiting"], IN_PROGRESS: ["In progress", "confirmed"], CALLED: ["Called", "confirmed"], COMPLETED: ["Completed", "completed"] };
  const [label, tone] = map[status] || [status || "Unknown", "scheduled"];
  return <span className={`queue-status ${tone}`}><i />{label}</span>;
}

export default function DoctorQueue() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true); setError("");
    try { const r = await api.queue(); setTokens(r.tokens || []); }
    catch (e) { setError(e.message || "Unable to load queue"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function callNext() {
    if (busy) return;
    setBusy(true); setError("");
    try { await api.callNext(); await refresh(); }
    catch (e) { setError(e.message || "Unable to call next patient"); }
    finally { setBusy(false); }
  }

  const current = tokens.find((t) => t.status === "IN_PROGRESS" || t.status === "CALLED");
  const waiting = useMemo(() => tokens.filter((t) => t.status === "WAITING"), [tokens]);
  const completed = tokens.filter((t) => t.status === "COMPLETED");

  return <div className="doctor-list-page">
    <div className="doctor-page-header"><div><span className="doctor-breadcrumb">Doctor / Token Management</span><h1><Icon name="calendar" size={24} />Patient Queue</h1><p>Manage today&apos;s department queue and call patients in order.</p></div><div className="doctor-page-actions"><button className="doctor-outline-btn" onClick={refresh}><Icon name="refresh" size={16} /> Refresh</button><button className="doctor-primary-btn" onClick={callNext} disabled={busy || waiting.length === 0}>{busy ? "Calling..." : "Call Next Patient"}</button></div></div>
    {error && <div className="doctor-page-error">{error}</div>}

    <div className="queue-summary-grid"><QueueSummary label="Now Serving" value={current?.token_number || "—"} note={current?.patient || "No active patient"} tone="blue" /><QueueSummary label="Waiting" value={waiting.length} note="Patients in queue" tone="orange" /><QueueSummary label="Completed" value={completed.length} note="Completed today" tone="green" /><QueueSummary label="Total Tokens" value={tokens.length} note="Today&apos;s queue" tone="purple" /></div>

    <section className="doctor-panel queue-table-panel"><div className="doctor-panel-header"><div className="doctor-title"><Icon name="user" size={18} /><h2>Today&apos;s Patient Queue</h2><em>Live</em></div><span className="queue-order-note">First-in queue order</span></div>{loading ? <div className="doctor-empty">Loading queue...</div> : !tokens.length ? <div className="doctor-empty">No tokens have been generated for today.</div> : <div className="doctor-table-wrap"><table className="doctor-table doctor-queue-table"><thead><tr><th>Token</th><th>Patient</th><th>Appointment</th><th>Status</th><th>Queue position</th></tr></thead><tbody>{tokens.map((token, index) => <tr key={`${token.token_number}-${index}`} className={token.token_number === current?.token_number ? "queue-current-row" : ""}><td><strong className="queue-token-number">{token.token_number}</strong></td><td><strong>{token.patient || "Patient"}</strong><small>Assigned appointment</small></td><td>{token.appointment_id ? `#${token.appointment_id}` : "—"}</td><td><QueueStatus status={token.status} /></td><td>{token.status === "WAITING" ? `#${waiting.findIndex((x) => x.token_number === token.token_number) + 1}` : token.status === "IN_PROGRESS" || token.status === "CALLED" ? "Serving" : "Done"}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function QueueSummary({ label, value, note, tone }) { return <div className={`queue-summary-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

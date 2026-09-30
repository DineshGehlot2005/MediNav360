import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

export default function DoctorTokens() {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() { setLoading(true); setError(""); try { setQueue(await api.queue()); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function callNext() { setBusy(true); setError(""); try { await api.callNext(); await load(); } catch(e) { setError(e.message); } finally { setBusy(false); } }
  const tokens = queue?.tokens || [];
  const current = tokens.find(t => ["CALLED", "IN_PROGRESS"].includes(t.status));
  return <div className="app-feature-page inner-page"><div className="feature-page-header"><div><span className="feature-eyebrow">Queue Control</span><h1>Token Management</h1><p>Call and monitor tokens for your assigned department.</p></div><div className="feature-round-icon"><Icon name="file" size={24}/></div></div>
    {error && <div className="feature-error"><Icon name="alert" size={16}/>{error}</div>}
    <div className="feature-stats-row"><div className="feature-stat"><span>Now Serving</span><strong>{current?.token_number || "—"}</strong></div><div className="feature-stat"><span>Waiting</span><strong>{tokens.filter(t=>t.status === "WAITING").length}</strong></div><div className="feature-stat"><span>Total Tokens</span><strong>{tokens.length}</strong></div></div>
    <section className="feature-card"><div className="feature-card-title"><Icon name="users" size={18}/><h2>Today's Tokens</h2><button className="btn btn-white compact-action" onClick={load}><Icon name="refresh" size={15}/>Refresh</button><button className="feature-primary compact-action" onClick={callNext} disabled={busy || loading}>{busy ? "Calling..." : "Call Next Patient"}</button></div>
      {loading ? <div className="feature-empty loading-state"><span className="loading-spinner"/>Loading queue...</div> : tokens.length ? <div className="token-list">{tokens.map(t=><div className="token-row" key={t.id || t.token_number}><div className="token-number">{t.token_number}</div><div><strong>{t.patient || "Patient"}</strong><span>{t.appointment_time || t.time || "Appointment"}</span></div><span className={`status-pill status-${String(t.status).toLowerCase()}`}><i className="status-dot"/>{t.status}</span></div>)}</div> : <div className="feature-empty"><Icon name="file" size={30}/><strong>No tokens yet</strong><span>Approved appointments will create queue tokens.</span></div>}
    </section>
  </div>;
}

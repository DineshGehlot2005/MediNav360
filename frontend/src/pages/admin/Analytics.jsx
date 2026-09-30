import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

function Stat({ icon, label, value, tone }) {
  return <div className="analytics-stat"><div className={`analytics-stat-icon ${tone}`}><Icon name={icon} size={20}/></div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try { const r = await api.adminAnalytics(); setData(r.analytics); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const maxDaily = useMemo(() => Math.max(1, ...(data?.daily || []).map(d => d.total)), [data]);
  const maxDept = useMemo(() => Math.max(1, ...(data?.departments || []).map(d => d.count)), [data]);

  if (loading) return <div className="admin-loading">Loading hospital analytics...</div>;
  if (error) return <div className="admin-list-page"><div className="admin-error">{error}</div><button className="btn btn-blue" onClick={load}>Try Again</button></div>;

  return <div className="admin-list-page">
    <div className="admin-list-header">
      <div><div className="admin-breadcrumb">Admin / Analytics</div><h1><Icon name="chart" size={23}/>Hospital Analytics</h1><p>Live appointment, patient and department activity from the hospital database.</p></div>
      <button className="btn btn-blue" onClick={load}><Icon name="refresh" size={16}/> Refresh</button>
    </div>

    <div className="analytics-stat-grid">
      <Stat icon="calendar" tone="blue" label="Appointments (7 days)" value={data.summary.appointments_7d}/>
      <Stat icon="check" tone="green" label="Completed (7 days)" value={data.summary.completed_7d}/>
      <Stat icon="clock" tone="orange" label="Pending now" value={data.summary.pending_now}/>
      <Stat icon="users" tone="purple" label="Active patients" value={data.summary.active_patients}/>
    </div>

    <div className="analytics-grid">
      <section className="admin-data-panel analytics-panel">
        <div className="admin-panel-header"><div className="admin-panel-title"><Icon name="chart" size={18}/><h2>Appointment Trend · Last 7 Days</h2></div></div>
        <div className="analytics-chart">
          {data.daily.map(day => <div className="analytics-day" key={day.date}>
            <div className="analytics-bars"><i title={`Completed ${day.completed}`} style={{height:`${Math.max(5, day.completed / maxDaily * 100)}%`}}/><b title={`Pending ${day.pending}`} style={{height:`${Math.max(5, day.pending / maxDaily * 100)}%`}}/></div>
            <strong>{day.total}</strong><span>{day.label}</span>
          </div>)}
        </div>
        <div className="analytics-legend"><span><i className="legend-green"/> Completed</span><span><i className="legend-orange"/> Pending</span></div>
      </section>

      <section className="admin-data-panel analytics-panel">
        <div className="admin-panel-header"><div className="admin-panel-title"><Icon name="grid" size={18}/><h2>Department Activity</h2></div></div>
        <div className="analytics-departments">
          {data.departments.length === 0 ? <div className="empty-state">No appointment data yet.</div> : data.departments.map((d, i) => <div className="analytics-dept-row" key={d.id}>
            <div><strong>{d.name}</strong><span>{d.count} appointment{d.count === 1 ? "" : "s"}</span></div>
            <div className="analytics-progress"><i style={{width:`${Math.max(8, d.count / maxDept * 100)}%`}}/></div>
            <b>{d.count}</b>
          </div>)}
        </div>
      </section>
    </div>

    <section className="admin-data-panel analytics-panel analytics-status-panel">
      <div className="admin-panel-header"><div className="admin-panel-title"><Icon name="calendar" size={18}/><h2>Appointment Status</h2></div></div>
      <div className="analytics-status-grid">
        {Object.entries(data.statuses).map(([status, count]) => <div className="analytics-status-card" key={status}><span className={`status-pill status-${status.toLowerCase()}`}><i className="status-dot"/>{status}</span><strong>{count}</strong></div>)}
      </div>
    </section>
  </div>;
}

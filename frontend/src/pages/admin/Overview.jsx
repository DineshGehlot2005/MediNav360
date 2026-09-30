import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

function AdminStat({ icon, tone, label, value, note, onClick }) {
  return (
    <button type="button" className="admin-stat-card admin-stat-card-button" onClick={onClick}>
      <div className={`admin-stat-icon ${tone}`}><Icon name={icon} size={21} /></div>
      <div className="admin-stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
      <Icon name="chevron" size={17} className="admin-stat-arrow" />
    </button>
  );
}

function PanelHeader({ icon, title, action, onAction }) {
  return (
    <div className="admin-panel-header">
      <div className="admin-panel-title"><Icon name={icon} size={18} /><h2>{title}</h2></div>
      {action && <button type="button" onClick={onAction}>{action} <Icon name="arrow" size={14} /></button>}
    </div>
  );
}

function Activity({ icon, tone, title, text }) {
  return <div className="admin-activity"><div className={`activity-icon ${tone}`}><Icon name={icon} size={16} /></div><div><strong>{title}</strong><span>{text}</span></div></div>;
}

export default function AdminOverview({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [statsResponse, analyticsResponse] = await Promise.all([api.adminStats(), api.adminAnalytics()]);
      setStats(statsResponse.statistics);
      setAnalytics(analyticsResponse.analytics);
    } catch (e) {
      setError(e.message || "Unable to load dashboard data");
    }
  }

  useEffect(() => { load(); }, []);

  const safe = stats || { total_patients: 0, total_doctors: 0, total_departments: 0, todays_appointments: 0, pending_appointments: 0, completed_appointments: 0 };
  const daily = analytics?.daily || [];
  const departments = analytics?.departments || [];
  const maxDaily = Math.max(1, ...daily.map((d) => d.total || 0));
  const totalHospital = Math.max(1, safe.total_patients + safe.total_doctors + safe.total_departments);
  const patientPct = (safe.total_patients / totalHospital) * 100;
  const doctorPct = (safe.total_doctors / totalHospital) * 100;
  const donutStyle = { "--patient-pct": `${patientPct}%`, "--doctor-end": `${patientPct + doctorPct}%` };
  const topDepartments = useMemo(() => departments.filter((d) => d.count > 0).slice(0, 6), [departments]);

  if (!stats && !error) return <div className="admin-loading">Loading hospital overview...</div>;

  return (
    <div className="admin-dashboard">
      {error && <div className="admin-error admin-dashboard-error">{error} <button type="button" onClick={load}>Retry</button></div>}

      <section className="admin-welcome">
        <div><h1>Welcome, Admin! <span>👋</span></h1><p>Here&apos;s what&apos;s happening in your hospital today.</p></div>
        <div className="admin-welcome-meta"><strong>{new Date().toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })}</strong><span>{new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}</span></div>
        <div className="admin-hospital-illustration"><span>Better Care</span><strong>Better Tomorrow</strong><i>⌁</i></div>
      </section>

      <section className="admin-stat-grid">
        <AdminStat icon="users" tone="blue" label="Total Patients" value={safe.total_patients} note="Live database count" onClick={() => onNavigate?.("patients")} />
        <AdminStat icon="user" tone="indigo" label="Total Doctors" value={safe.total_doctors} note="Active doctor records" onClick={() => onNavigate?.("doctors")} />
        <AdminStat icon="calendar" tone="green" label="Appointments Today" value={safe.todays_appointments} note="Appointments for today" onClick={() => onNavigate?.("appointments")} />
        <AdminStat icon="clock" tone="orange" label="Pending Requests" value={safe.pending_appointments} note="Awaiting approval" onClick={() => onNavigate?.("appointments")} />
        <AdminStat icon="grid" tone="purple" label="Departments" value={safe.total_departments} note="Active departments" onClick={() => onNavigate?.("departments")} />
      </section>

      <div className="admin-content-grid">
        <div className="admin-main-column">
          <section className="admin-panel admin-chart-panel">
            <PanelHeader icon="chart" title="Appointments Overview" action="Analytics" onAction={() => onNavigate?.("analytics")} />
            <div className="admin-chart-area">
              <div className="chart-y-labels"><span>{maxDaily}</span><span>{Math.ceil(maxDaily / 2)}</span><span>0</span></div>
              <div className="chart-bars">
                {(daily.length ? daily : [{label:"Mon", total:0}, {label:"Tue", total:0}, {label:"Wed", total:0}, {label:"Thu", total:0}, {label:"Fri", total:0}, {label:"Sat", total:0}, {label:"Sun", total:0}]).map((day) => {
                  const completed = day.completed || 0;
                  const pending = day.pending || 0;
                  return <div className="chart-day" key={day.date || day.label}>
                    <div className="bar-track"><i style={{ height: `${Math.max(day.total ? 7 : 2, (completed / maxDaily) * 100)}%` }} /><b style={{ height: `${Math.max(day.total ? 5 : 2, (pending / maxDaily) * 100)}%` }} /></div>
                    <span>{day.label}</span>
                  </div>;
                })}
              </div>
            </div>
            <div className="chart-legend"><span><i className="legend-green" /> Completed</span><span><i className="legend-orange" /> Pending</span><span><i className="legend-blue" /> Total appointment height</span></div>
          </section>

          <section className="admin-panel department-panel">
            <PanelHeader icon="grid" title="Hospital Departments" action="View All" onAction={() => onNavigate?.("departments")} />
            <div className="admin-department-list">
              {topDepartments.length ? topDepartments.map((d, index) => {
                const max = Math.max(1, ...departments.map((x) => x.count || 0));
                const tones = ["blue", "green", "purple", "orange", "pink", "slate"];
                return <div className="department-row" key={d.id || d.name}>
                  <div className={`department-dot ${tones[index % tones.length]}`} />
                  <div><strong>{d.name}</strong><span>{d.count} appointment{d.count === 1 ? "" : "s"} in last 7 days</span></div>
                  <div className="department-progress"><i style={{ width: `${Math.max(8, (d.count / max) * 100)}%` }} /></div>
                  <b>{d.count}</b>
                </div>;
              }) : <div className="doctor-empty compact">No department appointments recorded in the last 7 days.</div>}
            </div>
          </section>
        </div>

        <div className="admin-middle-column">
          <section className="admin-panel donut-panel">
            <PanelHeader icon="users" title="Hospital Statistics" />
            <div className="admin-donut admin-donut-real" style={donutStyle}><div><strong>{safe.total_patients}</strong><span>Patients</span></div></div>
            <div className="donut-legend"><span><i className="legend-blue" /> Patients <b>{safe.total_patients}</b></span><span><i className="legend-green" /> Doctors <b>{safe.total_doctors}</b></span><span><i className="legend-purple" /> Departments <b>{safe.total_departments}</b></span></div>
          </section>

          <section className="admin-panel activity-panel">
            <PanelHeader icon="bell" title="Recent Activities" action="Analytics" onAction={() => onNavigate?.("analytics")} />
            <Activity icon="calendar" tone="green" title="Appointments today" text={`${safe.todays_appointments} appointment${safe.todays_appointments === 1 ? "" : "s"} scheduled today`} />
            <Activity icon="check" tone="blue" title="Completed appointments" text={`${safe.completed_appointments} completed appointment${safe.completed_appointments === 1 ? "" : "s"} overall`} />
            <Activity icon="clock" tone="orange" title="Pending requests" text={`${safe.pending_appointments} request${safe.pending_appointments === 1 ? "" : "s"} awaiting doctor action`} />
            <Activity icon="grid" tone="purple" title="Departments" text={`${safe.total_departments} active department${safe.total_departments === 1 ? "" : "s"} configured`} />
          </section>
        </div>

        <aside className="admin-right-column">
          <section className="admin-panel quick-admin-panel">
            <PanelHeader icon="spark" title="Quick Actions" />
            <div className="admin-quick-grid">
              <button onClick={() => onNavigate?.("patients")}><Icon name="users" size={22} /><strong>Manage Patients</strong><span>View patient records</span></button>
              <button onClick={() => onNavigate?.("doctors")}><Icon name="user" size={22} /><strong>Manage Doctors</strong><span>View doctor records</span></button>
              <button onClick={() => onNavigate?.("departments")}><Icon name="grid" size={22} /><strong>Departments</strong><span>Add / update</span></button>
              <button onClick={() => onNavigate?.("appointments")}><Icon name="calendar" size={22} /><strong>Appointments</strong><span>View appointments</span></button>
            </div>
          </section>

          <section className="admin-panel map-admin-panel">
            <PanelHeader icon="map" title="Hospital Map" action="View Map" onAction={() => onNavigate?.("navigation")} />
            <div className="admin-map"><div className="map-road r1" /><div className="map-road r2" /><b className="map-pin p1">●</b><b className="map-pin p2">●</b><b className="map-pin p3">●</b><span className="map-label l1">Entrance</span><span className="map-label l2">Cardiology</span><span className="map-label l3">Elevator</span></div>
            <div className="map-key"><span><i className="blue-key" /> Entrance</span><span><i className="green-key" /> Reception</span><span><i className="purple-key" /> Departments</span></div>
          </section>

          <section className="admin-panel admin-health-panel">
            <div className="admin-health-icon"><Icon name="heart" size={20} /></div><div><strong>Hospital operations</strong><span>{safe.pending_appointments ? "There are requests waiting for review." : "No pending appointment requests."}</span></div>
          </section>
        </aside>
      </div>
    </div>
  );
}

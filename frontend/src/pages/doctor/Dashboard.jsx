import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

function StatusPill({ status }) {
  const map = {
    PENDING: ["Waiting", "doctor-status waiting"],
    APPROVED: ["Confirmed", "doctor-status confirmed"],
    COMPLETED: ["Completed", "doctor-status completed"],
    REJECTED: ["Rejected", "doctor-status rejected"],
    WAITING: ["Waiting", "doctor-status waiting"],
    IN_PROGRESS: ["In progress", "doctor-status confirmed"],
  };
  const [label, cls] = map[status] || [status || "Scheduled", "doctor-status scheduled"];
  return <span className={cls}><span />{label}</span>;
}

function todayKey() { return new Date().toISOString().slice(0, 10); }
function Avatar({ name }) {
  const initials = (name || "Patient").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <div className="doctor-avatar">{initials}</div>;
}

export default function DoctorDashboard({ user, onNavigate }) {
  const [appointments, setAppointments] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [doctorMeta, setDoctorMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [routeMode, setRouteMode] = useState("normal");
  const [routeResult, setRouteResult] = useState(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeError, setRouteError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [a, q] = await Promise.all([api.doctorAppointments(), api.queue()]);
      setAppointments(a.appointments || []);
      setDoctorMeta(a.doctor || null);
      setTokens(q.tokens || []);
    } catch {
      setAppointments([]);
      setTokens([]);
      setDoctorMeta(null);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const pending = appointments.filter((a) => a.status === "PENDING");
  const approved = appointments.filter((a) => a.status === "APPROVED");
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const today = appointments.filter((a) => a.date === todayKey());
  const currentToken = tokens.find((t) => t.status === "IN_PROGRESS" || t.status === "CALLED");
  const waitingTokens = tokens.filter((t) => t.status === "WAITING");
  const department = doctorMeta?.department || "Department not available";
  const uniquePatients = new Set(appointments.map((a) => a.patient).filter(Boolean)).size;
  const todayUniquePatients = new Set(today.map((a) => a.patient).filter(Boolean)).size;

  const sortedToday = useMemo(() => [...today].sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))), [today]);
  const recentPatients = useMemo(() => {
    const seen = new Set();
    return [...appointments].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).filter((a) => {
      if (!a.patient || seen.has(a.patient)) return false;
      seen.add(a.patient); return true;
    }).slice(0, 5);
  }, [appointments]);

  const weekStats = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - index));
      return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-IN", { weekday: "short" }) };
    });
    return days.map((day) => ({ ...day, total: appointments.filter((a) => a.date === day.key).length }));
  }, [appointments]);
  const maxWeek = Math.max(1, ...weekStats.map((d) => d.total));

  const departmentCounts = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => { const name = a.department || department; map.set(name, (map.get(name) || 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [appointments, department]);
  const maxDept = Math.max(1, ...departmentCounts.map((d) => d.count));
  const ring = departmentCounts.reduce((parts, item, index) => {
    const start = index === 0 ? 0 : parts[index - 1].end;
    const end = start + (item.count / Math.max(1, appointments.length)) * 100;
    parts.push({ name: item.name, count: item.count, start, end }); return parts;
  }, []);
  const ringGradient = ring.length ? `conic-gradient(${ring.map((r, i) => `${["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"][i % 4]} ${r.start}% ${r.end}%`).join(", ")})` : "conic-gradient(#e7edf5 0 100%)";

  async function callNext() {
    if (actionBusy || !waitingTokens.length) return;
    setActionBusy(true);
    try { await api.callNext(); await load(); } finally { setActionBusy(false); }
  }

  async function updateAppointment(id, action) {
    if (!id || actionBusy) return;
    setActionBusy(true);
    try {
      if (action === "approve") await api.approve(id);
      if (action === "reject") await api.reject(id);
      if (action === "complete") await api.complete(id);
      setSelectedAppointment(null); await load();
    } finally { setActionBusy(false); }
  }

  async function getRoute() {
    setRouteBusy(true); setRouteError("");
    try { setRouteResult(await api.shortestPath("Entrance", department, routeMode)); }
    catch (err) { setRouteResult(null); setRouteError(err.message || "Unable to find route"); }
    finally { setRouteBusy(false); }
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const doctorName = (doctorMeta?.name || user?.name || "Doctor").replace(/^Dr\.\s*/i, "");

  return (
    <div className="doctor-dashboard">
      <section className="doctor-hero"><div className="doctor-hero-copy"><h1>{greeting}, Dr. {doctorName}! <span>👋</span></h1><p>Here&apos;s what&apos;s happening with your patients today.</p></div><div className="doctor-hero-message">♡ <strong>The best doctors<br />treat the whole person,<br />not just the disease.</strong></div></section>

      <section className="doctor-stat-grid">
        <DoctorStat icon="user" tone="blue" label="Total Patients" value={uniquePatients} note={`${todayUniquePatients} unique patient${todayUniquePatients === 1 ? "" : "s"} today`} />
        <DoctorStat icon="clock" tone="orange" label="Waiting" value={waitingTokens.length} note="Patients in queue" />
        <DoctorStat icon="check" tone="green" label="Completed" value={completed.filter((a) => a.date === todayKey()).length} note="Completed today" />
        <DoctorStat icon="calendar" tone="purple" label="Pending Approval" value={pending.length} note="Appointment requests" />
      </section>

      <div className="doctor-main-grid">
        <div className="doctor-left-column">
          <section className="doctor-panel today-panel">
            <DoctorPanelHeader icon="calendar" title="Today&apos;s Appointments" action="View All" onAction={() => onNavigate?.("requests")} />
            {loading ? <div className="doctor-empty">Loading your appointments...</div> : sortedToday.length === 0 ? <div className="doctor-empty">No appointments assigned to you today.</div> : <div className="doctor-table-wrap"><table className="doctor-table"><thead><tr><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>{sortedToday.map((a) => <tr key={a.id}><td>{a.time || "—"}</td><td><strong>{a.patient}</strong><small>Assigned to you</small></td><td>{a.reason || "Consultation"}</td><td><StatusPill status={a.status} /></td><td><button className="table-view-btn" onClick={() => setSelectedAppointment(a)}>View</button></td></tr>)}</tbody></table></div>}
          </section>

          <div className="doctor-middle-grid">
            <section className="doctor-panel token-panel"><DoctorPanelHeader icon="spark" title="Current Token" /><div className="token-display"><strong>{currentToken?.token_number || "—"}</strong><span>{department}</span></div><div className="token-meta">{currentToken ? `${currentToken.patient || "Patient"} is currently being served` : "No patient is currently being served"}</div><button className="doctor-primary-btn full" onClick={callNext} disabled={actionBusy || waitingTokens.length === 0}><Icon name="arrow" size={17} /> {actionBusy ? "Calling..." : "Call Next Patient"}</button><button className="doctor-outline-btn full" onClick={() => onNavigate?.("queue")}>View Queue</button></section>
            <section className="doctor-panel queue-panel"><DoctorPanelHeader icon="user" title="Patient Queue" badge="Live" /><div className="queue-list">{tokens.slice(0, 5).map((t, i) => <div className={`queue-row ${t.token_number === currentToken?.token_number ? "current" : ""}`} key={t.token_number || i}><strong>{t.token_number}</strong><span>{t.patient || "Patient"}</span><small>{t.status === "WAITING" ? `${(i + 1) * 5} min` : "—"}</small><StatusPill status={t.status} /></div>)}{!tokens.length && <div className="doctor-empty compact">Queue is empty.</div>}</div><button className="text-action" onClick={() => onNavigate?.("queue")}>View Full Queue <Icon name="arrow" size={14} /></button></section>
          </div>

          <div className="doctor-bottom-grid">
            <section className="doctor-panel mini-panel"><DoctorPanelHeader icon="file" title="Patient Statistics" action="Last 7 Days" /><div className="mini-stats"><div><b>{appointments.length}</b><span>Appointments</span></div><div><b>{uniquePatients}</b><span>Unique Patients</span></div></div><div className="real-doctor-chart">{weekStats.map((day) => <div className="real-chart-column" key={day.key}><div className="real-chart-bar" style={{ height: `${Math.max(day.total ? 8 : 2, (day.total / maxWeek) * 100)}%` }} title={`${day.total} appointments`} /><span>{day.label}</span></div>)}</div></section>
            <section className="doctor-panel mini-panel"><DoctorPanelHeader icon="spark" title="Department-wise Distribution" /><div className="distribution-ring real" style={{ background: ringGradient }}><div><strong>{appointments.length}</strong><span>Appointments</span></div></div><div className="distribution-legend">{departmentCounts.slice(0, 4).map((d, i) => <div key={d.name}><span><i style={{ background: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"][i % 4] }} /> {d.name}</span><b>{d.count}</b></div>)}{!departmentCounts.length && <span>No appointment data yet.</span>}</div></section>
            <section className="doctor-panel mini-panel quick-doctor-panel"><DoctorPanelHeader icon="spark" title="Quick Actions" /><div className="doctor-quick-grid"><QuickDoctor icon="search" title="Find Patient" onClick={() => onNavigate?.("patients")} /><QuickDoctor icon="file" title="View Requests" onClick={() => onNavigate?.("requests")} /><QuickDoctor icon="calendar" title="Manage Tokens" onClick={() => onNavigate?.("tokens")} /><QuickDoctor icon="check" title="Update Status" onClick={() => currentToken?.appointment_id && updateAppointment(currentToken.appointment_id, "complete")} /></div></section>
          </div>
        </div>

        <aside className="doctor-right-column">
          <section className="doctor-panel notifications-panel-doctor"><DoctorPanelHeader icon="bell" title="Notifications" action="View All" onAction={() => onNavigate?.("notifications")} /><DoctorNotification title={pending.length ? "New appointment request" : "No new requests"} text={pending.length ? `${pending[0].patient} has requested an appointment.` : "You are all caught up."} tone="green" /><DoctorNotification title={currentToken ? `Token ${currentToken.token_number} is now ready` : "Queue status"} text={currentToken ? "Please call the current patient." : `${waitingTokens.length} patient(s) waiting.`} tone="blue" /><DoctorNotification title="Appointment summary" text={`${completed.length} completed and ${approved.length} approved overall.`} tone="orange" /></section>
          <section className="doctor-panel upcoming-panel"><DoctorPanelHeader icon="calendar" title="My Upcoming Appointments" action="View All" onAction={() => onNavigate?.("requests")} />{appointments.filter((a) => a.status !== "REJECTED" && a.date >= todayKey()).slice(0, 3).map((a) => <div className="upcoming-row" key={a.id}><Avatar name={a.patient} /><div><strong>{a.date}</strong><span>{a.time} • {a.patient}</span></div><StatusPill status={a.status} /></div>)}{!appointments.length && <div className="doctor-empty compact">No upcoming appointments.</div>}</section>
          <section className="doctor-panel recent-panel"><DoctorPanelHeader icon="user" title="Recent Patients" action="View All" onAction={() => onNavigate?.("patients")} />{recentPatients.map((a) => <div className="recent-row" key={a.patient}><Avatar name={a.patient} /><div><strong>{a.patient}</strong><span>{a.reason || "Consultation"}</span></div><small>{a.date || a.time || "—"}</small></div>)}{!recentPatients.length && <div className="doctor-empty compact">No patient records yet.</div>}</section>
          <section className="doctor-panel navigation-panel"><DoctorPanelHeader icon="map" title="Quick Navigation" action="View Full Map" onAction={() => onNavigate?.("navigation")} /><div className="map-placeholder"><span>Hospital Map</span><b>📍</b><i>●</i></div><div className="route-controls"><label>Target Department<select value={department} readOnly><option>{department}</option></select></label><div className="route-options"><button className={routeMode === "normal" ? "selected" : ""} onClick={() => setRouteMode("normal")}>◉ Normal</button><button className={routeMode === "wheelchair" ? "selected" : ""} onClick={() => setRouteMode("wheelchair")}>♿ Wheelchair</button></div><button className="doctor-primary-btn full" onClick={getRoute} disabled={routeBusy}>{routeBusy ? "Finding Route..." : "Get Route"} <Icon name="arrow" size={15} /></button>{routeError && <div className="doctor-empty compact route-error">{routeError}</div>}</div><div className="route-metrics"><span>◷ <b>{routeResult ? `${routeResult.distance} m` : "—"}</b> Distance</span><span>♧ <b>{routeResult ? `${routeResult.estimated_time_minutes} min` : "—"}</b> Est. time</span></div></section>
        </aside>
      </div>

      {selectedAppointment && <div className="doctor-modal-backdrop" onClick={() => setSelectedAppointment(null)}><div className="doctor-modal" onClick={(e) => e.stopPropagation()}><div className="doctor-modal-header"><div><span>Appointment Details</span><h3>{selectedAppointment.patient}</h3></div><button onClick={() => setSelectedAppointment(null)}>×</button></div><div className="doctor-modal-grid"><div><small>Date</small><strong>{selectedAppointment.date}</strong></div><div><small>Time</small><strong>{selectedAppointment.time}</strong></div><div><small>Department</small><strong>{selectedAppointment.department || department}</strong></div><div><small>Reason</small><strong>{selectedAppointment.reason || "Consultation"}</strong></div></div><div className="doctor-modal-actions">{selectedAppointment.status === "PENDING" && <><button className="doctor-primary-btn" onClick={() => updateAppointment(selectedAppointment.id, "approve")}>Approve</button><button className="doctor-outline-btn" onClick={() => updateAppointment(selectedAppointment.id, "reject")}>Reject</button></>}{selectedAppointment.status === "APPROVED" && <button className="doctor-primary-btn" onClick={() => updateAppointment(selectedAppointment.id, "complete")}>Mark Completed</button>}<button className="doctor-outline-btn" onClick={() => setSelectedAppointment(null)}>Close</button></div></div></div>}
    </div>
  );
}

function DoctorStat({ icon, tone, label, value, note }) { return <div className="doctor-stat"><div className={`doctor-stat-icon ${tone}`}><Icon name={icon} size={22} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>; }
function DoctorPanelHeader({ icon, title, action, badge, onAction }) { return <div className="doctor-panel-header"><div className="doctor-title"><Icon name={icon} size={18} /><h2>{title}</h2>{badge && <em>{badge}</em>}</div>{action && <button className="doctor-header-action" onClick={onAction}>{action} <Icon name="arrow" size={13} /></button>}</div>; }
function DoctorNotification({ title, text, tone }) { return <div className="doctor-notification"><div className={`doctor-notification-icon ${tone}`}><Icon name={tone === "green" ? "check" : tone === "orange" ? "calendar" : "info"} size={17} /></div><div><strong>{title}</strong><span>{text}</span></div></div>; }
function QuickDoctor({ icon, title, onClick }) { return <button className="quick-doctor-action" onClick={onClick}><Icon name={icon} size={20} /><span>{title}</span></button>; }

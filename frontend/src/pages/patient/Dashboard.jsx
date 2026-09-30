import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

function formatDate(value) {
  if (!value) return "Date not set";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function appointmentDateTime(a) {
  const d = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`);
  return Number.isNaN(d.getTime()) ? Number.MAX_SAFE_INTEGER : d.getTime();
}

function StatusPill({ status }) {
  const map = {
    APPROVED: ["Approved", "status-approved"],
    PENDING: ["Pending", "status-pending"],
    COMPLETED: ["Completed", "status-completed"],
    REJECTED: ["Rejected", "status-rejected"],
  };
  const [label, className] = map[status] || [status || "Scheduled", "status-scheduled"];
  return <span className={`status-pill ${className}`}><span className="status-dot" />{label}</span>;
}

function Avatar({ name, large = false }) {
  const initials = (name || "Patient").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <div className={`avatar patient-avatar ${large ? "avatar-large" : ""}`}>{initials}</div>;
}

export default function PatientDashboard({ user, onNavigate }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAppointments() {
    setLoading(true);
    try {
      const r = await api.myAppointments();
      setAppointments(r.appointments || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAppointments(); }, []);

  const sorted = useMemo(() => [...appointments].sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b)), [appointments]);
  const now = Date.now();
  const upcoming = sorted.filter((a) => ["PENDING", "APPROVED"].includes(a.status) && appointmentDateTime(a) >= now);
  const nextAppointment = upcoming[0] || null;
  const approved = appointments.filter((a) => a.status === "APPROVED").length;
  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  const notifications = [
    ...appointments.filter((a) => a.status === "APPROVED").slice(0, 2).map((a) => ({ icon: "check", tone: "green", title: "Your appointment is approved", text: `${a.department} • ${a.time}` })),
    ...appointments.filter((a) => a.status === "PENDING").slice(0, 2).map((a) => ({ icon: "clock", tone: "blue", title: "Appointment awaiting approval", text: `${a.department} • ${a.time}` })),
  ].slice(0, 4);

  return (
    <div className="patient-dashboard">
      <section className="welcome-card">
        <Avatar name={user.name} large />
        <div className="welcome-copy">
          <h1>{greeting}, {user.name}! <span>👋</span></h1>
          <p>Take care of your health. We're here to help you.</p>
        </div>
        <div className="welcome-meta">
          <div><Icon name="calendar" size={18} /><span>{formatDate(today.toISOString().slice(0, 10))}</span></div>
          <div><Icon name="clock" size={18} /><span>{today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span></div>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main-column">
          <section className="next-appointment-card">
            <div className="section-title light"><Icon name="calendar" size={20} /><h2>Your Next Appointment</h2></div>
            {loading ? <div className="appointment-empty light-empty">Loading your appointments...</div> : nextAppointment ? (
              <div className="next-appointment-inner">
                <div className="next-doctor">
                  <div className="department-icon"><Icon name="heart" size={24} /></div>
                  <div>
                    <h3>{nextAppointment.department}</h3>
                    <p>{nextAppointment.doctor}</p>
                    <span><Icon name="pin" size={16} /> Hospital consultation</span>
                  </div>
                </div>
                <div className="next-details">
                  <div><Icon name="calendar" size={18} /><strong>{nextAppointment.date}</strong></div>
                  <div><Icon name="clock" size={18} /><strong>{nextAppointment.time}</strong></div>
                  {nextAppointment.token && <div className="token-row"><span>Token</span><b>{nextAppointment.token}</b></div>}
                  <StatusPill status={nextAppointment.status} />
                </div>
                <div className="next-actions">
                  <button className="btn btn-white" onClick={() => onNavigate("nav", { destination: nextAppointment.department })}><Icon name="arrow" size={17} /> Navigate</button>
                  <button className="btn btn-blue" onClick={() => onNavigate("appointments")}>View Details</button>
                </div>
              </div>
            ) : (
              <div className="appointment-empty light-empty">
                <strong>No appointment scheduled yet.</strong>
                <span>Choose a doctor and book your first appointment.</span>
                <button className="btn btn-white compact" onClick={() => onNavigate("book")}>Book Appointment <Icon name="arrow" size={16} /></button>
              </div>
            )}
          </section>

          <section className="stats-grid">
            <StatCard icon="calendar" tone="blue" label="Total Appointments" value={appointments.length} note={`${completed} completed`} onClick={() => onNavigate("appointments")} />
            <StatCard icon="clock" tone="green" label="Approved" value={approved} note="Ready for consultation" onClick={() => onNavigate("appointments")} />
            <StatCard icon="bell" tone="red" label="Pending" value={pending} note="Waiting for approval" onClick={() => onNavigate("appointments")} />
            <StatCard icon="check" tone="purple" label="Completed" value={completed} note="Appointment history" onClick={() => onNavigate("appointments")} />
          </section>

          <div className="lower-grid">
            <section className="panel appointments-panel">
              <div className="panel-heading"><div className="section-title"><Icon name="calendar" size={19} /><h2>Upcoming Appointments</h2></div><button onClick={() => onNavigate("appointments")}>View All <Icon name="arrow" size={15} /></button></div>
              {upcoming.length === 0 ? <div className="empty-state">No upcoming appointments.</div> : upcoming.slice(0, 3).map((a) => (
                <div className="appointment-row" key={a.id}>
                  <div className="row-icon"><Icon name="heart" size={18} /></div>
                  <div className="appointment-person"><strong>{a.department}</strong><span>Dr. {a.doctor}</span></div>
                  <div className="appointment-time"><strong>{a.date}</strong><span>{a.time}{a.token ? ` • Token ${a.token}` : ""}</span></div>
                  <StatusPill status={a.status} />
                </div>
              ))}
            </section>

            <section className="panel ai-panel">
              <div className="ai-heading"><div className="ai-icon"><Icon name="spark" size={20} /></div><div><h2>AI Department Finder</h2><span>Beta</span></div></div>
              <p>Describe your symptoms and let AI suggest the right department.</p>
              <div className="ai-input"><span>e.g. I have knee pain and swelling...</span><small>0/200</small></div>
              <button className="btn btn-blue full" onClick={() => onNavigate("finder")}><Icon name="spark" size={17} /> Find Department</button>
              <div className="ai-note"><Icon name="info" size={14} /> Navigation assistance only — not a medical diagnosis.</div>
            </section>
          </div>

          <section className="health-banner">
            <div className="health-icon"><Icon name="heart" size={19} /></div>
            <div><strong>Your Health Matters</strong><span>Regular checkups and timely care can lead to a healthier tomorrow.</span></div>
            <button onClick={() => onNavigate("appointments")}>View appointments <Icon name="arrow" size={15} /></button>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <section className="panel notifications-panel">
            <div className="panel-heading"><div className="section-title"><Icon name="bell" size={19} /><h2>Notifications</h2></div><button onClick={() => onNavigate("appointments")}>View All <Icon name="arrow" size={15} /></button></div>
            {notifications.length === 0 ? <div className="empty-state">You're all caught up.</div> : notifications.map((n, i) => (
              <div className="notification-row" key={`${n.title}-${i}`}>
                <div className={`notification-icon ${n.tone}`}><Icon name={n.icon} size={18} /></div>
                <div><strong>{n.title}</strong><span>{n.text}</span></div>
              </div>
            ))}
          </section>

          <section className="panel quick-panel">
            <div className="section-title"><Icon name="spark" size={19} /><h2>Quick Actions</h2></div>
            <div className="quick-grid">
              <QuickAction icon="search" tone="green" title="Find Department" text="Get AI suggestion" onClick={() => onNavigate("finder")} />
              <QuickAction icon="calendar" tone="blue" title="Book Appointment" text="Choose your doctor" onClick={() => onNavigate("book")} />
              <QuickAction icon="map" tone="purple" title="Hospital Map" text="Find your way" onClick={() => onNavigate("nav")} />
              <QuickAction icon="file" tone="red" title="My Appointments" text="View history" onClick={() => onNavigate("appointments")} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, tone, label, value, note, onClick }) {
  return <button className="stat-card" onClick={onClick}><div className={`stat-icon ${tone}`}><Icon name={icon} size={19} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div><Icon name="chevron" size={17} className="stat-arrow" /></button>;
}

function QuickAction({ icon, tone, title, text, onClick }) {
  return <button className={`quick-action ${tone}`} onClick={onClick}><div className="quick-icon"><Icon name={icon} size={20} /></div><strong>{title}</strong><span>{text}</span></button>;
}

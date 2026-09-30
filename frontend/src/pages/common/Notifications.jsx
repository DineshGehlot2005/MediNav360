import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

function item(icon, tone, title, text, time="Now") { return { icon, tone, title, text, time }; }

export default function Notifications({ role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        if (role === "DOCTOR") {
          const [a, q] = await Promise.all([api.doctorAppointments(), api.queue()]);
          const appointments = a.appointments || [], tokens = q.tokens || [];
          const pending = appointments.filter(x => x.status === "PENDING");
          const current = tokens.find(x => ["IN_PROGRESS", "CALLED"].includes(x.status));
          setItems([
            ...pending.slice(0, 3).map(x => item("calendar","blue","New appointment request",`${x.patient} requested ${x.date} at ${x.time}.`)),
            ...(current ? [item("bell","green",`Token ${current.token_number} is ready`,`${current.patient || "Patient"} is currently in the queue.`)] : []),
            item("info","purple","Appointment summary",`${appointments.filter(x=>x.status==="COMPLETED").length} completed and ${appointments.filter(x=>x.status==="APPROVED").length} approved appointments.`),
          ]);
        } else {
          const r = await api.myAppointments();
          const appointments = r.appointments || [];
          setItems([
            ...appointments.filter(x => x.status === "APPROVED").slice(0,3).map(x => item("check","green","Appointment approved",`${x.department} with ${x.doctor} • ${x.date} ${x.time}`)),
            ...appointments.filter(x => x.status === "PENDING").slice(0,3).map(x => item("clock","blue","Appointment awaiting approval",`${x.department} with ${x.doctor} • ${x.date} ${x.time}`)),
            ...appointments.filter(x => x.status === "REJECTED").slice(0,2).map(x => item("info","red","Appointment not approved",`${x.department} • ${x.date} ${x.time}`)),
          ]);
        }
      } catch { setItems([]); } finally { setLoading(false); }
    }
    load();
  }, [role]);

  return <div className="app-feature-page"><div className="feature-page-header"><div><span className="feature-eyebrow">Updates</span><h1>Notifications</h1><p>Important appointment and queue updates for your account.</p></div><div className="feature-round-icon"><Icon name="bell" size={24}/></div></div>
    <section className="feature-card notification-list-card">
      <div className="feature-card-title"><Icon name="bell" size={18}/><h2>Recent Notifications</h2><span className="feature-count">{items.length}</span></div>
      {loading ? <div className="feature-empty">Loading notifications...</div> : items.length ? items.map((n,i)=><div className="feature-notification" key={`${n.title}-${i}`}><div className={`feature-notification-icon ${n.tone}`}><Icon name={n.icon} size={18}/></div><div className="feature-notification-copy"><strong>{n.title}</strong><span>{n.text}</span></div><small>{n.time}</small></div>) : <div className="feature-empty"><Icon name="check" size={28}/><strong>You're all caught up.</strong><span>No new notifications right now.</span></div>}
    </section>
  </div>;
}

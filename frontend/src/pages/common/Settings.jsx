import { useEffect, useState } from "react";
import Icon from "../../components/Icon.jsx";

const KEY = "hospital-nav-settings";
export default function Settings({ role }) {
  const [settings, setSettings] = useState({ notifications:true, reminders:true, compact:false });
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { const x = JSON.parse(localStorage.getItem(KEY)); if (x) setSettings(s => ({...s,...x})); } catch {} }, []);
  function toggle(name) { setSettings(s => ({...s,[name]:!s[name]})); setSaved(false); }
  function save() { localStorage.setItem(KEY, JSON.stringify(settings)); setSaved(true); }
  return <div className="app-feature-page"><div className="feature-page-header"><div><span className="feature-eyebrow">Preferences</span><h1>Settings</h1><p>Control your dashboard and notification preferences.</p></div><div className="feature-round-icon"><Icon name="settings" size={24}/></div></div>
    <div className="settings-layout"><section className="feature-card"><div className="feature-card-title"><Icon name="bell" size={18}/><h2>Notifications</h2></div><SettingRow title="In-app notifications" text="Show appointment and queue updates" checked={settings.notifications} onClick={()=>toggle("notifications")}/><SettingRow title="Appointment reminders" text="Keep reminders visible on your dashboard" checked={settings.reminders} onClick={()=>toggle("reminders")}/></section>
    <section className="feature-card"><div className="feature-card-title"><Icon name="settings" size={18}/><h2>Display</h2></div><SettingRow title="Compact dashboard" text="Use a tighter layout for smaller screens" checked={settings.compact} onClick={()=>toggle("compact")}/><div className="settings-role"><span>Current role</span><strong>{role === "DOCTOR" ? "Doctor" : role === "ADMIN" ? "Administrator" : "Patient"}</strong></div></section></div>
    <div className="feature-form-actions settings-save"><button className="feature-primary" onClick={save}>Save Preferences</button>{saved && <span className="feature-saved"><Icon name="check" size={15}/>Saved</span>}</div>
  </div>;
}
function SettingRow({title,text,checked,onClick}) { return <button className="setting-row" onClick={onClick}><div><strong>{title}</strong><span>{text}</span></div><span className={`toggle ${checked ? "on" : ""}`}><i/></span></button>; }

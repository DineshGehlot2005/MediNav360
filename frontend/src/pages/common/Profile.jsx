import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

export default function Profile({ user, role, onUserChange }) {
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (role === "DOCTOR") {
      api.doctorAppointments().then((r) => setDoctorInfo(r.doctor || null)).catch(() => setDoctorInfo(null));
    }
  }, [role]);

  const initials = useMemo(() => (form.name || "User").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(), [form.name]);
  const isDoctor = role === "DOCTOR";
  const title = isDoctor ? "Doctor Profile" : "My Profile";
  const roleText = isDoctor ? "Doctor" : "Patient";

  function save(e) {
    e.preventDefault();
    setSaved("Profile updated for this session.");
    setEditing(false);
    onUserChange?.({ ...user, name: form.name, email: form.email, phone: form.phone });
  }

  return <div className="app-feature-page">
    <div className="feature-page-header"><div><span className="feature-eyebrow">Account</span><h1>{title}</h1><p>Keep your personal information clear and up to date.</p></div><div className="feature-avatar"><span>{initials}</span></div></div>
    {saved && <div className="feature-success"><Icon name="check" size={16}/>{saved}</div>}
    <div className="feature-grid">
      <section className="feature-card profile-main-card">
        <div className="feature-card-title"><Icon name="user" size={18}/><h2>Personal Information</h2></div>
        <form onSubmit={save} className="feature-form">
          <label>Full name<input value={form.name} disabled={!editing} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
          <label>Email<input type="email" value={form.email} disabled={!editing} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
          <label>Phone<input value={form.phone || ""} disabled={!editing} placeholder="Add phone number" onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label>
          <div className="feature-form-actions">{editing ? <><button type="submit" className="feature-primary">Save Changes</button><button type="button" className="feature-secondary" onClick={() => { setEditing(false); setForm({ name:user?.name||"", email:user?.email||"", phone:user?.phone||"" }); }}>Cancel</button></> : <button type="button" className="feature-primary" onClick={() => setEditing(true)}>Edit Profile</button>}</div>
        </form>
      </section>
      <aside className="feature-card profile-side-card">
        <div className="feature-card-title"><Icon name="shield" size={18}/><h2>Account Summary</h2></div>
        <div className="summary-row"><span>Role</span><strong>{roleText}</strong></div>
        <div className="summary-row"><span>Account ID</span><strong>#{user?.id ?? "—"}</strong></div>
        {isDoctor && doctorInfo && <><div className="summary-row"><span>Department</span><strong>{doctorInfo.department}</strong></div><div className="summary-row"><span>Specialization</span><strong>{doctorInfo.specialization || "—"}</strong></div><div className="summary-row"><span>Room</span><strong>{doctorInfo.room || "—"}</strong></div></>}
        {!isDoctor && <div className="profile-tip"><Icon name="info" size={16}/><span>Your medical details and appointment history stay in their dedicated hospital sections.</span></div>}
      </aside>
    </div>
  </div>;
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

export default function PatientBook({ onNavigate }) {
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.doctors().then((r) => setDoctors(r.doctors || [])).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const departments = useMemo(() => [...new Map(doctors.map(d => [d.department_id, {id:d.department_id,name:d.department}])).values()], [doctors]);
  const filteredDoctors = useMemo(() => doctors.filter(d => !department || String(d.department_id) === String(department)), [doctors, department]);
  const selectedDoctor = doctors.find(d => String(d.id) === String(doctorId));
  const minDate = new Date().toISOString().slice(0,10);

  useEffect(() => {
    if (filteredDoctors.length && !filteredDoctors.some(d => String(d.id) === String(doctorId))) setDoctorId(String(filteredDoctors[0].id));
    if (!filteredDoctors.length) setDoctorId("");
  }, [department, doctors.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault(); setError(""); setMessage("");
    if (!doctorId || !date || !time || !reason.trim()) { setError("Please select a doctor and complete date, time and reason."); return; }
    setBusy(true);
    try {
      await api.bookAppointment({ doctor_id:Number(doctorId), date, time, reason:reason.trim() });
      setMessage(`Request sent to ${selectedDoctor?.name || "the selected doctor"}. It will remain pending until approved.`);
      setDate(""); setTime(""); setReason("");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <div className="app-feature-page booking-page">
    <div className="feature-page-header"><div><span className="feature-eyebrow">Appointments</span><h1>Book Appointment</h1><p>Choose a department and doctor. Your request is sent only to the doctor you select.</p></div><div className="feature-round-icon"><Icon name="calendar" size={24}/></div></div>
    <div className="booking-layout">
      <section className="feature-card">
        <div className="feature-card-title"><Icon name="calendar" size={18}/><h2>Appointment Details</h2></div>
        {loading ? <div className="feature-empty">Loading available doctors...</div> : <form className="feature-form" onSubmit={submit}>
          <label>Department<select value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label>Doctor<select value={doctorId} onChange={e=>setDoctorId(e.target.value)} disabled={!filteredDoctors.length}><option value="">Select a doctor</option>{filteredDoctors.map(d=><option key={d.id} value={d.id}>{d.name} — {d.specialization || d.department}</option>)}</select></label>
          {selectedDoctor && <div className="doctor-selection"><div className="feature-round-icon small"><Icon name="user" size={18}/></div><div><strong>{selectedDoctor.name}</strong><span>{selectedDoctor.specialization || "Doctor"} • {selectedDoctor.department}</span><small>{selectedDoctor.room ? `Room ${selectedDoctor.room}` : "Room not specified"} • {selectedDoctor.experience || 0} years experience</small></div></div>}
          <div className="auth-two"><label>Date<input type="date" min={minDate} value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Time<input type="time" value={time} onChange={e=>setTime(e.target.value)} required/></label></div>
          <label>Reason / symptoms<textarea value={reason} maxLength={255} onChange={e=>setReason(e.target.value)} placeholder="Briefly describe why you need the appointment..." required/><small className="field-counter">{reason.length}/255</small></label>
          {message && <div className="feature-success"><Icon name="check" size={16}/>{message}</div>}{error && <div className="auth-error">{error}</div>}
          <div className="feature-form-actions"><button className="feature-primary" disabled={busy || !filteredDoctors.length}>{busy ? "Sending Request..." : "Submit Appointment Request"}</button><button type="button" className="feature-secondary" onClick={()=>onNavigate?.("appointments")}>View My Appointments</button></div>
        </form>}
      </section>
      <aside className="feature-card booking-info"><div className="feature-card-title"><Icon name="info" size={18}/><h2>How it works</h2></div><div className="booking-step"><b>1</b><div><strong>Choose your department</strong><span>Doctors are loaded from the hospital system.</span></div></div><div className="booking-step"><b>2</b><div><strong>Select one doctor</strong><span>Only that selected doctor receives this appointment request.</span></div></div><div className="booking-step"><b>3</b><div><strong>Wait for approval</strong><span>Your appointment becomes approved after the doctor accepts it.</span></div></div></aside>
    </div>
  </div>;
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

// Static time slots — 9:00 AM to 5:00 PM, every 30 min
function generateSlots() {
  const slots = [];
  for (let h = 9; h < 17; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

function formatSlot(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getInitials(name) {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PatientBook({ onNavigate }) {
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load doctors
  useEffect(() => {
    api
      .doctors()
      .then((r) => setDoctors(r.doctors || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // AI auto-fill from sessionStorage
  useEffect(() => {
    const aiReason = sessionStorage.getItem("aiReason");
    if (aiReason) {
      setReason(aiReason);
      sessionStorage.removeItem("aiReason");
    }
  }, []);

  const departments = useMemo(
    () => [
      ...new Map(
        doctors.map((d) => [
          d.department_id,
          { id: d.department_id, name: d.department },
        ]),
      ).values(),
    ],
    [doctors],
  );

  const filteredDoctors = useMemo(
    () =>
      doctors.filter(
        (d) => !department || String(d.department_id) === String(department),
      ),
    [doctors, department],
  );

  const selectedDoctor = doctors.find((d) => String(d.id) === String(doctorId));
  const minDate = new Date().toISOString().slice(0, 10);

  // Auto-select first doctor when dept changes
  useEffect(() => {
    if (
      filteredDoctors.length &&
      !filteredDoctors.some((d) => String(d.id) === String(doctorId))
    ) {
      setDoctorId(String(filteredDoctors[0].id));
    }
    if (!filteredDoctors.length) setDoctorId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, doctors.length]);

  // Load booked slots when doctor or date changes
  useEffect(() => {
    if (!doctorId || !date) {
      setBookedSlots([]);
      return;
    }
    setSlotsLoading(true);
    api
      .doctorSlots(doctorId, date)
      .then((r) => setBookedSlots(r.booked || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, date]);

  function handleDoctorSelect(id) {
    setDoctorId(String(id));
    setTime(""); // reset time when doctor changes
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!doctorId || !date || !time || !reason.trim()) {
      setError("Please select a doctor and complete date, time and reason.");
      return;
    }
    setShowConfirm(true);
  }

  async function confirmBooking() {
    setShowConfirm(false);
    setBusy(true);
    try {
      await api.bookAppointment({
        doctor_id: Number(doctorId),
        date,
        time,
        reason: reason.trim(),
      });
      setMessage(
        `Request sent to ${selectedDoctor?.name || "the selected doctor"}. It will remain pending until approved.`,
      );
      setDate("");
      setTime("");
      setReason("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-feature-page inner-page">
      <div className="feature-page-header">
        <div>
          <span className="feature-eyebrow">Appointments</span>
          <h1>Book Appointment</h1>
          <p>
            Choose a department and doctor. Your request is sent only to the
            doctor you select.
          </p>
        </div>
        <div className="feature-round-icon">
          <Icon name="calendar" size={24} />
        </div>
      </div>

      <div className="booking-layout">
        {/* LEFT: Main form */}
        <section className="feature-card">
          {/* Department selector */}
          <div className="booking-step-block">
            <label className="booking-label">
              <span className="booking-step-num">1</span> Select department
            </label>
            <select
              className="booking-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loading}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor cards */}
          <div className="booking-step-block">
            <label className="booking-label">
              <span className="booking-step-num">2</span> Choose your doctor
            </label>

            {loading ? (
              <div className="feature-empty">Loading available doctors...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="feature-empty">
                No doctors available in this department.
              </div>
            ) : (
              <div className="doctor-cards-grid">
                {filteredDoctors.map((doc) => {
                  const selected = String(doc.id) === String(doctorId);
                  return (
                    <button
                      type="button"
                      key={doc.id}
                      className={`doctor-card ${selected ? "selected" : ""}`}
                      onClick={() => handleDoctorSelect(doc.id)}
                    >
                      <div className="doctor-card-photo-wrap">
                        {doc.photo_url ? (
                          <img
                            src={doc.photo_url}
                            alt={doc.name}
                            className="doctor-card-photo"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextSibling.style.display =
                                "grid";
                            }}
                          />
                        ) : null}
                        <div
                          className="doctor-card-photo-fallback"
                          style={{ display: doc.photo_url ? "none" : "grid" }}
                        >
                          {getInitials(doc.name)}
                        </div>
                      </div>

                      <div className="doctor-card-body">
                        <h3>{doc.name}</h3>
                        <p className="doctor-card-spec">
                          {doc.qualification || doc.specialization}
                        </p>
                        <div className="doctor-card-meta">
                          <span className="doctor-rating">
                            ⭐ {doc.rating?.toFixed(1) || "4.5"}{" "}
                            <small>({doc.review_count || 0})</small>
                          </span>
                          <span className="doctor-exp">
                            {doc.experience || 0} yrs exp
                          </span>
                        </div>
                        <div className="doctor-card-footer">
                          <span className="doctor-fees">
                            ₹{doc.fees || 500}
                          </span>
                          <span className="doctor-room">
                            {doc.room ? `Room ${doc.room}` : ""}
                          </span>
                        </div>
                      </div>

                      {selected && (
                        <div className="doctor-card-check">
                          <Icon name="check" size={16} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date + Time */}
          {selectedDoctor && (
            <>
              <div className="booking-step-block">
                <label className="booking-label">
                  <span className="booking-step-num">3</span> Pick date & time
                </label>

                <input
                  type="date"
                  className="booking-select"
                  value={date}
                  min={minDate}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                  required
                />

                {date && (
                  <>
                    {slotsLoading ? (
                      <div className="slots-loading">
                        <span className="button-spinner" /> Loading slots...
                      </div>
                    ) : (
                      <div className="time-slots-grid">
                        {ALL_SLOTS.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = time === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              className={`time-slot ${isSelected ? "selected" : ""} ${
                                isBooked ? "booked" : ""
                              }`}
                              onClick={() => !isBooked && setTime(slot)}
                              disabled={isBooked}
                              title={
                                isBooked ? "Already booked" : formatSlot(slot)
                              }
                            >
                              {formatSlot(slot)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Reason */}
              <div className="booking-step-block">
                <label className="booking-label">
                  <span className="booking-step-num">4</span> Reason / symptoms
                </label>
                <textarea
                  className="booking-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 255))}
                  placeholder="Briefly describe why you need the appointment..."
                  rows={4}
                />
                <small className="field-counter">{reason.length}/255</small>
              </div>
            </>
          )}

          {message && (
            <div className="feature-success">
              <Icon name="check" size={16} /> {message}
            </div>
          )}

          {error && (
            <div className="feature-error">
              <Icon name="info" size={16} /> {error}
            </div>
          )}

          <div className="feature-form-actions">
            <button
              type="button"
              className="feature-primary"
              onClick={handleSubmit}
              disabled={busy || !doctorId || !date || !time || !reason.trim()}
            >
              {busy ? (
                <>
                  <span className="button-spinner" /> Sending...
                </>
              ) : (
                <>
                  <Icon name="calendar" size={16} /> Submit Appointment Request
                </>
              )}
            </button>

            <button
              type="button"
              className="feature-secondary"
              onClick={() => onNavigate && onNavigate("appointments")}
            >
              View My Appointments
            </button>
          </div>
        </section>

        {/* RIGHT: How it works */}
        <aside className="feature-card finder-help">
          <div className="feature-card-title">
            <Icon name="info" size={18} />
            <h2>How it works</h2>
          </div>

          <div className="booking-step">
            <b>1</b>
            <div>
              <strong>Choose your department</strong>
              <span>Doctors are loaded from the hospital system.</span>
            </div>
          </div>
          <div className="booking-step">
            <b>2</b>
            <div>
              <strong>Select one doctor</strong>
              <span>
                Only the selected doctor receives your appointment request.
              </span>
            </div>
          </div>
          <div className="booking-step">
            <b>3</b>
            <div>
              <strong>Pick a time slot</strong>
              <span>
                Available slots are shown in green. Booked slots are disabled.
              </span>
            </div>
          </div>
          <div className="booking-step">
            <b>4</b>
            <div>
              <strong>Wait for approval</strong>
              <span>
                Your appointment becomes approved after the doctor accepts it.
              </span>
            </div>
          </div>

          {selectedDoctor && (
            <div className="selected-doctor-summary">
              <h4>Selected Doctor</h4>
              <p>
                <strong>{selectedDoctor.name}</strong>
              </p>
              <p>{selectedDoctor.qualification}</p>
              <p className="muted">
                {selectedDoctor.department} • Room {selectedDoctor.room}
              </p>
              <p className="muted">
                Consultation: ~{selectedDoctor.consultation_duration} min
              </p>
              <p className="fees-row">
                <strong>₹{selectedDoctor.fees}</strong> consultation fee
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Confirmation modal */}
      {showConfirm && selectedDoctor && (
        <div
          className="confirm-modal-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Appointment</h2>
            <div className="confirm-details">
              <div>
                <span>Doctor</span>
                <strong>{selectedDoctor.name}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{selectedDoctor.department}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{date}</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>{formatSlot(time)}</strong>
              </div>
              <div>
                <span>Fee</span>
                <strong>₹{selectedDoctor.fees}</strong>
              </div>
            </div>
            <div className="confirm-actions">
              <button
                type="button"
                className="feature-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="feature-primary"
                onClick={confirmBooking}
              >
                Confirm & Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

function getInitials(name) {
  return (name || "Patient")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function DoctorPatients() {
  const [appointments, setAppointments] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Patient detail modal
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await api.doctorAppointments();
      setAppointments(r.appointments || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Row click → load patient details
  async function openPatient(patientId) {
    if (!patientId) return;
    setSelectedPatientId(patientId);
    setPatientDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const r = await api.doctorPatientDetail(patientId);
      setPatientDetail(r.patient);
    } catch (e) {
      setDetailError(e.message || "Unable to load patient details");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeModal() {
    setSelectedPatientId(null);
    setPatientDetail(null);
    setDetailError("");
  }

  const patients = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      const key = a.patient_id ?? a.patient;
      if (!map.has(key))
        map.set(key, {
          id: key,
          name: a.patient || "Patient",
          last: a.date,
          department: a.department,
          visits: 0,
          status: a.status,
        });
      const p = map.get(key);
      p.visits += 1;
      if (String(a.date) > String(p.last)) {
        p.last = a.date;
        p.status = a.status;
      }
    });
    return [...map.values()].filter(
      (p) => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase())
    );
  }, [appointments, q]);

  return (
    <div className="admin-list-page inner-page">
      <div className="admin-list-header">
        <div>
          <div className="admin-breadcrumb">Doctor / My Patients</div>
          <h1>
            <Icon name="users" size={23} />
            My Patients
          </h1>
          <p>Patients with appointments assigned to your doctor account.</p>
        </div>
        <button className="btn btn-blue" onClick={load} disabled={loading}>
          <Icon name="refresh" size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Icon name="search" size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patients..."
          />
        </div>
        <span>
          {patients.length} patient{patients.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-data-panel">
        {loading ? (
          <div className="empty-state loading-state">
            <span className="loading-spinner" />
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <Icon name="users" size={30} />
            <strong>No patients found</strong>
            <span>Assigned patient appointments will appear here.</span>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Appointments</th>
                  <th>Last appointment</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="clickable-row"
                    onClick={() => openPatient(p.id)}
                  >
                    <td>
                      <div className="patient-cell">
                        <div className="patient-mini-avatar">
                          {getInitials(p.name)}
                        </div>
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td>{p.department || "—"}</td>
                    <td>{p.visits}</td>
                    <td>{p.last || "—"}</td>
                    <td>
                      <span
                        className={`status-pill status-${String(
                          p.status || ""
                        ).toLowerCase()}`}
                      >
                        <i className="status-dot" />
                        {p.status || "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPatient(p.id);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== PATIENT DETAIL MODAL ===== */}
      {selectedPatientId && (
        <div className="doctor-modal-backdrop" onClick={closeModal}>
          <div
            className="doctor-modal patient-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="modal-loading">
                <span className="loading-spinner" />
                Loading patient details...
              </div>
            ) : detailError ? (
              <div className="feature-error">
                <Icon name="info" size={16} />
                {detailError}
              </div>
            ) : patientDetail ? (
              <>
                {/* Header */}
                <div className="doctor-modal-header">
                  <div className="patient-detail-head">
                    <div className="patient-detail-avatar">
                      {getInitials(patientDetail.name)}
                    </div>
                    <div>
                      <span>Patient Details</span>
                      <h3>{patientDetail.name}</h3>
                      <p className="patient-detail-sub">
                        {patientDetail.gender || "—"}
                        {patientDetail.age
                          ? ` · ${patientDetail.age} yrs`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <button onClick={closeModal} aria-label="Close">
                    ×
                  </button>
                </div>

                {/* Blood group — CRITICAL */}
                <div className="blood-group-banner">
                  <div className="blood-group-icon">🩸</div>
                  <div className="blood-group-copy">
                    <span>Blood Group</span>
                    <strong>{patientDetail.blood_group || "Not recorded"}</strong>
                  </div>
                  {!patientDetail.blood_group && (
                    <span className="blood-group-warning">Ask patient</span>
                  )}
                </div>

                {/* Contact Info */}
                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <small>Phone</small>
                      <strong>{patientDetail.phone || "—"}</strong>
                    </div>
                    <div className="detail-item">
                      <small>Email</small>
                      <strong>{patientDetail.email || "—"}</strong>
                    </div>
                    <div className="detail-item">
                      <small>Date of Birth</small>
                      <strong>{formatDate(patientDetail.date_of_birth)}</strong>
                    </div>
                    <div className="detail-item">
                      <small>Gender</small>
                      <strong>{patientDetail.gender || "—"}</strong>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="detail-section emergency-section">
                  <h4>
                    <Icon name="info" size={14} /> Emergency Contact
                  </h4>
                  <div className="emergency-value">
                    {patientDetail.emergency_contact ? (
                      <strong>{patientDetail.emergency_contact}</strong>
                    ) : (
                      <span className="missing-info">
                        Not provided — ask patient to update
                      </span>
                    )}
                  </div>
                </div>

                {/* Address */}
                {patientDetail.address && (
                  <div className="detail-section">
                    <h4>Address</h4>
                    <p className="detail-text">{patientDetail.address}</p>
                  </div>
                )}

                {/* Visit Stats */}
                <div className="detail-section">
                  <h4>Visit Summary</h4>
                  <div className="visit-stats">
                    <div className="visit-stat">
                      <strong>{patientDetail.total_visits}</strong>
                      <span>Total Visits</span>
                    </div>
                    <div className="visit-stat">
                      <strong>{formatDate(patientDetail.last_visit)}</strong>
                      <span>Last Visit</span>
                    </div>
                  </div>
                </div>

                {/* Recent Appointments */}
                {patientDetail.appointments?.length > 0 && (
                  <div className="detail-section">
                    <h4>Recent Appointments</h4>
                    <div className="appt-history-list">
                      {patientDetail.appointments.slice(0, 5).map((a) => (
                        <div className="appt-history-row" key={a.id}>
                          <div className="appt-history-date">
                            <strong>{a.date || "—"}</strong>
                            <span>{a.time || ""}</span>
                          </div>
                          <div className="appt-history-reason">
                            {a.reason || "Consultation"}
                          </div>
                          <span
                            className={`status-pill status-${String(
                              a.status || ""
                            ).toLowerCase()}`}
                          >
                            <i className="status-dot" />
                            {a.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="doctor-modal-actions">
                  <button
                    className="doctor-outline-btn"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
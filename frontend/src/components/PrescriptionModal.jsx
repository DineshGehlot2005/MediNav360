import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { api } from "../api.js";
import Icon from "./Icon.jsx";

const EMPTY_MED = { name: "", dosage: "", duration: "", notes: "" };

export default function PrescriptionModal({
  appointmentId,
  mode = "edit", // "edit" | "view"
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }]);
  const [advice, setAdvice] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [meta, setMeta] = useState(null);

  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription-${meta?.patient_name || "Patient"}`,
  });

  // Load existing prescription
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const r = isEdit
          ? await api.getDoctorPrescription(appointmentId)
          : await api.getPatientPrescription(appointmentId);

        if (r.prescription) {
          const p = r.prescription;
          setDiagnosis(p.diagnosis || "");
          setMedicines(
            p.medicines?.length ? p.medicines : [{ ...EMPTY_MED }]
          );
          setAdvice(p.advice || "");
          setFollowUp(p.follow_up_date || "");
          setMeta({
            doctor_name: p.doctor_name,
            doctor_qualification: p.doctor_qualification,
            doctor_specialization: p.doctor_specialization,
            patient_name: p.patient_name,
            appointment_date: p.appointment_date,
            appointment_time: p.appointment_time,
          });
        } else if (!isEdit) {
          setError("No prescription has been issued for this appointment yet.");
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [appointmentId, isEdit]);

  function updateMed(index, field, value) {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function addMed() {
    setMedicines((prev) => [...prev, { ...EMPTY_MED }]);
  }

  function removeMed(index) {
    setMedicines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  }

  async function save() {
    setError("");
    if (!diagnosis.trim()) {
      setError("Please enter a diagnosis.");
      return;
    }
    const validMeds = medicines.filter((m) => m.name.trim());
    if (!validMeds.length) {
      setError("Please add at least one medicine.");
      return;
    }
    setSaving(true);
    try {
      await api.savePrescription(appointmentId, {
        diagnosis,
        medicines: validMeds,
        advice,
        follow_up_date: followUp,
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="doctor-modal-backdrop" onClick={onClose}>
      <div
        className="doctor-modal prescription-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="doctor-modal-header">
          <div>
            <span>
              {isEdit ? "Write Prescription" : "Prescription"}
            </span>
            <h3>{meta?.patient_name || "Patient"}</h3>
          </div>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {saved && (
          <div className="feature-success" style={{ marginBottom: 16 }}>
            <Icon name="check" size={16} /> Prescription saved successfully.
          </div>
        )}
        {error && (
          <div className="feature-error" style={{ marginBottom: 16 }}>
            <Icon name="info" size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="modal-loading">
            <span className="loading-spinner" /> Loading...
          </div>
        ) : (
          <>
            {/* ===== EDIT FORM ===== */}
            {isEdit ? (
              <div className="rx-form">
                <label className="rx-label">
                  Diagnosis <span className="req">*</span>
                  <input
                    className="rx-input"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value.slice(0, 200))}
                    placeholder="e.g. Acute gastritis"
                  />
                </label>

                <div className="rx-med-section">
                  <div className="rx-med-head">
                    <h4>Medicines</h4>
                    <button
                      type="button"
                      className="rx-add-btn"
                      onClick={addMed}
                    >
                      <Icon name="plus" size={14} /> Add Medicine
                    </button>
                  </div>

                  {medicines.map((m, i) => (
                    <div className="rx-med-row" key={i}>
                      <div className="rx-med-num">{i + 1}</div>
                      <div className="rx-med-fields">
                        <input
                          className="rx-input"
                          placeholder="Medicine name (e.g. Paracetamol 500mg)"
                          value={m.name}
                          onChange={(e) =>
                            updateMed(i, "name", e.target.value)
                          }
                        />
                        <div className="rx-med-inline">
                          <input
                            className="rx-input"
                            placeholder="Dosage (e.g. 1-0-1 after meals)"
                            value={m.dosage}
                            onChange={(e) =>
                              updateMed(i, "dosage", e.target.value)
                            }
                          />
                          <input
                            className="rx-input"
                            placeholder="Duration (e.g. 5 days)"
                            value={m.duration}
                            onChange={(e) =>
                              updateMed(i, "duration", e.target.value)
                            }
                          />
                        </div>
                        <input
                          className="rx-input"
                          placeholder="Notes (optional)"
                          value={m.notes}
                          onChange={(e) =>
                            updateMed(i, "notes", e.target.value)
                          }
                        />
                      </div>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          className="rx-remove-btn"
                          onClick={() => removeMed(i)}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <label className="rx-label">
                  Advice
                  <textarea
                    className="rx-input"
                    rows={3}
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value.slice(0, 400))}
                    placeholder="e.g. Drink plenty of water, avoid spicy food..."
                  />
                </label>

                <label className="rx-label">
                  Follow-up date (optional)
                  <input
                    type="date"
                    className="rx-input"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                  />
                </label>

                <div className="doctor-modal-actions">
                  <button
                    type="button"
                    className="doctor-primary-btn"
                    onClick={save}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="button-spinner" /> Saving...
                      </>
                    ) : (
                      <>
                        <Icon name="check" size={15} /> Save Prescription
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="doctor-outline-btn"
                    onClick={handlePrint}
                    disabled={saving}
                  >
                    <Icon name="file" size={15} /> Print Preview
                  </button>
                  <button
                    type="button"
                    className="doctor-outline-btn"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ===== VIEW MODE — Printable ===== */}
                <div className="rx-print-area" ref={printRef}>
                  <div className="rx-print-head">
                    <div className="rx-clinic-brand">
                      <div className="rx-clinic-logo">+</div>
                      <div>
                        <h2>Smart Hospital</h2>
                        <p>MediNav360 Healthcare</p>
                      </div>
                    </div>
                    <div className="rx-print-meta">
                      <strong>{today}</strong>
                      <span>Rx ID: #{meta?.appointment_date?.replaceAll("-", "") || ""}-{appointmentId}</span>
                    </div>
                  </div>

                  <div className="rx-print-patient">
                    <div>
                      <small>Patient Name</small>
                      <strong>{meta?.patient_name || "—"}</strong>
                    </div>
                    <div>
                      <small>Date</small>
                      <strong>{meta?.appointment_date || "—"}</strong>
                    </div>
                    <div>
                      <small>Time</small>
                      <strong>{meta?.appointment_time || "—"}</strong>
                    </div>
                  </div>

                  <div className="rx-print-section">
                    <h4>Diagnosis</h4>
                    <p>{diagnosis || "—"}</p>
                  </div>

                  <div className="rx-print-section">
                    <h4>Prescribed Medicines</h4>
                    <table className="rx-print-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines
                          .filter((m) => m.name)
                          .map((m, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>
                                <strong>{m.name}</strong>
                                {m.notes && <small>{m.notes}</small>}
                              </td>
                              <td>{m.dosage || "—"}</td>
                              <td>{m.duration || "—"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {advice && (
                    <div className="rx-print-section">
                      <h4>Advice</h4>
                      <p>{advice}</p>
                    </div>
                  )}

                  {followUp && (
                    <div className="rx-print-section">
                      <h4>Follow-up</h4>
                      <p>{followUp}</p>
                    </div>
                  )}

                  <div className="rx-print-footer">
                    <div className="rx-sign">
                      <div className="rx-sign-line" />
                      <strong>{meta?.doctor_name || "Doctor"}</strong>
                      <span>
                        {meta?.doctor_qualification || ""}
                      </span>
                      <span>
                        {meta?.doctor_specialization || ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="doctor-modal-actions no-print">
                  <button
                    type="button"
                    className="doctor-primary-btn"
                    onClick={handlePrint}
                  >
                    <Icon name="file" size={15} /> Print / Save PDF
                  </button>
                  <button
                    type="button"
                    className="doctor-outline-btn"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
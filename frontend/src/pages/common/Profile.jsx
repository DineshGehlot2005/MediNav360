import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const LANGUAGE_OPTIONS = [
  "Hindi",
  "English",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Marwari",
  "Urdu",
];

export default function Profile({ user, role, onUserChange }) {
  const isDoctor = role === "DOCTOR";
  const isPatient = role === "PATIENT";
  const title = isDoctor ? "Doctor Profile" : "My Profile";

  const [patientInfo, setPatientInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  // Shared form
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    // patient
    date_of_birth: "",
    gender: "",
    address: "",
    blood_group: "",
    emergency_contact: "",
    // doctor
    qualification: "",
    specialization: "",
    experience: "",
    room_number: "",
    fees: "",
    consultation_duration: "",
    bio: "",
    languages: "",
    is_available: true,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const r = await api.getProfile();
        setPatientInfo(r.patient || null);
        setDoctorInfo(r.doctor || null);

        setForm({
          name: r.user?.name || "",
          email: r.user?.email || "",
          phone: r.user?.phone || "",
          date_of_birth: r.patient?.date_of_birth || "",
          gender: r.patient?.gender || "",
          address: r.patient?.address || "",
          blood_group: r.patient?.blood_group || "",
          emergency_contact: r.patient?.emergency_contact || "",
          qualification: r.doctor?.qualification || "",
          specialization: r.doctor?.specialization || "",
          experience: r.doctor?.experience ?? "",
          room_number: r.doctor?.room_number || "",
          fees: r.doctor?.fees ?? "",
          consultation_duration: r.doctor?.consultation_duration ?? "",
          bio: r.doctor?.bio || "",
          languages: r.doctor?.languages || "",
          is_available: r.doctor?.is_available ?? true,
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const initials = useMemo(
    () =>
      (form.name || "User")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [form.name]
  );

  const completeness = useMemo(() => {
    if (!isPatient) return 100;
    const fields = [
      form.name,
      form.phone,
      form.date_of_birth,
      form.gender,
      form.address,
      form.blood_group,
      form.emergency_contact,
    ];
    const filled = fields.filter((f) => f && String(f).trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, isPatient]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
    setForm((prev) => ({
      ...prev,
      name: user?.name || "",
      phone: user?.phone || "",
      date_of_birth: patientInfo?.date_of_birth || "",
      gender: patientInfo?.gender || "",
      address: patientInfo?.address || "",
      blood_group: patientInfo?.blood_group || "",
      emergency_contact: patientInfo?.emergency_contact || "",
      qualification: doctorInfo?.qualification || "",
      specialization: doctorInfo?.specialization || "",
      experience: doctorInfo?.experience ?? "",
      room_number: doctorInfo?.room_number || "",
      fees: doctorInfo?.fees ?? "",
      consultation_duration: doctorInfo?.consultation_duration ?? "",
      bio: doctorInfo?.bio || "",
      languages: doctorInfo?.languages || "",
      is_available: doctorInfo?.is_available ?? true,
    }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
      };

      if (isPatient) {
        payload.date_of_birth = form.date_of_birth;
        payload.gender = form.gender;
        payload.address = form.address;
        payload.blood_group = form.blood_group;
        payload.emergency_contact = form.emergency_contact;
      }

      if (isDoctor) {
        payload.qualification = form.qualification;
        payload.specialization = form.specialization;
        payload.experience = form.experience;
        payload.room_number = form.room_number;
        payload.fees = form.fees;
        payload.consultation_duration = form.consultation_duration;
        payload.bio = form.bio;
        payload.languages = form.languages;
        payload.is_available = form.is_available;
      }

      await api.updateProfile(payload);
      onUserChange?.({ ...user, name: form.name, phone: form.phone });

      if (isPatient) {
        setPatientInfo({
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          address: form.address,
          blood_group: form.blood_group,
          emergency_contact: form.emergency_contact,
        });
      }

      if (isDoctor) {
        setDoctorInfo({
          ...doctorInfo,
          qualification: form.qualification,
          specialization: form.specialization,
          experience: Number(form.experience) || null,
          room_number: form.room_number,
          fees: Number(form.fees) || 500,
          consultation_duration: Number(form.consultation_duration) || 15,
          bio: form.bio,
          languages: form.languages,
          is_available: form.is_available,
        });
      }

      setSaved("Profile updated successfully.");
      setEditing(false);
      setTimeout(() => setSaved(""), 4000);
    } catch (err) {
      setError(err.message || "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-feature-page inner-page">
        <div className="feature-empty loading-state">
          <span className="loading-spinner" /> Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="app-feature-page inner-page profile-page">
      <div className="feature-page-header">
        <div>
          <span className="feature-eyebrow">Account</span>
          <h1>{title}</h1>
          <p>Keep your personal and professional information clear and up to date.</p>
        </div>
        <div className="feature-avatar">{initials}</div>
      </div>

      {saved && (
        <div className="feature-success">
          <Icon name="check" size={16} /> {saved}
        </div>
      )}

      {error && (
        <div className="feature-error">
          <Icon name="info" size={16} /> {error}
        </div>
      )}

      {/* Profile completeness (patients) */}
      {isPatient && !editing && (
        <div className={`profile-completeness ${completeness === 100 ? "complete" : ""}`}>
          <div className="completeness-head">
            <div>
              <strong>Profile Completeness</strong>
              <span>
                {completeness === 100
                  ? "Your profile is complete."
                  : "Complete your profile for better care."}
              </span>
            </div>
            <div className="completeness-value">{completeness}%</div>
          </div>
          <div className="completeness-bar">
            <div
              className="completeness-fill"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== DOCTOR: Patient preview ===== */}
      {isDoctor && doctorInfo && !editing && (
        <div className="doctor-preview-banner">
          <div className="preview-head">
            <Icon name="info" size={15} />
            <span>This is how your card appears to patients on the booking page</span>
          </div>
          <div className="preview-card">
            <div className="preview-photo">
              {doctorInfo.photo_url ? (
                <img src={doctorInfo.photo_url} alt={form.name} />
              ) : (
                <div className="preview-photo-fallback">{initials}</div>
              )}
            </div>
            <div className="preview-body">
              <h3>{form.name || "Your Name"}</h3>
              <p>{doctorInfo.qualification || "Qualification not set"}</p>
              <div className="preview-meta">
                <span className="preview-rating">
                  ⭐ {(doctorInfo.rating || 4.5).toFixed(1)}{" "}
                  <small>({doctorInfo.review_count || 0})</small>
                </span>
                <span>{doctorInfo.experience || 0} yrs exp</span>
              </div>
              <div className="preview-footer">
                <span className="preview-fees">₹{doctorInfo.fees || 500}</span>
                <span className="preview-room">
                  {doctorInfo.room_number ? `Room ${doctorInfo.room_number}` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="profile-layout">
        {/* ===== LEFT: Personal Info ===== */}
        <section className="feature-card">
          <div className="feature-card-title">
            <Icon name="user" size={18} />
            <h2>Personal Information</h2>
          </div>

          <form className="feature-form" onSubmit={save}>
            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={!editing}
                required
              />
            </label>

            <label>
              Email
              <input value={form.email} disabled />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                disabled={!editing}
                placeholder="Add phone number"
              />
            </label>

            {editing && (
              <div className="feature-form-actions">
                <button type="submit" className="feature-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="button-spinner" /> Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={16} /> Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="feature-secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>

          {!editing && (
            <button
              type="button"
              className="feature-primary profile-edit-btn"
              onClick={() => setEditing(true)}
            >
              <Icon name="file" size={16} /> Edit Profile
            </button>
          )}
        </section>

        {/* ===== RIGHT: Medical Info (patient) OR Professional Info (doctor) ===== */}
        {isPatient ? (
          <section className="feature-card">
            <div className="feature-card-title">
              <Icon name="heart" size={18} />
              <h2>Medical Information</h2>
            </div>

            <form className="feature-form" onSubmit={save}>
              <div className="auth-two">
                <label>
                  Date of birth
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setField("date_of_birth", e.target.value)}
                    disabled={!editing}
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={form.gender}
                    onChange={(e) => setField("gender", e.target.value)}
                    disabled={!editing}
                  >
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="auth-two">
                <label>
                  Blood group
                  <select
                    value={form.blood_group}
                    onChange={(e) => setField("blood_group", e.target.value)}
                    disabled={!editing}
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Emergency contact
                  <input
                    value={form.emergency_contact}
                    onChange={(e) => setField("emergency_contact", e.target.value)}
                    disabled={!editing}
                    placeholder="e.g. 9876543210"
                  />
                </label>
              </div>

              <label>
                Address
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  disabled={!editing}
                  placeholder="Add your address"
                />
              </label>
            </form>
          </section>
        ) : (
          <section className="feature-card">
            <div className="feature-card-title">
              <Icon name="shield" size={18} />
              <h2>Professional Information</h2>
            </div>

            <form className="feature-form" onSubmit={save}>
              <label>
                Qualification
                <input
                  value={form.qualification}
                  onChange={(e) => setField("qualification", e.target.value)}
                  disabled={!editing}
                  placeholder="e.g. MBBS, MD (Cardiology)"
                />
              </label>

              <div className="auth-two">
                <label>
                  Specialization
                  <input
                    value={form.specialization}
                    onChange={(e) => setField("specialization", e.target.value)}
                    disabled={!editing}
                    placeholder="e.g. Cardiology"
                  />
                </label>

                <label>
                  Experience (years)
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.experience}
                    onChange={(e) => setField("experience", e.target.value)}
                    disabled={!editing}
                    placeholder="e.g. 10"
                  />
                </label>
              </div>

              <div className="auth-two">
                <label>
                  Consultation Fee (₹)
                  <input
                    type="number"
                    min="0"
                    value={form.fees}
                    onChange={(e) => setField("fees", e.target.value)}
                    disabled={!editing}
                    placeholder="e.g. 500"
                  />
                </label>

                <label>
                  Consultation Duration (min)
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={form.consultation_duration}
                    onChange={(e) => setField("consultation_duration", e.target.value)}
                    disabled={!editing}
                    placeholder="e.g. 15"
                  />
                </label>
              </div>

              <label>
                Room number
                <input
                  value={form.room_number}
                  onChange={(e) => setField("room_number", e.target.value)}
                  disabled={!editing}
                  placeholder="e.g. 204"
                />
              </label>

              <label>
                Languages spoken
                <input
                  value={form.languages}
                  onChange={(e) => setField("languages", e.target.value)}
                  disabled={!editing}
                  placeholder="e.g. Hindi, English"
                />
                {editing && (
                  <div className="language-chips">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const current = form.languages
                        .split(",")
                        .map((l) => l.trim())
                        .filter(Boolean);
                      const isSelected = current.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          className={`language-chip ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            const next = isSelected
                              ? current.filter((l) => l !== lang)
                              : [...current, lang];
                            setField("languages", next.join(", "));
                          }}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                )}
              </label>

              <label>
                Short bio
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value.slice(0, 400))}
                  disabled={!editing}
                  placeholder="A short description about your practice..."
                />
                {editing && (
                  <small className="field-counter">{form.bio.length}/400</small>
                )}
              </label>

              {editing && (
                <div className="availability-toggle-wrap">
                  <div>
                    <strong>Currently accepting patients</strong>
                    <span>Turn off to hide your profile from new bookings.</span>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${form.is_available ? "on" : ""}`}
                    onClick={() => setField("is_available", !form.is_available)}
                    aria-label="Toggle availability"
                  >
                    <i />
                  </button>
                </div>
              )}
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
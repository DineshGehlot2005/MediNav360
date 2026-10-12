import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function Profile({ user, role, onUserChange }) {
  const isDoctor = role === "DOCTOR";
  const isPatient = role === "PATIENT";
  const title = isDoctor ? "Doctor Profile" : "My Profile";

  const [doctorInfo, setDoctorInfo] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date_of_birth: "",
    gender: "",
    address: "",
    blood_group: "",
    emergency_contact: "",
  });

  // Load profile
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const r = await api.getProfile();
        setPatientInfo(r.patient || null);

        setForm({
          name: r.user?.name || "",
          email: r.user?.email || "",
          phone: r.user?.phone || "",
          date_of_birth: r.patient?.date_of_birth || "",
          gender: r.patient?.gender || "",
          address: r.patient?.address || "",
          blood_group: r.patient?.blood_group || "",
          emergency_contact: r.patient?.emergency_contact || "",
        });

        if (isDoctor) {
          const d = await api.doctorAppointments().catch(() => null);
          setDoctorInfo(d?.doctor || null);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isDoctor]);

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

  // Profile completeness (patients only)
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
    // reset
    setForm((prev) => ({
      ...prev,
      name: user?.name || "",
      phone: user?.phone || "",
      date_of_birth: patientInfo?.date_of_birth || "",
      gender: patientInfo?.gender || "",
      address: patientInfo?.address || "",
      blood_group: patientInfo?.blood_group || "",
      emergency_contact: patientInfo?.emergency_contact || "",
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
      await api.updateProfile(payload);

      onUserChange?.({ ...user, name: form.name, phone: form.phone });

      setPatientInfo({
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        address: form.address,
        blood_group: form.blood_group,
        emergency_contact: form.emergency_contact,
      });

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
          <p>Keep your personal and medical information clear and up to date.</p>
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

      {/* ===== PROFILE COMPLETENESS (patients) ===== */}
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
                <button
                  type="submit"
                  className="feature-primary"
                  disabled={saving}
                >
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

        {/* ===== RIGHT: Medical Info (patients) or Account (doctors) ===== */}
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
                    onChange={(e) =>
                      setField("emergency_contact", e.target.value)
                    }
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
              <h2>Account Summary</h2>
            </div>

            <div className="summary-row">
              <span>Role</span>
              <strong>{isDoctor ? "Doctor" : "Administrator"}</strong>
            </div>
            <div className="summary-row">
              <span>Account ID</span>
              <strong>#{user?.id ?? "—"}</strong>
            </div>

            {isDoctor && doctorInfo && (
              <>
                <div className="summary-row">
                  <span>Department</span>
                  <strong>{doctorInfo.department}</strong>
                </div>
                <div className="summary-row">
                  <span>Specialization</span>
                  <strong>{doctorInfo.specialization || "—"}</strong>
                </div>
                <div className="summary-row">
                  <span>Room</span>
                  <strong>{doctorInfo.room || "—"}</strong>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
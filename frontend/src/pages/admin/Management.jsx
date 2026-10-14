import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

const CONFIG = {
  patients: {
    title: "Patients",
    icon: "users",
    load: api.adminPatients,
    columns: ["name", "email", "phone", "gender", "active"],
  },
  doctors: {
    title: "Doctors",
    icon: "user",
    load: api.adminDoctors,
    columns: [
      "name",
      "department",
      "specialization",
      "room",
      "available",
      "actions",
    ],
  },
  appointments: {
    title: "Appointments",
    icon: "calendar",
    load: api.adminAppointments,
    columns: [
      "patient",
      "doctor",
      "department",
      "date",
      "time",
      "status",
      "token",
    ],
  },
};

const labels = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  gender: "Gender",
  active: "Status",
  department: "Department",
  specialization: "Specialization",
  room: "Room",
  available: "Availability",
  patient: "Patient",
  doctor: "Doctor",
  date: "Date",
  time: "Time",
  status: "Status",
  token: "Token",
  actions: "Actions",
};

export default function AdminManagement({ type }) {
  const cfg = CONFIG[type];
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const isDoctors = type === "doctors";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await cfg.load(q);
      setRows(r[type]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type]);

  async function handleResetPassword(row) {
    if (!window.confirm(`Generate a new password for ${row.name}?`)) return;
    try {
      const r = await api.adminResetDoctorPassword(row.id);
      setCredentials(r.credentials);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleStatus(row) {
    const action = row.available ? "Deactivate" : "Activate";
    if (!window.confirm(`${action} ${row.name}?`)) return;
    try {
      await api.adminToggleDoctorStatus(row.id, !row.available);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="admin-list-page">
      <div className="admin-list-header">
        <div>
          <div className="admin-breadcrumb">Admin / {cfg.title}</div>
          <h1>
            <Icon name={cfg.icon} size={23} />
            {cfg.title}
          </h1>
          <p>Manage hospital {cfg.title.toLowerCase()} from the live database.</p>
        </div>
        <div className="admin-header-actions">
          {isDoctors && (
            <button className="btn btn-blue" onClick={() => setShowAdd(true)}>
              <span style={{ fontSize: 18, lineHeight: 1, marginRight: 4 }}>
                +
              </span>{" "}
              Add Doctor
            </button>
          )}
          <button className="btn btn-white" onClick={load}>
            <Icon name="refresh" size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Icon name="search" size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder={`Search ${cfg.title.toLowerCase()}...`}
          />
        </div>
        <span>
          {rows.length} record{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <section className="admin-data-panel">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : error ? (
          <div className="admin-error">{error}</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No records found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {cfg.columns.map((c) => (
                    <th key={c}>{labels[c]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {cfg.columns.map((c) => (
                      <td key={c}>
                        {c === "actions" ? (
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="table-action"
                              onClick={() => handleResetPassword(row)}
                              title="Reset password"
                            >
                              🔑 Reset
                            </button>
                            <button
                              type="button"
                              className={`table-action ${
                                row.available ? "danger" : ""
                              }`}
                              onClick={() => handleToggleStatus(row)}
                            >
                              {row.available ? "🚫 Deactivate" : "✓ Activate"}
                            </button>
                          </div>
                        ) : c === "status" ? (
                          <span
                            className={`status-pill status-${String(
                              row[c]
                            ).toLowerCase()}`}
                          >
                            <i className="status-dot" />
                            {row[c]}
                          </span>
                        ) : c === "active" || c === "available" ? (
                          <span
                            className={
                              row[c] ? "admin-active" : "admin-inactive"
                            }
                          >
                            {row[c] ? "Active" : "Inactive"}
                          </span>
                        ) : (
                          row[c] ?? "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAdd && isDoctors && (
        <AddDoctorModal
          onClose={() => setShowAdd(false)}
          onSaved={(creds) => {
            setShowAdd(false);
            setCredentials(creds);
            load();
          }}
        />
      )}

      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}

function AddDoctorModal({ onClose, onSaved }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department_id: "",
    qualification: "",
    specialization: "",
    experience: "",
    room_number: "",
    fees: 500,
    consultation_duration: 15,
    languages: "Hindi, English",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .adminDepartments()
      .then((r) => setDepartments(r.departments || []))
      .catch(() => {});
  }, []);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const r = await api.adminCreateDoctor({
        ...form,
        department_id: Number(form.department_id),
        experience: form.experience ? Number(form.experience) : null,
        fees: Number(form.fees) || 500,
        consultation_duration: Number(form.consultation_duration) || 15,
      });
      onSaved(r.credentials);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="doctor-modal-backdrop" onClick={onClose}>
      <div
        className="doctor-modal add-doctor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="doctor-modal-header">
          <div>
            <span>Admin Action</span>
            <h3>Add New Doctor</h3>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        <p className="modal-description">
          Create a new doctor account. A strong password will be auto-generated
          and shown after saving.
        </p>

        <form className="add-doctor-form" onSubmit={save}>
          <div className="add-doctor-grid">
            <label>
              Full Name *
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </label>
            <label>
              Email *
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </label>
            <label>
              Phone *
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </label>
            <label>
              Department *
              <select
                value={form.department_id}
                onChange={(e) => update("department_id", e.target.value)}
                required
              >
                <option value="">Select department</option>
                {departments
                  .filter((d) => d.is_active)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Qualification
              <input
                value={form.qualification}
                onChange={(e) => update("qualification", e.target.value)}
                placeholder="MBBS, MD"
              />
            </label>
            <label>
              Specialization
              <input
                value={form.specialization}
                onChange={(e) => update("specialization", e.target.value)}
                placeholder="Cardiology"
              />
            </label>
            <label>
              Experience (years)
              <input
                type="number"
                min="0"
                max="60"
                value={form.experience}
                onChange={(e) => update("experience", e.target.value)}
              />
            </label>
            <label>
              Room Number
              <input
                value={form.room_number}
                onChange={(e) => update("room_number", e.target.value)}
              />
            </label>
            <label>
              Consultation Fee (₹)
              <input
                type="number"
                min="0"
                value={form.fees}
                onChange={(e) => update("fees", e.target.value)}
              />
            </label>
            <label>
              Consultation Duration (min)
              <input
                type="number"
                min="5"
                max="60"
                value={form.consultation_duration}
                onChange={(e) =>
                  update("consultation_duration", e.target.value)
                }
              />
            </label>
            <label className="full-width">
              Languages
              <input
                value={form.languages}
                onChange={(e) => update("languages", e.target.value)}
                placeholder="Hindi, English"
              />
            </label>
            <label className="full-width">
              Short Bio
              <textarea
                rows={2}
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="Brief description..."
              />
            </label>
          </div>

          {error && (
            <div className="feature-error">
              <Icon name="info" size={15} /> {error}
            </div>
          )}

          <div className="doctor-modal-actions">
            <button
              type="submit"
              className="doctor-primary-btn"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Doctor Account"}
            </button>
            <button
              type="button"
              className="doctor-outline-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CredentialsModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(null);

  function copy(value, field) {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="doctor-modal-backdrop" onClick={onClose}>
      <div
        className="doctor-modal credentials-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="doctor-modal-header">
          <div>
            <span>Success</span>
            <h3>Doctor Account Credentials</h3>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        <div className="credentials-box">
          <p className="credentials-note">
            ⚠️ Share these credentials with the doctor. This password will not
            be shown again.
          </p>

          <div className="credential-row">
            <div>
              <small>Email</small>
              <strong>{credentials.email}</strong>
            </div>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copy(credentials.email, "email")}
            >
              {copied === "email" ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div className="credential-row">
            <div>
              <small>Password</small>
              <strong className="password-mono">
                {credentials.password}
              </strong>
            </div>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copy(credentials.password, "password")}
            >
              {copied === "password" ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="doctor-modal-actions">
          <button
            type="button"
            className="doctor-primary-btn"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDepartments() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    floor: 1,
    room: "",
    description: "",
  });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const r = await api.adminDepartments();
      setRows(r.departments);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) await api.adminUpdateDepartment(editing, form);
      else await api.adminCreateDepartment(form);
      setForm({ name: "", code: "", floor: 1, room: "", description: "" });
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="admin-list-page">
      <div className="admin-list-header">
        <div>
          <div className="admin-breadcrumb">Admin / Departments</div>
          <h1>
            <Icon name="grid" size={23} />
            Departments
          </h1>
          <p>Add, update or deactivate hospital departments.</p>
        </div>
      </div>
      <div className="admin-dept-layout">
        <form className="admin-form-panel" onSubmit={save}>
          <h2>{editing ? "Edit Department" : "Add Department"}</h2>
          {["name", "code", "room", "description"].map((k) => (
            <label key={k}>
              {labels[k] || k}
              <input
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                required={k === "name" || k === "code"}
              />
            </label>
          ))}
          <label>
            Floor
            <input
              type="number"
              min="1"
              value={form.floor}
              onChange={(e) =>
                setForm({ ...form, floor: Number(e.target.value) })
              }
            />
          </label>
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-form-actions">
            <button className="btn btn-blue">
              {editing ? "Save Changes" : "Add Department"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn btn-white"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    code: "",
                    floor: 1,
                    room: "",
                    description: "",
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <section className="admin-data-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title">
              <Icon name="grid" size={18} />
              <h2>Configured Departments</h2>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Floor</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.code}</td>
                    <td>{d.floor}</td>
                    <td>{d.room || "—"}</td>
                    <td>
                      <span
                        className={
                          d.is_active ? "admin-active" : "admin-inactive"
                        }
                      >
                        {d.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => {
                          setEditing(d.id);
                          setForm({
                            name: d.name,
                            code: d.code,
                            floor: d.floor,
                            room: d.room || "",
                            description: d.description || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      {d.is_active && (
                        <button
                          className="table-action danger"
                          onClick={async () => {
                            await api.adminDeleteDepartment(d.id);
                            load();
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { api } from "../api.js";

const DEMO = [
  ["Patient", "patient@hospital.demo", "patient123"],
  ["Doctor", "doctor.cardio@hospital.demo", "doctor123"],
  ["Admin", "admin@hospital.demo", "admin123"],
];

export default function Landing({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    blood_group: "",
    emergency_contact: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isProd, setIsProd] = useState(true);  // ← Fail-safe: assume production

useEffect(() => {
  api.getConfig()
    .then((r) => setIsProd(r.is_production === true))
    .catch(() => setIsProd(true));  // ← Fail → production mode
}, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await api.login(form.email, form.password)
          : await api.register(form);
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(e, email, password) {
    e.preventDefault();
    e.stopPropagation();
    setForm((f) => ({ ...f, email, password }));
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-mark auth-mark">+</div>
        <div>
          <strong>Smart Hospital</strong>
          <span>Navigation System</span>
        </div>
      </div>
      <div className="auth-layout">
        <section className="auth-intro">
          <span className="auth-kicker">SMART HOSPITAL NAVIGATION</span>
          <h1>
            Better navigation.
            <br />
            <strong>Better care.</strong>
          </h1>
          <p>
            Appointments, department assistance, token management and indoor
            hospital navigation in one place.
          </p>
          <div className="auth-features">
            <span>✓ Patient appointments</span>
            <span>✓ Doctor queue management</span>
            <span>✓ Hospital navigation</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Patient Registration
            </button>
          </div>

          <div className="auth-card-heading">
            <h2>
              {mode === "login" ? "Welcome back" : "Create your patient account"}
            </h2>
            <p>
              {mode === "login"
                ? "Sign in to continue to your hospital dashboard."
                : "Register as a patient to book and manage appointments."}
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <>
                <label>
                  Full name
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </label>
                <div className="auth-two">
                  <label>
                    Phone
                    <input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="Phone number"
                      required
                    />
                  </label>
                  <label>
                    Gender
                    <select
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </label>

            {mode === "register" && (
              <div className="auth-two">
                <label>
                  Date of birth
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => update("date_of_birth", e.target.value)}
                  />
                </label>
                <label>
                  Blood group
                  <select
                    value={form.blood_group}
                    onChange={(e) => update("blood_group", e.target.value)}
                  >
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (x) => (
                        <option key={x}>{x}</option>
                      )
                    )}
                  </select>
                </label>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Patient Account"}
            </button>
          </form>

          {mode === "register" && (
            <p className="auth-note">
              Doctor and administrator accounts are created by hospital
              administration.
            </p>
          )}

          {/* ===== DEMO BOX — sirf development mein ===== */}
          {mode === "login" && !isProd && (
            <div className="demo-box">
              <strong>Demo accounts</strong>
              {DEMO.map(([role, e, p]) => (
                <button
                  key={role}
                  type="button"
                  onClick={(ev) => fillDemo(ev, e, p)}
                >
                  <span>{role}</span>
                  <small>{e}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
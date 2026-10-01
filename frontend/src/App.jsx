import { useEffect, useState } from "react";
import { api } from "./api.js";
import Landing from "./components/Landing.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Icon from "./components/Icon.jsx";

import PatientDashboard from "./pages/patient/Dashboard.jsx";
import PatientFinder from "./pages/patient/Finder.jsx";
import PatientBook from "./pages/patient/Book.jsx";
import PatientAppointments from "./pages/patient/Appointments.jsx";
import PatientNavigation from "./pages/patient/Navigation.jsx";
import Notifications from "./pages/common/Notifications.jsx";
import Profile from "./pages/common/Profile.jsx";
import Settings from "./pages/common/Settings.jsx";

import DoctorDashboard from "./pages/doctor/Dashboard.jsx";
import DoctorRequests from "./pages/doctor/Requests.jsx";
import DoctorQueue from "./pages/doctor/Queue.jsx";
import DoctorPatients from "./pages/doctor/Patients.jsx";
import DoctorTokens from "./pages/doctor/Tokens.jsx";
import AdminOverview from "./pages/admin/Overview.jsx";
import AdminManagement, { AdminDepartments } from "./pages/admin/Management.jsx";
import AdminAnalytics from "./pages/admin/Analytics.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminNavigation from "./pages/admin/Navigation.jsx";

function AppTopbar({ user, role, roleLabel, placeholder, onNavigate }) {
  const [query, setQuery] = useState("");
  const initials = (user?.name || "User").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const menu = role === "PATIENT"
    ? [["Dashboard","dashboard","home"],["Find Department","finder","search"],["Book Appointment","book","calendar"],["My Appointments","appointments","file"],["Hospital Navigation","nav","map"],["Notifications","notifications","bell"],["My Profile","profile","user"],["Settings","settings","settings"]]
    : role === "DOCTOR"
      ? [["Dashboard","dashboard","home"],["Appointments","requests","calendar"],["Patient Queue","queue","users"],["My Patients","patients","user"],["Token Management","tokens","file"],["Notifications","notifications","bell"],["Profile","profile","user"],["Settings","settings","settings"]]
      : [["Dashboard","dashboard","home"],["Patients","patients","users"],["Doctors","doctors","user"],["Appointments","appointments","calendar"],["Departments","departments","grid"],["Hospital Navigation","navigation","map"],["Analytics","analytics","chart"],["User Management","users","shield"],["Settings","settings","settings"]];
  const matches = query.trim() ? menu.filter(([label]) => label.toLowerCase().includes(query.toLowerCase())) : [];
  return <header className="topbar">
    <div className="global-search-wrap">
      <div className="search-box"><Icon name="search" size={20}/><input aria-label="Search" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key === "Escape" && setQuery("")} placeholder={placeholder || "Search..."}/>{query && <button className="search-clear" onClick={()=>setQuery("")} aria-label="Clear search">×</button>}</div>
      {matches.length > 0 && <div className="global-search-results">{matches.slice(0,6).map(([label,id,icon])=><button key={id} onClick={()=>{onNavigate(id);setQuery("")}}><Icon name={icon} size={17}/><span>{label}</span><Icon name="chevron" size={14}/></button>)}</div>}
    </div>
    <div className="topbar-actions"><button className="icon-button notification-button" aria-label="Notifications" onClick={()=>onNavigate("notifications")}><Icon name="bell" size={21}/><span>•</span></button><div className="topbar-divider"/><button className="user-menu user-menu-button" onClick={()=>onNavigate("profile")}><div className="avatar avatar-top">{initials}</div><div className="user-menu-copy"><strong>{user?.name}</strong><span>{roleLabel}</span></div><span className="chevron-down">⌄</span></button></div>
  </header>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [navDestination, setNavDestination] = useState("");

  useEffect(() => {
    api.me().then((r) => setUser(r.user)).catch(() => {}).finally(() => setChecking(false));
  }, []);

  function handleNavigate(nextTab, options = {}) {
    setTab(nextTab);
    if (nextTab === "nav") setNavDestination(options.destination || "");
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    setUser(null);
    setTab("dashboard");
  }

  if (checking) return <div className="app-loading">Loading Hospital Nav...</div>;
  if (!user) return <Landing onLogin={setUser} />;

  const role = user.role;
  const patient = role === "PATIENT";
  const doctor = role === "DOCTOR";
  const admin = role === "ADMIN";

  const placeholder = patient
    ? "Search departments, doctors, or services..."
    : doctor
      ? "Search patients, tokens, or information..."
      : "Search patients, doctors, departments...";

  return (
    <div className={`app-shell ${patient ? "patient-shell" : ""} ${doctor ? "doctor-shell" : ""} ${admin ? "admin-shell" : ""}`}>
      <Sidebar role={role} user={user} tab={tab} setTab={handleNavigate} onLogout={handleLogout} />
      <main className="app-main">
        <AppTopbar user={user} role={role} roleLabel={patient ? "Patient" : doctor ? "Doctor" : "Administrator"} placeholder={placeholder} onNavigate={handleNavigate} />
        <div className="page-content">
          {patient && (
            <>
              {tab === "dashboard" && <PatientDashboard user={user} onNavigate={handleNavigate} />}
              {tab === "finder" && <PatientFinder />}
              {tab === "book" && <PatientBook onNavigate={setTab} />}
              {tab === "appointments" && <PatientAppointments />}
              {tab === "nav" && <PatientNavigation initialDestination={navDestination} />}
              {tab === "notifications" && <Notifications role={role} />}
              {tab === "profile" && <Profile user={user} role={role} onUserChange={setUser} />}
              {tab === "settings" && <Settings role={role} />}
            </>
          )}
          {doctor && (
            <>
              {tab === "dashboard" && <DoctorDashboard user={user} />}
              {tab === "requests" && <DoctorRequests />}
              {tab === "queue" && <DoctorQueue />}
              {tab === "patients" && <DoctorPatients />}
              {tab === "tokens" && <DoctorTokens />}
              {tab === "notifications" && <Notifications role={role} />}
              {tab === "profile" && <Profile user={user} role={role} onUserChange={setUser} />}
              {tab === "settings" && <Settings role={role} />}
              {!["dashboard","requests","queue","patients","tokens","notifications","profile","settings"].includes(tab) && <DoctorDashboard user={user} />}
            </>
          )}
          {admin && (
            <>
              {tab === "dashboard" && <AdminOverview onNavigate={setTab} />}
              {tab === "patients" && <AdminManagement type="patients" />}
              {tab === "doctors" && <AdminManagement type="doctors" />}
              {tab === "appointments" && <AdminManagement type="appointments" />}
              {tab === "departments" && <AdminDepartments />}
              {tab === "navigation" && <AdminNavigation />}
              {tab === "analytics" && <AdminAnalytics />}
              {tab === "users" && <AdminUsers currentUser={user} />}
              {tab === "settings" && <Settings role={role} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

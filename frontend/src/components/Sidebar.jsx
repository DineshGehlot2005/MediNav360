import Icon from "./Icon.jsx";

const TABS = {
  PATIENT: [
    ["dashboard", "Dashboard", "home"], ["finder", "Find Department", "search"],
    ["book", "Book Appointment", "calendar"], ["appointments", "My Appointments", "file"],
    ["nav", "Hospital Navigation", "map"], ["notifications", "Notifications", "bell"], ["profile", "My Profile", "user"],
  ],
  DOCTOR: [
    ["dashboard", "Dashboard", "home"], ["requests", "Appointments", "calendar"],
    ["queue", "Patient Queue", "users"], ["patients", "My Patients", "user"],
    ["tokens", "Token Management", "file"], ["profile", "Profile", "user"],
    ["notifications", "Notifications", "bell"],
  ],
  ADMIN: [
    ["dashboard", "Dashboard", "home", true], ["patients", "Patients", "users", true],
    ["doctors", "Doctors", "user", true], ["appointments", "Appointments", "calendar", true],
    ["departments", "Departments", "grid", true], ["navigation", "Hospital Navigation", "map", true],
    ["analytics", "Analytics", "chart", true], ["users", "User Management", "shield", true],
  ],
};

export default function Sidebar({ role, user, tab, setTab, onLogout }) {
  const items = TABS[role] || [];
  const initials = (user?.name || "User").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const roleText = role === "PATIENT" ? "Patient" : role === "DOCTOR" ? "Doctor" : "System Administrator";
  return <aside className="hospital-sidebar">
    <div className="brand-block"><div className="brand-mark">+</div><div><div className="brand-title">Smart Hospital</div><div className="brand-subtitle">Navigation System</div></div></div>
    <div className="sidebar-profile"><div className="avatar avatar-sidebar">{initials}</div><div className="min-w-0"><div className="profile-name">{user?.name || "User"}</div><div className="profile-role"><span className="online-dot" />{roleText}</div></div></div>
    <nav className="sidebar-nav"><div className="sidebar-label">MENU</div>{items.map(([id,label,icon])=><button key={id} onClick={()=>setTab(id)} className={`sidebar-item ${tab===id?"active":""}`}><Icon name={icon} size={19}/><span>{label}</span></button>)}</nav>
    <div className="sidebar-bottom"><button className={`sidebar-item ${tab==="settings"?"active":""}`} onClick={()=>setTab("settings")}><Icon name="settings" size={19}/><span>Settings</span></button><button onClick={onLogout} className="sidebar-item logout-item"><Icon name="logout" size={19}/><span>Logout</span></button></div>
  </aside>;
}

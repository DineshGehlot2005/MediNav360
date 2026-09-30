import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

export default function AdminUsers({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  async function load() {
    setLoading(true); setError("");
    try { const r = await api.adminUsers(q, role); setRows(r.users); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [role]);

  async function toggle(user) {
    if (user.id === currentUser?.id) return;
    setBusy(user.id); setError("");
    try { await api.adminUserStatus(user.id, !user.active); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  return <div className="admin-list-page">
    <div className="admin-list-header"><div><div className="admin-breadcrumb">Admin / User Management</div><h1><Icon name="shield" size={23}/>User Management</h1><p>Review user accounts and control their active status.</p></div><button className="btn btn-blue" onClick={load}><Icon name="refresh" size={16}/> Refresh</button></div>
    <div className="admin-toolbar user-toolbar">
      <div className="admin-search"><Icon name="search" size={17}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Search name, email, or phone..."/></div>
      <div className="user-filter"><label>Role</label><select value={role} onChange={e=>setRole(e.target.value)}><option value="">All roles</option><option value="PATIENT">Patient</option><option value="DOCTOR">Doctor</option><option value="ADMIN">Admin</option></select></div>
      <span>{rows.length} user{rows.length !== 1 ? "s" : ""}</span>
    </div>
    {error && <div className="admin-error">{error}</div>}
    <section className="admin-data-panel">{loading ? <div className="empty-state">Loading users...</div> : rows.length === 0 ? <div className="empty-state">No users found.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(user => <tr key={user.id}>
      <td><strong>{user.name}</strong></td><td>{user.email}</td><td>{user.phone || "—"}</td><td><span className="role-pill">{user.role}</span></td><td><span className={user.active ? "admin-active" : "admin-inactive"}>{user.active ? "Active" : "Inactive"}</span></td><td>{user.id === currentUser?.id ? <span className="current-user-label">Current account</span> : <button disabled={busy === user.id} className={`table-action ${user.active ? "danger" : ""}`} onClick={()=>toggle(user)}>{busy === user.id ? "Saving..." : user.active ? "Deactivate" : "Activate"}</button>}</td>
    </tr>)}</tbody></table></div>}</section>
  </div>;
}

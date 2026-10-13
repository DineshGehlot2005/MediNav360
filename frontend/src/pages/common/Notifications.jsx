import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Icon from "../../components/Icon.jsx";

// Notification type → icon + tone mapping
const TYPE_META = {
  appointment_request: { icon: "calendar", tone: "blue", label: "New Request" },
  appointment_approved: { icon: "check", tone: "green", label: "Approved" },
  appointment_rejected: { icon: "info", tone: "red", label: "Rejected" },
  appointment_completed: { icon: "check", tone: "purple", label: "Completed" },
  appointment_cancelled: { icon: "info", tone: "orange", label: "Cancelled" },
  prescription_ready: { icon: "file", tone: "green", label: "Prescription" },
  general: { icon: "bell", tone: "blue", label: "Info" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// Category filter — user ke liye simple
function getCategory(type) {
  if (!type) return "general";
  if (type.startsWith("appointment")) return "appointments";
  if (type === "prescription_ready") return "prescriptions";
  return "general";
}

export default function Notifications({ role, onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await api.notifications();
      setItems(r.notifications || []);
    } catch (e) {
      setError(e.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Poll every 30s for fresh notifications
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(() => {
    const all = items.length;
    const unread = items.filter((n) => !n.is_read).length;
    const appointments = items.filter(
      (n) => getCategory(n.type) === "appointments"
    ).length;
    const prescriptions = items.filter(
      (n) => getCategory(n.type) === "prescriptions"
    ).length;
    return { ALL: all, UNREAD: unread, APPOINTMENTS: appointments, PRESCRIPTIONS: prescriptions };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    if (filter === "UNREAD") return items.filter((n) => !n.is_read);
    if (filter === "APPOINTMENTS")
      return items.filter((n) => getCategory(n.type) === "appointments");
    if (filter === "PRESCRIPTIONS")
      return items.filter((n) => getCategory(n.type) === "prescriptions");
    return items;
  }, [items, filter]);

  async function handleRead(item) {
    if (item.is_read) return;
    try {
      await api.markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      if (item.type === "prescription_ready") {
        onNavigate?.("appointments");
      }
    } catch {
      // ignore
    }
  }

  async function handleReadAll() {
    if (counts.UNREAD === 0) return;
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app-feature-page inner-page">
      <div className="feature-page-header">
        <div>
          <span className="feature-eyebrow">Updates</span>
          <h1>Notifications</h1>
          <p>
            Important appointment and prescription updates for your account.
          </p>
        </div>
        <div className="notification-header-actions">
          <button
            className="feature-secondary header-action"
            onClick={load}
            disabled={loading}
          >
            <Icon name="refresh" size={16} />
            {loading ? "Loading..." : "Refresh"}
          </button>
          {counts.UNREAD > 0 && (
            <button
              className="feature-primary header-action"
              onClick={handleReadAll}
            >
              <Icon name="check" size={16} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="feature-filter-row">
        {[
          ["ALL", "All", counts.ALL],
          ["UNREAD", "Unread", counts.UNREAD],
          ["APPOINTMENTS", "Appointments", counts.APPOINTMENTS],
          ["PRESCRIPTIONS", "Prescriptions", counts.PRESCRIPTIONS],
        ].map(([value, label, count]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
            <b>{count}</b>
          </button>
        ))}
      </div>

      {error && (
        <div className="feature-error">
          <Icon name="info" size={16} />
          {error}
          <button onClick={load}>Try again</button>
        </div>
      )}

      <section className="feature-card notification-list-card">
        {loading ? (
          <div className="feature-empty loading-state">
            <span className="loading-spinner" />
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="feature-empty">
            <Icon name="bell" size={30} />
            <strong>
              {filter === "ALL"
                ? "You're all caught up."
                : `No ${filter.toLowerCase()} notifications.`}
            </strong>
            <span>
              {filter === "ALL"
                ? "New updates will appear here."
                : "Try a different filter above."}
            </span>
          </div>
        ) : (
          <div className="notification-list">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.general;
              return (
                <div
                  key={n.id}
                  className={`notification-item ${!n.is_read ? "unread" : ""}`}
                  onClick={() => handleRead(n)}
                >
                  <div className={`notification-badge ${meta.tone}`}>
                    <Icon name={meta.icon} size={18} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-top-row">
                      <span className={`notification-type-tag ${meta.tone}`}>
                        {meta.label}
                      </span>
                      <span className="notification-time">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="notification-message">{n.message}</p>
                  </div>
                  {!n.is_read && <span className="notification-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
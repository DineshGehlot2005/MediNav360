const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  predict: (symptoms) =>
    request("/predict", { method: "POST", body: JSON.stringify({ symptoms }) }),
  aiNavigate: (symptoms, source) =>
    request("/ai-navigation", { method: "POST", body: JSON.stringify({ symptoms, source }) }),
  shortestPath: (source, destination, mode = "normal") =>
    request("/navigation/shortest-path", {
      method: "POST", body: JSON.stringify({ source, destination, mode }),
    }),

  myAppointments: () => request("/appointments"),
  bookAppointment: (payload) =>
    request("/appointments", { method: "POST", body: JSON.stringify(payload) }),
  doctors: () => request("/doctors"),

  doctorAppointments: (status) =>
    request(`/doctor/appointments${status ? `?status=${status}` : ""}`),
  approve: (id) => request(`/doctor/appointments/${id}/approve`, { method: "POST" }),
  reject: (id) => request(`/doctor/appointments/${id}/reject`, { method: "POST" }),
  callNext: () => request("/doctor/token/next", { method: "POST" }),
  queue: () => request("/doctor/queue"),

  adminStats: () => request("/admin/statistics"),
  adminPatients: (q = "") => request(`/admin/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  adminDoctors: (q = "") => request(`/admin/doctors${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  adminAppointments: (status = "") => request(`/admin/appointments${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  adminDepartments: () => request("/admin/departments"),
  adminAnalytics: () => request("/admin/analytics"),
  adminUsers: (q = "", role = "") => request(`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}) }).toString()}`),
  adminUserStatus: (id, active) => request(`/admin/users/${id}/status`, { method: "PUT", body: JSON.stringify({ active }) }),
  adminNavigationNodes: () => request("/admin/navigation/nodes"),
  adminCreateDepartment: (payload) => request("/admin/departments", { method: "POST", body: JSON.stringify(payload) }),
  adminUpdateDepartment: (id, payload) => request(`/admin/departments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminDeleteDepartment: (id) => request(`/admin/departments/${id}`, { method: "DELETE" }),

};

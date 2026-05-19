import { staticApi } from "./staticApi.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";

let csrfToken = "";

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${API_BASE}/auth/csrf-token`, { credentials: "include" });
  if (!response.ok) throw new Error("Nu am putut initializa sesiunea securizata.");
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function request(path, options = {}) {
  const method = options.method || "GET";
  const headers = { ...(options.headers || {}) };
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (unsafe) headers["X-CSRF-Token"] = await ensureCsrf();
  if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.message || "Cererea a esuat.";
    throw new Error(message);
  }
  return payload;
}

async function downloadExport(type) {
  const response = await fetch(`${API_BASE}/exports/${type}`, { credentials: "include" });
  if (!response.ok) throw new Error("Exportul nu a putut fi generat.");
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename=([^;]+)/);
  const filename = match?.[1]?.replaceAll('"', "") || `unitracka-export.${type}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const liveApi = {
  me: () => request("/auth/me"),
  login: (body) => request("/auth/login", { method: "POST", body }),
  register: (body) => request("/auth/register", { method: "POST", body }),
  checkCnp: (body) => request("/auth/check-cnp", { method: "POST", body }),
  forgotPassword: (body) => request("/auth/forgot-password", { method: "POST", body }),
  resetPassword: (body) => request("/auth/reset-password", { method: "POST", body }),
  logout: () => request("/auth/logout", { method: "POST" }),
  publicInstitutions: () => request("/institutions/public"),
  adminSystemStatus: () => request("/admin/system-status"),
  adminInstitutions: () => request("/admin/institutions"),
  createInstitution: (body) => request("/admin/institutions", { method: "POST", body }),
  updateInstitution: (id, body) => request(`/admin/institutions/${id}`, { method: "PATCH", body }),
  adminUsers: () => request("/admin/users"),
  adminAuditLogs: () => request("/admin/audit-logs"),
  createUniversityUser: (body) => request("/admin/university-users", { method: "POST", body }),
  myApplications: () => request("/applications/mine"),
  createApplication: (body) => request("/applications", { method: "POST", body }),
  workspaceApplications: (query = {}) => request(`/applications/workspace?${new URLSearchParams(query)}`),
  updateApplicationStatus: (id, body) => request(`/applications/${id}/status`, { method: "PATCH", body }),
  checkDocumentAi: (body) => request("/ai/documents/check", { method: "POST", body }),
  notifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  listUniversities: () => request("/universities"),
  stats: () => request("/universities/stats"),
  createUniversity: (body) => request("/universities", { method: "POST", body }),
  updateUniversity: (id, body) => request(`/universities/${id}`, { method: "PATCH", body }),
  deleteUniversity: (id) => request(`/universities/${id}`, { method: "DELETE" }),
  compare: (ids) => request(`/universities/compare?ids=${ids.join(",")}`),
  listDocuments: (universityId) => request(`/documents/university/${universityId}`),
  createDocument: (universityId, body) => request(`/documents/university/${universityId}`, { method: "POST", body }),
  updateDocument: (id, body) => request(`/documents/${id}`, { method: "PATCH", body }),
  deleteDocument: (id) => request(`/documents/${id}`, { method: "DELETE" }),
  profile: () => request("/users/profile"),
  updateProfile: (body) => request("/users/profile", { method: "PUT", body }),
  changePassword: (body) => request("/users/profile/password", { method: "PATCH", body }),
  deleteAccount: (body) => request("/users/profile", { method: "DELETE", body }),
  rotateShareLink: () => request("/users/profile/share-link", { method: "POST" }),
  publicShare: (shareId) => request(`/users/public/${shareId}`),
  catalog: (search = "") => request(`/catalog?search=${encodeURIComponent(search)}`),
  downloadExport
};

export const api = STATIC_MODE ? staticApi : liveApi;
export const apiMode = STATIC_MODE ? "static" : "live";

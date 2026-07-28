import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDirectory, "../../.env") });

const baseUrl = (process.env.JURY_BASE_URL || process.env.SMOKE_BASE_URL || "http://127.0.0.1:4000/api").replace(/\/+$/, "");
const localRun = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(`${baseUrl}/`);
const email = process.env.JURY_EMAIL || process.env.SMOKE_EMAIL || process.env.DEMO_EMAIL || (localRun ? "andrei@unitracker.ro" : "");
const password = process.env.JURY_PASSWORD || process.env.SMOKE_PASSWORD || process.env.DEMO_PASSWORD || (localRun ? "Demo1234!" : "");

const report = {
  connection: "pending",
  authentication: "pending",
  authorization: "pending",
  baseUrl,
  role: null,
  features: [],
  errors: [],
  startedAt: new Date().toISOString()
};

const cookies = new Map();
let csrfToken = "";

function setCookies(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  values.forEach((value) => {
    const pair = value.split(";")[0];
    const separator = pair.indexOf("=");
    if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  });
}

function cookieHeader() {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function call(path, options = {}) {
  const started = Date.now();
  const headers = { accept: "application/json", ...(options.headers || {}) };
  const method = options.method || "GET";
  if (cookieHeader()) headers.cookie = cookieHeader();
  if (options.csrf !== false && !["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }
  if (options.body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: "manual"
  });
  setCookies(response);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");
  return { response, payload, durationMs: Date.now() - started };
}

function feature(name, result, expected = [200]) {
  const success = expected.includes(result.response.status);
  report.features.push({
    name,
    status: success ? "success" : "failed",
    httpStatus: result.response.status,
    durationMs: result.durationMs
  });
  if (!success) {
    report.errors.push({
      feature: name,
      httpStatus: result.response.status,
      message: result.payload?.message || "Răspuns neașteptat."
    });
  }
  return success;
}

async function check(name, path, expected = [200]) {
  try {
    const result = await call(path);
    feature(name, result, expected);
    return result;
  } catch (error) {
    report.features.push({ name, status: "failed", httpStatus: null, durationMs: null });
    report.errors.push({ feature: name, message: error.message });
    return null;
  }
}

async function main() {
  const health = await check("API health", "/health");
  const ready = await check("Database readiness", "/ready");
  report.connection = health?.response.ok && ready?.response.ok ? "success" : "failed";

  await check("Instituții publice", "/institutions/public");

  const protectedResult = await call("/auth/me");
  feature("Rută protejată fără sesiune", protectedResult, [401]);

  const csrf = await call("/auth/csrf-token");
  feature("Inițializare CSRF", csrf);
  csrfToken = csrf.payload?.csrfToken || "";

  if (!email || !password) {
    report.authentication = "skipped";
    report.authorization = "skipped";
    report.errors.push({
      feature: "Autentificare",
      message: "Pentru un server live setează JURY_EMAIL și JURY_PASSWORD cu un cont de test."
    });
    return;
  }

  const rejectedCsrf = await call("/auth/login", {
    method: "POST",
    csrf: false,
    body: { email, password }
  });
  feature("Blocare cerere fără CSRF", rejectedCsrf, [403]);

  const login = await call("/auth/login", {
    method: "POST",
    body: { email, password }
  });
  feature("Autentificare", login, [200]);
  if (!login.response.ok || !login.payload?.user) {
    report.authentication = "failed";
    report.authorization = "skipped";
    return;
  }

  report.authentication = "success";
  report.role = login.payload.user.role;
  await check("Sesiune curentă", "/auth/me");
  await check("Catalog universități", "/catalog");
  await check("Profil utilizator", "/users/profile");
  await check("Notificări", "/notifications");

  if (report.role === "student") {
    await check("Tracker universități", "/universities");
    await check("Statistici dashboard", "/universities/stats");
    await check("Aplicațiile studentului", "/applications/mine");
    const forbidden = await call("/admin/system-status");
    feature("Separare rol student/admin", forbidden, [403]);
    report.authorization = forbidden.response.status === 403 ? "success" : "failed";
  } else if (report.role === "university") {
    await check("Profil instituție", "/institutions/me");
    await check("Oferta instituției", "/institutions/me/programs");
    await check("Workspace aplicații", "/applications/workspace");
    const forbidden = await call("/admin/system-status");
    feature("Separare rol universitate/admin", forbidden, [403]);
    report.authorization = forbidden.response.status === 403 ? "success" : "failed";
  } else if (report.role === "admin") {
    await check("Stare sistem admin", "/admin/system-status");
    await check("Instituții admin", "/admin/institutions");
    await check("Programe admin", "/admin/programs");
    await check("Utilizatori admin", "/admin/users");
    await check("Audit admin", "/admin/audit-logs");
    const forbidden = await call("/institutions/me");
    feature("Separare workspace instituțional", forbidden, [403]);
    report.authorization = forbidden.response.status === 403 ? "success" : "failed";
  } else {
    report.authorization = "failed";
    report.errors.push({ feature: "Autorizare", message: `Rol necunoscut: ${report.role}` });
  }
}

try {
  await main();
} catch (error) {
  report.errors.push({ feature: "Execuție", message: error.message });
}

report.finishedAt = new Date().toISOString();
report.success = ["success"].includes(report.connection)
  && ["success"].includes(report.authentication)
  && ["success"].includes(report.authorization)
  && report.errors.length === 0;

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = report.success ? 0 : 1;

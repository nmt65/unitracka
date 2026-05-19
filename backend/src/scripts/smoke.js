const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:4000/api";
const email = process.env.SMOKE_EMAIL || process.env.DEMO_EMAIL || "andrei@unitracker.ro";
const password = process.env.SMOKE_PASSWORD || process.env.DEMO_PASSWORD || "Demo1234!";

function cookiePair(header) {
  return header?.split(";")[0] || "";
}

async function assertOk(label, response) {
  if (response.ok) return response;
  const body = await response.text();
  throw new Error(`${label} a eșuat: ${response.status} ${body}`);
}

const health = await assertOk("health", await fetch(`${baseUrl}/health`));
const ready = await assertOk("ready", await fetch(`${baseUrl}/ready`));
const csrfResponse = await assertOk("csrf", await fetch(`${baseUrl}/auth/csrf-token`));
const csrfCookie = cookiePair(csrfResponse.headers.get("set-cookie"));
const { csrfToken } = await csrfResponse.json();

const loginResponse = await assertOk("login", await fetch(`${baseUrl}/auth/login`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-csrf-token": csrfToken,
    cookie: csrfCookie
  },
  body: JSON.stringify({ email, password })
}));

const sessionCookie = cookiePair(loginResponse.headers.get("set-cookie"));
const cookies = [csrfCookie, sessionCookie].filter(Boolean).join("; ");
const universitiesResponse = await assertOk("universities", await fetch(`${baseUrl}/universities`, { headers: { cookie: cookies } }));
const universities = await universitiesResponse.json();

console.log(JSON.stringify({
  health: await health.json(),
  ready: await ready.json(),
  login: email,
  universities: universities.universities?.length ?? 0
}, null, 2));

import dotenv from "dotenv";

dotenv.config();

const requiredInProduction = ["JWT_SECRET", "CNP_PEPPER"];
const defaultCorsOrigin = "http://localhost:5173,http://127.0.0.1:5173";
const appUrl = process.env.APP_URL || "http://localhost:5173";

function uniqueOrigins(values) {
  return [...new Set(values.map((origin) => origin.trim()).filter(Boolean))];
}

if (process.env.NODE_ENV === "production") {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  appUrl,
  corsOrigin: process.env.CORS_ORIGIN || defaultCorsOrigin,
  corsOrigins: uniqueOrigins([
    ...(process.env.CORS_ORIGIN || defaultCorsOrigin).split(","),
    appUrl,
    "https://unitrack.sbs",
    "https://www.unitrack.sbs",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]),
  trustProxy: process.env.TRUST_PROXY === "true",
  jwtSecret: process.env.JWT_SECRET || "dev-unitracka-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieSameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === "production" ? "none" : "lax"),
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
  cnpPepper: process.env.CNP_PEPPER || "dev-cnp-pepper-change-me",
  resetTokenMinutes: Number(process.env.RESET_TOKEN_MINUTES || 30),
  dbDialect: process.env.DB_DIALECT || "sqlite",
  databaseUrl: process.env.DATABASE_URL || "./data/unitracka.sqlite",
  seedDemo: process.env.SEED_DEMO !== "false",
  seedCatalog: process.env.SEED_CATALOG !== "false",
  bootstrapAdmin: process.env.BOOTSTRAP_ADMIN === "true",
  bootstrapAdminResetPassword: process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD === "true",
  demoEmail: process.env.DEMO_EMAIL || "andrei@unitracker.ro",
  demoPassword: process.env.DEMO_PASSWORD || "Demo1234!",
  adminEmail: process.env.ADMIN_EMAIL || "admin@unitracker.ro",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  universityEmail: process.env.UNIVERSITY_EMAIL || "admitere@unibuc.ro",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiDocumentModel: process.env.OPENAI_DOCUMENT_MODEL || "gpt-4o-mini",
  openaiAdvisorModel: process.env.OPENAI_ADVISOR_MODEL || process.env.OPENAI_DOCUMENT_MODEL || "gpt-4o-mini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  // Gemini 2.5 Flash is a stable multimodal production baseline. A newer model
  // can still be selected per deployment through GEMINI_*_MODEL.
  geminiDocumentModel: process.env.GEMINI_DOCUMENT_MODEL || "gemini-2.5-flash",
  geminiAdvisorModel: process.env.GEMINI_ADVISOR_MODEL || process.env.GEMINI_DOCUMENT_MODEL || "gemini-2.5-flash",
  geminiFallbackModels: (process.env.GEMINI_FALLBACK_MODELS || "gemini-2.5-flash,gemini-2.0-flash").split(",").map((model) => model.trim()).filter(Boolean),
  geminiRequestTimeoutMs: Math.min(45000, Math.max(5000, Number(process.env.GEMINI_REQUEST_TIMEOUT_MS || 25000))),
  aiDocumentDailyLimit: Number(process.env.AI_DOCUMENT_DAILY_LIMIT || 40),
  aiAdvisorDailyLimit: Number(process.env.AI_ADVISOR_DAILY_LIMIT || 20),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "UniTrack <no-reply@unitracker.ro>",
    forceIpv4: process.env.SMTP_FORCE_IPV4 ? process.env.SMTP_FORCE_IPV4 === "true" : process.env.NODE_ENV === "production"
  }
};

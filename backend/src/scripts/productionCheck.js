import { sequelize, User, Institution, University, AdmissionApplication, Document, Notification } from "../models/index.js";
import { env } from "../config/env.js";

const required = ["JWT_SECRET", "CNP_PEPPER", "DATABASE_URL", "APP_URL", "CORS_ORIGIN"];

async function main() {
  if (env.nodeEnv !== "production") {
    console.warn("NODE_ENV is not production; running production check against current environment.");
  }

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required production variables: ${missing.join(", ")}`);
  }

  await sequelize.authenticate();

  const counts = {
    users: await User.count(),
    institutions: await Institution.count(),
    universities: await University.count(),
    applications: await AdmissionApplication.count(),
    documents: await Document.count(),
    notifications: await Notification.count()
  };

  console.log(JSON.stringify({
    ok: true,
    dialect: env.dbDialect,
    appUrl: env.appUrl,
    corsOrigins: env.corsOrigins,
    counts
  }, null, 2));

  await sequelize.close();
}

main().catch(async (error) => {
  console.error(error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});

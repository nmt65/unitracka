import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sequelize } from "../models/index.js";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.resolve(__dirname, "../../sql/postgres_rls.sql");

async function main() {
  if (env.dbDialect !== "postgres") {
    throw new Error("RLS policies can only be applied when DB_DIALECT=postgres.");
  }

  const sql = await fs.readFile(sqlPath, "utf8");
  await sequelize.authenticate();
  await sequelize.query(sql);
  await sequelize.close();

  console.log("PostgreSQL RLS policies applied successfully.");
}

main().catch(async (error) => {
  console.error(error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});

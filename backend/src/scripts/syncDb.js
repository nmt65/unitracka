import { initDb, sequelize } from "../models/index.js";
import { bootstrapAdmin } from "../utils/bootstrapAdmin.js";
import { env } from "../config/env.js";

async function main() {
  await initDb();

  const admin = await bootstrapAdmin();

  console.log(JSON.stringify({
    ok: true,
    dialect: env.dbDialect,
    bootstrapAdmin: admin
  }, null, 2));

  await sequelize.close();
}

main().catch(async (error) => {
  console.error(error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});

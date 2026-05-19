import { env } from "../config/env.js";
import { initDb, sequelize } from "../models/index.js";
import { seedDemoData } from "../utils/demoSeed.js";

async function seed() {
  await initDb();
  await seedDemoData();
  console.log(`Demo ready: ${env.demoEmail} / ${env.demoPassword}`);
  await sequelize.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

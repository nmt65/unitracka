import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { initDb } from "./models/index.js";
import { bootstrapAdmin } from "./utils/bootstrapAdmin.js";
import { seedDemoData } from "./utils/demoSeed.js";
import { importCatalogToInstitutions } from "./services/catalogImport.js";
import { startupState } from "./startupState.js";

const app = createApp();

async function runStartupTasks() {
  try {
    console.log("Inițializare bază de date...");
    await initDb();

    if (env.seedDemo && env.nodeEnv !== "production") {
      const result = await seedDemoData();
      if (result.created) {
        console.log(`Date demo create: ${env.demoEmail} / ${env.demoPassword}`);
      }
    }

    const adminBootstrap = await bootstrapAdmin();
    if (adminBootstrap.created) {
      console.log(`Admin initial creat: ${env.adminEmail}`);
    }
    startupState.databaseReady = true;
    console.log("Baza de date este pregătită.");

    if (env.seedCatalog) {
      const catalogImport = await importCatalogToInstitutions();
      if (catalogImport.created) {
        console.log(`Catalog universități importat: ${catalogImport.created}/${catalogImport.catalog}`);
      }
    }
  } catch (error) {
    startupState.error = error.message;
    console.error("Inițializarea serverului a eșuat:", error);
    process.exitCode = 1;
    setTimeout(() => process.exit(1), 1000);
  } finally {
    startupState.busy = false;
  }
}

app.listen(env.port, () => {
  console.log(`UniTrack API pornit pe http://localhost:${env.port}`);
  void runStartupTasks();
});

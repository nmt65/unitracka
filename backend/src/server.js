import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { initDb } from "./models/index.js";
import { bootstrapAdmin } from "./utils/bootstrapAdmin.js";
import { seedDemoData } from "./utils/demoSeed.js";
import { importCatalogToInstitutions } from "./services/catalogImport.js";
import { startupState } from "./startupState.js";

const app = createApp();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initialiseOnce() {
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

  if (env.seedCatalog) {
    const catalogImport = await importCatalogToInstitutions();
    if (catalogImport.created) {
      console.log(`Catalog universități importat: ${catalogImport.created}/${catalogImport.catalog}`);
    }
  }
}

async function runStartupTasks() {
  // A short Supabase/Render network interruption should not require a manual deploy.
  while (true) {
    try {
      await initialiseOnce();
      startupState.databaseReady = true;
      startupState.busy = false;
      startupState.error = null;
      startupState.attempts = 0;
      startupState.retryAt = null;
      startupState.lastReadyAt = new Date().toISOString();
      console.log("Baza de date este pregătită.");
      return;
    } catch (error) {
      startupState.databaseReady = false;
      startupState.busy = false;
      startupState.error = error instanceof Error ? error.message : "Conexiunea cu baza de date a eșuat.";
      startupState.attempts += 1;
      const retryDelay = Math.min(60000, 5000 * 2 ** Math.min(startupState.attempts - 1, 4));
      startupState.retryAt = new Date(Date.now() + retryDelay).toISOString();
      console.error(`Inițializarea serverului a eșuat. Reîncerc în ${Math.round(retryDelay / 1000)} secunde:`, error);
      await wait(retryDelay);
    }
  }
}

app.listen(env.port, () => {
  console.log(`UniTrack API pornit pe http://localhost:${env.port}`);
  void runStartupTasks();
});

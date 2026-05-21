import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { initDb } from "./models/index.js";
import { bootstrapAdmin } from "./utils/bootstrapAdmin.js";
import { seedDemoData } from "./utils/demoSeed.js";
import { importCatalogToInstitutions } from "./services/catalogImport.js";

const app = createApp();

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

app.listen(env.port, () => {
  console.log(`UniTrack API pornit pe http://localhost:${env.port}`);
});

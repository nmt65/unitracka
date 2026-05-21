import { Institution } from "../models/index.js";
import { universityCatalog } from "../data/catalog.js";

export async function importCatalogToInstitutions() {
  const existing = await Institution.findAll({ attributes: ["name"] });
  const existingNames = new Set(existing.map((item) => item.name.toLowerCase()));
  const rows = universityCatalog
    .filter((item) => !existingNames.has(item.name.toLowerCase()))
    .map((item) => ({
      name: item.name,
      shortName: String(item.shortName || item.name.split(/\s+/).map((part) => part[0]).join("")).slice(0, 20),
      country: item.country || "România",
      countryCode: item.countryCode || null,
      city: item.city || null,
      website: item.website || null,
      contactEmail: item.contactEmail || null,
      status: "active",
      description: item.description || `Catalog UniTrack: ${item.source || "universitate europeană / România"}. Domenii: ${(item.strengths || []).join(", ") || "admitere generală"}.`
    }));
  const created = rows.length ? await Institution.bulkCreate(rows, { validate: true }) : [];
  return {
    created: created.length,
    existing: existing.length,
    catalog: universityCatalog.length
  };
}

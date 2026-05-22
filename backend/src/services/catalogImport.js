import { AdmissionProgram, Institution, ProgramRequirement } from "../models/index.js";
import { currentAdmissionYear, universityCatalog } from "../data/catalog.js";
import { defaultDocuments } from "../data/defaultDocuments.js";

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function defaultRequirementsForProgram(program) {
  return defaultDocuments.map((document, index) => ({
    documentName: document.name,
    category: document.category,
    isOptional: document.isOptional || (program.programType === "licenta" && document.name.includes("Certificat limbă")),
    verificationRequired: true,
    sortOrder: index,
    rule: document.isOptional ? "Opțional, dar util pentru departajare." : "Obligatoriu pentru validarea dosarului."
  }));
}

function programKey({ InstitutionId, academicYear, faculty, name, programType }) {
  return [InstitutionId, academicYear, normalizeName(faculty), normalizeName(name), programType || "licenta"].join("|");
}

export async function importCatalogToInstitutions() {
  const existing = await Institution.findAll({ attributes: ["id", "name"] });
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
      description: item.description || `Catalog UniTrack ${item.academicYear || "2026-2027"}: ${item.source || "universitate europeană / România"}. Domenii: ${(item.strengths || []).join(", ") || "admitere generală"}. Ofertă: ${(item.offerPrograms || []).map((program) => program.program).join(", ") || "consultă site-ul oficial"}.`
    }));
  const created = rows.length ? await Institution.bulkCreate(rows, { validate: true }) : [];
  const institutions = await Institution.findAll({ order: [["name", "ASC"]] });
  const institutionByName = new Map(institutions.map((item) => [normalizeName(item.name), item]));
  const programRows = [];

  for (const catalogItem of universityCatalog) {
    const institution = institutionByName.get(normalizeName(catalogItem.name));
    if (!institution) continue;
    for (const offer of catalogItem.offerPrograms || []) {
      programRows.push({
        InstitutionId: institution.id,
        faculty: offer.faculty,
        name: offer.program,
        programType: offer.programType || "licenta",
        academicYear: catalogItem.academicYear || currentAdmissionYear,
        deadline: offer.deadline || catalogItem.deadline || null,
        annualTuition: offer.annualTuition ?? catalogItem.annualTuition ?? null,
        seats: offer.seats ?? null,
        language: offer.language || null,
        admissionMethod: offer.admissionMethod || "Dosar digital verificat în UniTrack și criteriile publicate de universitate.",
        website: offer.website || catalogItem.website || null,
        description: offer.description || catalogItem.offerSummary || null,
        status: "active",
        source: "catalog"
      });
    }
  }

  const programCountBefore = await AdmissionProgram.count();
  if (programRows.length) {
    await AdmissionProgram.bulkCreate(programRows, { ignoreDuplicates: true, validate: true });
  }
  const programCountAfter = await AdmissionProgram.count();
  const programsCreated = Math.max(0, programCountAfter - programCountBefore);
  const programs = await AdmissionProgram.findAll({ attributes: ["id", "InstitutionId", "academicYear", "faculty", "name", "programType"] });
  const programByKey = new Map(programs.map((program) => [programKey(program), program]));
  const requirementRows = [];

  for (const catalogItem of universityCatalog) {
    const institution = institutionByName.get(normalizeName(catalogItem.name));
    if (!institution) continue;
    for (const offer of catalogItem.offerPrograms || []) {
      const program = programByKey.get(programKey({
        InstitutionId: institution.id,
        academicYear: catalogItem.academicYear || currentAdmissionYear,
        faculty: offer.faculty,
        name: offer.program,
        programType: offer.programType || "licenta"
      }));
      if (!program) continue;
      defaultRequirementsForProgram(offer).forEach((requirement) => {
        requirementRows.push({ ...requirement, AdmissionProgramId: program.id });
      });
    }
  }

  const requirementCountBefore = await ProgramRequirement.count();
  if (requirementRows.length) {
    await ProgramRequirement.bulkCreate(requirementRows, { ignoreDuplicates: true, validate: true });
  }
  const requirementCountAfter = await ProgramRequirement.count();

  return {
    created: created.length,
    existing: existing.length,
    programsCreated,
    requirementsCreated: Math.max(0, requirementCountAfter - requirementCountBefore),
    catalog: universityCatalog.length
  };
}

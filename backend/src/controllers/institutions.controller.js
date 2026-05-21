import { Institution } from "../models/index.js";
import { writeAudit } from "../services/audit.js";
import { universityCatalog } from "../data/catalog.js";

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function serializeInstitution(institution) {
  const plain = institution.toJSON ? institution.toJSON() : { ...institution };
  const catalog = universityCatalog.find((item) => normalizeName(item.name) === normalizeName(plain.name));
  return {
    ...plain,
    academicYear: catalog?.academicYear || "2026-2027",
    offerPrograms: catalog?.offerPrograms || [
      { faculty: "Oferta educațională oficială", program: "Programe de licență", programType: "licenta" },
      { faculty: "Oferta educațională oficială", program: "Programe de master", programType: "master" },
      { faculty: "Oferta educațională oficială", program: "Programe doctorale", programType: "doctorat" }
    ],
    offerSummary: catalog?.offerSummary || plain.description || "Ofertă educațională 2026-2027 disponibilă prin site-ul oficial al universității."
  };
}

export async function publicInstitutions(_req, res, next) {
  try {
    const institutions = await Institution.findAll({
      where: { status: "active" },
      order: [["name", "ASC"]]
    });
    return res.json({ institutions: institutions.map(serializeInstitution) });
  } catch (error) {
    next(error);
  }
}

export async function listInstitutions(_req, res, next) {
  try {
    const institutions = await Institution.findAll({ order: [["name", "ASC"]] });
    return res.json({ institutions: institutions.map(serializeInstitution) });
  } catch (error) {
    next(error);
  }
}

export async function myInstitution(req, res, next) {
  try {
    if (req.user.role !== "university" || !req.user.InstitutionId) {
      return res.status(403).json({ message: "Nu ai un workspace de universitate asociat." });
    }
    const institution = await Institution.findByPk(req.user.InstitutionId);
    if (!institution) return res.status(404).json({ message: "Universitatea nu a fost găsită." });
    return res.json({ institution: serializeInstitution(institution) });
  } catch (error) {
    next(error);
  }
}

export async function updateMyInstitution(req, res, next) {
  try {
    if (req.user.role !== "university" || !req.user.InstitutionId) {
      return res.status(403).json({ message: "Nu ai un workspace de universitate asociat." });
    }
    const institution = await Institution.findByPk(req.user.InstitutionId);
    if (!institution) return res.status(404).json({ message: "Universitatea nu a fost găsită." });
    await institution.update(req.body);
    await writeAudit(req, {
      action: "institution.profile_update",
      entityType: "Institution",
      entityId: institution.id,
      metadata: Object.keys(req.body)
    });
    return res.json({ institution: serializeInstitution(institution) });
  } catch (error) {
    next(error);
  }
}

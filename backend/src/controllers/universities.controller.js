import { AdmissionProgram, Document, Institution, ProgramRequirement, University, sequelize } from "../models/index.js";
import { defaultDocuments } from "../data/defaultDocuments.js";
import { universityCatalog } from "../data/catalog.js";
import { daysUntil } from "../utils/dates.js";
import { categoryProgress, documentProgress, documentsRemaining } from "../utils/progress.js";

const includeDocuments = [{ model: Document, order: [["createdAt", "ASC"]] }];
const documentOrder = [
  "Diplomă BAC",
  "Foaie matricolă",
  "CV Europass",
  "Scrisoare motivație",
  "Scrisori de recomandare",
  "Certificat limbă (IELTS)",
  "Certificat limbă (IELTS/TOEFL)",
  "Cazier judiciar",
  "Adeverință medicală",
  "Portofoliu"
];

function serializeUniversity(university) {
  const plain = university.toJSON ? university.toJSON() : university;
  const documents = [...(plain.Documents || plain.documents || [])].sort((a, b) => {
    const aIndex = documentOrder.indexOf(a.name);
    const bIndex = documentOrder.indexOf(b.name);
    if (aIndex !== bIndex) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });
  return {
    ...plain,
    documents,
    progress: documentProgress(documents),
    remainingRequiredDocuments: documentsRemaining(documents),
    daysUntilDeadline: daysUntil(plain.deadline)
  };
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function matchesOfferProgram(source, payload) {
  if (!source?.offerPrograms?.length) return true;
  return source.offerPrograms.some((offer) => (
    normalizeName(offer.program) === normalizeName(payload.program)
    && normalizeName(offer.faculty) === normalizeName(payload.faculty)
    && offer.programType === payload.programType
  ));
}

async function ensureStudentUsesApprovedCatalog(payload) {
  const requested = normalizeName(payload.name);
  const catalogMatch = universityCatalog.find((item) => normalizeName(item.name) === requested);
  if (catalogMatch) {
    if (!matchesOfferProgram(catalogMatch, payload)) {
      const error = new Error("Alege un program din oferta educațională curentă a universității.");
      error.status = 422;
      throw error;
    }
    return catalogMatch;
  }

  const institutions = await Institution.findAll({
    where: { status: "active" },
    attributes: ["name", "shortName", "country", "countryCode", "website"],
    include: [{ model: AdmissionProgram, where: { status: "active" }, required: false, include: [ProgramRequirement] }]
  });
  const institution = institutions.find((item) => normalizeName(item.name) === requested);
  if (institution) {
    const programs = institution.AdmissionPrograms || [];
    if (programs.length && !programs.some((program) => (
      normalizeName(program.name) === normalizeName(payload.program)
      && normalizeName(program.faculty) === normalizeName(payload.faculty)
      && program.programType === payload.programType
    ))) {
      const error = new Error("Alege un program din oferta educațională curentă a universității.");
      error.status = 422;
      throw error;
    }
    return institution;
  }

  const error = new Error("Elevii pot adăuga în tracker doar universități din catalogul public sau instituții active aprobate de admin.");
  error.status = 422;
  throw error;
}

function studentUniversityPayload(payload, source) {
  const clean = { ...payload };
  clean.name = source.name || clean.name;
  clean.shortName = source.shortName || clean.shortName;
  clean.country = source.country || clean.country;
  clean.countryCode = source.countryCode || clean.countryCode;
  clean.officialLink = source.website || clean.officialLink;
  return clean;
}

function ensureStudentCanUpdate(payload) {
  const allowed = new Set(["status", "deadline", "notes", "rating"]);
  const blocked = Object.keys(payload).filter((key) => !allowed.has(key));
  if (blocked.length) {
    const error = new Error("Elevii pot modifica doar statusul personal, deadline-ul, notițele și ratingul. Universitățile și programele vin din catalogul aprobat.");
    error.status = 403;
    throw error;
  }
}

export async function listUniversities(req, res, next) {
  try {
    const universities = await University.findAll({
      where: { UserId: req.user.id },
      include: includeDocuments,
      order: [["deadline", "ASC"], ["createdAt", "ASC"]]
    });
    return res.json({ universities: universities.map(serializeUniversity) });
  } catch (error) {
    next(error);
  }
}

export async function createUniversity(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const approvedSource = req.user.role === "student" ? await ensureStudentUsesApprovedCatalog(req.body) : null;
    const payload = approvedSource ? studentUniversityPayload(req.body, approvedSource) : req.body;
    const duplicate = await University.findOne({
      where: {
        UserId: req.user.id,
        name: payload.name,
        program: payload.program,
        faculty: payload.faculty
      },
      transaction
    });
    if (duplicate) {
      await transaction.rollback();
      return res.status(409).json({ message: "Universitatea și programul există deja în trackerul tău." });
    }
    const university = await University.create({ ...payload, UserId: req.user.id }, { transaction });
    await Document.bulkCreate(
      defaultDocuments.map((doc) => ({ ...doc, UniversityId: university.id })),
      { transaction }
    );
    await transaction.commit();
    const created = await University.findByPk(university.id, { include: includeDocuments });
    return res.status(201).json({ university: serializeUniversity(created) });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
}

export async function updateUniversity(req, res, next) {
  try {
    const university = await University.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!university) return res.status(404).json({ message: "Universitatea nu a fost gasita." });
    if (req.user.role === "student") {
      ensureStudentCanUpdate(req.body);
    }
    await university.update(req.body);
    const updated = await University.findByPk(university.id, { include: includeDocuments });
    return res.json({ university: serializeUniversity(updated) });
  } catch (error) {
    next(error);
  }
}

export async function deleteUniversity(req, res, next) {
  try {
    const deleted = await University.destroy({ where: { id: req.params.id, UserId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: "Universitatea nu a fost gasita." });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function dashboardStats(req, res, next) {
  try {
    const universities = await University.findAll({ where: { UserId: req.user.id }, include: includeDocuments });
    const serialized = universities.map(serializeUniversity);
    const upcoming = serialized
      .filter((uni) => uni.daysUntilDeadline >= 0)
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
    const byStatus = serialized.reduce((acc, uni) => {
      acc[uni.status] = (acc[uni.status] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      stats: {
        total: serialized.length,
        accepted: byStatus.Acceptat || 0,
        pending: byStatus.Aplicat || 0,
        nextDeadlineDays: upcoming[0]?.daysUntilDeadline ?? null,
        byStatus,
        categoryProgress: categoryProgress(universities),
        upcomingDeadlines: upcoming.slice(0, 6)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function compareUniversities(req, res, next) {
  try {
    const ids = req.query.ids.slice(0, 4);
    if (ids.length < 2) return res.status(422).json({ message: "Selecteaza intre 2 si 4 universitati." });

    const universities = await University.findAll({
      where: { id: ids, UserId: req.user.id },
      include: includeDocuments
    });
    const serialized = universities.map(serializeUniversity);
    if (serialized.length < 2) return res.status(404).json({ message: "Nu am gasit universitatile selectate." });

    const winnerBy = (selector, mode = "min") => {
      const candidates = serialized.filter((item) => selector(item) !== null && selector(item) !== undefined);
      if (!candidates.length) return null;
      return candidates.reduce((best, current) => {
        const bestValue = selector(best);
        const currentValue = selector(current);
        return mode === "max" ? (currentValue > bestValue ? current : best) : currentValue < bestValue ? current : best;
      }).id;
    };

    return res.json({
      universities: serialized,
      winners: {
        annualTuition: winnerBy((uni) => uni.annualTuition, "min"),
        rating: winnerBy((uni) => uni.rating, "max"),
        deadline: winnerBy((uni) => new Date(uni.deadline).getTime(), "max"),
        remainingRequiredDocuments: winnerBy((uni) => uni.remainingRequiredDocuments, "min")
      }
    });
  } catch (error) {
    next(error);
  }
}

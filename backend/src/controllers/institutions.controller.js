import { AdmissionProgram, Institution, ProgramRequirement } from "../models/index.js";
import { writeAudit } from "../services/audit.js";
import { universityCatalog } from "../data/catalog.js";
import { defaultDocuments } from "../data/defaultDocuments.js";

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
  const dbPrograms = (plain.AdmissionPrograms || plain.admissionPrograms || [])
    .filter((program) => program.status !== "archived")
    .map((program) => ({
      id: program.id,
      faculty: program.faculty,
      program: program.name,
      programType: program.programType,
      academicYear: program.academicYear,
      deadline: program.deadline,
      annualTuition: program.annualTuition,
      seats: program.seats,
      language: program.language,
      admissionMethod: program.admissionMethod,
      website: program.website,
      description: program.description,
      status: program.status,
      requirements: (program.ProgramRequirements || program.requirements || [])
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((requirement) => ({
          id: requirement.id,
          documentName: requirement.documentName,
          category: requirement.category,
          isOptional: requirement.isOptional,
          verificationRequired: requirement.verificationRequired,
          rule: requirement.rule,
          sortOrder: requirement.sortOrder
        }))
    }));
  delete plain.AdmissionPrograms;
  delete plain.admissionPrograms;
  return {
    ...plain,
    academicYear: dbPrograms[0]?.academicYear || catalog?.academicYear || "2026-2027",
    offerPrograms: dbPrograms.length ? dbPrograms : catalog?.offerPrograms || [
      { faculty: "Oferta educațională oficială", program: "Programe de licență", programType: "licenta" },
      { faculty: "Oferta educațională oficială", program: "Programe de master", programType: "master" },
      { faculty: "Oferta educațională oficială", program: "Programe doctorale", programType: "doctorat" }
    ],
    offerSummary: catalog?.offerSummary || plain.description || "Ofertă educațională 2026-2027 disponibilă prin site-ul oficial al universității."
  };
}

function defaultProgramRequirements() {
  return defaultDocuments.map((document, index) => ({
    documentName: document.name,
    category: document.category,
    isOptional: document.isOptional,
    verificationRequired: true,
    rule: document.isOptional ? "Opțional, dar util pentru departajare." : "Obligatoriu pentru validarea dosarului.",
    sortOrder: index
  }));
}

function serializeProgram(program) {
  const plain = program.toJSON ? program.toJSON() : { ...program };
  const requirements = plain.ProgramRequirements || plain.requirements || [];
  delete plain.ProgramRequirements;
  delete plain.requirements;
  return {
    ...plain,
    requirements: requirements
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((requirement) => ({
        id: requirement.id,
        documentName: requirement.documentName,
        category: requirement.category,
        isOptional: requirement.isOptional,
        verificationRequired: requirement.verificationRequired,
        rule: requirement.rule,
        sortOrder: requirement.sortOrder
      }))
  };
}

function requireUniversityWorkspace(req, res) {
  if (req.user.role !== "university" || !req.user.InstitutionId) {
    res.status(403).json({ message: "Nu ai un workspace de universitate asociat." });
    return null;
  }
  return req.user.InstitutionId;
}

export async function publicInstitutions(_req, res, next) {
  try {
    const institutions = await Institution.findAll({
      where: { status: "active" },
      include: [{ model: AdmissionProgram, where: { status: "active" }, required: false, include: [ProgramRequirement] }],
      order: [["name", "ASC"]]
    });
    return res.json({ institutions: institutions.map(serializeInstitution) });
  } catch (error) {
    next(error);
  }
}

export async function listInstitutions(_req, res, next) {
  try {
    const institutions = await Institution.findAll({
      include: [{ model: AdmissionProgram, required: false, include: [ProgramRequirement] }],
      order: [["name", "ASC"]]
    });
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
    const institution = await Institution.findByPk(req.user.InstitutionId, {
      include: [{ model: AdmissionProgram, required: false, include: [ProgramRequirement] }]
    });
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
    const updated = await Institution.findByPk(institution.id, {
      include: [{ model: AdmissionProgram, required: false, include: [ProgramRequirement] }]
    });
    return res.json({ institution: serializeInstitution(updated) });
  } catch (error) {
    next(error);
  }
}

export async function listMyPrograms(req, res, next) {
  try {
    const institutionId = requireUniversityWorkspace(req, res);
    if (!institutionId) return;
    const programs = await AdmissionProgram.findAll({
      where: { InstitutionId: institutionId },
      include: [ProgramRequirement],
      order: [["academicYear", "DESC"], ["faculty", "ASC"], ["name", "ASC"]]
    });
    return res.json({ programs: programs.map(serializeProgram) });
  } catch (error) {
    next(error);
  }
}

export async function createMyProgram(req, res, next) {
  try {
    const institutionId = requireUniversityWorkspace(req, res);
    if (!institutionId) return;
    const { requirements = [], ...payload } = req.body;
    const program = await AdmissionProgram.create({ ...payload, InstitutionId: institutionId, source: "university" });
    const rows = (requirements.length ? requirements : defaultProgramRequirements()).map((requirement, index) => ({
      ...requirement,
      sortOrder: requirement.sortOrder ?? index,
      AdmissionProgramId: program.id
    }));
    await ProgramRequirement.bulkCreate(rows, { validate: true });
    await writeAudit(req, {
      action: "institution.program_create",
      entityType: "AdmissionProgram",
      entityId: program.id,
      metadata: { institutionId, name: program.name, requirements: rows.length }
    });
    const created = await AdmissionProgram.findByPk(program.id, { include: [ProgramRequirement] });
    return res.status(201).json({ program: serializeProgram(created) });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProgram(req, res, next) {
  try {
    const institutionId = requireUniversityWorkspace(req, res);
    if (!institutionId) return;
    const program = await AdmissionProgram.findOne({ where: { id: req.params.id, InstitutionId: institutionId }, include: [ProgramRequirement] });
    if (!program) return res.status(404).json({ message: "Programul nu există în workspace-ul tău." });
    const { requirements, ...payload } = req.body;
    await program.update(payload);
    if (Array.isArray(requirements)) {
      await ProgramRequirement.destroy({ where: { AdmissionProgramId: program.id } });
      await ProgramRequirement.bulkCreate(requirements.map((requirement, index) => ({
        ...requirement,
        sortOrder: requirement.sortOrder ?? index,
        AdmissionProgramId: program.id
      })), { validate: true });
    }
    await writeAudit(req, {
      action: "institution.program_update",
      entityType: "AdmissionProgram",
      entityId: program.id,
      metadata: { fields: Object.keys(payload), requirements: Array.isArray(requirements) ? requirements.length : undefined }
    });
    const updated = await AdmissionProgram.findByPk(program.id, { include: [ProgramRequirement] });
    return res.json({ program: serializeProgram(updated) });
  } catch (error) {
    next(error);
  }
}

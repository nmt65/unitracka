import { universityCatalog } from "../data/catalog.js";
import { AdmissionProgram, Institution, ProgramRequirement } from "../models/index.js";

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function programRows(institution) {
  return (institution.AdmissionPrograms || []).map((program) => ({
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
    requirements: (program.ProgramRequirements || []).map((requirement) => ({
      id: requirement.id,
      documentName: requirement.documentName,
      category: requirement.category,
      isOptional: requirement.isOptional,
      verificationRequired: requirement.verificationRequired,
      rule: requirement.rule
    }))
  }));
}

export async function listCatalog(req, res, next) {
  try {
    const search = normalizeSearch(req.query.search);
    const institutions = await Institution.findAll({
      where: { status: "active" },
      include: [{ model: AdmissionProgram, where: { status: "active" }, required: false, include: [ProgramRequirement] }],
      order: [["name", "ASC"]]
    });
    const known = new Set(universityCatalog.map((item) => normalizeSearch(item.name)));
    const dbByName = new Map(institutions.map((item) => [normalizeSearch(item.name), item]));
    const mergedCatalog = universityCatalog.map((item) => {
      const institution = dbByName.get(normalizeSearch(item.name));
      if (!institution) return item;
      const programs = programRows(institution);
      return {
        ...item,
        id: institution.id,
        shortName: institution.shortName || item.shortName,
        website: institution.website || item.website,
        contactEmail: institution.contactEmail || item.contactEmail,
        description: institution.description || item.description,
        offerPrograms: programs.length ? programs : item.offerPrograms,
        offerSummary: institution.description || item.offerSummary,
        source: item.source || "Catalog UniTrack"
      };
    });
    const activeInstitutions = institutions
      .filter((item) => !known.has(normalizeSearch(item.name)))
      .map((item) => {
        const programs = programRows(item);
        return {
        id: item.id,
        name: item.name,
        shortName: item.shortName,
        country: item.country,
        countryCode: item.countryCode,
        city: item.city,
        website: item.website,
        strengths: ["Admitere", "Programe active", "Workspace universitate"],
        academicYear: "2026-2027",
        offerPrograms: programs.length ? programs : [
          { faculty: "Oferta educațională oficială", program: "Programe de licență", programType: "licenta" },
          { faculty: "Oferta educațională oficială", program: "Programe de master", programType: "master" },
          { faculty: "Oferta educațională oficială", program: "Programe doctorale", programType: "doctorat" }
        ],
        offerSummary: item.description || "Ofertă educațională 2026-2027 disponibilă prin workspace-ul universității și site-ul oficial.",
        source: "Instituție activă UniTrack"
        };
      });
    const results = [...mergedCatalog, ...activeInstitutions]
      .filter((item) => {
        if (!search) return true;
        return normalizeSearch([
          item.name,
          item.country,
          item.city,
          item.offerSummary,
          ...(item.strengths || []),
          ...(item.offerPrograms || []).map((program) => `${program.program} ${program.faculty}`)
        ].join(" ")).includes(search);
      })
      .slice(0, 180);
    return res.json({ universities: results });
  } catch (error) {
    next(error);
  }
}

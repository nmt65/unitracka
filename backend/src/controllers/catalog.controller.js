import { universityCatalog } from "../data/catalog.js";
import { Institution } from "../models/index.js";

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function listCatalog(req, res, next) {
  try {
    const search = normalizeSearch(req.query.search);
    const institutions = await Institution.findAll({ where: { status: "active" }, order: [["name", "ASC"]] });
    const known = new Set(universityCatalog.map((item) => normalizeSearch(item.name)));
    const activeInstitutions = institutions
      .filter((item) => !known.has(normalizeSearch(item.name)))
      .map((item) => ({
        id: item.id,
        name: item.name,
        shortName: item.shortName,
        country: item.country,
        countryCode: item.countryCode,
        city: item.city,
        website: item.website,
        strengths: ["Admitere", "Programe active", "Workspace universitate"],
        academicYear: "2026-2027",
        offerPrograms: [
          { faculty: "Oferta educațională oficială", program: "Programe de licență", programType: "licenta" },
          { faculty: "Oferta educațională oficială", program: "Programe de master", programType: "master" },
          { faculty: "Oferta educațională oficială", program: "Programe doctorale", programType: "doctorat" }
        ],
        offerSummary: item.description || "Ofertă educațională 2026-2027 disponibilă prin workspace-ul universității și site-ul oficial.",
        source: "Instituție activă UniTrack"
      }));
    const results = [...universityCatalog, ...activeInstitutions]
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

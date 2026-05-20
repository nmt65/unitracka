import { Institution } from "../models/index.js";
import { writeAudit } from "../services/audit.js";

export async function publicInstitutions(_req, res, next) {
  try {
    const institutions = await Institution.findAll({
      where: { status: "active" },
      order: [["name", "ASC"]]
    });
    return res.json({ institutions });
  } catch (error) {
    next(error);
  }
}

export async function listInstitutions(_req, res, next) {
  try {
    const institutions = await Institution.findAll({ order: [["name", "ASC"]] });
    return res.json({ institutions });
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
    return res.json({ institution });
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
    return res.json({ institution });
  } catch (error) {
    next(error);
  }
}

import { Institution } from "../models/index.js";

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

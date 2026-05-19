import { Document, University, sequelize } from "../models/index.js";
import { defaultDocuments } from "../data/defaultDocuments.js";
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
  "Adeverință medicală"
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
    const university = await University.create({ ...req.body, UserId: req.user.id }, { transaction });
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

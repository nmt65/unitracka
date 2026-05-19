import { Document, University } from "../models/index.js";

async function findOwnedUniversity(userId, universityId) {
  return University.findOne({ where: { id: universityId, UserId: userId } });
}

export async function listDocuments(req, res, next) {
  try {
    const university = await findOwnedUniversity(req.user.id, req.params.universityId);
    if (!university) return res.status(404).json({ message: "Universitatea nu a fost gasita." });
    const documents = await Document.findAll({ where: { UniversityId: university.id }, order: [["createdAt", "ASC"]] });
    return res.json({ documents });
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req, res, next) {
  try {
    const university = await findOwnedUniversity(req.user.id, req.params.universityId);
    if (!university) return res.status(404).json({ message: "Universitatea nu a fost gasita." });
    const document = await Document.create({ ...req.body, UniversityId: university.id });
    return res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
}

export async function updateDocument(req, res, next) {
  try {
    const document = await Document.findByPk(req.params.id, { include: [University] });
    if (!document || document.University.UserId !== req.user.id) {
      return res.status(404).json({ message: "Documentul nu a fost gasit." });
    }

    const payload = { ...req.body };
    if (payload.isCompleted === true && !payload.completedAt) {
      payload.completedAt = new Date().toISOString().slice(0, 10);
    }
    if (payload.isCompleted === false) payload.completedAt = null;

    await document.update(payload);
    return res.json({ document });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const document = await Document.findByPk(req.params.id, { include: [University] });
    if (!document || document.University.UserId !== req.user.id) {
      return res.status(404).json({ message: "Documentul nu a fost gasit." });
    }
    await document.destroy();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}


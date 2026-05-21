import { AdmissionApplication, Document, University } from "../models/index.js";

async function findOwnedUniversity(userId, universityId) {
  return University.findOne({ where: { id: universityId, UserId: userId } });
}

async function findAccessibleApplication(user, applicationId) {
  const application = await AdmissionApplication.findByPk(applicationId);
  if (!application) return null;
  if (user.role === "admin") return application;
  if (user.role === "student" && application.StudentId === user.id) return application;
  if (user.role === "university" && application.InstitutionId === user.InstitutionId) return application;
  return null;
}

function canAccessDocument(user, document) {
  if (!document) return false;
  if (user.role === "admin") return true;
  if (document.University) return user.role === "student" && document.University.UserId === user.id;
  if (document.AdmissionApplication) {
    if (user.role === "student") return document.AdmissionApplication.StudentId === user.id;
    if (user.role === "university") return document.AdmissionApplication.InstitutionId === user.InstitutionId;
  }
  return false;
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

export async function listApplicationDocuments(req, res, next) {
  try {
    const application = await findAccessibleApplication(req.user, req.params.applicationId);
    if (!application) return res.status(404).json({ message: "Aplicația nu a fost găsită." });
    const documents = await Document.findAll({ where: { AdmissionApplicationId: application.id }, order: [["createdAt", "ASC"]] });
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

export async function createApplicationDocument(req, res, next) {
  try {
    const application = await findAccessibleApplication(req.user, req.params.applicationId);
    if (!application) return res.status(404).json({ message: "Aplicația nu a fost găsită." });
    const document = await Document.create({
      ...req.body,
      isCompleted: false,
      verificationStatus: "missing",
      AdmissionApplicationId: application.id
    });
    return res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
}

export async function updateDocument(req, res, next) {
  try {
    const document = await Document.findByPk(req.params.id, { include: [University, AdmissionApplication] });
    if (!canAccessDocument(req.user, document)) {
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

export async function downloadDocumentFile(req, res, next) {
  try {
    const document = await Document.findByPk(req.params.id, { include: [University, AdmissionApplication] });
    if (!canAccessDocument(req.user, document)) {
      return res.status(404).json({ message: "Documentul nu a fost gasit." });
    }
    if (!document.fileDataUrl) {
      return res.status(404).json({ message: "Documentul nu are fișier atașat." });
    }
    const match = String(document.fileDataUrl).match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) return res.status(422).json({ message: "Fișierul atașat nu poate fi citit." });

    const buffer = Buffer.from(match[2], "base64");
    res.setHeader("Content-Type", document.mimeType || match[1] || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(document.fileName || `${document.name}.bin`)}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const document = await Document.findByPk(req.params.id, { include: [University, AdmissionApplication] });
    if (!canAccessDocument(req.user, document)) {
      return res.status(404).json({ message: "Documentul nu a fost gasit." });
    }
    if (req.user.role === "university") {
      return res.status(403).json({ message: "Universitatea poate verifica documente, dar nu le poate șterge." });
    }
    await document.destroy();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

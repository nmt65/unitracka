import { AdmissionApplication, Document, University } from "../models/index.js";
import { defaultDocuments } from "../data/defaultDocuments.js";

const studentDocumentTemplates = new Map(defaultDocuments.map((doc) => [normalizeName(doc.name), doc]));

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function studentDocumentTemplate(name) {
  return studentDocumentTemplates.get(normalizeName(name));
}

function serializeDocument(document) {
  const plain = document.toJSON ? document.toJSON() : { ...document };
  delete plain.fileDataUrl;
  delete plain.fileSha256;
  return plain;
}

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
    return res.json({ documents: documents.map(serializeDocument) });
  } catch (error) {
    next(error);
  }
}

export async function listApplicationDocuments(req, res, next) {
  try {
    const application = await findAccessibleApplication(req.user, req.params.applicationId);
    if (!application) return res.status(404).json({ message: "Aplicația nu a fost găsită." });
    const documents = await Document.findAll({ where: { AdmissionApplicationId: application.id }, order: [["createdAt", "ASC"]] });
    return res.json({ documents: documents.map(serializeDocument) });
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req, res, next) {
  try {
    const university = await findOwnedUniversity(req.user.id, req.params.universityId);
    if (!university) return res.status(404).json({ message: "Universitatea nu a fost gasita." });
    const payload = { ...req.body };
    if (req.user.role === "student") {
      return res.status(403).json({ message: "Elevii nu pot adăuga documente manual în tracker. Atașează fișierul real la documentele cerute din dosarul de admitere." });
    }
    const document = await Document.create({ ...payload, UniversityId: university.id });
    return res.status(201).json({ document: serializeDocument(document) });
  } catch (error) {
    next(error);
  }
}

export async function createApplicationDocument(req, res, next) {
  try {
    const application = await findAccessibleApplication(req.user, req.params.applicationId);
    if (!application) return res.status(404).json({ message: "Aplicația nu a fost găsită." });
    const payload = { ...req.body };
    if (req.user.role === "student") {
      const template = studentDocumentTemplate(payload.name);
      if (!template) {
        return res.status(422).json({ message: "Alege un tip de document aprobat din lista UniTrack; documentele arbitrare nu pot fi adăugate în dosar." });
      }
      const existing = await Document.findOne({ where: { AdmissionApplicationId: application.id, name: template.name } });
      if (existing) {
        return res.status(409).json({ message: "Documentul există deja în dosarul acestei aplicații." });
      }
      payload.name = template.name;
      payload.category = template.category;
      payload.isOptional = template.isOptional;
    }
    const document = await Document.create({
      ...payload,
      isCompleted: false,
      verificationStatus: "missing",
      AdmissionApplicationId: application.id
    });
    return res.status(201).json({ document: serializeDocument(document) });
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
    if (req.user.role === "student" && payload.verificationStatus) {
      return res.status(403).json({ message: "Doar universitatea sau adminul poate schimba statusul de verificare manual." });
    }
    if (req.user.role === "student" && (payload.name || payload.category || payload.isOptional !== undefined)) {
      return res.status(403).json({ message: "Elevii nu pot modifica tipul documentelor cerute; pot adăuga doar documente suplimentare." });
    }
    if (req.user.role === "student" && (payload.isCompleted === true || payload.completedAt)) {
      return res.status(403).json({ message: "Documentele se marchează complete doar după verificare AI sau aprobare de universitate." });
    }
    if (payload.verificationStatus === "verified") {
      payload.isCompleted = true;
      payload.completedAt = payload.completedAt || new Date().toISOString().slice(0, 10);
    }
    if (payload.verificationStatus === "rejected") {
      payload.isCompleted = false;
      payload.completedAt = null;
    }
    if (payload.isCompleted === true && !payload.completedAt) {
      payload.completedAt = new Date().toISOString().slice(0, 10);
    }
    if (payload.isCompleted === false) payload.completedAt = null;

    await document.update(payload);
    return res.json({ document: serializeDocument(document) });
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
    if (req.user.role === "student") {
      if (!document.isOptional) {
        return res.status(403).json({ message: "Documentele cerute de admitere nu pot fi șterse de elev." });
      }
      if (document.verificationStatus === "verified" || document.isCompleted) {
        return res.status(403).json({ message: "Un document verificat rămâne în dosar pentru audit și nu poate fi șters de elev." });
      }
    }
    await document.destroy();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

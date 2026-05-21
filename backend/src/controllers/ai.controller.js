import { AdmissionApplication, Document, Institution, University } from "../models/index.js";
import { classifyDocument } from "../services/documentAi.js";
import { adviseStudent } from "../services/studentAdvisor.js";
import { writeAudit } from "../services/audit.js";
import { hashText } from "../utils/crypto.js";

function serializeDocument(document) {
  if (!document) return document;
  const plain = document.toJSON ? document.toJSON() : { ...document };
  delete plain.fileDataUrl;
  delete plain.fileSha256;
  return plain;
}

async function findOwnedDocument(req) {
  if (req.body.documentId) {
    const document = await Document.findByPk(req.body.documentId, { include: [AdmissionApplication, University] });
    if (!document) return null;
    if (req.user.role === "admin") return document;
    const app = document.AdmissionApplication;
    if (app) {
      if (req.user.role === "student" && app.StudentId !== req.user.id) return null;
      if (req.user.role === "university" && app.InstitutionId !== req.user.InstitutionId) return null;
      return document;
    }
    const university = document.University;
    if (university && req.user.role === "student" && university.UserId === req.user.id) return document;
  }
  return null;
}

export async function checkDocument(req, res, next) {
  try {
    const hasAttachedFile = /^data:[^;,]+;base64,/i.test(String(req.body.fileDataUrl || ""));
    if (!hasAttachedFile) {
      return res.status(422).json({ message: "Atașează fișierul real înainte de verificare. Textul sau numele fișierului nu sunt suficiente pentru dosar." });
    }

    const result = await classifyDocument(req.body);
    const document = await findOwnedDocument(req);
    if (document) {
      await document.update({
        fileName: req.body.fileName,
        mimeType: req.body.mimeType || null,
        fileSize: req.body.fileSize || null,
        fileDataUrl: req.body.fileDataUrl || null,
        fileSha256: hashText(`${req.body.fileName}:${req.body.text || ""}:${req.body.fileDataUrl || ""}`),
        extractedText: req.body.text || "",
        verificationStatus: result.accepted ? "verified" : "rejected",
        isCompleted: result.accepted,
        completedAt: result.accepted ? new Date().toISOString().slice(0, 10) : null,
        aiProvider: result.provider,
        aiLabel: result.label,
        aiConfidence: result.confidence,
        aiExplanation: result.explanation
      });
      await writeAudit(req, {
        action: "document.ai_check",
        entityType: "Document",
        entityId: document.id,
        metadata: { accepted: result.accepted, provider: result.provider, label: result.label, confidence: result.confidence }
      });
    }
    return res.json({ result, document: serializeDocument(document) });
  } catch (error) {
    next(error);
  }
}

export async function studentAdvice(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Consilierul AI este disponibil pentru conturile de elev." });
    }

    const universities = await University.findAll({ where: { UserId: req.user.id }, include: [Document], order: [["deadline", "ASC"]] });
    const applications = await AdmissionApplication.findAll({
      where: { StudentId: req.user.id },
      include: [Institution, Document],
      order: [["submittedAt", "DESC"]]
    });
    const documents = [
      ...universities.flatMap((university) => university.Documents || []),
      ...applications.flatMap((application) => application.Documents || [])
    ];

    let target = null;
    if (req.body.applicationId) target = applications.find((item) => item.id === req.body.applicationId) || null;
    if (!target && req.body.universityId) target = universities.find((item) => item.id === req.body.universityId) || null;
    if (!target && req.body.institutionId) target = await Institution.findOne({ where: { id: req.body.institutionId, status: "active" } });
    if (!target) target = applications[0] || universities[0] || null;

    const advice = await adviseStudent({
      profile: {
        name: req.user.name,
        bacAverage: req.user.bacAverage,
        languageResults: req.user.languageResults,
        interests: req.user.interests
      },
      target,
      cvText: req.body.cvText,
      personalGoal: req.body.personalGoal,
      universities,
      applications,
      documents
    });

    await writeAudit(req, {
      action: "ai.student_advice",
      entityType: target?.constructor?.name || "Institution",
      entityId: target?.id || null,
      metadata: { provider: advice.provider, admissionChance: advice.admissionChance }
    });
    return res.json({ advice });
  } catch (error) {
    next(error);
  }
}

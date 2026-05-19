import { AdmissionApplication, Document, University } from "../models/index.js";
import { classifyDocument } from "../services/documentAi.js";
import { writeAudit } from "../services/audit.js";
import { hashText } from "../utils/crypto.js";

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
    const result = await classifyDocument(req.body);
    const document = await findOwnedDocument(req);
    if (document) {
      await document.update({
        fileName: req.body.fileName,
        mimeType: req.body.mimeType || null,
        fileSha256: hashText(`${req.body.fileName}:${req.body.text || ""}`),
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
    return res.json({ result, document });
  } catch (error) {
    next(error);
  }
}

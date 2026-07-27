import { Op } from "sequelize";
import { AdmissionApplication, AiUsage, Document, Institution, University } from "../models/index.js";
import { classifyDocument } from "../services/documentAi.js";
import { adviseStudent } from "../services/studentAdvisor.js";
import { writeAudit } from "../services/audit.js";
import { hashText } from "../utils/crypto.js";
import { env } from "../config/env.js";

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

function dayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function estimatedTokensForPayload(payload) {
  const raw = [
    payload.fileName,
    payload.expectedType,
    payload.text,
    payload.personalGoal,
    payload.cvText,
    payload.fileDataUrl ? `[file:${Math.ceil(String(payload.fileDataUrl).length / 1024)}kb]` : ""
  ].filter(Boolean).join("\n");
  return Math.max(1, Math.ceil(raw.length / 4));
}

function modelForUsage(feature, result) {
  if (result?.provider === "gemini") {
    return feature === "advisor" ? env.geminiAdvisorModel : env.geminiDocumentModel;
  }
  if (result?.provider === "openai") {
    return feature === "advisor" ? env.openaiAdvisorModel : env.openaiDocumentModel;
  }
  return null;
}

async function enforceAiQuota(req, feature) {
  const limit = feature === "document" ? env.aiDocumentDailyLimit : env.aiAdvisorDailyLimit;
  if (req.user.role === "admin") return { limit, used: 0 };
  const used = await AiUsage.count({
    where: {
      UserId: req.user.id,
      feature,
      createdAt: { [Op.gte]: dayStart() }
    }
  });
  if (used >= limit) {
    const label = feature === "document" ? "verificări de documente" : "cereri către asistentul de dosar";
    const error = new Error(`Ai atins limita zilnică de ${limit} ${label}. Reîncearcă mâine sau cere adminului să mărească limita.`);
    error.status = 429;
    throw error;
  }
  return { limit, used };
}

async function recordAiUsage(req, { feature, result, document = null, application = null, status = "success" }) {
  return AiUsage.create({
    UserId: req.user.id,
    DocumentId: document?.id || null,
    AdmissionApplicationId: application?.id || document?.AdmissionApplicationId || null,
    feature,
    provider: result?.provider || null,
    model: result?.model || modelForUsage(feature, result),
    status,
    requestHash: hashText(JSON.stringify({
      feature,
      fileName: req.body.fileName,
      expectedType: req.body.expectedType,
      applicationId: req.body.applicationId,
      institutionId: req.body.institutionId,
      target: req.body.target
    })),
    inputBytes: Number(req.body.fileSize || 0) || Buffer.byteLength(JSON.stringify(req.body || {}), "utf8"),
    estimatedTokens: estimatedTokensForPayload(req.body),
    metadata: {
      accepted: result?.accepted,
      label: result?.label,
      confidence: result?.confidence,
      admissionChance: result?.admissionChance
    }
  }).catch(() => null);
}

export async function checkDocument(req, res, next) {
  try {
    await enforceAiQuota(req, "document");
    const hasAttachedFile = /^data:[^;,]+;base64,/i.test(String(req.body.fileDataUrl || ""));
    if (!hasAttachedFile) {
      return res.status(422).json({ message: "Atașează fișierul real înainte de verificare. Textul sau numele fișierului nu sunt suficiente pentru dosar." });
    }

    const result = await classifyDocument(req.body);
    const document = await findOwnedDocument(req);
    const verificationStatus = result.accepted
      ? "verified"
      : result.reviewRequired
        ? "pending"
        : "rejected";
    if (document) {
      await document.update({
        fileName: req.body.fileName,
        mimeType: req.body.mimeType || null,
        fileSize: req.body.fileSize || null,
        fileDataUrl: req.body.fileDataUrl || null,
        fileSha256: hashText(`${req.body.fileName}:${req.body.text || ""}:${req.body.fileDataUrl || ""}`),
        extractedText: req.body.text || "",
        verificationStatus,
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
        metadata: {
          accepted: result.accepted,
          reviewRequired: Boolean(result.reviewRequired),
          verificationStatus,
          provider: result.provider,
          model: result.model || null,
          label: result.label,
          confidence: result.confidence
        }
      });
    }
    await recordAiUsage(req, {
      feature: "document",
      result,
      document,
      status: result.reviewRequired && result.confidence === 0 ? "failed" : "success"
    });
    return res.json({ result, document: serializeDocument(document) });
  } catch (error) {
    next(error);
  }
}

export async function studentAdvice(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Asistentul de dosar este disponibil pentru conturile de elev." });
    }
    await enforceAiQuota(req, "advisor");

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
      strategyGoal: req.body.strategyGoal,
      budgetPreference: req.body.budgetPreference,
      mobilityPreference: req.body.mobilityPreference,
      timelineWeeks: req.body.timelineWeeks,
      universities,
      applications,
      documents
    });

    await recordAiUsage(req, {
      feature: "advisor",
      result: advice,
      application: target instanceof AdmissionApplication ? target : null
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

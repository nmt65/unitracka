import bcrypt from "bcryptjs";
import { AuditLog, Institution, User } from "../models/index.js";
import { env } from "../config/env.js";
import { writeAudit } from "../services/audit.js";
import { isSmtpConfigured } from "../services/mail.js";

export async function createInstitution(req, res, next) {
  try {
    const existing = await Institution.findOne({ where: { name: req.body.name } });
    if (existing) return res.status(409).json({ message: "Această universitate există deja în platformă." });
    const institution = await Institution.create(req.body);
    await writeAudit(req, { action: "admin.institution_create", entityType: "Institution", entityId: institution.id, metadata: { name: institution.name, status: institution.status } });
    return res.status(201).json({ institution });
  } catch (error) {
    next(error);
  }
}

export async function updateInstitution(req, res, next) {
  try {
    const institution = await Institution.findByPk(req.params.id);
    if (!institution) return res.status(404).json({ message: "Universitatea nu există." });
    await institution.update(req.body);
    await writeAudit(req, { action: "admin.institution_update", entityType: "Institution", entityId: institution.id, metadata: req.body });
    return res.json({ institution });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(_req, res, next) {
  try {
    const users = await User.findAll({
      include: [Institution],
      order: [["createdAt", "DESC"]]
    });
    return res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function createUniversityUser(req, res, next) {
  try {
    const institution = await Institution.findByPk(req.body.institutionId);
    if (!institution) return res.status(404).json({ message: "Universitatea nu există." });
    if (institution.status !== "active") return res.status(422).json({ message: "Activează universitatea înainte să creezi cont instituțional." });
    const exists = await User.unscoped().findOne({ where: { email: req.body.email } });
    if (exists) return res.status(409).json({ message: "Există deja un utilizator cu acest email." });
    const user = await User.create({
      email: req.body.email,
      name: req.body.name || institution.name,
      role: "university",
      InstitutionId: institution.id,
      passwordHash: await bcrypt.hash(req.body.password, 12)
    });
    await writeAudit(req, { action: "admin.university_user_create", entityType: "User", entityId: user.id, metadata: { email: user.email, institutionId: institution.id } });
    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function listAuditLogs(_req, res, next) {
  try {
    const logs = await AuditLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 100
    });
    return res.json({ logs });
  } catch (error) {
    next(error);
  }
}

export function systemStatus(_req, res) {
  return res.json({
    status: {
      nodeEnv: env.nodeEnv,
      database: env.dbDialect,
      seedDemo: env.seedDemo,
      bootstrapAdmin: env.bootstrapAdmin,
      smtpConfigured: isSmtpConfigured(),
      aiConfigured: Boolean(env.openaiApiKey || env.geminiApiKey),
      openaiModel: env.openaiApiKey ? env.openaiDocumentModel : null,
      openaiAdvisorModel: env.openaiApiKey ? env.openaiAdvisorModel : null,
      geminiModel: env.geminiApiKey ? env.geminiDocumentModel : null,
      geminiAdvisorModel: env.geminiApiKey ? env.geminiAdvisorModel : null,
      corsOrigins: env.corsOrigins,
      trustProxy: env.trustProxy
    }
  });
}

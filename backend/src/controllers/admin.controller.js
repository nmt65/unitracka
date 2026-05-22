import bcrypt from "bcryptjs";
import { AdmissionProgram, AuditLog, Institution, ProgramRequirement, User } from "../models/index.js";
import { env } from "../config/env.js";
import { writeAudit } from "../services/audit.js";
import { isSmtpConfigured, sendMailSafe } from "../services/mail.js";
import { universityCatalog } from "../data/catalog.js";
import { importCatalogToInstitutions } from "../services/catalogImport.js";
import { defaultDocuments } from "../data/defaultDocuments.js";

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

function serializeProgram(program) {
  const plain = program.toJSON ? program.toJSON() : { ...program };
  const requirements = plain.ProgramRequirements || plain.requirements || [];
  delete plain.ProgramRequirements;
  delete plain.requirements;
  return {
    ...plain,
    requirements: requirements
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((requirement) => ({
        id: requirement.id,
        documentName: requirement.documentName,
        category: requirement.category,
        isOptional: requirement.isOptional,
        verificationRequired: requirement.verificationRequired,
        rule: requirement.rule,
        sortOrder: requirement.sortOrder
      }))
  };
}

function fallbackRequirements() {
  return defaultDocuments.map((document, index) => ({
    documentName: document.name,
    category: document.category,
    isOptional: document.isOptional,
    verificationRequired: true,
    rule: document.isOptional ? "Opțional, dar util pentru departajare." : "Obligatoriu pentru validarea dosarului.",
    sortOrder: index
  }));
}

export async function listAdmissionPrograms(req, res, next) {
  try {
    const where = {};
    if (req.query.institutionId) where.InstitutionId = req.query.institutionId;
    const programs = await AdmissionProgram.findAll({
      where,
      include: [Institution, ProgramRequirement],
      order: [["academicYear", "DESC"], ["faculty", "ASC"], ["name", "ASC"]]
    });
    return res.json({ programs: programs.map(serializeProgram) });
  } catch (error) {
    next(error);
  }
}

export async function createAdmissionProgram(req, res, next) {
  try {
    const institution = await Institution.findByPk(req.body.institutionId);
    if (!institution) return res.status(404).json({ message: "Universitatea nu există." });
    const { institutionId, requirements = [], ...payload } = req.body;
    const program = await AdmissionProgram.create({ ...payload, InstitutionId: institutionId, source: "admin" });
    const rows = (requirements.length ? requirements : fallbackRequirements()).map((requirement, index) => ({
      ...requirement,
      sortOrder: requirement.sortOrder ?? index,
      AdmissionProgramId: program.id
    }));
    await ProgramRequirement.bulkCreate(rows, { validate: true });
    await writeAudit(req, {
      action: "admin.program_create",
      entityType: "AdmissionProgram",
      entityId: program.id,
      metadata: { institutionId, name: program.name, requirements: rows.length }
    });
    const created = await AdmissionProgram.findByPk(program.id, { include: [Institution, ProgramRequirement] });
    return res.status(201).json({ program: serializeProgram(created) });
  } catch (error) {
    next(error);
  }
}

export async function updateAdmissionProgram(req, res, next) {
  try {
    const program = await AdmissionProgram.findByPk(req.params.id, { include: [ProgramRequirement] });
    if (!program) return res.status(404).json({ message: "Programul nu există." });
    const { requirements, institutionId: _ignoredInstitutionId, ...payload } = req.body;
    await program.update(payload);
    if (Array.isArray(requirements)) {
      await ProgramRequirement.destroy({ where: { AdmissionProgramId: program.id } });
      await ProgramRequirement.bulkCreate(requirements.map((requirement, index) => ({
        ...requirement,
        sortOrder: requirement.sortOrder ?? index,
        AdmissionProgramId: program.id
      })), { validate: true });
    }
    await writeAudit(req, {
      action: "admin.program_update",
      entityType: "AdmissionProgram",
      entityId: program.id,
      metadata: { fields: Object.keys(payload), requirements: Array.isArray(requirements) ? requirements.length : undefined }
    });
    const updated = await AdmissionProgram.findByPk(program.id, { include: [Institution, ProgramRequirement] });
    return res.json({ program: serializeProgram(updated) });
  } catch (error) {
    next(error);
  }
}

export async function importCatalogInstitutions(req, res, next) {
  try {
    const result = await importCatalogToInstitutions();
    await writeAudit(req, {
      action: "admin.catalog_import",
      entityType: "Institution",
      metadata: result
    });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function sendTestEmail(req, res, next) {
  try {
    const to = req.body.email || req.user.email;
    const delivery = await sendMailSafe({
      to,
      subject: "Test email UniTrack",
      text: [
        "SMTP este configurat corect.",
        "",
        `Mediu: ${env.nodeEnv}`,
        `APP_URL: ${env.appUrl}`,
        "",
        "Dacă ai primit acest mesaj, resetarea parolei și notificările pot fi trimise."
      ].join("\n")
    });
    await writeAudit(req, {
      action: "admin.smtp_test",
      entityType: "Email",
      metadata: { to, sent: delivery.sent, reason: delivery.reason || null }
    });
    if (!delivery.sent) return res.status(422).json({ sent: false, message: delivery.reason || "Emailul de test nu a putut fi trimis." });
    return res.json({ sent: true, message: "Email test trimis." });
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
      seedCatalog: env.seedCatalog,
      bootstrapAdmin: env.bootstrapAdmin,
      bootstrapAdminResetPassword: env.bootstrapAdminResetPassword,
      smtpConfigured: isSmtpConfigured(),
      smtpHost: env.smtp.host || null,
      smtpUser: env.smtp.user ? env.smtp.user.replace(/(^.).*(@.*$)/, "$1***$2") : null,
      aiConfigured: Boolean(env.openaiApiKey || env.geminiApiKey),
      openaiModel: env.openaiApiKey ? env.openaiDocumentModel : null,
      openaiAdvisorModel: env.openaiApiKey ? env.openaiAdvisorModel : null,
      geminiModel: env.geminiApiKey ? env.geminiDocumentModel : null,
      geminiAdvisorModel: env.geminiApiKey ? env.geminiAdvisorModel : null,
      aiDocumentDailyLimit: env.aiDocumentDailyLimit,
      aiAdvisorDailyLimit: env.aiAdvisorDailyLimit,
      corsOrigins: env.corsOrigins,
      trustProxy: env.trustProxy,
      catalogCount: universityCatalog.length
    }
  });
}

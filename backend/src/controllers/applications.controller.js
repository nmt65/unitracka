import { AdmissionApplication, Document, Institution, Notification, User } from "../models/index.js";
import { defaultDocuments } from "../data/defaultDocuments.js";
import { writeAudit } from "../services/audit.js";
import { sendApplicationStatusEmail, sendApplicationSubmittedEmail } from "../services/mail.js";

function includeAll() {
  return [
    Institution,
    { model: User, as: "Student", attributes: ["id", "name", "email", "bacAverage", "languageResults", "cnpLast4"] },
    Document
  ];
}

function serialize(application) {
  const plain = application.toJSON ? application.toJSON() : application;
  const docs = plain.Documents || plain.documents || [];
  delete plain.Documents;
  delete plain.documents;
  return {
    ...plain,
    documents: docs
  };
}

export async function listMine(req, res, next) {
  try {
    const applications = await AdmissionApplication.findAll({
      where: { StudentId: req.user.id },
      include: includeAll(),
      order: [["submittedAt", "DESC"]]
    });
    return res.json({ applications: applications.map(serialize) });
  } catch (error) {
    next(error);
  }
}

export async function createApplication(req, res, next) {
  try {
    const institution = await Institution.findOne({ where: { id: req.body.institutionId, status: "active" } });
    if (!institution) return res.status(404).json({ message: "Universitatea nu există sau nu este activă." });
    const duplicate = await AdmissionApplication.findOne({
      where: {
        StudentId: req.user.id,
        InstitutionId: institution.id,
        program: req.body.program
      }
    });
    if (duplicate) return res.status(409).json({ message: "Ai deja o aplicație pentru această universitate și acest program." });

    const application = await AdmissionApplication.create({
      ...req.body,
      StudentId: req.user.id,
      InstitutionId: institution.id,
      submittedAt: new Date()
    });
    await Document.bulkCreate(defaultDocuments.map((doc) => ({
      ...doc,
      isCompleted: false,
      verificationStatus: "missing",
      AdmissionApplicationId: application.id
    })));

    const staff = await User.findAll({ where: { role: "university", InstitutionId: institution.id } });
    await Notification.bulkCreate(staff.map((user) => ({
      UserId: user.id,
      AdmissionApplicationId: application.id,
      type: "application_submitted",
      title: "Aplicație nouă",
      body: `${req.user.name} a trimis o aplicație pentru ${req.body.program}.`
    })));
    await Promise.all(staff.map((user) => sendApplicationSubmittedEmail(user, req.user, institution, application)));
    await writeAudit(req, {
      action: "application.create",
      entityType: "AdmissionApplication",
      entityId: application.id,
      metadata: { institutionId: institution.id, program: application.program }
    });

    const created = await AdmissionApplication.findByPk(application.id, { include: includeAll() });
    return res.status(201).json({ application: serialize(created) });
  } catch (error) {
    next(error);
  }
}

export async function workspaceApplications(req, res, next) {
  try {
    const where = {};
    if (req.user.role === "university") where.InstitutionId = req.user.InstitutionId;
    if (req.query.status && req.query.status !== "all") where.status = req.query.status;
    const order = {
      newest: [["submittedAt", "DESC"]],
      oldest: [["submittedAt", "ASC"]],
      score: [["admissionScore", "DESC"]],
      status: [["status", "ASC"], ["submittedAt", "DESC"]]
    }[req.query.sort || "newest"];
    const applications = await AdmissionApplication.findAll({ where, include: includeAll(), order });
    return res.json({ applications: applications.map(serialize) });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const application = await AdmissionApplication.findByPk(req.params.id, { include: includeAll() });
    if (!application) return res.status(404).json({ message: "Aplicația nu există." });
    if (req.user.role === "university" && application.InstitutionId !== req.user.InstitutionId) {
      return res.status(403).json({ message: "Nu poți modifica aplicațiile altei universități." });
    }
    await application.update({ status: req.body.status, reviewerNotes: req.body.reviewerNotes || null, reviewedAt: new Date() });
    await Notification.create({
      UserId: application.StudentId,
      AdmissionApplicationId: application.id,
      type: "application_status",
      title: "Status aplicație actualizat",
      body: `${application.Institution.name} a setat statusul aplicației tale la ${req.body.status}.`
    });
    await sendApplicationStatusEmail(application.Student, application.Institution, req.body.status);
    await writeAudit(req, {
      action: "application.status_update",
      entityType: "AdmissionApplication",
      entityId: application.id,
      metadata: { status: req.body.status, institutionId: application.InstitutionId }
    });
    const updated = await AdmissionApplication.findByPk(application.id, { include: includeAll() });
    return res.json({ application: serialize(updated) });
  } catch (error) {
    next(error);
  }
}

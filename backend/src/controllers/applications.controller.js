import { AdmissionApplication, AdmissionProgram, Document, Institution, Notification, ProgramRequirement, University, User } from "../models/index.js";
import { Op } from "sequelize";
import { defaultDocuments } from "../data/defaultDocuments.js";
import { universityCatalog } from "../data/catalog.js";
import { writeAudit } from "../services/audit.js";
import { sendApplicationStatusEmail, sendApplicationSubmittedEmail } from "../services/mail.js";

function includeAll() {
  return [
    Institution,
    { model: AdmissionProgram, include: [ProgramRequirement] },
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
    documents: docs.map((doc) => {
      const safeDoc = doc.toJSON ? doc.toJSON() : { ...doc };
      delete safeDoc.fileDataUrl;
      delete safeDoc.fileSha256;
      return safeDoc;
    })
  };
}

function documentRatio(application) {
  const docs = application.documents || [];
  if (!docs.length) return 0;
  return docs.filter((doc) => doc.verificationStatus === "verified" || doc.isCompleted).length / docs.length;
}

function matchesDocumentFilter(application, filter) {
  const docs = application.documents || [];
  if (!filter || filter === "all") return true;
  if (filter === "complete") return docs.length > 0 && docs.every((doc) => doc.isOptional || doc.verificationStatus === "verified");
  if (filter === "incomplete") return docs.some((doc) => !doc.isOptional && doc.verificationStatus !== "verified");
  if (filter === "rejected") return docs.some((doc) => doc.verificationStatus === "rejected");
  if (filter === "missing") return docs.some((doc) => doc.verificationStatus === "missing" || !doc.fileName);
  return true;
}

function normalizeValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function catalogForInstitution(institution) {
  return universityCatalog.find((item) => normalizeValue(item.name) === normalizeValue(institution.name));
}

async function resolveProgram(institution, payload) {
  if (payload.programId) {
    return AdmissionProgram.findOne({
      where: { id: payload.programId, InstitutionId: institution.id, status: "active" },
      include: [ProgramRequirement]
    });
  }

  const dbPrograms = await AdmissionProgram.findAll({
    where: { InstitutionId: institution.id, status: "active" },
    include: [ProgramRequirement]
  });
  if (dbPrograms.length) {
    return dbPrograms.find((program) => (
      normalizeValue(program.name) === normalizeValue(payload.program)
      && normalizeValue(program.faculty) === normalizeValue(payload.faculty)
      && program.programType === payload.programType
    )) || null;
  }

  const catalog = catalogForInstitution(institution);
  if (!catalog?.offerPrograms?.length) return {
    name: payload.program,
    faculty: payload.faculty || "Oferta educațională oficială",
    programType: payload.programType,
    deadline: null,
    website: institution.website,
    ProgramRequirements: []
  };
  const offer = catalog.offerPrograms.find((program) => (
    normalizeValue(program.program) === normalizeValue(payload.program)
    && normalizeValue(program.faculty) === normalizeValue(payload.faculty)
    && program.programType === payload.programType
  ));
  if (!offer) return null;
  return {
    name: offer.program,
    faculty: offer.faculty,
    programType: offer.programType,
    deadline: offer.deadline || null,
    website: offer.website || institution.website,
    ProgramRequirements: []
  };
}

function requirementsForProgram(program) {
  const requirements = program?.ProgramRequirements || program?.requirements || [];
  if (requirements.length) {
    return requirements
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((requirement) => ({
        name: requirement.documentName,
        category: requirement.category,
        isOptional: requirement.isOptional,
        isCompleted: false,
        verificationStatus: "missing"
      }));
  }
  return defaultDocuments.map((doc) => ({ ...doc, isCompleted: false, verificationStatus: "missing" }));
}

function matchesCurrentOffer(institution, payload) {
  const catalog = catalogForInstitution(institution);
  if (!catalog?.offerPrograms?.length) return true;
  return catalog.offerPrograms.some((offer) => (
    normalizeValue(offer.program) === normalizeValue(payload.program)
    && normalizeValue(offer.faculty) === normalizeValue(payload.faculty)
    && offer.programType === payload.programType
  ));
}

function trackerStatusForApplication(status) {
  if (status === "accepted") return "Acceptat";
  if (status === "rejected") return "Respins";
  return "Aplicat";
}

async function syncApplicationTracker(studentId, institution, application) {
  const catalog = catalogForInstitution(institution);
  const [tracker, created] = await University.findOrCreate({
    where: {
      UserId: studentId,
      name: institution.name,
      program: application.program,
      faculty: application.faculty || "Oferta educațională oficială"
    },
    defaults: {
      UserId: studentId,
      name: institution.name,
      shortName: institution.shortName,
      country: institution.country,
      countryCode: institution.countryCode,
      faculty: application.faculty || "Oferta educațională oficială",
      program: application.program,
      programType: application.programType,
      deadline: `${new Date().getFullYear()}-07-15`,
      officialLink: institution.website || catalog?.website || "",
      notes: application.notes || catalog?.offerSummary || null,
      status: trackerStatusForApplication(application.status),
      annualTuition: null,
      rating: null
    }
  });

  if (created) {
    await Document.bulkCreate(defaultDocuments.map((doc) => ({ ...doc, isCompleted: false, verificationStatus: "missing", UniversityId: tracker.id })));
    return tracker;
  }

  await tracker.update({
    status: trackerStatusForApplication(application.status),
    officialLink: tracker.officialLink || institution.website || catalog?.website || "",
    notes: tracker.notes || application.notes || catalog?.offerSummary || null
  });
  return tracker;
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
    const selectedProgram = await resolveProgram(institution, req.body);
    if (!selectedProgram && !matchesCurrentOffer(institution, req.body)) {
      return res.status(422).json({ message: "Alege un program din oferta educațională curentă a universității." });
    }
    const programName = selectedProgram?.name || req.body.program;
    const faculty = selectedProgram?.faculty || req.body.faculty || null;
    const programType = selectedProgram?.programType || req.body.programType;
    const duplicateChecks = [{ program: programName, faculty, programType }];
    if (selectedProgram?.id) duplicateChecks.unshift({ AdmissionProgramId: selectedProgram.id });
    const duplicate = await AdmissionApplication.findOne({
      where: {
        StudentId: req.user.id,
        InstitutionId: institution.id,
        [Op.or]: duplicateChecks
      }
    });
    if (duplicate) return res.status(409).json({ message: "Ai deja o aplicație pentru această universitate și acest program." });

    const { admissionScore: _ignoredAdmissionScore, ...payload } = req.body;
    const application = await AdmissionApplication.create({
      ...payload,
      AdmissionProgramId: selectedProgram?.id || null,
      program: programName,
      faculty,
      programType,
      admissionScore: null,
      StudentId: req.user.id,
      InstitutionId: institution.id,
      submittedAt: new Date()
    });
    await Document.bulkCreate(requirementsForProgram(selectedProgram).map((doc) => ({
      ...doc,
      isCompleted: false,
      verificationStatus: "missing",
      AdmissionApplicationId: application.id
    })));
    await syncApplicationTracker(req.user.id, institution, application);

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
    let rows = applications.map(serialize).filter((application) => matchesDocumentFilter(application, req.query.documents));
    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      rows = rows.filter((application) => [
        application.program,
        application.faculty,
        application.Student?.name,
        application.Student?.email,
        application.Institution?.name
      ].filter(Boolean).join(" ").toLowerCase().includes(search));
    }
    if (req.query.sort === "documents") rows.sort((a, b) => documentRatio(b) - documentRatio(a));
    return res.json({ applications: rows });
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
    await University.update(
      { status: trackerStatusForApplication(req.body.status) },
      {
        where: {
          UserId: application.StudentId,
          name: application.Institution.name,
          program: application.program,
          faculty: application.faculty || "Oferta educațională oficială"
        }
      }
    );
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

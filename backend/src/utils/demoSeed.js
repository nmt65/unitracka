import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { AdmissionApplication, Document, Institution, Notification, University, User } from "../models/index.js";
import { hashCnp } from "./cnp.js";

const universities = [
  {
    name: "Universitatea din București",
    shortName: "UB",
    country: "România",
    countryCode: "RO",
    faculty: "Facultatea de Matematică și Informatică",
    program: "Informatică",
    programType: "licenta",
    deadline: "2026-05-27",
    officialLink: "https://unibuc.ro",
    status: "Acceptat",
    annualTuition: 0,
    rating: 5,
    notes: "Acceptat. Dosar complet.",
    documents: [
      ["Diplomă BAC", true, "2026-05-10"],
      ["Foaie matricolă", true, "2026-05-10"],
      ["CV Europass", true, "2026-05-08"],
      ["Scrisoare motivație", true, "2026-05-09"],
      ["Scrisori de recomandare", true, "2026-05-11"],
      ["Cazier judiciar", true, "2026-05-07"],
      ["Adeverință medicală", true, "2026-05-07"]
    ]
  },
  {
    name: "Univ. Tehnică Cluj-Napoca",
    shortName: "UTCN",
    country: "România",
    countryCode: "RO",
    faculty: "Calculatoare și Tehnologia Informației",
    program: "Calculatoare și Tehnologia Informației",
    programType: "licenta",
    deadline: "2026-05-27",
    officialLink: "https://www.utcluj.ro",
    status: "Aplicat",
    annualTuition: 50,
    rating: 4,
    notes: "Mai lipsesc recomandările și adeverința.",
    documents: [
      ["Diplomă BAC", true, "2026-05-10"],
      ["Foaie matricolă", true, "2026-05-10"],
      ["CV Europass", true, "2026-05-08"],
      ["Scrisoare motivație", true, "2026-05-09"],
      ["Cazier judiciar", true, "2026-05-07"],
      ["Scrisori de recomandare", false, null],
      ["Adeverință medicală", false, null]
    ]
  },
  {
    name: "TU Delft",
    shortName: "TU",
    country: "Olanda",
    countryCode: "NL",
    faculty: "Faculty of Electrical Engineering",
    program: "Computer Science & Engineering",
    programType: "licenta",
    deadline: "2026-05-31",
    officialLink: "https://www.tudelft.nl",
    status: "Aplicat",
    annualTuition: 2601,
    rating: 5,
    notes: "Dosar international in lucru.",
    documents: [
      ["Diplomă BAC", true, "2026-05-10"],
      ["Foaie matricolă", true, "2026-05-10"],
      ["CV Europass", true, "2026-05-08"],
      ["Scrisoare motivație", false, null],
      ["Scrisori de recomandare", false, null],
      ["Certificat limbă (IELTS)", false, null],
      ["Cazier judiciar", false, null]
    ]
  },
  {
    name: "KU Leuven",
    shortName: "KU",
    country: "Belgia",
    countryCode: "BE",
    faculty: "Faculty of Engineering Science",
    program: "Master Artificial Intelligence",
    programType: "master",
    deadline: "2026-06-15",
    officialLink: "https://www.kuleuven.be",
    status: "Wishlist",
    annualTuition: 1250,
    rating: 4,
    notes: "De verificat cerințele de limbă.",
    documents: [
      ["Diplomă BAC", true, "2026-05-10"],
      ["Foaie matricolă", false, null],
      ["CV Europass", false, null],
      ["Scrisoare motivație", false, null],
      ["Scrisori de recomandare", false, null],
      ["Certificat limbă (IELTS/TOEFL)", false, null]
    ]
  },
  {
    name: "Politehnica București",
    shortName: "UPB",
    country: "România",
    countryCode: "RO",
    faculty: "Facultatea de Automatică și Calculatoare",
    program: "Automatică și Informatică Aplicată",
    programType: "licenta",
    deadline: "2026-06-20",
    officialLink: "https://upb.ro",
    status: "Cercetare",
    annualTuition: 0,
    rating: 3,
    notes: "Cercetare inițială.",
    documents: [
      ["Diplomă BAC", false, null],
      ["Foaie matricolă", false, null],
      ["CV Europass", false, null],
      ["Adeverință medicală", false, null]
    ]
  },
  {
    name: "University of Edinburgh",
    shortName: "UoE",
    country: "Marea Britanie",
    countryCode: "GB",
    faculty: "School of Informatics",
    program: "Artificial Intelligence",
    programType: "master",
    deadline: "2026-07-01",
    officialLink: "https://www.ed.ac.uk",
    status: "Cercetare",
    annualTuition: 32000,
    rating: 4,
    notes: "Opțiune internațională, cost ridicat.",
    documents: [
      ["Diplomă BAC", false, null],
      ["Foaie matricolă", false, null],
      ["CV Europass", false, null],
      ["Scrisoare motivație", false, null],
      ["Scrisori de recomandare", false, null],
      ["Certificat limbă (IELTS/TOEFL)", false, null]
    ]
  }
];

const institutions = [
  {
    name: "Universitatea din București",
    shortName: "UB",
    country: "România",
    countryCode: "RO",
    city: "București",
    website: "https://unibuc.ro",
    contactEmail: "admitere@unibuc.ro",
    status: "active"
  },
  {
    name: "Univ. Tehnică Cluj-Napoca",
    shortName: "UTCN",
    country: "România",
    countryCode: "RO",
    city: "Cluj-Napoca",
    website: "https://www.utcluj.ro",
    contactEmail: "admitere@utcluj.ro",
    status: "active"
  },
  {
    name: "TU Delft",
    shortName: "TU",
    country: "Olanda",
    countryCode: "NL",
    city: "Delft",
    website: "https://www.tudelft.nl",
    contactEmail: "admissions@tudelft.nl",
    status: "active"
  }
];

function categoryFor(name) {
  if (/bac|matricol/i.test(name)) return "Academice";
  if (/cv/i.test(name)) return "Identitate";
  if (/scrisoare|recomandare/i.test(name)) return "Eseuri";
  if (/limb/i.test(name)) return "Limbi străine";
  return "Administrative";
}

export async function seedDemoData() {
  const [user] = await User.scope("withPassword").findOrCreate({
    where: { email: env.demoEmail },
    defaults: {
      name: "Andrei Mihai",
      passwordHash: await bcrypt.hash(env.demoPassword, 12),
      role: "student",
      cnpHash: hashCnp("5060101221141"),
      cnpLast4: "1141",
      bacAverage: 9.75,
      languageResults: "IELTS 7.5",
      interests: ["Informatică", "Inteligență Artificială", "Machine Learning"],
      emailNotifications: true,
      notifyBeforeDays: 14
    }
  });

  await user.update({
    name: "Andrei Mihai",
    role: "student",
    cnpHash: user.cnpHash || hashCnp("5060101221141"),
    cnpLast4: user.cnpLast4 || "1141",
    bacAverage: 9.75,
    languageResults: "IELTS 7.5",
    interests: ["Informatică", "Inteligență Artificială", "Machine Learning"]
  });

  for (const item of institutions) {
    await Institution.findOrCreate({ where: { name: item.name }, defaults: item });
  }

  const ubInstitution = await Institution.findOne({ where: { shortName: "UB" } });
  const [admin] = await User.scope("withPassword").findOrCreate({
    where: { email: env.adminEmail },
    defaults: {
      name: "Admin UniTrack",
      role: "admin",
      passwordHash: await bcrypt.hash(env.demoPassword, 12)
    }
  });
  await admin.update({ role: "admin", name: "Admin UniTrack" });

  const [universityUser] = await User.scope("withPassword").findOrCreate({
    where: { email: env.universityEmail },
    defaults: {
      name: "Admitere Universitatea din București",
      role: "university",
      InstitutionId: ubInstitution?.id,
      passwordHash: await bcrypt.hash(env.demoPassword, 12)
    }
  });
  await universityUser.update({ role: "university", InstitutionId: ubInstitution?.id, name: "Admitere Universitatea din București" });

  let createdUniversities = 0;
  for (const item of universities) {
    const { documents, ...universityPayload } = item;
    const [university, wasCreated] = await University.findOrCreate({
      where: { UserId: user.id, name: item.name, program: item.program },
      defaults: { ...universityPayload, UserId: user.id }
    });
    if (wasCreated) createdUniversities += 1;
    const existingDocs = await Document.count({ where: { UniversityId: university.id } });
    if (!existingDocs) {
      await Document.bulkCreate(
        documents.map(([name, isCompleted, completedAt]) => ({
          name,
          category: categoryFor(name),
          isOptional: false,
          isCompleted,
          completedAt,
          verificationStatus: isCompleted ? "verified" : "missing",
          UniversityId: university.id
        }))
      );
    }
  }

  if (ubInstitution) {
    const [application] = await AdmissionApplication.findOrCreate({
      where: { StudentId: user.id, InstitutionId: ubInstitution.id, program: "Informatică" },
      defaults: {
        StudentId: user.id,
        InstitutionId: ubInstitution.id,
        program: "Informatică",
        faculty: "Facultatea de Matematică și Informatică",
        programType: "licenta",
        admissionScore: 9.75,
        status: "submitted",
        notes: "Aplicație demo trimisă către workspace-ul universității."
      }
    });
    const appDocs = await Document.count({ where: { AdmissionApplicationId: application.id } });
    if (!appDocs) {
      await Document.bulkCreate(universities[0].documents.map(([name, isCompleted, completedAt]) => ({
        name,
        category: categoryFor(name),
        isCompleted,
        completedAt,
        verificationStatus: isCompleted ? "verified" : "missing",
        AdmissionApplicationId: application.id
      })));
    }
    await Notification.findOrCreate({
      where: { UserId: universityUser.id, AdmissionApplicationId: application.id, type: "application_submitted" },
      defaults: {
        title: "Aplicație demo nouă",
        body: "Andrei Mihai a trimis o aplicație demo pentru Informatică.",
        type: "application_submitted",
        UserId: universityUser.id,
        AdmissionApplicationId: application.id
      }
    });
  }

  return { user, created: createdUniversities > 0 };
}

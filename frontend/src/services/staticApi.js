import { currentAdmissionYear as sharedCurrentAdmissionYear, universityCatalog as sharedUniversityCatalog } from "../../../backend/src/data/catalog.js";

const STORE_KEY = "unitrack_static_state_v2";
const SESSION_KEY = "unitrack_static_session_v2";

const defaultDocuments = [
  ["Diplomă BAC", "Academice", true, "2026-05-10"],
  ["Foaie matricolă", "Academice", true, "2026-05-10"],
  ["CV Europass", "Identitate", true, "2026-05-08"],
  ["Scrisoare motivație", "Eseuri", true, "2026-05-09"],
  ["Scrisori de recomandare", "Eseuri", true, "2026-05-11"],
  ["Certificat limbă (IELTS/TOEFL)", "Limbi străine", true, "2026-05-11", true],
  ["Cazier judiciar", "Administrative", true, "2026-05-07"],
  ["Adeverință medicală", "Administrative", true, "2026-05-07"],
  ["Portofoliu", "Suplimentare", false, null, true]
];

const seedUniversities = [
  ["Universitatea din București", "UB", "România", "RO", "Facultatea de Matematică și Informatică", "Informatică", "licenta", "2026-05-27", "Acceptat", 0, 9],
  ["Univ. Tehnică Cluj-Napoca", "UTCN", "România", "RO", "Calculatoare și Tehnologia Informației", "Calculatoare și Tehnologia Informației", "licenta", "2026-05-27", "Aplicat", 50, 8],
  ["TU Delft", "TU", "Olanda", "NL", "Faculty of Electrical Engineering", "Computer Science & Engineering", "licenta", "2026-05-31", "Aplicat", 2400, 8],
  ["KU Leuven", "KU", "Belgia", "BE", "Faculty of Engineering Science", "Master Artificial Intelligence", "master", "2026-06-15", "Wishlist", 1100, 7],
  ["Politehnica București", "UPB", "România", "RO", "Facultatea de Automatică și Calculatoare", "Automatică și Informatică Aplicată", "licenta", "2026-06-20", "Cercetare", 0, 7],
  ["University of Edinburgh", "UoE", "Marea Britanie", "GB", "School of Informatics", "Artificial Intelligence", "master", "2026-07-01", "Cercetare", 9250, 8]
];

const currentAdmissionYear = sharedCurrentAdmissionYear;
const defaultOfferPrograms = [
  { faculty: "Facultatea de Științe", program: "Informatică", programType: "licenta" },
  { faculty: "Facultatea de Științe", program: "Inteligență Artificială", programType: "master" },
  { faculty: "Școala doctorală", program: "Cercetare doctorală", programType: "doctorat" }
];

function catalogEntry(item) {
  return {
    academicYear: currentAdmissionYear,
    offerPrograms: item.offerPrograms || defaultOfferPrograms,
    offerSummary: `Ofertă educațională ${currentAdmissionYear}: ${(item.offerPrograms || defaultOfferPrograms).map((program) => program.program).join(", ")}.`,
    website: item.website || item.officialLink || "",
    ...item
  };
}

const catalog = sharedUniversityCatalog.map(catalogEntry);

function id(prefix) {
  return `${prefix}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function todayDiff(date) {
  const now = new Date();
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

const cnpControlDigits = "279146358279";
const cnpCountyCodes = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38",
  "39", "40", "41", "42", "43", "44", "45", "46", "51", "52"
]);

function normalizeCnp(cnp) {
  return String(cnp || "").replace(/\D/g, "");
}

function validateStaticCnp(cnp) {
  const value = normalizeCnp(cnp);
  if (!/^\d{13}$/.test(value)) return { valid: false, message: "CNP-ul trebuie să conțină 13 cifre." };
  const prefix = ["1", "2"].includes(value[0]) ? "19" : ["3", "4"].includes(value[0]) ? "18" : ["5", "6"].includes(value[0]) ? "20" : null;
  if (!prefix) return { valid: false, message: "Prima cifră din CNP nu este validă." };
  const year = Number(`${prefix}${value.slice(1, 3)}`);
  const month = Number(value.slice(3, 5));
  const day = Number(value.slice(5, 7));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { valid: false, message: "Data nașterii din CNP nu este validă." };
  }
  if (!cnpCountyCodes.has(value.slice(7, 9))) return { valid: false, message: "Codul județului din CNP nu este valid." };
  const sum = value.slice(0, 12).split("").reduce((acc, digit, index) => acc + Number(digit) * Number(cnpControlDigits[index]), 0);
  const check = sum % 11 === 10 ? 1 : sum % 11;
  if (check !== Number(value[12])) return { valid: false, message: "Cifra de control din CNP nu este validă." };
  return { valid: true, normalized: value, last4: value.slice(-4) };
}

function makeDocs(prefix, completedCount = 7) {
  return defaultDocuments.map(([name, category, defaultCompleted, completedAt, isOptional = false], index) => ({
    id: id(`${prefix}-doc`),
    name,
    category,
    isOptional,
    isCompleted: index < completedCount ? defaultCompleted : false,
    completedAt: index < completedCount ? completedAt : null,
    verificationStatus: index < completedCount ? "verified" : "missing",
    aiProvider: null,
    aiLabel: null,
    aiConfidence: null,
    aiExplanation: null
  }));
}

function initialState() {
  const studentId = "user-student";
  const adminId = "user-admin";
  const universityId = "user-university";
  const institutions = [
    { id: "inst-ub", name: "Universitatea din București", shortName: "UB", country: "România", countryCode: "RO", city: "București", website: "https://unibuc.ro", contactEmail: "admitere@unibuc.ro", status: "active" },
    { id: "inst-utcn", name: "Univ. Tehnică Cluj-Napoca", shortName: "UTCN", country: "România", countryCode: "RO", city: "Cluj-Napoca", website: "https://utcluj.ro", contactEmail: "admitere@utcluj.ro", status: "active" },
    { id: "inst-tud", name: "TU Delft", shortName: "TU", country: "Olanda", countryCode: "NL", city: "Delft", website: "https://www.tudelft.nl", contactEmail: "admissions@tudelft.nl", status: "active" }
  ];
  const completedByRow = [7, 5, 3, 1, 0, 0];
  const universities = seedUniversities.map((row, index) => ({
    id: `uni-${index + 1}`,
    UserId: studentId,
    name: row[0],
    shortName: row[1],
    country: row[2],
    countryCode: row[3],
    faculty: row[4],
    program: row[5],
    programType: row[6],
    deadline: row[7],
    status: row[8],
    annualTuition: row[9],
    rating: row[10],
    officialLink: "https://example.edu/admitere",
    notes: "",
    documents: makeDocs(`uni-${index + 1}`, completedByRow[index])
  }));
  const appDocs = makeDocs("app-1", 6);
  return {
    users: [
      { id: studentId, email: "andrei@unitracker.ro", password: "Demo1234!", name: "Andrei Mihai", role: "student", cnp: "5060101221141", cnpLast4: "1141", bacAverage: 9.75, languageResults: "IELTS 7.5", interests: ["Informatică", "Inteligență Artificială", "Machine Learning"], emailNotifications: true, notifyBeforeDays: 14, publicShareId: "share-andrei" },
      { id: adminId, email: "admin@unitracker.ro", password: "Demo1234!", name: "Admin UniTrack", role: "admin", emailNotifications: true, notifyBeforeDays: 14, publicShareId: "share-admin" },
      { id: universityId, email: "admitere@unibuc.ro", password: "Demo1234!", name: "Admitere UB", role: "university", InstitutionId: "inst-ub", emailNotifications: true, notifyBeforeDays: 14, publicShareId: "share-ub" }
    ],
    institutions,
    universities,
    applications: [
      {
        id: "app-1",
        StudentId: studentId,
        InstitutionId: "inst-ub",
        program: "Informatică",
        faculty: "Facultatea de Matematică și Informatică",
        programType: "licenta",
        status: "submitted",
        admissionScore: 9.75,
        notes: "Aplicație trimisă din modul static GitHub Pages.",
        submittedAt: new Date().toISOString(),
        documents: appDocs
      }
    ],
    notifications: [
      { id: "notif-1", UserId: universityId, title: "Aplicație nouă", body: "Andrei Mihai a trimis o aplicație pentru Informatică.", type: "application_submitted", readAt: null }
    ],
    auditLogs: [
      { id: "audit-1", actorEmail: "admin@unitracker.ro", actorRole: "admin", action: "admin.seed_demo", entityType: "System", entityId: "static", metadata: { mode: "github-pages" }, createdAt: new Date().toISOString() },
      { id: "audit-2", actorEmail: "andrei@unitracker.ro", actorRole: "student", action: "application.create", entityType: "AdmissionApplication", entityId: "app-1", metadata: { program: "Informatică" }, createdAt: new Date().toISOString() }
    ],
    resets: {}
  };
}

function readState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    const state = initialState();
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return state;
  }
  return JSON.parse(raw);
}

function writeState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function addAudit(state, { actor, action, entityType = null, entityId = null, metadata = {} }) {
  state.auditLogs = state.auditLogs || [];
  state.auditLogs.unshift({
    id: id("audit"),
    actorEmail: actor?.email || metadata.email || null,
    actorRole: actor?.role || "anonymous",
    action,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString()
  });
  state.auditLogs = state.auditLogs.slice(0, 100);
}

function currentUser(state = readState()) {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  return state.users.find((user) => user.id === userId) || null;
}

function publicUser(user, state = readState()) {
  if (!user) return null;
  const institution = user.InstitutionId ? state.institutions.find((item) => item.id === user.InstitutionId) : null;
  const { password, cnp, ...safeUser } = user;
  return { ...safeUser, institutionId: user.InstitutionId || null, institution: institution || null };
}

function progress(docs = []) {
  if (!docs.length) return 0;
  return Math.round((docs.filter((doc) => doc.isCompleted).length / docs.length) * 100);
}

function serializeUniversity(university) {
  const documents = university.documents || [];
  return {
    ...clone(university),
    progress: progress(documents),
    remainingRequiredDocuments: documents.filter((doc) => !doc.isOptional && !doc.isCompleted).length,
    daysUntilDeadline: todayDiff(university.deadline)
  };
}

function userUniversities(state, userId) {
  return state.universities.filter((university) => university.UserId === userId).map(serializeUniversity).sort((a, b) => a.deadline.localeCompare(b.deadline));
}

function catalogInstitutionId(item) {
  return `catalog-${normalizeName(item.name).replace(/\s+/g, "-")}`;
}

function publicInstitutionRows(state) {
  const existing = new Set(state.institutions.map((item) => normalizeName(item.name)));
  const catalogInstitutions = catalog
    .filter((item) => !existing.has(normalizeName(item.name)))
    .map((item) => ({
      id: catalogInstitutionId(item),
      name: item.name,
      shortName: item.shortName,
      country: item.country,
      countryCode: item.countryCode,
      city: item.city,
      website: item.website,
      contactEmail: item.contactEmail || "",
      status: "active",
      description: item.offerSummary,
      academicYear: item.academicYear,
      offerPrograms: item.offerPrograms,
      offerSummary: item.offerSummary
    }));
  return [...state.institutions, ...catalogInstitutions]
    .filter((item) => item.status === "active")
    .map((item) => {
      const catalogMatch = catalog.find((entry) => normalizeName(entry.name) === normalizeName(item.name));
      return {
        ...item,
        academicYear: item.academicYear || catalogMatch?.academicYear || currentAdmissionYear,
        offerPrograms: item.offerPrograms || catalogMatch?.offerPrograms || defaultOfferPrograms,
        offerSummary: item.offerSummary || catalogMatch?.offerSummary || item.description || `Ofertă educațională ${currentAdmissionYear} disponibilă prin site-ul oficial.`
      };
    });
}

function statsFor(universities) {
  const upcoming = universities.filter((uni) => uni.daysUntilDeadline >= 0).sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
  return {
    total: universities.length,
    accepted: universities.filter((uni) => uni.status === "Acceptat").length,
    pending: universities.filter((uni) => uni.status === "Aplicat").length,
    nextDeadlineDays: upcoming[0]?.daysUntilDeadline ?? null,
    upcomingDeadlines: upcoming.slice(0, 6)
  };
}

function attachApplication(state, app) {
  const Institution = state.institutions.find((item) => item.id === app.InstitutionId);
  const Student = state.users.find((item) => item.id === app.StudentId);
  return { ...clone(app), Institution, Student: publicUser(Student, state) };
}

function normalizeDocumentText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_./\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function documentTextScore({ fileName = "", text = "", expectedType = "" }) {
  const content = String(text || "").trim();
  const normalizedText = normalizeDocumentText(content);
  const normalizedFileName = normalizeDocumentText(fileName);
  const expected = normalizeDocumentText(expectedType);
  const checks = [
    ["Diplomă BAC", ["bac", "bacalaureat", "diplom"]],
    ["Foaie matricolă", ["matricol", "foaie"]],
    ["CV Europass", ["cv", "europass"]],
    ["Scrisoare motivație", ["motiva", "eseu"]],
    ["Scrisori de recomandare", ["recomand"]],
    ["Certificat limbă", ["ielts", "toefl", "cambridge", "limba", "language"]],
    ["Cazier judiciar", ["cazier", "judiciar"]],
    ["Adeverință medicală", ["medical", "adeverin"]],
    ["Portofoliu", ["portofoliu", "portfolio", "github", "proiect"]]
  ];
  const scores = checks.map(([label, keys]) => ({
    label,
    textHits: keys.filter((key) => normalizedText.includes(normalizeDocumentText(key))).length,
    fileNameHits: keys.filter((key) => normalizedFileName.includes(normalizeDocumentText(key))).length,
    expected: normalizeDocumentText(label).includes(expected) || expected.includes(normalizeDocumentText(label))
  }));
  const best = [...scores].sort((a, b) => b.textHits - a.textHits || b.fileNameHits - a.fileNameHits)[0];

  if (content.length < 45) {
    return {
      provider: "static-ai-check",
      label: best?.fileNameHits ? best.label : "Necunoscut",
      confidence: 0.24,
      accepted: false,
      explanation: "Nu există suficient text real din document. Numele fișierului nu este dovadă."
    };
  }

  const accepted = Boolean(best?.expected && best.textHits >= 2);
  return {
    provider: "static-ai-check",
    label: best?.textHits ? best.label : "Necunoscut",
    confidence: accepted ? Math.min(0.91, 0.5 + best.textHits * 0.14) : 0.28,
    accepted,
    explanation: accepted
      ? "Documentul pare să corespundă tipului cerut pe baza textului extras."
      : "Conținutul nu seamănă suficient cu documentul așteptat."
  };
}

function studentDocumentTemplate(name) {
  const normalized = normalizeName(name);
  const row = defaultDocuments.find(([docName]) => normalizeName(docName) === normalized);
  if (!row) return null;
  const [docName, category] = row;
  return { name: docName, category, isOptional: docName === "Certificat limbă (IELTS/TOEFL)" || docName === "Portofoliu" };
}

function approvedTrackerSource(state, body) {
  const source = publicInstitutionRows(state).find((item) => normalizeName(item.name) === normalizeName(body.name));
  if (!source) {
    throw new Error("Elevii pot adăuga în tracker doar universități din catalogul public sau instituții active aprobate de admin.");
  }
  if (source.offerPrograms?.length) {
    const validProgram = source.offerPrograms.some((program) => (
      normalizeName(program.program) === normalizeName(body.program)
      && normalizeName(program.faculty) === normalizeName(body.faculty)
      && program.programType === body.programType
    ));
    if (!validProgram) throw new Error("Alege un program din oferta educațională curentă a universității.");
  }
  return source;
}

function studentTrackerPayload(body, source) {
  return {
    ...body,
    name: source.name || body.name,
    shortName: source.shortName || body.shortName,
    country: source.country || body.country,
    countryCode: source.countryCode || body.countryCode,
    officialLink: source.website || body.officialLink
  };
}

function trackerStatusForApplication(status) {
  if (status === "accepted") return "Acceptat";
  if (status === "rejected") return "Respins";
  return "Aplicat";
}

function syncStaticApplicationTracker(state, user, institution, application) {
  const faculty = application.faculty || "Oferta educațională oficială";
  const tracker = state.universities.find((item) => (
    item.UserId === user.id
    && normalizeName(item.name) === normalizeName(institution.name)
    && normalizeName(item.program) === normalizeName(application.program)
    && normalizeName(item.faculty) === normalizeName(faculty)
  ));
  if (tracker) {
    tracker.status = trackerStatusForApplication(application.status);
    tracker.officialLink ||= institution.website || "";
    tracker.notes ||= application.notes || institution.offerSummary || "";
    return tracker;
  }
  const university = {
    id: id("uni"),
    UserId: user.id,
    name: institution.name,
    shortName: institution.shortName,
    country: institution.country,
    countryCode: institution.countryCode,
    faculty,
    program: application.program,
    programType: application.programType,
    deadline: `${new Date().getFullYear()}-07-15`,
    status: trackerStatusForApplication(application.status),
    annualTuition: null,
    rating: null,
    officialLink: institution.website || "",
    notes: application.notes || institution.offerSummary || "",
    documents: makeDocs(id("uni"), 0)
  };
  state.universities.push(university);
  return university;
}

function ensureStudentTrackerUpdate(body) {
  const allowed = new Set(["status", "deadline", "notes", "rating"]);
  const blocked = Object.keys(body).filter((key) => !allowed.has(key));
  if (blocked.length) {
    throw new Error("Elevii pot modifica doar statusul personal, deadline-ul, notițele și ratingul. Universitățile și programele vin din catalogul aprobat.");
  }
}

function hasMaxTwoDecimals(value) {
  const scaled = Number(value) * 100;
  return Number.isFinite(scaled) && Math.abs(scaled - Math.round(scaled)) < 1e-8;
}

function download(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const staticApi = {
  async me() {
    const state = readState();
    const user = currentUser(state);
    if (!user) throw new Error("Autentificare necesară.");
    return { user: publicUser(user, state) };
  },
  async login(body) {
    const state = readState();
    const user = state.users.find((item) => item.email.toLowerCase() === body.email.toLowerCase() && item.password === body.password);
    if (!user) throw new Error("Email sau parolă incorectă.");
    localStorage.setItem(SESSION_KEY, user.id);
    addAudit(state, { actor: user, action: "auth.login", entityType: "User", entityId: user.id });
    writeState(state);
    return { user: publicUser(user, state) };
  },
  async register(body) {
    const state = readState();
    if (state.users.some((item) => item.email.toLowerCase() === body.email.toLowerCase())) throw new Error("Există deja un cont cu acest email.");
    const cnp = validateStaticCnp(body.cnp);
    if (body.role !== "university" && (!cnp.valid || state.users.some((item) => normalizeCnp(item.cnp) === cnp.normalized))) {
      throw new Error(cnp.message || "CNP invalid sau deja folosit.");
    }
    const user = {
      id: id("user"),
      email: body.email.toLowerCase(),
      password: body.password,
      name: body.name || "Utilizator UniTrack",
      role: body.role || "student",
      cnp: body.role === "university" ? null : cnp.normalized,
      cnpLast4: body.role === "university" ? null : cnp.last4,
      InstitutionId: body.role === "university" ? body.institutionId : null,
      bacAverage: null,
      languageResults: "",
      interests: [],
      emailNotifications: true,
      notifyBeforeDays: 14,
      publicShareId: id("share")
    };
    state.users.push(user);
    addAudit(state, { actor: user, action: "auth.register", entityType: "User", entityId: user.id });
    writeState(state);
    localStorage.setItem(SESSION_KEY, user.id);
    return { user: publicUser(user, state) };
  },
  async checkCnp(body) {
    const state = readState();
    const cnp = validateStaticCnp(body.cnp);
    if (!cnp.valid) throw new Error(cnp.message);
    return {
      valid: true,
      available: !state.users.some((item) => normalizeCnp(item.cnp) === cnp.normalized),
      last4: cnp.last4
    };
  },
  async forgotPassword(body) {
    const state = readState();
    const token = id("reset");
    state.resets[body.email.toLowerCase()] = token;
    addAudit(state, { action: "auth.password_reset_requested", entityType: "User", metadata: { email: body.email.toLowerCase() } });
    writeState(state);
    return { message: "Token generat local.", resetToken: token };
  },
  async resetPassword(body) {
    const state = readState();
    const email = Object.keys(state.resets).find((key) => state.resets[key] === body.token);
    if (!email) throw new Error("Token invalid.");
    const user = state.users.find((item) => item.email === email);
    user.password = body.password;
    delete state.resets[email];
    addAudit(state, { actor: user, action: "auth.password_reset_completed", entityType: "User", entityId: user.id });
    writeState(state);
    return { message: "Parola a fost resetată." };
  },
  async logout() {
    localStorage.removeItem(SESSION_KEY);
    return { message: "Delogat cu succes." };
  },
  async publicInstitutions() {
    const state = readState();
    return { institutions: publicInstitutionRows(state) };
  },
  async myInstitution() {
    const state = readState();
    const user = currentUser(state);
    const institution = state.institutions.find((item) => item.id === user.InstitutionId);
    if (!institution) throw new Error("Nu ai un workspace de universitate asociat.");
    return { institution };
  },
  async updateMyInstitution(body) {
    const state = readState();
    const user = currentUser(state);
    const institution = state.institutions.find((item) => item.id === user.InstitutionId);
    if (!institution) throw new Error("Nu ai un workspace de universitate asociat.");
    Object.assign(institution, body);
    addAudit(state, { actor: user, action: "institution.profile_update", entityType: "Institution", entityId: institution.id, metadata: Object.keys(body) });
    writeState(state);
    return { institution };
  },
  async adminSystemStatus() {
    return {
      status: {
        nodeEnv: "static",
        database: "localStorage",
        seedDemo: true,
        bootstrapAdmin: false,
        smtpConfigured: false,
        aiConfigured: false,
        openaiModel: null,
        openaiAdvisorModel: null,
        geminiModel: null,
        geminiAdvisorModel: null,
        aiDocumentDailyLimit: 40,
        aiAdvisorDailyLimit: 20,
        corsOrigins: ["GitHub Pages static"],
        trustProxy: false
      }
    };
  },
  async sendTestEmail() {
    return { sent: false, message: "SMTP indisponibil în modul static." };
  },
  async importCatalogInstitutions() {
    const state = readState();
    return { created: 0, existing: state.institutions.length, catalog: catalog.length };
  },
  async adminInstitutions() {
    return { institutions: readState().institutions };
  },
  async createInstitution(body) {
    const state = readState();
    const institution = { ...body, id: id("inst") };
    state.institutions.push(institution);
    addAudit(state, { actor: currentUser(state), action: "admin.institution_create", entityType: "Institution", entityId: institution.id, metadata: { name: institution.name } });
    writeState(state);
    return { institution };
  },
  async updateInstitution(institutionId, body) {
    const state = readState();
    const institution = state.institutions.find((item) => item.id === institutionId);
    Object.assign(institution, body);
    addAudit(state, { actor: currentUser(state), action: "admin.institution_update", entityType: "Institution", entityId: institution.id, metadata: body });
    writeState(state);
    return { institution };
  },
  async myInstitutionPrograms() {
    const state = readState();
    const user = currentUser(state);
    return this.adminPrograms({ institutionId: user.InstitutionId });
  },
  async createMyInstitutionProgram(body) {
    const state = readState();
    const user = currentUser(state);
    return this.createProgram({ ...body, institutionId: user.InstitutionId });
  },
  async updateMyInstitutionProgram(programId, body) {
    return this.updateProgram(programId, body);
  },
  async adminPrograms(query = {}) {
    const state = readState();
    const rows = publicInstitutionRows(state)
      .filter((institution) => !query.institutionId || institution.id === query.institutionId)
      .flatMap((institution) => (institution.offerPrograms || defaultOfferPrograms).map((program, index) => ({
        id: program.id || `${institution.id}-program-${index}`,
        InstitutionId: institution.id,
        Institution: institution,
        faculty: program.faculty,
        name: program.program || program.name,
        programType: program.programType || "licenta",
        academicYear: program.academicYear || currentAdmissionYear,
        deadline: program.deadline || null,
        annualTuition: program.annualTuition ?? null,
        seats: program.seats ?? null,
        language: program.language || "",
        admissionMethod: program.admissionMethod || "Dosar digital verificat.",
        website: program.website || institution.website || "",
        description: program.description || institution.offerSummary || "",
        status: program.status || "active",
        requirements: program.requirements || []
      })));
    return { programs: rows };
  },
  async createProgram(body) {
    const state = readState();
    const institution = state.institutions.find((item) => item.id === body.institutionId);
    if (!institution) throw new Error("Universitatea nu există.");
    institution.offerPrograms = institution.offerPrograms || [];
    const program = {
      id: id("program"),
      faculty: body.faculty,
      program: body.name,
      name: body.name,
      programType: body.programType,
      academicYear: body.academicYear,
      deadline: body.deadline || null,
      annualTuition: body.annualTuition ?? null,
      seats: body.seats ?? null,
      language: body.language || "",
      admissionMethod: body.admissionMethod || "",
      website: body.website || institution.website || "",
      description: body.description || "",
      status: body.status || "active",
      requirements: body.requirements || []
    };
    institution.offerPrograms.push(program);
    addAudit(state, { actor: currentUser(state), action: "admin.program_create", entityType: "AdmissionProgram", entityId: program.id, metadata: { institutionId: institution.id, name: program.name } });
    writeState(state);
    return { program: { ...program, InstitutionId: institution.id, Institution: institution } };
  },
  async updateProgram(programId, body) {
    const state = readState();
    let found = null;
    for (const institution of state.institutions) {
      institution.offerPrograms = institution.offerPrograms || [];
      const program = institution.offerPrograms.find((item, index) => (item.id || `${institution.id}-program-${index}`) === programId);
      if (program) {
        found = { institution, program };
        break;
      }
    }
    if (!found) throw new Error("Programul nu există.");
    Object.assign(found.program, body.name ? { ...body, program: body.name } : body);
    addAudit(state, { actor: currentUser(state), action: "admin.program_update", entityType: "AdmissionProgram", entityId: programId, metadata: Object.keys(body) });
    writeState(state);
    return { program: { ...found.program, InstitutionId: found.institution.id, Institution: found.institution } };
  },
  async adminUsers() {
    const state = readState();
    return { users: state.users.map((user) => publicUser(user, state)) };
  },
  async adminAuditLogs() {
    return { logs: (readState().auditLogs || []).slice(0, 100) };
  },
  async createUniversityUser(body) {
    const state = readState();
    if (state.users.some((item) => item.email.toLowerCase() === body.email.toLowerCase())) throw new Error("Există deja un cont cu acest email.");
    const user = {
      id: id("user"),
      email: body.email.toLowerCase(),
      password: body.password,
      name: body.name || "Cont universitate",
      role: "university",
      InstitutionId: body.institutionId,
      emailNotifications: true,
      notifyBeforeDays: 14,
      publicShareId: id("share")
    };
    state.users.push(user);
    addAudit(state, { actor: currentUser(state), action: "admin.university_user_create", entityType: "User", entityId: user.id, metadata: { email: user.email, institutionId: user.InstitutionId } });
    writeState(state);
    return { user: publicUser(user, state) };
  },
  async listUniversities() {
    const state = readState();
    const user = currentUser(state);
    return { universities: userUniversities(state, user.id) };
  },
  async stats() {
    const state = readState();
    const user = currentUser(state);
    return { stats: statsFor(userUniversities(state, user.id)) };
  },
  async createUniversity(body) {
    const state = readState();
    const user = currentUser(state);
    let payload = { ...body };
    if (user.role === "student") {
      payload = studentTrackerPayload(payload, approvedTrackerSource(state, payload));
    }
    const duplicate = state.universities.some((item) => (
      item.UserId === user.id
      && normalizeName(item.name) === normalizeName(payload.name)
      && normalizeName(item.program) === normalizeName(payload.program)
      && normalizeName(item.faculty) === normalizeName(payload.faculty)
    ));
    if (duplicate) {
      throw new Error("Universitatea și programul există deja în trackerul tău.");
    }
    const university = { ...payload, id: id("uni"), UserId: user.id, documents: makeDocs(id("uni"), 0) };
    state.universities.push(university);
    writeState(state);
    return { university: serializeUniversity(university) };
  },
  async updateUniversity(universityId, body) {
    const state = readState();
    const user = currentUser(state);
    if (user.role === "student") ensureStudentTrackerUpdate(body);
    const university = state.universities.find((item) => item.id === universityId && (user.role === "admin" || item.UserId === user.id));
    if (!university) throw new Error("Universitatea nu a fost găsită.");
    Object.assign(university, body);
    writeState(state);
    return { university: serializeUniversity(university) };
  },
  async deleteUniversity(universityId) {
    const state = readState();
    const user = currentUser(state);
    state.universities = state.universities.filter((item) => item.id !== universityId || (user.role !== "admin" && item.UserId !== user.id));
    writeState(state);
    return null;
  },
  async compare(ids) {
    const state = readState();
    return { universities: userUniversities(state, currentUser(state).id).filter((item) => ids.includes(item.id)), winners: {} };
  },
  async listDocuments(universityId) {
    const university = readState().universities.find((item) => item.id === universityId);
    return { documents: university?.documents || [] };
  },
  async createDocument(universityId, body) {
    const state = readState();
    const user = currentUser(state);
    if (user?.role === "student") {
      throw new Error("Elevii nu pot adăuga documente manual în tracker. Atașează fișierul real la dosarul de admitere.");
    }
    const university = state.universities.find((item) => item.id === universityId);
    const document = { id: id("doc"), ...body, category: "Document suplimentar", isOptional: true, isCompleted: false, completedAt: null, verificationStatus: "missing" };
    university.documents.push(document);
    writeState(state);
    return { document };
  },
  async listApplicationDocuments(applicationId) {
    const application = readState().applications.find((item) => item.id === applicationId);
    return { documents: application?.documents || [] };
  },
  async createApplicationDocument(applicationId, body) {
    const state = readState();
    const user = currentUser(state);
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) throw new Error("Aplicația nu a fost găsită.");
    let payload = { ...body };
    if (user?.role === "student") {
      const template = studentDocumentTemplate(payload.name);
      if (!template) throw new Error("Alege un tip de document aprobat din lista UniTrack.");
      if ((application.documents || []).some((doc) => normalizeName(doc.name) === normalizeName(template.name))) {
        throw new Error("Documentul există deja în dosarul acestei aplicații.");
      }
      payload = template;
    }
    const document = { id: id("app-doc"), ...payload, isCompleted: false, completedAt: null, verificationStatus: "missing" };
    application.documents.push(document);
    writeState(state);
    return { document };
  },
  async updateDocument(documentId, body) {
    const state = readState();
    const user = currentUser(state);
    if (user?.role === "student" && (body.name || body.category || body.isOptional !== undefined)) {
      throw new Error("Elevii nu pot modifica tipul documentelor cerute; pot adăuga doar documente suplimentare.");
    }
    if (user?.role === "student" && (body.isCompleted === true || body.completedAt || body.verificationStatus === "verified")) {
      throw new Error("Documentele se marchează complete doar după verificare AI sau aprobare de universitate.");
    }
    const containers = [...state.universities.map((item) => item.documents), ...state.applications.map((item) => item.documents)];
    const document = containers.flat().find((item) => item.id === documentId);
    Object.assign(document, body);
    if (body.verificationStatus === "verified") {
      document.isCompleted = true;
      document.completedAt = new Date().toISOString().slice(0, 10);
    }
    if (body.verificationStatus === "rejected") {
      document.isCompleted = false;
      document.completedAt = null;
    }
    if (Object.hasOwn(body, "isCompleted")) document.completedAt = body.isCompleted ? new Date().toISOString().slice(0, 10) : null;
    writeState(state);
    return { document };
  },
  async deleteDocument(documentId) {
    const state = readState();
    const user = currentUser(state);
    const document = [...state.universities.flatMap((item) => item.documents || []), ...state.applications.flatMap((item) => item.documents || [])].find((doc) => doc.id === documentId);
    if (user?.role === "student" && document && (!document.isOptional || document.isCompleted || document.verificationStatus === "verified")) {
      throw new Error("Elevii pot șterge doar documente opționale neverificate.");
    }
    for (const university of state.universities) university.documents = university.documents.filter((doc) => doc.id !== documentId);
    for (const app of state.applications) app.documents = app.documents.filter((doc) => doc.id !== documentId);
    writeState(state);
    return null;
  },
  documentFileUrl(documentId) {
    const state = readState();
    const document = [
      ...state.universities.flatMap((item) => item.documents || []),
      ...state.applications.flatMap((item) => item.documents || [])
    ].find((doc) => doc.id === documentId);
    return document?.fileDataUrl || "#";
  },
  async myApplications() {
    const state = readState();
    const user = currentUser(state);
    return { applications: state.applications.filter((app) => app.StudentId === user.id).map((app) => attachApplication(state, app)) };
  },
  async createApplication(body) {
    const state = readState();
    const user = currentUser(state);
    const publicInstitution = publicInstitutionRows(state).find((item) => item.id === body.institutionId);
    if (!publicInstitution) throw new Error("Universitatea nu există sau nu este activă.");
    if (publicInstitution.offerPrograms?.length) {
      const validProgram = publicInstitution.offerPrograms.some((program) => (
        normalizeName(program.program) === normalizeName(body.program)
        && normalizeName(program.faculty) === normalizeName(body.faculty)
        && program.programType === body.programType
      ));
      if (!validProgram) throw new Error("Alege un program din oferta educațională curentă a universității.");
    }
    if (publicInstitution && !state.institutions.some((item) => item.id === publicInstitution.id)) {
      state.institutions.push(publicInstitution);
    }
    const duplicate = state.applications.find((item) => item.StudentId === user.id && item.InstitutionId === body.institutionId && item.program.toLowerCase() === body.program.toLowerCase());
    if (duplicate) throw new Error("Ai deja o aplicație pentru această universitate și acest program.");
    const app = { id: id("app"), StudentId: user.id, InstitutionId: body.institutionId, status: "submitted", submittedAt: new Date().toISOString(), documents: makeDocs(id("app"), 0), ...body };
    state.applications.push(app);
    syncStaticApplicationTracker(state, user, publicInstitution, app);
    addAudit(state, { actor: user, action: "application.create", entityType: "AdmissionApplication", entityId: app.id, metadata: { institutionId: app.InstitutionId, program: app.program } });
    writeState(state);
    return { application: attachApplication(state, app) };
  },
  async workspaceApplications(query = {}) {
    const state = readState();
    const user = currentUser(state);
    let apps = state.applications;
    if (user.role === "university") apps = apps.filter((app) => app.InstitutionId === user.InstitutionId);
    if (query.status && query.status !== "all") apps = apps.filter((app) => app.status === query.status);
    let rows = apps.map((app) => attachApplication(state, app));
    if (query.documents && query.documents !== "all") {
      rows = rows.filter((app) => {
        const docs = app.documents || [];
        if (query.documents === "complete") return docs.length && docs.every((doc) => doc.isOptional || doc.verificationStatus === "verified");
        if (query.documents === "incomplete") return docs.some((doc) => !doc.isOptional && doc.verificationStatus !== "verified");
        if (query.documents === "missing") return docs.some((doc) => doc.verificationStatus === "missing" || !doc.fileName);
        if (query.documents === "rejected") return docs.some((doc) => doc.verificationStatus === "rejected");
        return true;
      });
    }
    if (query.search) {
      const search = query.search.toLowerCase();
      rows = rows.filter((app) => [app.Student?.name, app.Student?.email, app.program, app.faculty, app.Institution?.name].filter(Boolean).join(" ").toLowerCase().includes(search));
    }
    if (query.sort === "documents") {
      rows.sort((a, b) => {
        const ratio = (app) => (app.documents?.length ? app.documents.filter((doc) => doc.verificationStatus === "verified").length / app.documents.length : 0);
        return ratio(b) - ratio(a);
      });
    }
    return { applications: rows };
  },
  async updateApplicationStatus(appId, body) {
    const state = readState();
    const app = state.applications.find((item) => item.id === appId);
    app.status = body.status;
    app.reviewerNotes = body.reviewerNotes || "";
    app.reviewedAt = new Date().toISOString();
    const institution = publicInstitutionRows(state).find((item) => item.id === app.InstitutionId) || state.institutions.find((item) => item.id === app.InstitutionId);
    const student = state.users.find((item) => item.id === app.StudentId);
    if (institution && student) syncStaticApplicationTracker(state, student, institution, app);
    addAudit(state, { actor: currentUser(state), action: "application.status_update", entityType: "AdmissionApplication", entityId: app.id, metadata: { status: app.status } });
    writeState(state);
    return { application: attachApplication(state, app) };
  },
  async checkDocumentAi(body) {
    const state = readState();
    if (!body.fileDataUrl) {
      throw new Error("Atașează fișierul real înainte de verificare. Textul sau numele fișierului nu sunt suficiente pentru dosar.");
    }
    const result = documentTextScore(body);
    const document = state.applications.flatMap((app) => app.documents).find((doc) => doc.id === body.documentId);
    if (document) {
      Object.assign(document, {
        fileName: body.fileName,
        mimeType: body.mimeType || null,
        fileSize: body.fileSize || null,
        fileDataUrl: body.fileDataUrl || null,
        extractedText: body.text,
        verificationStatus: result.accepted ? "verified" : "rejected",
        isCompleted: result.accepted,
        completedAt: result.accepted ? new Date().toISOString().slice(0, 10) : null,
        aiProvider: result.provider,
        aiLabel: result.label,
        aiConfidence: result.confidence,
        aiExplanation: result.explanation
      });
      addAudit(state, { actor: currentUser(state), action: "document.ai_check", entityType: "Document", entityId: document.id, metadata: { accepted: result.accepted, provider: result.provider, label: result.label } });
      writeState(state);
    }
    return { result, document };
  },
  async studentAdvisor(body) {
    const state = readState();
    const user = currentUser(state);
    const applications = state.applications.filter((app) => app.StudentId === user.id);
    const universities = userUniversities(state, user.id);
    const documents = [...applications.flatMap((app) => app.documents || []), ...universities.flatMap((uni) => uni.documents || [])];
    const verifiedRatio = documents.length ? documents.filter((doc) => doc.isCompleted || doc.verificationStatus === "verified").length / documents.length : 0;
    const cvText = String(body.cvText || "");
    const cvSignals = [/proiect|github|portofoliu/i, /olimpiad|concurs|premiu/i, /voluntar|leadership|echip/i, /python|javascript|react|ai|java|c\+\+/i]
      .filter((pattern) => pattern.test(cvText)).length;
    const bac = Number(user.bacAverage || 0);
    const target = state.institutions.find((item) => item.id === body.institutionId) || applications[0]?.Institution || { name: "universitatea selectată" };
    return {
      advice: {
        provider: "static-advisor",
        targetName: target.name,
        admissionChance: Math.max(5, Math.min(94, Math.round(18 + bac * 5 + verifiedRatio * 22 + cvSignals * 4))),
        cvScore: Math.max(20, Math.min(98, 38 + cvSignals * 13)),
        applicationScore: Math.max(15, Math.min(98, Math.round(28 + verifiedRatio * 58))),
        summary: `Profilul este evaluat orientativ pentru ${target.name}. Estimarea nu înlocuiește decizia oficială a universității.`,
        strengths: ["Dosarul este urmărit centralizat.", "Documentele verificate cresc credibilitatea aplicației.", "CV-ul devine mai bun când include proiecte concrete."],
        risks: ["Estimarea depinde de documentele încărcate.", "Lipsa dovezilor academice reduce scorul."],
        nextSteps: ["Verifică Diploma BAC/Foaia matricolă.", "Adaugă linkuri concrete în CV.", "Personalizează scrisoarea de motivație pentru program."]
      }
    };
  },
  async notifications() {
    const state = readState();
    const user = currentUser(state);
    return { notifications: state.notifications.filter((item) => item.UserId === user.id) };
  },
  async markNotificationRead(idValue) {
    const state = readState();
    const notification = state.notifications.find((item) => item.id === idValue);
    if (notification) notification.readAt = new Date().toISOString();
    writeState(state);
    return { notification };
  },
  async profile() {
    return this.me();
  },
  async updateProfile(body) {
    const state = readState();
    const user = currentUser(state);
    const documents = [
      ...state.universities.filter((item) => item.UserId === user.id).flatMap((item) => item.documents || []),
      ...state.applications.filter((item) => item.StudentId === user.id).flatMap((item) => item.documents || [])
    ];
    const hasEvidence = (pattern) => documents.some((doc) => new RegExp(pattern, "i").test(doc.name) && doc.verificationStatus === "verified" && doc.fileName && Number(doc.fileSize || 0) > 0);
    if (body.bacAverage !== undefined && body.bacAverage !== null && !hasMaxTwoDecimals(body.bacAverage)) {
      throw new Error("Media BAC poate avea maximum două zecimale.");
    }
    if (/\d+[.,]\d{3,}/.test(String(body.languageResults || ""))) {
      throw new Error("Rezultatele examenelor pot avea maximum două zecimale.");
    }
    if (body.bacAverage !== undefined && body.bacAverage !== null) body.bacAverage = Math.round(Number(body.bacAverage) * 100) / 100;
    if (user.role === "student" && body.bacAverage !== undefined && body.bacAverage !== null && Number(body.bacAverage) !== Number(user.bacAverage || 0) && !hasEvidence("bac|matricol")) {
      throw new Error("Adaugă și verifică Diploma BAC sau Foaia matricolă înainte să salvezi media.");
    }
    if (user.role === "student" && body.languageResults && body.languageResults !== user.languageResults && !hasEvidence("limb|ielts|toefl|cambridge")) {
      throw new Error("Adaugă și verifică un certificat de limbă înainte să salvezi scorurile IELTS/TOEFL.");
    }
    Object.assign(user, body);
    writeState(state);
    return { user: publicUser(user, state) };
  },
  async changePassword(body) {
    const state = readState();
    const user = currentUser(state);
    if (user.password !== body.currentPassword) throw new Error("Parola curentă nu este corectă.");
    user.password = body.newPassword;
    addAudit(state, { actor: user, action: "user.password_change", entityType: "User", entityId: user.id });
    writeState(state);
    return { message: "Parola a fost schimbată." };
  },
  async deleteAccount(body) {
    const state = readState();
    const user = currentUser(state);
    if (user.password !== body.password) throw new Error("Parola nu este corectă.");
    if (body.confirmation !== "STERG CONTUL") throw new Error("Confirmarea trebuie să fie exact: STERG CONTUL.");
    addAudit(state, { actor: user, action: "user.account_delete", entityType: "User", entityId: user.id, metadata: { email: user.email, role: user.role } });
    state.users = state.users.filter((item) => item.id !== user.id);
    state.universities = state.universities.filter((item) => item.UserId !== user.id);
    state.applications = state.applications.filter((item) => item.StudentId !== user.id);
    writeState(state);
    localStorage.removeItem(SESSION_KEY);
    return { message: "Contul a fost șters definitiv." };
  },
  async rotateShareLink() {
    const state = readState();
    const user = currentUser(state);
    user.publicShareId = id("share");
    addAudit(state, { actor: user, action: "user.share_link_rotate", entityType: "User", entityId: user.id });
    writeState(state);
    return { publicShareId: user.publicShareId };
  },
  async publicShare(shareId) {
    const state = readState();
    const user = state.users.find((item) => item.publicShareId === shareId);
    if (!user) throw new Error("Profil public negăsit.");
    return { profile: publicUser(user, state), universities: userUniversities(state, user.id) };
  },
  async catalog(search = "") {
    const query = search.toLowerCase();
    return {
      universities: catalog.filter((item) => {
        if (!query) return true;
        return [
          item.name,
          item.country,
          item.city,
          item.offerSummary,
          ...(item.strengths || []),
          ...(item.offerPrograms || []).map((program) => `${program.program} ${program.faculty}`)
        ].join(" ").toLowerCase().includes(query);
      })
    };
  },
  async downloadExport(type) {
    const state = readState();
    const universities = userUniversities(state, currentUser(state).id);
    if (type === "json") return download("unitrack-export.json", JSON.stringify({ universities }, null, 2), "application/json");
    if (type === "xml") return download("unitrack-export.xml", `<?xml version="1.0"?><unitrack>${universities.map((uni) => `<universitate><nume>${uni.name}</nume><status>${uni.status}</status></universitate>`).join("")}</unitrack>`, "application/xml");
    if (type === "pdf") return download("unitrack-status.pdf", universities.map((uni) => `${uni.name} - ${uni.status} - ${uni.progress}%`).join("\n"), "application/pdf");
    const csv = ["Universitate,Program,Status,Deadline,Progres", ...universities.map((uni) => `"${uni.name}","${uni.program}","${uni.status}","${uni.deadline}","${uni.progress}%"`)].join("\n");
    return download("unitrack-universitati.csv", csv, "text/csv");
  }
};

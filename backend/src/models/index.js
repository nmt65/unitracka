import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DataTypes, Sequelize } from "sequelize";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");

if (env.dbDialect === "sqlite" && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storage = path.resolve(dataDir, "unitracka.sqlite");

export const sequelize =
  env.dbDialect === "sqlite"
    ? new Sequelize({
        dialect: "sqlite",
        storage: env.databaseUrl.endsWith(".sqlite") ? env.databaseUrl : storage,
        logging: false
      })
    : new Sequelize(env.databaseUrl, {
        dialect: env.dbDialect,
        logging: false,
        pool: {
          acquire: 10000
        },
        dialectOptions: env.nodeEnv === "production" ? {
          ssl: { require: true, rejectUnauthorized: false },
          connectTimeout: 10000
        } : {}
      });

export const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(180), unique: true, allowNull: false, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING(120), defaultValue: "Student UniTrack" },
    avatarDataUrl: { type: DataTypes.TEXT, allowNull: true },
    role: { type: DataTypes.ENUM("student", "university", "admin"), defaultValue: "student", allowNull: false },
    cnpHash: { type: DataTypes.STRING(128), allowNull: true },
    cnpLast4: { type: DataTypes.STRING(4), allowNull: true },
    bacAverage: { type: DataTypes.FLOAT, allowNull: true },
    languageResults: { type: DataTypes.TEXT, defaultValue: "" },
    interests: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("interests") || "[]");
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue("interests", JSON.stringify(Array.isArray(value) ? value : []));
      }
    },
    emailNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
    notifyBeforeDays: { type: DataTypes.INTEGER, defaultValue: 14 },
    publicShareId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    emailVerificationCodeHash: { type: DataTypes.STRING(128), allowNull: true },
    emailVerificationExpiresAt: { type: DataTypes.DATE, allowNull: true },
    emailVerificationAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    passkeyChallenge: { type: DataTypes.TEXT, allowNull: true },
    passkeyChallengeType: { type: DataTypes.STRING(24), allowNull: true },
    passkeyChallengeExpiresAt: { type: DataTypes.DATE, allowNull: true },
    resetTokenHash: { type: DataTypes.STRING(128), allowNull: true },
    resetTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
    passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    defaultScope: { attributes: { exclude: ["passwordHash"] } },
    scopes: { withPassword: { attributes: {} } },
    indexes: [{ name: "users_cnp_hash_unique", unique: true, fields: ["cnpHash"] }]
  }
);

export const Passkey = sequelize.define(
  "Passkey",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    credentialId: { type: DataTypes.TEXT, allowNull: false, unique: true },
    publicKey: { type: DataTypes.TEXT, allowNull: false },
    webauthnUserId: { type: DataTypes.TEXT, allowNull: false },
    counter: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    deviceType: { type: DataTypes.STRING(32), allowNull: true },
    backedUp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    transports: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("transports") || "[]");
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue("transports", JSON.stringify(Array.isArray(value) ? value : []));
      }
    },
    name: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "Passkey personal" },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    indexes: [
      { name: "passkeys_credential_id_unique", unique: true, fields: ["credentialId"] },
      { name: "passkeys_user_id_idx", fields: ["UserId"] }
    ]
  }
);

export const Institution = sequelize.define("Institution", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  shortName: { type: DataTypes.STRING(20), allowNull: false },
  country: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "România" },
  countryCode: { type: DataTypes.STRING(8), allowNull: true, defaultValue: "RO" },
  city: { type: DataTypes.STRING(120), allowNull: true },
  website: { type: DataTypes.STRING(500), allowNull: true },
  contactEmail: { type: DataTypes.STRING(180), allowNull: true, validate: { isEmail: true } },
  status: { type: DataTypes.ENUM("active", "pending", "disabled"), defaultValue: "active" },
  description: { type: DataTypes.TEXT, allowNull: true }
});

export const AdmissionProgram = sequelize.define(
  "AdmissionProgram",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    faculty: { type: DataTypes.STRING(180), allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    programType: { type: DataTypes.ENUM("licenta", "master", "doctorat"), defaultValue: "licenta" },
    academicYear: { type: DataTypes.STRING(20), defaultValue: "2026-2027" },
    deadline: { type: DataTypes.DATEONLY, allowNull: true },
    annualTuition: { type: DataTypes.FLOAT, allowNull: true },
    seats: { type: DataTypes.INTEGER, allowNull: true },
    language: { type: DataTypes.STRING(80), allowNull: true },
    admissionMethod: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM("active", "pending", "archived"), defaultValue: "active" },
    source: { type: DataTypes.STRING(60), defaultValue: "manual" }
  },
  {
    indexes: [
      {
        name: "program_institution_year_name_unique",
        unique: true,
        fields: ["InstitutionId", "academicYear", "faculty", "name", "programType"]
      }
    ]
  }
);

export const ProgramRequirement = sequelize.define(
  "ProgramRequirement",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    documentName: { type: DataTypes.STRING(180), allowNull: false },
    category: { type: DataTypes.STRING(80), defaultValue: "Admitere" },
    isOptional: { type: DataTypes.BOOLEAN, defaultValue: false },
    verificationRequired: { type: DataTypes.BOOLEAN, defaultValue: true },
    rule: { type: DataTypes.TEXT, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 }
  },
  {
    indexes: [
      {
        name: "program_requirement_unique",
        unique: true,
        fields: ["AdmissionProgramId", "documentName"]
      }
    ]
  }
);

export const University = sequelize.define("University", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  shortName: { type: DataTypes.STRING(20), allowNull: true },
  country: { type: DataTypes.STRING(120), allowNull: false },
  countryCode: { type: DataTypes.STRING(8), allowNull: true },
  faculty: { type: DataTypes.STRING(180), allowNull: false },
  program: { type: DataTypes.STRING(180), allowNull: false },
  programType: { type: DataTypes.ENUM("licenta", "master", "doctorat"), defaultValue: "licenta" },
  deadline: { type: DataTypes.DATEONLY, allowNull: false },
  officialLink: { type: DataTypes.STRING(500), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM("Wishlist", "Cercetare", "Aplicat", "Acceptat", "Respins"),
    defaultValue: "Wishlist"
  },
  annualTuition: { type: DataTypes.FLOAT, allowNull: true },
  rating: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 10 } }
});

export const AdmissionApplication = sequelize.define("AdmissionApplication", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  program: { type: DataTypes.STRING(180), allowNull: false },
  faculty: { type: DataTypes.STRING(180), allowNull: true },
  programType: { type: DataTypes.ENUM("licenta", "master", "doctorat"), defaultValue: "licenta" },
  status: {
    type: DataTypes.ENUM("draft", "submitted", "under_review", "accepted", "rejected", "waitlist"),
    defaultValue: "submitted"
  },
  admissionScore: { type: DataTypes.FLOAT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  reviewerNotes: { type: DataTypes.TEXT, allowNull: true },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reviewedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    {
      name: "applications_student_institution_program_scope_unique",
      unique: true,
      fields: ["StudentId", "InstitutionId", "program", "faculty", "programType"]
    }
  ]
});

export const Document = sequelize.define("Document", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  category: { type: DataTypes.STRING(80), defaultValue: "Custom" },
  isOptional: { type: DataTypes.BOOLEAN, defaultValue: false },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  completedAt: { type: DataTypes.DATEONLY, allowNull: true },
  fileName: { type: DataTypes.STRING(240), allowNull: true },
  mimeType: { type: DataTypes.STRING(120), allowNull: true },
  fileSize: { type: DataTypes.INTEGER, allowNull: true },
  storageProvider: { type: DataTypes.STRING(40), allowNull: true },
  storageBucket: { type: DataTypes.STRING(120), allowNull: true },
  storagePath: { type: DataTypes.STRING(600), allowNull: true },
  fileDataUrl: { type: DataTypes.TEXT, allowNull: true },
  fileSha256: { type: DataTypes.STRING(64), allowNull: true },
  extractedText: { type: DataTypes.TEXT, allowNull: true },
  verificationStatus: {
    type: DataTypes.ENUM("missing", "pending", "verified", "rejected"),
    defaultValue: "missing"
  },
  aiProvider: { type: DataTypes.STRING(40), allowNull: true },
  aiLabel: { type: DataTypes.STRING(120), allowNull: true },
  aiConfidence: { type: DataTypes.FLOAT, allowNull: true },
  aiExplanation: { type: DataTypes.TEXT, allowNull: true }
});

export const AiUsage = sequelize.define("AiUsage", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  feature: { type: DataTypes.ENUM("document", "advisor"), allowNull: false },
  provider: { type: DataTypes.STRING(40), allowNull: true },
  model: { type: DataTypes.STRING(120), allowNull: true },
  status: { type: DataTypes.ENUM("success", "failed", "skipped"), defaultValue: "success" },
  requestHash: { type: DataTypes.STRING(64), allowNull: true },
  inputBytes: { type: DataTypes.INTEGER, allowNull: true },
  estimatedTokens: { type: DataTypes.INTEGER, allowNull: true },
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: "{}",
    get() {
      try {
        return JSON.parse(this.getDataValue("metadata") || "{}");
      } catch {
        return {};
      }
    },
    set(value) {
      this.setDataValue("metadata", JSON.stringify(value || {}));
    }
  }
});

export const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING(60), defaultValue: "system" },
  readAt: { type: DataTypes.DATE, allowNull: true }
});

export const AuditLog = sequelize.define("AuditLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  actorEmail: { type: DataTypes.STRING(180), allowNull: true },
  actorRole: { type: DataTypes.STRING(40), allowNull: true },
  action: { type: DataTypes.STRING(80), allowNull: false },
  entityType: { type: DataTypes.STRING(80), allowNull: true },
  entityId: { type: DataTypes.STRING(80), allowNull: true },
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: "{}",
    get() {
      try {
        return JSON.parse(this.getDataValue("metadata") || "{}");
      } catch {
        return {};
      }
    },
    set(value) {
      this.setDataValue("metadata", JSON.stringify(value || {}));
    }
  },
  ipAddress: { type: DataTypes.STRING(80), allowNull: true },
  userAgent: { type: DataTypes.STRING(320), allowNull: true }
});

User.hasMany(University, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
University.belongsTo(User);
University.hasMany(Document, { foreignKey: { allowNull: true }, onDelete: "CASCADE" });
Document.belongsTo(University);
Institution.hasMany(User, { foreignKey: { allowNull: true }, onDelete: "SET NULL" });
User.belongsTo(Institution);
Institution.hasMany(AdmissionProgram, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
AdmissionProgram.belongsTo(Institution);
AdmissionProgram.hasMany(ProgramRequirement, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
ProgramRequirement.belongsTo(AdmissionProgram);
Institution.hasMany(AdmissionApplication, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
AdmissionApplication.belongsTo(Institution);
AdmissionProgram.hasMany(AdmissionApplication, { foreignKey: { name: "AdmissionProgramId", allowNull: true }, onDelete: "SET NULL" });
AdmissionApplication.belongsTo(AdmissionProgram, { foreignKey: { name: "AdmissionProgramId", allowNull: true } });
User.hasMany(AdmissionApplication, { as: "StudentApplications", foreignKey: { name: "StudentId", allowNull: false }, onDelete: "CASCADE" });
AdmissionApplication.belongsTo(User, { as: "Student", foreignKey: { name: "StudentId", allowNull: false } });
AdmissionApplication.hasMany(Document, { foreignKey: { allowNull: true }, onDelete: "CASCADE" });
Document.belongsTo(AdmissionApplication);
User.hasMany(Notification, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
Notification.belongsTo(User);
AdmissionApplication.hasMany(Notification, { foreignKey: { allowNull: true }, onDelete: "SET NULL" });
Notification.belongsTo(AdmissionApplication);
User.hasMany(AuditLog, { foreignKey: { name: "ActorId", allowNull: true }, onDelete: "SET NULL" });
AuditLog.belongsTo(User, { as: "Actor", foreignKey: { name: "ActorId", allowNull: true } });
User.hasMany(AiUsage, { foreignKey: { allowNull: true }, onDelete: "SET NULL" });
AiUsage.belongsTo(User);
User.hasMany(Passkey, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
Passkey.belongsTo(User);
AdmissionApplication.hasMany(AiUsage, { foreignKey: { allowNull: true }, onDelete: "SET NULL" });
AiUsage.belongsTo(AdmissionApplication);
Document.hasMany(AiUsage, { foreignKey: { allowNull: true }, onDelete: "SET NULL" });
AiUsage.belongsTo(Document);

export async function initDb() {
  await sequelize.authenticate();
  const syncOptions = env.dbDialect === "sqlite" ? {} : { alter: env.nodeEnv !== "production" };
  await sequelize.sync(syncOptions);
  const queryInterface = sequelize.getQueryInterface();
  if (env.dbDialect === "postgres") {
    // Passkeys are handled only by the authenticated API. Keep the Supabase
    // REST surface deny-by-default even before the full migration is applied.
    await sequelize.query('ALTER TABLE "Passkeys" ENABLE ROW LEVEL SECURITY');
  }
  async function ensureColumns(tableName, definitions) {
    const columns = await queryInterface.describeTable(tableName).catch(() => null);
    if (!columns) return null;
    for (const [columnName, definition] of Object.entries(definitions)) {
      if (columns[columnName]) continue;
      await queryInterface.addColumn(tableName, columnName, definition).catch(async (error) => {
        // A parallel Render startup can add the same column. Re-read before failing.
        const refreshed = await queryInterface.describeTable(tableName).catch(() => null);
        if (!refreshed?.[columnName]) throw error;
      });
    }
    return queryInterface.describeTable(tableName).catch(() => columns);
  }

  // Production uses migrations rather than `sync({ alter: true })`. These
  // additions keep an existing Supabase project compatible after an update.
  const usersBeforeAuthUpgrade = await queryInterface.describeTable("Users").catch(() => null);
  const hadEmailVerification = Boolean(usersBeforeAuthUpgrade?.emailVerifiedAt);
  await ensureColumns("Users", {
    name: { type: DataTypes.STRING(120), allowNull: true },
    role: { type: DataTypes.ENUM("student", "university", "admin"), allowNull: true, defaultValue: "student" },
    cnpHash: { type: DataTypes.STRING(128), allowNull: true },
    cnpLast4: { type: DataTypes.STRING(4), allowNull: true },
    bacAverage: { type: DataTypes.FLOAT, allowNull: true },
    InstitutionId: { type: DataTypes.UUID, allowNull: true },
    avatarDataUrl: { type: DataTypes.TEXT, allowNull: true },
    resetTokenHash: { type: DataTypes.STRING(128), allowNull: true },
    resetTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
    passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    languageResults: { type: DataTypes.TEXT, allowNull: true },
    emailNotifications: { type: DataTypes.BOOLEAN, allowNull: true },
    notifyBeforeDays: { type: DataTypes.INTEGER, allowNull: true },
    publicShareId: { type: DataTypes.UUID, allowNull: true },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    emailVerificationCodeHash: { type: DataTypes.STRING(128), allowNull: true },
    emailVerificationExpiresAt: { type: DataTypes.DATE, allowNull: true },
    emailVerificationAttempts: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    passkeyChallenge: { type: DataTypes.TEXT, allowNull: true },
    passkeyChallengeType: { type: DataTypes.STRING(24), allowNull: true },
    passkeyChallengeExpiresAt: { type: DataTypes.DATE, allowNull: true }
  });
  if (usersBeforeAuthUpgrade && !hadEmailVerification) {
    await sequelize.query(
      `UPDATE "Users" SET "emailVerifiedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "emailVerifiedAt" IS NULL`
    ).catch(() => {});
  }
  const userIndexes = await queryInterface.showIndex("Users").catch(() => []);
  const hasCnpIndex = userIndexes.some((index) => index.name === "users_cnp_hash_unique");
  if (!hasCnpIndex) {
    await queryInterface.addIndex("Users", ["cnpHash"], {
      name: "users_cnp_hash_unique",
      unique: true
    }).catch(() => {});
  }
  await ensureColumns("Documents", {
    fileSize: { type: DataTypes.INTEGER, allowNull: true },
    fileDataUrl: { type: DataTypes.TEXT, allowNull: true },
    storageProvider: { type: DataTypes.STRING(40), allowNull: true },
    storageBucket: { type: DataTypes.STRING(120), allowNull: true },
    storagePath: { type: DataTypes.STRING(600), allowNull: true },
    fileSha256: { type: DataTypes.STRING(64), allowNull: true },
    extractedText: { type: DataTypes.TEXT, allowNull: true },
    aiProvider: { type: DataTypes.STRING(40), allowNull: true },
    aiLabel: { type: DataTypes.STRING(120), allowNull: true },
    aiConfidence: { type: DataTypes.FLOAT, allowNull: true },
    aiExplanation: { type: DataTypes.TEXT, allowNull: true }
  });
  const applicationColumns = await queryInterface.describeTable("AdmissionApplications").catch(() => null);
  if (applicationColumns && !applicationColumns.AdmissionProgramId) {
    await queryInterface.addColumn("AdmissionApplications", "AdmissionProgramId", { type: DataTypes.UUID, allowNull: true });
  }
  if (applicationColumns) {
    const applicationIndexes = await queryInterface.showIndex("AdmissionApplications").catch(() => []);
    const hasOldProgramIndex = applicationIndexes.some((index) => index.name === "applications_student_institution_program_unique");
    const hasProgramScopeIndex = applicationIndexes.some((index) => index.name === "applications_student_institution_program_scope_unique");
    if (hasOldProgramIndex) {
      await queryInterface.removeIndex("AdmissionApplications", "applications_student_institution_program_unique").catch(() => {});
    }
    if (!hasProgramScopeIndex) {
      await queryInterface.addIndex("AdmissionApplications", ["StudentId", "InstitutionId", "program", "faculty", "programType"], {
        name: "applications_student_institution_program_scope_unique",
        unique: true
      }).catch(() => {});
    }
  }
}

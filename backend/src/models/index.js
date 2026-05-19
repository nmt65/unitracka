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
        dialectOptions: env.nodeEnv === "production" ? { ssl: { require: true, rejectUnauthorized: false } } : {}
      });

export const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(180), unique: true, allowNull: false, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING(120), defaultValue: "Student UniTrack" },
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
      name: "applications_student_institution_program_unique",
      unique: true,
      fields: ["StudentId", "InstitutionId", "program"]
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
Institution.hasMany(AdmissionApplication, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
AdmissionApplication.belongsTo(Institution);
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

export async function initDb() {
  await sequelize.authenticate();
  const syncOptions = env.dbDialect === "sqlite" ? {} : { alter: env.nodeEnv !== "production" };
  await sequelize.sync(syncOptions);
}

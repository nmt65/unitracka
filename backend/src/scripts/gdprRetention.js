import { Op } from "sequelize";
import {
  AiUsage,
  AuditLog,
  Notification,
  User,
  initDb,
  sequelize
} from "../models/index.js";

const execute = process.argv.includes("--execute");
const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const rules = [
  {
    name: "readNotifications",
    model: Notification,
    where: { readAt: { [Op.lt]: daysAgo(180) } },
    retentionDays: 180
  },
  {
    name: "aiUsage",
    model: AiUsage,
    where: { createdAt: { [Op.lt]: daysAgo(365) } },
    retentionDays: 365
  },
  {
    name: "auditLogs",
    model: AuditLog,
    where: { createdAt: { [Op.lt]: daysAgo(730) } },
    retentionDays: 730
  }
];

const report = {
  mode: execute ? "execute" : "dry-run",
  generatedAt: now.toISOString(),
  rules: [],
  expiredCredentialsCleared: 0,
  errors: []
};

try {
  await initDb();

  for (const rule of rules) {
    const candidates = await rule.model.count({ where: rule.where });
    const deleted = execute && candidates
      ? await rule.model.destroy({ where: rule.where })
      : 0;
    report.rules.push({
      name: rule.name,
      retentionDays: rule.retentionDays,
      candidates,
      deleted
    });
  }

  const expiredCredentials = {
    [Op.or]: [
      { resetTokenExpiresAt: { [Op.lt]: now } },
      { emailVerificationExpiresAt: { [Op.lt]: now } },
      { passkeyChallengeExpiresAt: { [Op.lt]: now } }
    ]
  };
  const credentialCandidates = await User.unscoped().count({ where: expiredCredentials });
  if (execute && credentialCandidates) {
    const [updated] = await User.unscoped().update({
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
      passkeyChallenge: null,
      passkeyChallengeType: null,
      passkeyChallengeExpiresAt: null
    }, { where: expiredCredentials });
    report.expiredCredentialsCleared = updated;
  } else {
    report.expiredCredentialsCandidates = credentialCandidates;
  }
} catch (error) {
  report.errors.push(error.message);
  process.exitCode = 1;
} finally {
  console.log(JSON.stringify(report, null, 2));
  await sequelize.close().catch(() => {});
}

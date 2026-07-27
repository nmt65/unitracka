import bcrypt from "bcryptjs";
import { Institution, User } from "../models/index.js";
import { authCookieName, setAuthCookie, signUserToken } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { hashCnp, validateCnp } from "../utils/cnp.js";
import { randomToken, sha256 } from "../utils/crypto.js";
import { writeAudit } from "../services/audit.js";
import { isSmtpConfigured, sendPasswordResetEmail } from "../services/mail.js";

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarDataUrl: user.avatarDataUrl,
    role: user.role,
    cnpLast4: user.cnpLast4,
    institutionId: user.InstitutionId,
    institution: user.Institution ? {
      id: user.Institution.id,
      name: user.Institution.name,
      shortName: user.Institution.shortName,
      status: user.Institution.status
    } : null,
    bacAverage: user.bacAverage,
    languageResults: user.languageResults,
    interests: user.interests,
    emailNotifications: user.emailNotifications,
    notifyBeforeDays: user.notifyBeforeDays,
    publicShareId: user.publicShareId
  };
}

export async function register(req, res, next) {
  try {
    const existing = await User.unscoped().findOne({ where: { email: req.body.email } });
    if (existing) return res.status(409).json({ message: "Exista deja un cont cu acest email." });
    const role = req.body.role || "student";
    if (role !== "student") {
      return res.status(403).json({ message: "Conturile de universitate se creează doar de către admin." });
    }
    const payload = { email: req.body.email, name: req.body.name || "Student UniTrack", role };

    if (role === "student") {
      const cnp = validateCnp(req.body.cnp);
      if (!cnp.valid) return res.status(422).json({ message: cnp.reason });
      const cnpHash = hashCnp(cnp.normalized);
      const cnpExists = await User.unscoped().findOne({ where: { cnpHash } });
      if (cnpExists) return res.status(409).json({ message: "Există deja un cont pentru acest CNP." });
      payload.cnpHash = cnpHash;
      payload.cnpLast4 = cnp.last4;
    }

    if (role === "university") {
      if (!req.body.institutionId) return res.status(422).json({ message: "Alege universitatea din lista aprobată de admin." });
      const institution = await Institution.findOne({ where: { id: req.body.institutionId, status: "active" } });
      if (!institution) return res.status(422).json({ message: "Universitatea nu există sau nu este activă." });
      payload.InstitutionId = institution.id;
      payload.name = req.body.name || institution.name;
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ ...payload, passwordHash });
    const created = await User.findByPk(user.id, { include: [Institution] });
    const token = signUserToken(created);
    setAuthCookie(res, token);
    await writeAudit(req, { action: "auth.register", entityType: "User", entityId: created.id, metadata: { actorId: created.id, email: created.email, role: created.role } });
    return res.status(201).json({ user: publicUser(created) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const user = await User.scope("withPassword").findOne({ where: { email: req.body.email }, include: [Institution] });
    if (!user) return res.status(401).json({ message: "Email sau parola incorecta." });
    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      return res.status(401).json({ message: "Contul nu are o parola valida. Foloseste resetarea parolei." });
    }

    const passwordOk = await bcrypt.compare(req.body.password, user.passwordHash).catch(() => false);
    if (!passwordOk) return res.status(401).json({ message: "Email sau parola incorecta." });

    const token = signUserToken(user);
    setAuthCookie(res, token);
    // Login must remain available even if an older production schema is still
    // catching up with the optional activity-tracking column.
    void user.update({ lastLoginAt: new Date() }).catch((error) => {
      console.warn(`Nu am putut salva ultima autentificare pentru ${user.id}: ${error.message}`);
    });
    void writeAudit(req, { action: "auth.login", entityType: "User", entityId: user.id, metadata: { actorId: user.id, email: user.email, role: user.role } });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure
  });
  return res.json({ message: "Delogat cu succes." });
}

export function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}

export async function forgotPassword(req, res, next) {
  try {
    const user = await User.scope("withPassword").findOne({ where: { email: req.body.email } });
    let devResetToken = null;
    let delivery = { sent: false, reason: isSmtpConfigured() ? "email necunoscut sau netrimis" : "SMTP neconfigurat" };
    if (user) {
      devResetToken = randomToken(24);
      await user.update({
        resetTokenHash: sha256(devResetToken),
        resetTokenExpiresAt: new Date(Date.now() + env.resetTokenMinutes * 60 * 1000)
      });
      delivery = await sendPasswordResetEmail(user, devResetToken);
      await writeAudit(req, {
        action: "auth.password_reset_requested",
        entityType: "User",
        entityId: user.id,
        metadata: { email: user.email, mailSent: delivery.sent, mailReason: delivery.reason || null }
      });
    }
    return res.json({
      message: isSmtpConfigured()
        ? delivery.sent
          ? "Dacă emailul există, am trimis instrucțiunile pentru resetarea parolei."
          : user
            ? "Contul există, dar emailul de resetare nu a putut fi trimis."
            : "Dacă emailul există, am generat instrucțiuni pentru resetarea parolei."
        : "Resetarea a fost generată, dar emailul nu poate fi trimis până când SMTP este configurat pe Render.",
      mailConfigured: isSmtpConfigured(),
      mailSent: delivery.sent,
      mailReason: user && !delivery.sent ? delivery.reason : env.nodeEnv === "production" ? undefined : delivery.reason,
      resetToken: env.nodeEnv === "production" ? undefined : devResetToken
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const user = await User.scope("withPassword").findOne({ where: { resetTokenHash: sha256(req.body.token) } });
    if (!user || !user.resetTokenExpiresAt || new Date(user.resetTokenExpiresAt) < new Date()) {
      return res.status(422).json({ message: "Tokenul de resetare este invalid sau expirat." });
    }
    await user.update({
      passwordHash: await bcrypt.hash(req.body.password, 12),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      passwordChangedAt: new Date()
    });
    await writeAudit(req, { action: "auth.password_reset_completed", entityType: "User", entityId: user.id, metadata: { email: user.email } });
    return res.json({ message: "Parola a fost resetată." });
  } catch (error) {
    next(error);
  }
}

export async function checkCnp(req, res, next) {
  try {
    const result = validateCnp(req.body.cnp);
    if (!result.valid) return res.status(422).json({ valid: false, message: result.reason });
    const exists = await User.unscoped().findOne({ where: { cnpHash: hashCnp(result.normalized) } });
    return res.json({ valid: true, available: !exists, last4: result.last4 });
  } catch (error) {
    next(error);
  }
}

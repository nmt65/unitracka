import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { authCookieName } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { Document, Institution, University, User } from "../models/index.js";
import { writeAudit } from "../services/audit.js";
import { documentProgress } from "../utils/progress.js";

function publicProfile(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
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

export function getProfile(req, res) {
  return res.json({ user: publicProfile(req.user) });
}

export async function updateProfile(req, res, next) {
  try {
    await req.user.update(req.body);
    const user = await User.findByPk(req.user.id, { include: [Institution] });
    await writeAudit(req, { action: "user.profile_update", entityType: "User", entityId: req.user.id, metadata: Object.keys(req.body) });
    return res.json({ user: publicProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const user = await User.scope("withPassword").findByPk(req.user.id);
    const passwordOk = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!passwordOk) return res.status(401).json({ message: "Parola curentă nu este corectă." });
    await user.update({
      passwordHash: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: new Date()
    });
    await writeAudit(req, { action: "user.password_change", entityType: "User", entityId: user.id });
    return res.json({ message: "Parola a fost schimbată." });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const user = await User.scope("withPassword").findByPk(req.user.id);
    const passwordOk = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!passwordOk) return res.status(401).json({ message: "Parola nu este corectă." });
    if (req.body.confirmation !== "STERG CONTUL") {
      return res.status(422).json({ message: "Confirmarea trebuie să fie exact: STERG CONTUL." });
    }
    if (user.role === "admin") {
      const otherAdmins = await User.count({ where: { role: "admin", id: { [Op.ne]: user.id } } });
      if (otherAdmins === 0) {
        return res.status(409).json({ message: "Nu poți șterge ultimul cont de admin." });
      }
    }
    await writeAudit(req, { action: "user.account_delete", entityType: "User", entityId: user.id, metadata: { email: user.email, role: user.role } });
    await user.destroy();
    res.clearCookie(authCookieName, {
      httpOnly: true,
      sameSite: env.cookieSameSite,
      secure: env.cookieSecure
    });
    return res.json({ message: "Contul a fost șters definitiv." });
  } catch (error) {
    next(error);
  }
}

export async function rotateShareLink(req, res, next) {
  try {
    await req.user.update({ publicShareId: crypto.randomUUID() });
    await writeAudit(req, { action: "user.share_link_rotate", entityType: "User", entityId: req.user.id });
    return res.json({ publicShareId: req.user.publicShareId });
  } catch (error) {
    next(error);
  }
}

export async function publicShare(req, res, next) {
  try {
    const user = await User.findOne({
      where: { publicShareId: req.params.shareId },
      include: [{ model: University, include: [Document] }]
    });
    if (!user) return res.status(404).json({ message: "Profil public negasit." });

    return res.json({
      profile: {
        name: user.name,
        bacAverage: user.bacAverage,
        languageResults: user.languageResults,
        interests: user.interests
      },
      universities: user.Universities.map((university) => ({
        id: university.id,
        name: university.name,
        country: university.country,
        faculty: university.faculty,
        program: university.program,
        programType: university.programType,
        deadline: university.deadline,
        status: university.status,
        progress: documentProgress(university.Documents)
      }))
    });
  } catch (error) {
    next(error);
  }
}

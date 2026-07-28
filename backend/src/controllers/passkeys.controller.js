import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";
import { env } from "../config/env.js";
import { Institution, Passkey, User } from "../models/index.js";
import { setAuthCookie, signUserToken } from "../middleware/auth.js";
import { writeAudit } from "../services/audit.js";
import { publicUser } from "./auth.controller.js";

function challengeExpiresAt() {
  return new Date(Date.now() + env.passkey.challengeMinutes * 60 * 1000);
}

function challengeIsValid(user, type) {
  return user.passkeyChallenge
    && user.passkeyChallengeType === type
    && user.passkeyChallengeExpiresAt
    && new Date(user.passkeyChallengeExpiresAt) > new Date();
}

function toPublicKey(value) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

function publicPasskey(passkey) {
  return {
    id: passkey.id,
    name: passkey.name,
    deviceType: passkey.deviceType,
    backedUp: passkey.backedUp,
    transports: passkey.transports,
    createdAt: passkey.createdAt,
    lastUsedAt: passkey.lastUsedAt
  };
}

function passkeyFailure(res, error, fallback) {
  console.warn(`Passkey: ${error?.message || fallback}`);
  return res.status(422).json({
    message: env.nodeEnv === "production" ? fallback : error?.message || fallback
  });
}

export async function listPasskeys(req, res, next) {
  try {
    const passkeys = await Passkey.findAll({
      where: { UserId: req.user.id },
      order: [["createdAt", "DESC"]]
    });
    return res.json({
      supported: true,
      rpId: env.passkey.rpId,
      passkeys: passkeys.map(publicPasskey)
    });
  } catch (error) {
    next(error);
  }
}

export async function registrationOptions(req, res, next) {
  try {
    const passkeys = await Passkey.findAll({ where: { UserId: req.user.id } });
    const options = await generateRegistrationOptions({
      rpName: env.passkey.rpName,
      rpID: env.passkey.rpId,
      userID: new TextEncoder().encode(req.user.id),
      userName: req.user.email,
      userDisplayName: req.user.name || req.user.email,
      attestationType: "none",
      supportedAlgorithmIDs: [-7, -257],
      excludeCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required"
      }
    });
    await req.user.update({
      passkeyChallenge: options.challenge,
      passkeyChallengeType: "registration",
      passkeyChallengeExpiresAt: challengeExpiresAt()
    });
    return res.json(options);
  } catch (error) {
    next(error);
  }
}

export async function verifyRegistration(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !challengeIsValid(user, "registration")) {
      return res.status(422).json({ message: "Cererea passkey a expirat. Începe din nou." });
    }
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: req.body.response,
        expectedChallenge: user.passkeyChallenge,
        expectedOrigin: env.passkey.origin,
        expectedRPID: env.passkey.rpId,
        requireUserVerification: true
      });
    } catch (error) {
      return passkeyFailure(res, error, "Passkey-ul nu a putut fi verificat.");
    }
    if (!verification.verified || !verification.registrationInfo) {
      return res.status(422).json({ message: "Passkey-ul nu a fost verificat." });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const passkey = await Passkey.create({
      UserId: user.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      webauthnUserId: Buffer.from(user.id).toString("base64url"),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports || req.body.response.response?.transports || [],
      name: req.body.name || "Passkey personal"
    });
    await user.update({
      passkeyChallenge: null,
      passkeyChallengeType: null,
      passkeyChallengeExpiresAt: null
    });
    await writeAudit(req, {
      action: "auth.passkey_registered",
      entityType: "Passkey",
      entityId: passkey.id,
      metadata: { actorId: user.id, name: passkey.name, deviceType: passkey.deviceType }
    });
    return res.status(201).json({ verified: true, passkey: publicPasskey(passkey) });
  } catch (error) {
    next(error);
  }
}

export async function authenticationOptions(req, res, next) {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    const passkeys = user ? await Passkey.findAll({ where: { UserId: user.id } }) : [];
    if (!user || !passkeys.length || (user.role !== "admin" && !user.emailVerifiedAt)) {
      return res.status(404).json({ message: "Nu există un passkey disponibil pentru acest cont." });
    }
    const options = await generateAuthenticationOptions({
      rpID: env.passkey.rpId,
      userVerification: "required",
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports
      }))
    });
    await user.update({
      passkeyChallenge: options.challenge,
      passkeyChallengeType: "authentication",
      passkeyChallengeExpiresAt: challengeExpiresAt()
    });
    return res.json(options);
  } catch (error) {
    next(error);
  }
}

export async function verifyAuthentication(req, res, next) {
  try {
    const user = await User.findOne({ where: { email: req.body.email }, include: [Institution] });
    if (!user || !challengeIsValid(user, "authentication")) {
      return res.status(422).json({ message: "Cererea passkey a expirat. Începe din nou." });
    }
    const passkey = await Passkey.findOne({
      where: { UserId: user.id, credentialId: req.body.response.id }
    });
    if (!passkey) return res.status(422).json({ message: "Passkey necunoscut." });

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: req.body.response,
        expectedChallenge: user.passkeyChallenge,
        expectedOrigin: env.passkey.origin,
        expectedRPID: env.passkey.rpId,
        requireUserVerification: true,
        credential: {
          id: passkey.credentialId,
          publicKey: toPublicKey(passkey.publicKey),
          counter: Number(passkey.counter || 0),
          transports: passkey.transports
        }
      });
    } catch (error) {
      return passkeyFailure(res, error, "Autentificarea cu passkey a eșuat.");
    }
    if (!verification.verified) {
      return res.status(401).json({ message: "Autentificarea cu passkey a eșuat." });
    }

    await passkey.update({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date()
    });
    await user.update({
      passkeyChallenge: null,
      passkeyChallengeType: null,
      passkeyChallengeExpiresAt: null,
      lastLoginAt: new Date()
    });
    setAuthCookie(res, signUserToken(user));
    await writeAudit(req, {
      action: "auth.passkey_login",
      entityType: "User",
      entityId: user.id,
      metadata: { actorId: user.id, email: user.email, passkeyId: passkey.id }
    });
    return res.json({ verified: true, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function deletePasskey(req, res, next) {
  try {
    const passkey = await Passkey.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!passkey) return res.status(404).json({ message: "Passkey-ul nu există." });
    await passkey.destroy();
    await writeAudit(req, {
      action: "auth.passkey_deleted",
      entityType: "Passkey",
      entityId: passkey.id,
      metadata: { actorId: req.user.id, name: passkey.name }
    });
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}

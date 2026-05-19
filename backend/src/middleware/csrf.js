import crypto from "node:crypto";
import { env } from "../config/env.js";

export const csrfCookieName = "unitracka_csrf";

export function issueCsrfToken(_req, res) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(csrfCookieName, token, {
    httpOnly: false,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    maxAge: 24 * 60 * 60 * 1000
  });
  return res.json({ csrfToken: token });
}

export function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookieToken = req.cookies?.[csrfCookieName];
  const headerToken = req.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "Token CSRF lipsa sau invalid." });
  }
  next();
}

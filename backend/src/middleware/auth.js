import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Institution, User } from "../models/index.js";

export const authCookieName = "unitracka_token";

export function signUserToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[authCookieName];
    if (!token) return res.status(401).json({ message: "Autentificare necesara." });

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findByPk(payload.sub, { include: [Institution] });
    if (!user) return res.status(401).json({ message: "Sesiune invalida." });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Sesiune expirata sau invalida." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Autentificare necesară." });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Nu ai permisiuni pentru această acțiune." });
    next();
  };
}

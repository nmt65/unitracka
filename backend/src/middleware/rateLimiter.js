import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Prea multe incercari. Incearca din nou peste cateva minute." }
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 160,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trafic prea mare. Reîncearcă imediat." }
});

export const documentRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Prea multe verificări de documente. Așteaptă câteva minute." }
});

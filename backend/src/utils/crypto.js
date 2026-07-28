import crypto from "node:crypto";

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function randomNumericCode(length = 6) {
  const digits = Math.max(4, Math.min(8, Number(length) || 6));
  const ceiling = 10 ** digits;
  return crypto.randomInt(0, ceiling).toString().padStart(digits, "0");
}

export function hashText(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

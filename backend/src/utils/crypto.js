import crypto from "node:crypto";

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashText(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

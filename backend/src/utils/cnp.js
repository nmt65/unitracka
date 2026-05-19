import crypto from "node:crypto";
import { env } from "../config/env.js";

const controlDigits = "279146358279";
const validCountyCodes = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38",
  "39", "40", "41", "42", "43", "44", "45", "46", "51", "52"
]);

function yearPrefix(firstDigit) {
  if (["1", "2"].includes(firstDigit)) return "19";
  if (["3", "4"].includes(firstDigit)) return "18";
  if (["5", "6"].includes(firstDigit)) return "20";
  return null;
}

export function normalizeCnp(cnp) {
  return String(cnp || "").replace(/\D/g, "");
}

export function validateCnp(cnp) {
  const value = normalizeCnp(cnp);
  if (!/^\d{13}$/.test(value)) return { valid: false, reason: "CNP-ul trebuie să conțină 13 cifre." };

  const prefix = yearPrefix(value[0]);
  if (!prefix) return { valid: false, reason: "Prima cifră din CNP nu este validă pentru un elev." };

  const year = Number(`${prefix}${value.slice(1, 3)}`);
  const month = Number(value.slice(3, 5));
  const day = Number(value.slice(5, 7));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { valid: false, reason: "Data nașterii din CNP nu este validă." };
  }

  const county = value.slice(7, 9);
  if (!validCountyCodes.has(county)) return { valid: false, reason: "Codul județului din CNP nu este valid." };

  const sum = value
    .slice(0, 12)
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * Number(controlDigits[index]), 0);
  const check = sum % 11 === 10 ? 1 : sum % 11;
  if (check !== Number(value[12])) return { valid: false, reason: "Cifra de control din CNP nu este validă." };

  return { valid: true, normalized: value, last4: value.slice(-4) };
}

export function hashCnp(cnp) {
  const normalized = normalizeCnp(cnp);
  return crypto.createHmac("sha256", env.cnpPepper).update(normalized).digest("hex");
}

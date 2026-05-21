import xss from "xss";

function sanitizeValue(value, key = "") {
  if (typeof value === "string") {
    if (key === "fileDataUrl") return value.trim();
    return xss(value.trim());
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, item]) => [childKey, sanitizeValue(item, childKey)]));
  }
  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

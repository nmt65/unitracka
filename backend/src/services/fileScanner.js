import { env } from "../config/env.js";

export async function scanDocumentFile({ buffer, fileName, mimeType }) {
  if (!env.fileScan.url) return { status: "unavailable", provider: null, clean: null };

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType || "application/octet-stream" }), fileName || "document.bin");
  const response = await fetch(env.fileScan.url, {
    method: "POST",
    headers: env.fileScan.token ? { authorization: `Bearer ${env.fileScan.token}` } : {},
    body: form,
    signal: AbortSignal.timeout(env.fileScan.timeoutMs)
  });
  if (!response.ok) return { status: "error", provider: "http-antivirus", clean: null };

  const payload = await response.json().catch(() => ({}));
  const clean = payload.clean === true || payload.status === "clean";
  return {
    status: clean ? "clean" : "infected",
    provider: payload.provider || "http-antivirus",
    clean
  };
}

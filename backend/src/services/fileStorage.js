import { env } from "../config/env.js";

export function decodeDataUrl(value) {
  const match = String(value || "").match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw Object.assign(new Error("Fișierul atașat nu poate fi citit."), { status: 422 });
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}

function objectUrl(bucket, objectPath) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${env.storage.supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function storageHeaders(extra = {}) {
  return {
    apikey: env.storage.supabaseServiceKey,
    authorization: `Bearer ${env.storage.supabaseServiceKey}`,
    ...extra
  };
}

export async function storeDocumentFile({ documentId, fileName, fileDataUrl, mimeType }) {
  const decoded = decodeDataUrl(fileDataUrl);
  if (!env.storage.enabled) {
    return { storageProvider: "database", storageBucket: null, storagePath: null, fileDataUrl };
  }

  const safeName = String(fileName || "document.bin").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-160);
  const storagePath = `${documentId}/${Date.now()}-${safeName}`;
  const response = await fetch(objectUrl(env.storage.bucket, storagePath), {
    method: "POST",
    headers: storageHeaders({
      "content-type": mimeType || decoded.mimeType || "application/octet-stream",
      "x-upsert": "true"
    }),
    body: decoded.buffer,
    signal: AbortSignal.timeout(env.storage.timeoutMs)
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Stocarea documentului a eșuat (${response.status}).`), { status: 502 });
  }
  return {
    storageProvider: "supabase",
    storageBucket: env.storage.bucket,
    storagePath,
    fileDataUrl: null
  };
}

export async function loadDocumentFile(document) {
  if (document.storageProvider !== "supabase" || !document.storagePath) {
    return decodeDataUrl(document.fileDataUrl);
  }
  if (!env.storage.enabled) {
    throw Object.assign(new Error("Stocarea externă nu este configurată pe acest server."), { status: 503 });
  }
  const response = await fetch(objectUrl(document.storageBucket || env.storage.bucket, document.storagePath), {
    headers: storageHeaders(),
    signal: AbortSignal.timeout(env.storage.timeoutMs)
  });
  if (!response.ok) {
    throw Object.assign(new Error("Fișierul nu a putut fi descărcat din stocarea privată."), {
      status: response.status === 404 ? 404 : 502
    });
  }
  return {
    mimeType: response.headers.get("content-type") || document.mimeType || "application/octet-stream",
    buffer: Buffer.from(await response.arrayBuffer())
  };
}

export async function deleteStoredDocumentFile(document) {
  if (document.storageProvider !== "supabase" || !document.storagePath || !env.storage.enabled) return;
  await fetch(objectUrl(document.storageBucket || env.storage.bucket, document.storagePath), {
    method: "DELETE",
    headers: storageHeaders(),
    signal: AbortSignal.timeout(env.storage.timeoutMs)
  }).catch(() => null);
}

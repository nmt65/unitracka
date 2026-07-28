import { env } from "../config/env.js";

async function callProvider(provider, path, payload) {
  if (!provider.baseUrl || !provider.token) {
    throw Object.assign(new Error("Integrarea nu este configurată."), { status: 503 });
  }
  const response = await fetch(`${provider.baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${provider.token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(provider.timeoutMs)
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Furnizorul extern a răspuns cu ${response.status}.`), { status: 502 });
  }
  return response.json();
}

export function verifyOfficialIdentity(payload) {
  return callProvider(env.integrations.registry, "/verify", payload);
}

export function createQualifiedSignatureRequest(payload) {
  return callProvider(env.integrations.signature, "/signature-requests", payload);
}

export function integrationStatus() {
  return {
    officialRegistry: Boolean(env.integrations.registry.baseUrl && env.integrations.registry.token),
    qualifiedSignature: Boolean(env.integrations.signature.baseUrl && env.integrations.signature.token)
  };
}

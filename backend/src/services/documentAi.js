import { z } from "zod";
import { env } from "../config/env.js";

const MAX_FILE_BYTES = 5_000_000;
const REMOTE_ACCEPTANCE_THRESHOLD = 0.68;
const LOCAL_MIN_TEXT_LENGTH = 45;
const LOCAL_MIN_MATCHES = 2;

const patterns = [
  { label: "Diplomă BAC", terms: ["diploma de bacalaureat", "diplomă de bacalaureat", "bacalaureat", "diplomă bac", "diploma bac", "diploma de absolvire"] },
  { label: "Foaie matricolă", terms: ["foaie matricola", "foaie matricolă", "situație școlară", "situatie scolara", "transcript", "matricol"] },
  { label: "CV Europass", terms: ["europass", "erasmus", "erasmus+", "curriculum vitae", "resume", "cv", "experiență profesională", "experienta profesionala", "work experience", "education", "educație", "educatie", "competențe", "competente", "skills", "profil personal"] },
  { label: "Scrisoare motivație", terms: ["scrisoare de motivatie", "scrisoare motivație", "motivation letter", "personal statement", "motivația candidaturii"] },
  { label: "Scrisori de recomandare", terms: ["recomandare", "recommendation letter", "letter of recommendation", "referință academică", "referinta academica"] },
  { label: "Certificat limbă", terms: ["ielts", "toefl", "cambridge", "language certificate", "certificat de competență lingvistică", "certificat de competenta lingvistica"] },
  { label: "Cazier judiciar", terms: ["cazier judiciar", "certificat de cazier", "criminal record"] },
  { label: "Adeverință medicală", terms: ["adeverință medicală", "adeverinta medicala", "apt medical", "medic de familie"] },
  { label: "Portofoliu", terms: ["portofoliu", "portfolio", "proiecte", "projects", "github", "lucrări", "lucrari"] }
];

const supportedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml"
]);

const remoteDocumentSchema = z.object({
  label: z.string().min(2).max(120),
  confidence: z.coerce.number().min(0).max(1),
  accepted: z.boolean(),
  readable: z.boolean().optional().default(true),
  evidence: z.array(z.string().min(2).max(180)).max(5).optional().default([]),
  explanation: z.string().min(4).max(1000)
});

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_./\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function canonicalDocumentType(value) {
  const normalized = normalize(value);
  if (!normalized) return "";
  const match = patterns.find((item) => {
    const label = normalize(item.label);
    return label === normalized
      || label.includes(normalized)
      || normalized.includes(label)
      || item.terms.some((term) => normalized.includes(normalize(term)));
  });
  return match?.label || "";
}

function expectedMatches(label, expectedType) {
  const expected = normalize(expectedType);
  const current = normalize(label);
  const expectedCanonical = canonicalDocumentType(expectedType);
  const currentCanonical = canonicalDocumentType(label);
  if (expectedCanonical && currentCanonical) return expectedCanonical === currentCanonical;
  const pattern = patterns.find((item) => item.label === label);
  return current.includes(expected)
    || expected.includes(current)
    || pattern?.terms.some((term) => expected.includes(normalize(term)));
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  return Math.max(0, Math.min(1, numeric));
}

function dataUrlParts(fileDataUrl = "") {
  const match = String(fileDataUrl).match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  const data = match[2].replace(/\s/g, "");
  if (!data) return null;
  return { mimeType: match[1].toLowerCase(), data };
}

function extensionOf(fileName = "") {
  const match = String(fileName).trim().toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return match?.[1] || "";
}

function mimeMatchesExtension(mimeType, extension) {
  const pairs = {
    pdf: ["application/pdf"],
    doc: ["application/msword"],
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"],
    txt: ["text/plain"],
    csv: ["text/csv", "text/plain"],
    json: ["application/json", "text/plain"],
    xml: ["application/xml", "text/xml", "text/plain"]
  };
  return !extension || !pairs[extension] || pairs[extension].includes(mimeType);
}

function hasExpectedSignature(mimeType, buffer) {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return buffer.subarray(0, 2).toString("ascii") === "PK";
  if (mimeType === "application/msword") return buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  return true;
}

function textFromTrustedFile(mimeType, buffer) {
  if (!/(^text\/|application\/(json|xml)$)/i.test(mimeType)) return "";
  return buffer.toString("utf8").replace(/\0/g, "").slice(0, 12000);
}

function fileRejection(explanation) {
  return {
    provider: "file-security",
    label: "Fișier nevalid",
    confidence: 0,
    accepted: false,
    reviewRequired: false,
    status: "rejected",
    evidence: [],
    explanation
  };
}

function inspectFile(payload) {
  const inline = dataUrlParts(payload.fileDataUrl);
  if (!inline) return { result: fileRejection("Atașamentul nu este un fișier Base64 valid.") };
  if (!supportedMimeTypes.has(inline.mimeType)) {
    return { result: fileRejection("Tipul de fișier nu este acceptat. Încarcă PDF, DOC/DOCX, JPG, PNG, WebP sau un document text/XML.") };
  }
  const buffer = Buffer.from(inline.data, "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES) {
    return { result: fileRejection("Fișierul este gol sau depășește limita de 5 MB.") };
  }
  const claimedSize = Number(payload.fileSize);
  if (Number.isFinite(claimedSize) && claimedSize > 0 && Math.abs(claimedSize - buffer.length) > 1024) {
    return { result: fileRejection("Dimensiunea declarată nu corespunde fișierului atașat.") };
  }
  if (payload.mimeType && String(payload.mimeType).toLowerCase() !== inline.mimeType) {
    return { result: fileRejection("Tipul declarat al fișierului nu corespunde atașamentului real.") };
  }
  if (!mimeMatchesExtension(inline.mimeType, extensionOf(payload.fileName))) {
    return { result: fileRejection("Extensia fișierului nu corespunde tipului real al documentului.") };
  }
  if (!hasExpectedSignature(inline.mimeType, buffer)) {
    return { result: fileRejection("Conținutul nu corespunde tipului de fișier declarat. Documentul nu a fost acceptat.") };
  }
  return {
    inline,
    buffer,
    trustedText: textFromTrustedFile(inline.mimeType, buffer)
  };
}

function localClassifier({ expectedType, fileName, text }) {
  const textValue = String(text || "").trim();
  const normalizedText = normalize(textValue);
  const normalizedFileName = normalize(fileName);
  const scores = patterns.map((item) => ({
    label: item.label,
    textHits: item.terms.filter((term) => normalizedText.includes(normalize(term))).length,
    fileNameHits: item.terms.filter((term) => normalizedFileName.includes(normalize(term))).length,
    expected: expectedMatches(item.label, expectedType)
  }));
  const best = [...scores].sort((a, b) => b.textHits - a.textHits || b.fileNameHits - a.fileNameHits)[0]
    || { label: "Necunoscut", textHits: 0, fileNameHits: 0 };
  const expectedScore = scores.find((item) => item.expected);

  if (textValue.length < LOCAL_MIN_TEXT_LENGTH) {
    return {
      provider: "unitrack-document-classifier",
      label: best.fileNameHits ? best.label : "Necunoscut",
      confidence: 0.24,
      accepted: false,
      reviewRequired: true,
      status: "pending",
      evidence: [],
      explanation: "Nu există suficient conținut text verificabil. Fișierul a fost păstrat pentru verificare manuală; numele lui nu este acceptat ca dovadă."
    };
  }

  const requiredMatches = expectedScore?.label === "CV Europass" ? 1 : LOCAL_MIN_MATCHES;
  const accepted = Boolean(best.expected && expectedScore?.label === best.label && expectedScore.textHits >= requiredMatches);
  const confidence = best.textHits ? Math.min(0.91, 0.36 + best.textHits * 0.14 + (accepted ? 0.18 : 0)) : 0.28;

  return {
    provider: "unitrack-document-classifier",
    label: best.textHits ? best.label : "Necunoscut",
    confidence,
    accepted,
    reviewRequired: !accepted && best.label === "Necunoscut",
    status: accepted ? "verified" : best.label === "Necunoscut" ? "pending" : "rejected",
    evidence: accepted ? [`${best.textHits} indicii găsite în conținutul fișierului`] : [],
    explanation: best.textHits
      ? accepted
        ? `Documentul pare să fie ${best.label}; am găsit ${best.textHits} indicii în conținut, nu doar în numele fișierului.`
        : `Documentul pare să fie ${best.label}, iar tipul cerut este ${expectedScore?.label || expectedType}.`
      : "Nu am găsit indicii clare în conținut; documentul rămâne în verificare manuală."
  };
}

function normalizeRemoteResult(payload, remote) {
  const label = String(remote.label || "Necunoscut").trim() || "Necunoscut";
  const confidence = clampConfidence(remote.confidence);
  const labelMatchesExpected = expectedMatches(label, payload.expectedType);
  const readable = remote.readable !== false;
  const accepted = Boolean(remote.accepted) && readable && labelMatchesExpected && confidence >= REMOTE_ACCEPTANCE_THRESHOLD;
  const needsReview = !accepted && (!readable || confidence < REMOTE_ACCEPTANCE_THRESHOLD || label === "Necunoscut");
  let explanation = remote.explanation || "Clasificat cu providerul de analiză configurat.";

  if (!readable) explanation = "Fișierul nu poate fi citit suficient pentru o decizie automată. A fost trimis la verificare manuală.";
  else if (!labelMatchesExpected) explanation = `Verificarea a detectat ${label}, nu ${payload.expectedType}. ${explanation}`;
  else if (confidence < REMOTE_ACCEPTANCE_THRESHOLD) explanation = `Încrederea clasificării este prea mică pentru aprobare automată. ${explanation}`;

  return {
    provider: remote.provider,
    model: remote.model || null,
    label,
    confidence,
    accepted,
    reviewRequired: needsReview,
    status: accepted ? "verified" : needsReview ? "pending" : "rejected",
    evidence: Array.isArray(remote.evidence) ? remote.evidence.slice(0, 5) : [],
    explanation
  };
}

function extractJsonObject(value) {
  const source = String(value || "").replace(/```json|```/gi, "").trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = remoteDocumentSchema.safeParse(JSON.parse(source.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function providerFailure(provider, model) {
  const providerName = provider === "gemini" ? "Gemini" : "providerul AI";
  return {
    provider,
    model: model || null,
    label: "În verificare manuală",
    confidence: 0,
    accepted: false,
    reviewRequired: true,
    status: "pending",
    evidence: [],
    explanation: `${providerName} nu a putut finaliza analiza acum. Fișierul a fost păstrat în dosar pentru verificarea universității și nu a fost respins automat.`
  };
}

async function fetchJson(url, body, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.geminiRequestTimeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      return { error: { status: response.status, message: text.slice(0, 500) } };
    }
    try {
      return { data: JSON.parse(text) };
    } catch {
      return { error: { status: 502, message: "Răspuns AI nevalid." } };
    }
  } catch (error) {
    return { error: { status: error?.name === "AbortError" ? 504 : 502, message: error instanceof Error ? error.message : "Eroare de rețea AI." } };
  } finally {
    clearTimeout(timer);
  }
}

async function openAiClassifier(payload, file) {
  if (!env.openaiApiKey) return { skipped: true };
  const content = [{
    type: "input_text",
    text: `Evaluează conținutul real al documentului de admitere. Numele fișierului este doar metadată, nu dovadă. Răspunde strict JSON cu label, confidence (0-1), accepted, readable, evidence (maxim 5), explanation. Tip așteptat: ${payload.expectedType}. Tip MIME: ${file.inline.mimeType}.`
  }];
  if (file.inline.mimeType.startsWith("image/")) content.push({ type: "input_image", image_url: payload.fileDataUrl });
  if (file.trustedText) content.push({ type: "input_text", text: `Conținut citit direct din fișier:\n${file.trustedText}` });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.openaiDocumentModel,
        input: [{ role: "system", content: "Nu aproba pe baza numelui fișierului. Dacă nu poți vedea conținutul, setează readable=false și accepted=false." }, { role: "user", content }]
      })
    });
    if (!response.ok) return { error: { provider: "openai", model: env.openaiDocumentModel, status: response.status } };
    const data = await response.json();
    const parsed = extractJsonObject(data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text).join(""));
    return parsed ? { result: { provider: "openai", model: env.openaiDocumentModel, ...parsed } } : { error: { provider: "openai", model: env.openaiDocumentModel, status: 502 } };
  } catch (error) {
    return { error: { provider: "openai", model: env.openaiDocumentModel, status: 502, message: error instanceof Error ? error.message : "Eroare OpenAI" } };
  }
}

function geminiPrompt(payload, file) {
  const labels = patterns.map((item) => item.label).join(", ");
  return [
    "Analizezi un fișier real pentru admitere universitară.",
    "Răspunde exclusiv cu JSON valid: {\"label\":\"...\",\"confidence\":0.0,\"accepted\":false,\"readable\":true,\"evidence\":[\"...\"],\"explanation\":\"...\"}.",
    `Alege label din: ${labels}, Necunoscut.`,
    `Tip cerut: ${payload.expectedType}. Tip MIME real: ${file.inline.mimeType}.`,
    "Evaluează conținutul vizibil sau extras din fișier, nu numele lui. Nu accepta un document care nu poate fi citit, este de alt tip sau are indicii insuficiente.",
    "Un CV Europass/Erasmus poate fi acceptat doar dacă documentul arată clar secțiuni de profil, educație/experiență și competențe. Nu promite autenticitate juridică; clasifici doar tipul și lizibilitatea.",
    file.trustedText ? `Conținut citit direct din fișier:\n${file.trustedText}` : ""
  ].filter(Boolean).join("\n\n");
}

async function geminiClassifier(payload, file) {
  if (!env.geminiApiKey) return { skipped: true };
  const models = [...new Set([env.geminiDocumentModel, ...env.geminiFallbackModels].filter(Boolean))].slice(0, 3);
  let lastError = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const outcome = await fetchJson(url, {
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        maxOutputTokens: 800
      },
      contents: [{
        parts: [
          { text: geminiPrompt(payload, file) },
          { inlineData: { mimeType: file.inline.mimeType, data: file.inline.data } }
        ]
      }]
    }, {
      "x-goog-api-key": env.geminiApiKey
    });
    if (outcome.data) {
      const content = outcome.data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
      const parsed = extractJsonObject(content);
      if (parsed) return { result: { provider: "gemini", model, ...parsed } };
      lastError = { provider: "gemini", model, status: 502, message: "Gemini nu a respectat schema JSON." };
      break;
    }
    lastError = { provider: "gemini", model, ...outcome.error };
    // Only a missing model benefits from attempting the explicit stable fallback.
    if (outcome.error?.status !== 404) break;
  }
  if (lastError) console.warn("Gemini document analysis unavailable", { model: lastError.model, status: lastError.status });
  return { error: lastError || { provider: "gemini", model: env.geminiDocumentModel, status: 502 } };
}

export async function classifyDocument(payload) {
  const file = inspectFile(payload);
  if (file.result) return file.result;

  const normalizedPayload = {
    ...payload,
    mimeType: file.inline.mimeType,
    text: file.trustedText
  };

  // Gemini is preferred for documents because it receives PDFs and images inline.
  const geminiOutcome = await geminiClassifier(normalizedPayload, file);
  if (geminiOutcome.result) return normalizeRemoteResult(normalizedPayload, geminiOutcome.result);

  const openAiOutcome = await openAiClassifier(normalizedPayload, file);
  if (openAiOutcome.result) return normalizeRemoteResult(normalizedPayload, openAiOutcome.result);

  if (env.geminiApiKey || env.openaiApiKey) {
    const failed = geminiOutcome.error || openAiOutcome.error;
    return providerFailure(failed?.provider || "gemini", failed?.model || env.geminiDocumentModel);
  }

  return localClassifier(normalizedPayload);
}

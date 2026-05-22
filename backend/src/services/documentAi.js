import { env } from "../config/env.js";

const patterns = [
  { label: "Diplomă BAC", terms: ["diploma de bacalaureat", "diplomă de bacalaureat", "bacalaureat", "diplomă bac", "diploma bac", "diploma de absolvire"] },
  { label: "Foaie matricolă", terms: ["foaie matricola", "foaie matricolă", "situație școlară", "situatie scolara", "transcript", "matricol"] },
  { label: "CV Europass", terms: ["europass", "curriculum vitae", "experiență profesională", "experienta profesionala", "competențe", "competente"] },
  { label: "Scrisoare motivație", terms: ["scrisoare de motivatie", "scrisoare motivație", "motivation letter", "personal statement", "motivația candidaturii"] },
  { label: "Scrisori de recomandare", terms: ["recomandare", "recommendation letter", "letter of recommendation", "referință academică", "referinta academica"] },
  { label: "Certificat limbă", terms: ["ielts", "toefl", "cambridge", "language certificate", "certificat de competență lingvistică", "certificat de competenta lingvistica"] },
  { label: "Cazier judiciar", terms: ["cazier judiciar", "certificat de cazier", "criminal record"] },
  { label: "Adeverință medicală", terms: ["adeverință medicală", "adeverinta medicala", "apt medical", "medic de familie"] },
  { label: "Portofoliu", terms: ["portofoliu", "portfolio", "proiecte", "projects", "github", "lucrări", "lucrari"] }
];

const REMOTE_ACCEPTANCE_THRESHOLD = 0.68;
const LOCAL_MIN_TEXT_LENGTH = 45;
const LOCAL_MIN_MATCHES = 2;

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
      explanation: "Nu am suficient text real din document. Numele fișierului nu este acceptat ca dovadă; atașează OCR sau configurează Gemini pentru citirea PDF/imagine."
    };
  }

  const accepted = Boolean(
    best.expected
    && expectedScore?.label === best.label
    && expectedScore.textHits >= LOCAL_MIN_MATCHES
  );
  const confidence = best.textHits
    ? Math.min(0.91, 0.36 + best.textHits * 0.14 + (accepted ? 0.18 : 0))
    : 0.28;

  return {
    provider: "unitrack-document-classifier",
    label: best.textHits ? best.label : "Necunoscut",
    confidence,
    accepted,
    explanation: best.textHits
      ? accepted
        ? `Documentul pare să fie ${best.label}; am găsit ${best.textHits} indicii în conținut, nu doar în numele fișierului.`
        : `Documentul pare să fie ${best.label}, dar tipul cerut este ${expectedScore?.label || expectedType}.`
      : "Nu am găsit indicii clare; documentul rămâne de verificat manual."
  };
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  return Math.max(0, Math.min(1, numeric));
}

function normalizeRemoteResult(payload, remote) {
  const label = String(remote.label || "Necunoscut").trim() || "Necunoscut";
  const confidence = clampConfidence(remote.confidence);
  const labelMatchesExpected = expectedMatches(label, payload.expectedType);
  let accepted = Boolean(remote.accepted) && labelMatchesExpected && confidence >= REMOTE_ACCEPTANCE_THRESHOLD;
  let explanation = remote.explanation || "Clasificat cu provider AI extern.";

  if (remote.accepted && !labelMatchesExpected) {
    explanation = `AI-ul a detectat ${label}, nu ${payload.expectedType}. ${explanation}`;
  } else if (remote.accepted && confidence < REMOTE_ACCEPTANCE_THRESHOLD) {
    explanation = `Încrederea AI este prea mică pentru aprobare automată. ${explanation}`;
  }

  if (!accepted && remote.accepted) {
    explanation = `${explanation} Documentul rămâne respins până la verificare manuală.`;
  }

  return {
    provider: remote.provider,
    label,
    confidence,
    accepted,
    explanation
  };
}

function dataUrlParts(fileDataUrl = "") {
  const match = String(fileDataUrl).match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function openAiClassifier(payload) {
  if (!env.openaiApiKey) return null;
  const contentItems = [
    {
      type: "input_text",
      text: `Evaluează conținutul real al documentului pentru admitere. Nu folosi numele fișierului ca dovadă, doar ca metadată. Dacă documentul nu poate fi citit, este alt tip de act, este generic/neoficial sau conținutul nu susține clar tipul așteptat, răspunde accepted=false și confidence<=0.4.\nTip așteptat: ${payload.expectedType}\nNume fișier: ${payload.fileName}\nTip MIME: ${payload.mimeType || "necunoscut"}\nText extras:\n${payload.text || ""}`
    }
  ];
  if (payload.fileDataUrl && String(payload.mimeType || "").startsWith("image/")) {
    contentItems.push({ type: "input_image", image_url: payload.fileDataUrl });
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openaiDocumentModel,
      input: [
        {
          role: "system",
          content: "Răspunde doar JSON valid: {\"label\":\"...\",\"confidence\":0.0,\"accepted\":true,\"explanation\":\"...\"}. Verifici documente de admitere. Ești strict: nu aprobi pe baza numelui fișierului."
        },
        {
          role: "user",
          content: contentItems
        }
      ]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const responseContent = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text).join("") || "";
  try {
    const parsed = JSON.parse(responseContent);
    return { provider: "openai", ...parsed };
  } catch {
    return null;
  }
}

async function geminiClassifier(payload) {
  if (!env.geminiApiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiDocumentModel}:generateContent?key=${env.geminiApiKey}`;
  const parts = [{
    text: `Returnează doar JSON valid cu label, confidence, accepted, explanation. Evaluează conținutul real al fișierului/documentului pentru admitere. Nu folosi numele fișierului ca dovadă, doar ca metadată. Dacă documentul atașat nu poate fi citit, este alt document, nu este oficial sau nu susține clar tipul așteptat, accepted=false și confidence<=0.4. Tip așteptat: ${payload.expectedType}. Fișier: ${payload.fileName}. Tip MIME: ${payload.mimeType || "necunoscut"}. Text extras/OCR: ${payload.text || ""}`
  }];
  const inline = dataUrlParts(payload.fileDataUrl);
  if (inline) parts.push({ inline_data: { mime_type: inline.mimeType, data: inline.data } });
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts
      }]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim() || "";
  try {
    const parsed = JSON.parse(content);
    return { provider: "gemini", ...parsed };
  } catch {
    return null;
  }
}

export async function classifyDocument(payload) {
  const remoteConfigured = Boolean(env.openaiApiKey || env.geminiApiKey);
  const remote = await openAiClassifier(payload).catch(() => null) || await geminiClassifier(payload).catch(() => null);
  if (remote) {
    return normalizeRemoteResult(payload, remote);
  }
  if (remoteConfigured && /^data:(application\/pdf|image\/)/i.test(String(payload.fileDataUrl || ""))) {
    return {
      provider: "unitrack-document-classifier",
      label: "Necunoscut",
      confidence: 0.18,
      accepted: false,
      explanation: "AI-ul extern nu a putut citi fișierul atașat, deci documentul nu este aprobat automat. Verifică cheia API sau aprobă manual din workspace-ul universității."
    };
  }
  return localClassifier(payload);
}

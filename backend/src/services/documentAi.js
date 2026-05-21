import { env } from "../config/env.js";

const patterns = [
  { label: "Diplomă BAC", terms: ["diploma de bacalaureat", "diplomă de bacalaureat", "bacalaureat", "diplomă bac", "diploma bac", "diploma de absolvire"] },
  { label: "Foaie matricolă", terms: ["foaie matricola", "foaie matricolă", "situație școlară", "situatie scolara", "transcript", "matricol"] },
  { label: "CV Europass", terms: ["europass", "curriculum vitae", "experiență profesională", "experienta profesionala", "competențe", "competente"] },
  { label: "Scrisoare motivație", terms: ["scrisoare de motivatie", "scrisoare motivație", "motivation letter", "personal statement", "motivația candidaturii"] },
  { label: "Scrisori de recomandare", terms: ["recomandare", "recommendation letter", "letter of recommendation", "referință academică", "referinta academica"] },
  { label: "Certificat limbă", terms: ["ielts", "toefl", "cambridge", "language certificate", "certificat de competență lingvistică", "certificat de competenta lingvistica"] },
  { label: "Cazier judiciar", terms: ["cazier judiciar", "certificat de cazier", "criminal record"] },
  { label: "Adeverință medicală", terms: ["adeverință medicală", "adeverinta medicala", "apt medical", "medic de familie"] }
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function expectedMatches(label, expectedType) {
  const expected = normalize(expectedType);
  const current = normalize(label);
  const pattern = patterns.find((item) => item.label === label);
  return current.includes(expected)
    || expected.includes(current)
    || pattern?.terms.some((term) => expected.includes(normalize(term)));
}

function localClassifier({ expectedType, fileName, text }) {
  const haystack = normalize(`${fileName} ${text}`);
  const scores = patterns.map((item) => ({
    label: item.label,
    hits: item.terms.filter((term) => haystack.includes(normalize(term))).length,
    expected: expectedMatches(item.label, expectedType)
  }));
  const best = scores.sort((a, b) => b.hits - a.hits)[0] || { label: "Necunoscut", hits: 0 };
  const expectedScore = scores.find((item) => item.expected);
  const accepted = Boolean(best.hits > 0 && best.expected);
  const confidence = best.hits
    ? Math.min(0.98, 0.54 + best.hits * 0.16 + (best.expected ? 0.16 : 0))
    : 0.34;

  return {
    provider: "unitrack-document-classifier",
    label: best.hits ? best.label : expectedType,
    confidence,
    accepted,
    explanation: best.hits
      ? accepted
        ? `Documentul pare să fie ${best.label}; am găsit ${best.hits} indicii compatibile cu tipul cerut.`
        : `Documentul pare să fie ${best.label}, dar tipul cerut este ${expectedScore?.label || expectedType}.`
      : "Nu am găsit indicii clare; documentul rămâne de verificat manual."
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
      text: `Tip așteptat: ${payload.expectedType}\nNume fișier: ${payload.fileName}\nTip MIME: ${payload.mimeType || "necunoscut"}\nText extras:\n${payload.text || ""}`
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
          content: "Răspunde doar JSON valid: {\"label\":\"...\",\"confidence\":0.0,\"accepted\":true,\"explanation\":\"...\"}. Verifici documente de admitere."
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
    text: `Returnează doar JSON valid cu label, confidence, accepted, explanation. Tip așteptat: ${payload.expectedType}. Fișier: ${payload.fileName}. Tip MIME: ${payload.mimeType || "necunoscut"}. Text extras: ${payload.text || ""}`
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
  const remote = await openAiClassifier(payload).catch(() => null) || await geminiClassifier(payload).catch(() => null);
  if (remote) {
    return {
      provider: remote.provider,
      label: remote.label || payload.expectedType,
      confidence: Number(remote.confidence) || 0.5,
      accepted: Boolean(remote.accepted),
      explanation: remote.explanation || "Clasificat cu provider AI extern."
    };
  }
  return localClassifier(payload);
}

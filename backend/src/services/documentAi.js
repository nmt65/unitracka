import { env } from "../config/env.js";

const patterns = [
  { label: "Diplomă BAC", terms: ["diploma de bacalaureat", "bacalaureat", "diplomă bac", "diploma bac"] },
  { label: "Foaie matricolă", terms: ["foaie matricola", "foaie matricolă", "situație școlară", "situatie scolara", "matricol"] },
  { label: "CV Europass", terms: ["europass", "curriculum vitae", "experiență profesională", "experienta profesionala"] },
  { label: "Scrisoare motivație", terms: ["scrisoare de motivatie", "scrisoare motivație", "motivation letter", "personal statement"] },
  { label: "Scrisori de recomandare", terms: ["recomandare", "recommendation letter", "letter of recommendation"] },
  { label: "Certificat limbă", terms: ["ielts", "toefl", "cambridge", "language certificate", "certificat de competență lingvistică"] },
  { label: "Cazier judiciar", terms: ["cazier judiciar", "certificat de cazier"] },
  { label: "Adeverință medicală", terms: ["adeverință medicală", "adeverinta medicala", "apt medical"] }
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function localClassifier({ expectedType, fileName, text }) {
  const haystack = normalize(`${fileName} ${text}`);
  const scores = patterns.map((item) => ({
    label: item.label,
    hits: item.terms.filter((term) => haystack.includes(normalize(term))).length
  }));
  const best = scores.sort((a, b) => b.hits - a.hits)[0] || { label: "Necunoscut", hits: 0 };
  const expected = normalize(expectedType);
  const bestMatchesExpected = normalize(best.label).includes(expected) || expected.includes(normalize(best.label)) || best.hits > 0 && patterns
    .find((item) => item.label === best.label)
    ?.terms.some((term) => expected.includes(normalize(term)));

  return {
    provider: "local-yolo-style",
    label: best.hits ? best.label : expectedType,
    confidence: best.hits ? Math.min(0.98, 0.58 + best.hits * 0.18) : 0.42,
    accepted: Boolean(bestMatchesExpected || haystack.includes(expected)),
    explanation: best.hits
      ? `Clasificare locală pe cuvinte-cheie: ${best.label}, ${best.hits} indicii găsite.`
      : "Nu am găsit indicii clare; documentul rămâne de verificat manual."
  };
}

async function openAiClassifier(payload) {
  if (!env.openaiApiKey) return null;
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
          content: `Tip așteptat: ${payload.expectedType}\nNume fișier: ${payload.fileName}\nText extras:\n${payload.text || ""}`
        }
      ]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text).join("") || "";
  try {
    const parsed = JSON.parse(content);
    return { provider: "openai", ...parsed };
  } catch {
    return null;
  }
}

async function geminiClassifier(payload) {
  if (!env.geminiApiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiDocumentModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Returnează doar JSON valid cu label, confidence, accepted, explanation. Tip așteptat: ${payload.expectedType}. Fișier: ${payload.fileName}. Text: ${payload.text || ""}`
        }]
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

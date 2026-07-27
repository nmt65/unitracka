import { env } from "../config/env.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function completedRatio(documents = []) {
  if (!documents.length) return 0;
  return documents.filter((doc) => doc.isCompleted || doc.verificationStatus === "verified").length / documents.length;
}

function hasVerified(documents = [], pattern) {
  const regex = new RegExp(pattern, "i");
  return documents.some((doc) => regex.test(doc.name) && (doc.isCompleted || doc.verificationStatus === "verified"));
}

function preferenceLabels(payload = {}) {
  const strategy = {
    safe: "strategie defensivă, cu accent pe aplicații unde profilul este peste prag",
    balanced: "strategie echilibrată, cu un mix de opțiuni realiste și opțiuni ambițioase",
    ambitious: "strategie ambițioasă, cu accent pe programe competitive și portofoliu puternic"
  };
  const budget = {
    low: "buget redus, prioritate pentru taxe mici sau burse",
    medium: "buget mediu, echilibru între costuri și oportunități",
    flexible: "buget flexibil, prioritate pentru potrivire academică"
  };
  const mobility = {
    local: "aproape de orașul actual",
    romania: "România",
    europe: "Europa",
    global: "opțiuni internaționale"
  };
  return {
    strategy: strategy[payload.strategyGoal] || strategy.balanced,
    budget: budget[payload.budgetPreference] || budget.medium,
    mobility: mobility[payload.mobilityPreference] || mobility.europe,
    weeks: Number(payload.timelineWeeks || 6)
  };
}

function buildStrategy(payload, result = {}) {
  const preferences = preferenceLabels(payload);
  const chance = Number(result.admissionChance || 0);
  const documents = payload.documents || [];
  const missingCount = documents.filter((doc) => !(doc.isCompleted || doc.verificationStatus === "verified")).length;
  const posture = payload.strategyGoal === "safe"
    ? "Aplică întâi la programele unde dosarul este aproape complet și cerințele sunt clare."
    : payload.strategyGoal === "ambitious"
      ? "Păstrează 1-2 opțiuni foarte competitive, dar susține-le cu dovezi academice și portofoliu."
      : "Țintește un mix realist: o opțiune sigură, două potrivite și una ambițioasă.";
  const urgency = chance >= 72
    ? "Profilul pare pregătit; câștigul vine din rafinarea CV-ului și verificarea documentelor."
    : chance >= 45
      ? "Profilul poate deveni competitiv dacă închizi rapid documentele lipsă și personalizezi motivația."
      : "Prioritatea este credibilitatea dosarului: documente oficiale, rezultate verificabile și un CV concret.";
  return {
    posture,
    preferenceSummary: `${preferences.strategy}; ${preferences.budget}; mobilitate: ${preferences.mobility}.`,
    next7Days: [
      missingCount ? `Închide minimum ${Math.min(3, missingCount)} documente lipsă sau cere validare manuală unde AI-ul nu este sigur.` : "Revizuiește documentele aprobate și verifică dacă numele fișierelor sunt clare.",
      "Adaugă în CV linkuri și rezultate măsurabile: proiect, rol, tehnologii, impact.",
      "Scrie o versiune de motivație pentru programul selectat, nu un text general."
    ],
    next30Days: [
      "Compară cel puțin 4 programe după cost, deadline, limbă, cerințe și potrivire cu obiectivul.",
      "Pregătește o variantă scurtă de portofoliu: 2-3 proiecte cu capturi, repo sau descriere verificabilă.",
      `Planifică pașii pe ${preferences.weeks} săptămâni și lasă 3 zile tampon înainte de fiecare deadline.`
    ],
    decisionRule: urgency
  };
}

function heuristicAdvisor(payload) {
  const profile = payload.profile || {};
  const documents = payload.documents || [];
  const bac = Number(profile.bacAverage || 0);
  const docRatio = completedRatio(documents);
  const languageEvidence = hasVerified(documents, "limb|ielts|toefl|cambridge");
  const academicEvidence = hasVerified(documents, "bac|matricol");
  const cvText = String(payload.cvText || "");
  const cvSignals = [
    /proiect|project|github|portofoliu/i.test(cvText),
    /olimpiad|concurs|premiu|award/i.test(cvText),
    /voluntar|leadership|echip/i.test(cvText),
    /python|javascript|react|machine learning|ai|c\+\+|java/i.test(cvText),
    cvText.length > 450
  ].filter(Boolean).length;

  const cvScore = clamp(35 + cvSignals * 11 + (profile.interests?.length ? 7 : 0), 20, 98);
  const applicationScore = clamp(25 + docRatio * 45 + (academicEvidence ? 12 : 0) + (languageEvidence ? 8 : 0), 15, 98);
  const strategyAdjustment = payload.strategyGoal === "safe" ? 4 : payload.strategyGoal === "ambitious" ? -6 : 0;
  const budgetAdjustment = payload.budgetPreference === "low" ? -2 : 0;
  const admissionChance = clamp(18 + bac * 5.2 + docRatio * 20 + cvSignals * 3 + (languageEvidence ? 5 : 0) + strategyAdjustment + budgetAdjustment, 5, 94);
  const targetName = payload.target?.name || payload.target?.Institution?.name || "universitatea selectată";
  const result = {
    provider: "unitrack-advisor",
    targetName,
    admissionChance: Math.round(admissionChance),
    cvScore: Math.round(cvScore),
    applicationScore: Math.round(applicationScore),
    summary: `Profilul este ${admissionChance >= 70 ? "competitiv" : admissionChance >= 45 ? "promițător, dar perfectibil" : "la început și are nevoie de dovezi mai solide"} pentru ${targetName}. Estimarea nu înlocuiește decizia oficială a universității.`
  };

  return {
    ...result,
    strengths: [
      academicEvidence ? "Rezultatele academice sunt susținute de documente verificate." : "Ai început profilul academic, dar încă lipsește dovada verificată.",
      cvSignals >= 3 ? "CV-ul are indicii bune de proiecte, competențe sau activități relevante." : "CV-ul poate deveni mai convingător cu proiecte, premii sau activități concrete.",
      docRatio >= 0.7 ? "Dosarul este aproape complet." : "Checklist-ul de documente încă poate fi îmbunătățit."
    ],
    risks: [
      !academicEvidence ? "Nu introducem media BAC ca avantaj până nu există diplomă/foaie matricolă verificată." : null,
      !languageEvidence ? "Pentru programe internaționale, certificatul de limbă poate crește șansele." : null,
      docRatio < 0.5 ? "Documentele lipsă pot bloca evaluarea dosarului." : null
    ].filter(Boolean),
    nextSteps: [
      "Încarcă și verifică documentele obligatorii înainte de deadline.",
      "Adaugă în CV proiecte măsurabile: link GitHub, tehnologii, rolul tău și rezultatul.",
      "Scrie o motivație adaptată programului, nu una generică."
    ],
    strategy: buildStrategy(payload, result)
  };
}

async function openAiAdvisor(payload) {
  if (!env.openaiApiKey) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openaiAdvisorModel,
      input: [
        {
          role: "system",
          content: "Ești consilier de admitere. Răspunde doar JSON valid cu: provider,targetName,admissionChance,cvScore,applicationScore,summary,strengths,risks,nextSteps,strategy. strategy are posture,preferenceSummary,next7Days,next30Days,decisionRule. Nu promite admitere sigură."
        },
        {
          role: "user",
          content: JSON.stringify(payload).slice(0, 18000)
        }
      ]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text).join("") || "";
  try {
    return { provider: "openai", ...JSON.parse(content) };
  } catch {
    return null;
  }
}

async function geminiAdvisor(payload) {
  if (!env.geminiApiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiAdvisorModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json"
      },
      contents: [{
        parts: [{
          text: `Ești consilier de admitere. Răspunde doar JSON valid cu provider,targetName,admissionChance,cvScore,applicationScore,summary,strengths,risks,nextSteps,strategy. strategy are posture, preferenceSummary, next7Days, next30Days, decisionRule. Nu promite admitere sigură. Date: ${JSON.stringify(payload).slice(0, 18000)}`
        }]
      }]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim() || "";
  try {
    return { provider: "gemini", ...JSON.parse(content) };
  } catch {
    return null;
  }
}

export async function adviseStudent(payload) {
  const remote = await openAiAdvisor(payload).catch(() => null) || await geminiAdvisor(payload).catch(() => null);
  const result = remote || heuristicAdvisor(payload);
  const strategy = result.strategy && typeof result.strategy === "object" ? result.strategy : buildStrategy(payload, result);
  return {
    ...result,
    admissionChance: clamp(Number(result.admissionChance) || 0, 0, 100),
    cvScore: clamp(Number(result.cvScore) || 0, 0, 100),
    applicationScore: clamp(Number(result.applicationScore) || 0, 0, 100),
    strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : [],
    risks: Array.isArray(result.risks) ? result.risks.slice(0, 5) : [],
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.slice(0, 5) : [],
    strategy: {
      posture: String(strategy.posture || ""),
      preferenceSummary: String(strategy.preferenceSummary || ""),
      next7Days: Array.isArray(strategy.next7Days) ? strategy.next7Days.slice(0, 4) : [],
      next30Days: Array.isArray(strategy.next30Days) ? strategy.next30Days.slice(0, 4) : [],
      decisionRule: String(strategy.decisionRule || "")
    }
  };
}

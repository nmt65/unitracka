import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Globe2, Route, ShieldCheck, Sparkles, Target, Wallet } from "lucide-react";
import { api } from "../services/api.js";

const strategyOptions = [
  { value: "balanced", label: "Echilibrat", hint: "mix de opțiuni sigure și ambițioase" },
  { value: "safe", label: "Sigur", hint: "prioritate pentru dosare cu șanse mari" },
  { value: "ambitious", label: "Ambițios", hint: "ținte mai competitive, cu plan mai dur" }
];

const budgetOptions = [
  { value: "medium", label: "Mediu", hint: "costuri controlate, flexibilitate bună" },
  { value: "low", label: "Redus", hint: "burse, taxe mici, România/EU first" },
  { value: "flexible", label: "Flexibil", hint: "potrivirea academică contează cel mai mult" }
];

const mobilityOptions = [
  { value: "europe", label: "Europa", hint: "opțiuni RO + UE" },
  { value: "romania", label: "România", hint: "universități românești" },
  { value: "global", label: "Global", hint: "incluzi și programe internaționale" },
  { value: "local", label: "Aproape", hint: "mai puțină relocare" }
];

function Score({ label, value }) {
  return (
    <article className="advisor-score">
      <strong>{Math.round(value || 0)}%</strong>
      <span>{label}</span>
    </article>
  );
}

function OptionButton({ active, icon: Icon, label, hint, onClick }) {
  return (
    <button className={`advisor-option ${active ? "active" : ""}`} type="button" onClick={onClick}>
      <Icon size={16} />
      <strong>{label}</strong>
      <small>{hint}</small>
    </button>
  );
}

function bulletList(items = []) {
  return items.map((item) => <p key={item}><CheckCircle2 size={14} /> {item}</p>);
}

function targetKey(kind, id) {
  return id ? `${kind}:${id}` : "";
}

function splitTargetKey(value = "") {
  const [kind, id] = value.split(":");
  return { kind, id };
}

export function StudentAdvisor({ universities = [], onToast }) {
  const [institutions, setInstitutions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({
    targetKey: "",
    cvText: "",
    personalGoal: "",
    strategyGoal: "balanced",
    budgetPreference: "medium",
    mobilityPreference: "europe",
    timelineWeeks: 6
  });
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.publicInstitutions(), api.myApplications()])
      .then(([institutionData, appData]) => {
        const nextInstitutions = institutionData.institutions || [];
        const nextApplications = appData.applications || [];
        setInstitutions(nextInstitutions);
        setApplications(nextApplications);
        setForm((current) => ({
          ...current,
          targetKey: current.targetKey
            || targetKey("application", nextApplications[0]?.id)
            || targetKey("institution", nextInstitutions[0]?.id)
        }));
      })
      .catch((error) => onToast(error.message));
  }, []);

  const targets = useMemo(() => {
    const appTargets = applications.map((app) => ({
      key: targetKey("application", app.id),
      group: "Aplicații trimise",
      label: `${app.Institution?.name || "Universitate"} · ${app.program}`,
      meta: app.faculty || app.programType || "Dosar trimis"
    }));
    const trackerTargets = universities.map((uni) => ({
      key: targetKey("university", uni.id),
      group: "Tracker personal",
      label: `${uni.name} · ${uni.program}`,
      meta: uni.faculty || uni.country || "În tracker"
    }));
    const institutionTargets = institutions.map((institution) => ({
      key: targetKey("institution", institution.id),
      group: "Catalog public",
      label: institution.name,
      meta: institution.offerSummary || institution.country || "Catalog activ"
    }));
    return [...appTargets, ...trackerTargets, ...institutionTargets];
  }, [applications, institutions, universities]);

  const selectedTarget = targets.find((item) => item.key === form.targetKey) || targets[0] || null;

  const readiness = useMemo(() => {
    const documents = applications.flatMap((app) => app.documents || []);
    const verified = documents.filter((doc) => doc.isCompleted || doc.verificationStatus === "verified").length;
    return {
      applications: applications.length,
      universities: universities.length,
      verified,
      documents: documents.length,
      ratio: documents.length ? Math.round((verified / documents.length) * 100) : 0
    };
  }, [applications, universities]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function setChoice(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const target = splitTargetKey(form.targetKey);
    setLoading(true);
    try {
      const payload = {
        cvText: form.cvText,
        personalGoal: form.personalGoal,
        strategyGoal: form.strategyGoal,
        budgetPreference: form.budgetPreference,
        mobilityPreference: form.mobilityPreference,
        timelineWeeks: form.timelineWeeks,
        applicationId: target.kind === "application" ? target.id : undefined,
        universityId: target.kind === "university" ? target.id : undefined,
        institutionId: target.kind === "institution" ? target.id : undefined
      };
      const data = await api.studentAdvisor(payload);
      setAdvice(data.advice);
      onToast("Asistentul a analizat profilul.");
    } catch (error) {
      onToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="unitrack-page advisor-page">
      <div className="page-heading">
        <div>
          <h1>Asistent dosar</h1>
          <p>Primești strategie, riscuri și pași concreți pentru aplicațiile tale.</p>
        </div>
      </div>

      <section className="advisor-hero profile-panel">
        <div>
          <span className="hero-kicker"><Sparkles size={15} /> Strategy studio</span>
          <h2>Construiește un plan de admitere, nu doar un scor.</h2>
          <p>Alege ținta, bugetul și nivelul de ambiție. AI-ul folosește documentele verificate și aplicațiile reale, iar fallback-ul local rămâne strict când API-ul nu răspunde.</p>
        </div>
        <div className="advisor-readiness">
          <strong>{readiness.ratio}%</strong>
          <span>dosar verificat</span>
          <small>{readiness.verified}/{readiness.documents || 0} documente · {readiness.applications} aplicații</small>
        </div>
      </section>

      <div className="admin-grid advisor-layout">
        <form className="profile-panel admin-form advisor-form" onSubmit={submit}>
          <h2><ClipboardList size={17} /> Analiză profil</h2>
          <div className="profile-form">
            <label className="wide">
              Ținta analizei
              <select name="targetKey" value={form.targetKey} onChange={updateField}>
                {!targets.length && <option value="">Nu există încă universități</option>}
                {targets.map((target) => (
                  <option key={target.key} value={target.key}>{target.group} · {target.label}</option>
                ))}
              </select>
            </label>
            {selectedTarget && (
              <div className="advisor-target-card wide">
                <Target size={18} />
                <div>
                  <strong>{selectedTarget.label}</strong>
                  <span>{selectedTarget.meta}</span>
                </div>
              </div>
            )}
            <label className="wide">
              Obiectiv personal
              <input name="personalGoal" value={form.personalGoal} onChange={updateField} placeholder="ex. informatică în Europa, buget controlat, bursă" />
            </label>
            <label className="wide">
              CV / experiență
              <textarea
                name="cvText"
                value={form.cvText}
                onChange={updateField}
                rows="7"
                placeholder="Proiecte, concursuri, GitHub, voluntariat, tehnologii, rezultate..."
              />
            </label>
          </div>

          <div className="advisor-choice-block">
            <span>Strategie</span>
            <div className="advisor-option-grid">
              {strategyOptions.map((item) => (
                <OptionButton
                  key={item.value}
                  active={form.strategyGoal === item.value}
                  icon={ShieldCheck}
                  label={item.label}
                  hint={item.hint}
                  onClick={() => setChoice("strategyGoal", item.value)}
                />
              ))}
            </div>
          </div>

          <div className="advisor-choice-row">
            <div className="advisor-choice-block">
              <span>Buget</span>
              <div className="advisor-option-grid compact">
                {budgetOptions.map((item) => (
                  <OptionButton
                    key={item.value}
                    active={form.budgetPreference === item.value}
                    icon={Wallet}
                    label={item.label}
                    hint={item.hint}
                    onClick={() => setChoice("budgetPreference", item.value)}
                  />
                ))}
              </div>
            </div>
            <div className="advisor-choice-block">
              <span>Mobilitate</span>
              <div className="advisor-option-grid compact">
                {mobilityOptions.map((item) => (
                  <OptionButton
                    key={item.value}
                    active={form.mobilityPreference === item.value}
                    icon={Globe2}
                    label={item.label}
                    hint={item.hint}
                    onClick={() => setChoice("mobilityPreference", item.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <label className="advisor-range">
            <span>Plan pe {form.timelineWeeks} săptămâni</span>
            <input name="timelineWeeks" type="range" min="1" max="24" value={form.timelineWeeks} onChange={updateField} />
          </label>

          <div className="profile-actions">
            <button className="primary-button" disabled={loading || !form.targetKey}>
              <Sparkles size={17} /> {loading ? "Analizez..." : "Generează strategia"}
            </button>
          </div>
        </form>

        <section className="profile-panel advisor-output">
          <h2><Sparkles size={17} /> Rezultat</h2>
          {!advice ? (
            <div className="advisor-empty">
              <Route size={28} />
              <strong>Alege o țintă și generează planul.</strong>
              <p>Scorurile sunt orientative. Pentru credibilitate, media BAC, certificatele și documentele trebuie susținute de fișiere verificate.</p>
            </div>
          ) : (
            <>
              <div className="advisor-scores">
                <Score label="Șansă admitere" value={advice.admissionChance} />
                <Score label="CV" value={advice.cvScore} />
                <Score label="Dosar" value={advice.applicationScore} />
              </div>
              <p className="advisor-summary"><strong>{advice.targetName}</strong><br />{advice.summary}</p>
              {advice.strategy && (
                <div className="advisor-strategy-panel">
                  <h3>Strategie recomandată</h3>
                  <p>{advice.strategy.posture}</p>
                  <small>{advice.strategy.preferenceSummary}</small>
                  <strong>{advice.strategy.decisionRule}</strong>
                </div>
              )}
              <div className="advisor-plan-grid">
                <article>
                  <h3>Următoarele 7 zile</h3>
                  {bulletList(advice.strategy?.next7Days || advice.nextSteps || [])}
                </article>
                <article>
                  <h3>Următoarele 30 zile</h3>
                  {bulletList(advice.strategy?.next30Days || advice.nextSteps || [])}
                </article>
              </div>
              <div className="advisor-lists">
                <div>
                  <h3>Puncte tari</h3>
                  {(advice.strengths || []).map((item) => <p key={item}>{item}</p>)}
                </div>
                <div>
                  <h3>Riscuri</h3>
                  {(advice.risks || []).map((item) => <p key={item}>{item}</p>)}
                </div>
                <div>
                  <h3>Pași următori</h3>
                  {(advice.nextSteps || []).map((item) => <p key={item}>{item}</p>)}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

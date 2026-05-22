import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Sparkles } from "lucide-react";
import { api } from "../services/api.js";

function Score({ label, value }) {
  return (
    <article className="advisor-score">
      <strong>{Math.round(value || 0)}%</strong>
      <span>{label}</span>
    </article>
  );
}

export function StudentAdvisor({ universities = [], onToast }) {
  const [institutions, setInstitutions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({ institutionId: "", applicationId: "", universityId: "", cvText: "", personalGoal: "" });
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.publicInstitutions(), api.myApplications()])
      .then(([institutionData, appData]) => {
        setInstitutions(institutionData.institutions || []);
        setApplications(appData.applications || []);
        setForm((current) => ({
          ...current,
          institutionId: current.institutionId || institutionData.institutions?.[0]?.id || "",
          applicationId: current.applicationId || appData.applications?.[0]?.id || ""
        }));
      })
      .catch((error) => onToast(error.message));
  }, []);

  const targetOptions = useMemo(() => ({
    institutions,
    applications,
    universities
  }), [institutions, applications, universities]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        cvText: form.cvText,
        personalGoal: form.personalGoal,
        institutionId: form.applicationId || form.universityId ? undefined : form.institutionId,
        applicationId: form.applicationId || undefined,
        universityId: form.universityId || undefined
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
          <p>Primești scoruri orientative pentru CV, aplicație și potrivirea cu universitatea.</p>
        </div>
      </div>

      <div className="admin-grid">
        <form className="profile-panel admin-form" onSubmit={submit}>
          <h2><ClipboardList size={17} /> Analiză profil</h2>
          <div className="profile-form">
            <label>
              Aplicație trimisă
              <select name="applicationId" value={form.applicationId} onChange={updateField}>
                <option value="">Fără aplicație selectată</option>
                {targetOptions.applications.map((app) => (
                  <option key={app.id} value={app.id}>{app.Institution?.name} · {app.program}</option>
                ))}
              </select>
            </label>
            <label>
              Universitate din tracker
              <select name="universityId" value={form.universityId} onChange={updateField}>
                <option value="">Fără universitate din tracker</option>
                {targetOptions.universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>{uni.name} · {uni.program}</option>
                ))}
              </select>
            </label>
            <label>
              Universitate publică
              <select name="institutionId" value={form.institutionId} onChange={updateField}>
                {targetOptions.institutions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              Obiectiv personal
              <input name="personalGoal" value={form.personalGoal} onChange={updateField} placeholder="ex. vreau informatică în Europa" />
            </label>
            <label className="wide">
              CV / experiență
              <textarea
                name="cvText"
                value={form.cvText}
                onChange={updateField}
                rows="8"
                placeholder="Proiecte, concursuri, GitHub, voluntariat, tehnologii, rezultate..."
              />
            </label>
          </div>
          <div className="profile-actions">
            <button className="primary-button" disabled={loading}><Sparkles size={17} /> {loading ? "Analizez..." : "Analizează șansele"}</button>
          </div>
        </form>

        <section className="profile-panel advisor-output">
          <h2><Sparkles size={17} /> Rezultat</h2>
          {!advice ? (
            <p className="muted">Completează CV-ul sau alege o aplicație ca să primești o estimare realistă. Verdictul final rămâne la universitate.</p>
          ) : (
            <>
              <div className="advisor-scores">
                <Score label="Șansă admitere" value={advice.admissionChance} />
                <Score label="CV" value={advice.cvScore} />
                <Score label="Dosar" value={advice.applicationScore} />
              </div>
              <p className="advisor-summary"><strong>{advice.targetName}</strong><br />{advice.summary}</p>
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

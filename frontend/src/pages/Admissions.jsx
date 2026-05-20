import { useEffect, useMemo, useState } from "react";
import { Brain, CheckCircle2, Circle, FileText, Plus, Send, Upload } from "lucide-react";
import { api } from "../services/api.js";

const statusLabels = {
  submitted: "Trimisă",
  under_review: "În evaluare",
  accepted: "Acceptată",
  rejected: "Respinsă",
  waitlist: "Waitlist"
};

const documentStatusLabels = {
  missing: "Lipsă",
  pending: "În verificare",
  verified: "Verificat",
  rejected: "Respins"
};

const documentHints = [
  ["Diplomă BAC", ["bac", "bacalaureat", "diploma", "diplomă"]],
  ["Foaie matricolă", ["foaie", "matricola", "matricolă", "transcript"]],
  ["CV Europass", ["cv", "europass"]],
  ["Scrisoare motivație", ["motivatie", "motivație", "motivation"]],
  ["Scrisori de recomandare", ["recomandare", "recommendation"]],
  ["Certificat limbă", ["ielts", "toefl", "cambridge", "limba", "language"]],
  ["Cazier judiciar", ["cazier", "criminal"]],
  ["Adeverință medicală", ["medical", "adeverinta", "adeverință"]]
];

function inferExpectedType(fileName, text) {
  const haystack = `${fileName} ${text || ""}`.toLowerCase();
  return documentHints.find(([, terms]) => terms.some((term) => haystack.includes(term)))?.[0] || "";
}

export function Admissions({ onToast }) {
  const [institutions, setInstitutions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({ institutionId: "", program: "Informatică", faculty: "Facultatea de Matematică și Informatică", programType: "licenta", admissionScore: "9.75", notes: "" });
  const [aiForm, setAiForm] = useState({ documentId: "", expectedType: "Diplomă BAC", fileName: "diploma_bac.pdf", mimeType: "application/pdf", text: "Diplomă de bacalaureat, absolvent, medie BAC" });
  const [aiResult, setAiResult] = useState(null);
  const [customDocs, setCustomDocs] = useState({});
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  async function load() {
    const [institutionData, appData] = await Promise.all([api.publicInstitutions(), api.myApplications()]);
    setInstitutions(institutionData.institutions || []);
    setApplications(appData.applications || []);
    setForm((current) => ({ ...current, institutionId: current.institutionId || institutionData.institutions?.[0]?.id || "" }));
    const firstDoc = appData.applications?.flatMap((app) => app.documents || [])?.[0];
    if (firstDoc) setAiForm((current) => ({ ...current, documentId: current.documentId || firstDoc.id, expectedType: firstDoc.name }));
  }

  useEffect(() => {
    load().catch((error) => onToast(error.message));
  }, []);

  const allDocs = useMemo(() => applications.flatMap((app) => (app.documents || []).map((doc) => ({ ...doc, appName: app.Institution?.name }))), [applications]);
  const duplicateApplication = useMemo(() => applications.some((app) => (
    app.InstitutionId === form.institutionId
    && app.program?.toLowerCase() === form.program.toLowerCase()
  )), [applications, form.institutionId, form.program]);

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateAi(event) {
    setAiForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleDocumentFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const canReadText = file.type.startsWith("text/") || /\.(txt|csv|json|xml)$/i.test(file.name);
    const text = canReadText ? await file.text() : aiForm.text;
    const detectedType = inferExpectedType(file.name, text);
    setAiForm((current) => ({
      ...current,
      expectedType: detectedType || current.expectedType,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      text
    }));
    onToast(canReadText ? "Fișier citit local pentru verificare." : "Fișier atașat; completează textul OCR/extras pentru verificare AI.");
  }

  async function submitApplication(event) {
    event.preventDefault();
    if (duplicateApplication) {
      onToast("Ai deja o aplicație pentru această universitate și acest program.");
      return;
    }
    setSending(true);
    try {
      await api.createApplication({ ...form, admissionScore: Number(form.admissionScore) });
      onToast("Aplicația a fost trimisă către universitate.");
      await load();
    } catch (error) {
      onToast(error.message);
    } finally {
      setSending(false);
    }
  }

  async function checkDocument(event) {
    event.preventDefault();
    if (!aiForm.documentId) {
      onToast("Trimite întâi o aplicație ca să ai documente de verificat.");
      return;
    }
    setChecking(true);
    try {
      const data = await api.checkDocumentAi(aiForm);
      setAiResult(data.result);
      onToast(data.result.accepted ? "Document verificat și marcat în sistem." : "Document respins de verificarea AI.");
      await load();
    } catch (error) {
      onToast(error.message);
    } finally {
      setChecking(false);
    }
  }

  async function addApplicationDocument(event, applicationId) {
    event.preventDefault();
    const name = customDocs[applicationId]?.trim();
    if (!name) return;
    try {
      const data = await api.createApplicationDocument(applicationId, { name, category: "Custom", isOptional: false });
      setCustomDocs((current) => ({ ...current, [applicationId]: "" }));
      setAiForm((current) => ({ ...current, documentId: data.document.id, expectedType: data.document.name }));
      onToast("Document adăugat în dosarul aplicației.");
      await load();
    } catch (error) {
      onToast(error.message);
    }
  }

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Admitere</h1>
          <p>Trimite aplicații către universități și verifică documentele cu AI înainte de evaluare.</p>
        </div>
      </div>
      <div className="admin-grid">
        <form className="profile-panel admin-form" onSubmit={submitApplication}>
          <h2><Send size={17} /> Trimite aplicație</h2>
          <div className="profile-form">
            <label>Universitate<select name="institutionId" value={form.institutionId} onChange={updateForm}>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Program<input name="program" value={form.program} onChange={updateForm} required /></label>
            <label>Facultate<input name="faculty" value={form.faculty} onChange={updateForm} /></label>
            <label>Tip<select name="programType" value={form.programType} onChange={updateForm}><option value="licenta">Licență</option><option value="master">Master</option><option value="doctorat">Doctorat</option></select></label>
            <label>Scor admitere<input name="admissionScore" type="number" min="0" max="10" step="0.01" value={form.admissionScore} onChange={updateForm} /></label>
            <label className="wide">Note<textarea name="notes" value={form.notes} onChange={updateForm} /></label>
          </div>
          {duplicateApplication && <p className="form-error">Există deja o aplicație pe aceeași universitate și program.</p>}
          <div className="profile-actions"><button className="primary-button" disabled={sending || !form.institutionId || duplicateApplication}>{sending ? "Se trimite..." : "Trimite către universitate"}</button></div>
        </form>
        <form className="profile-panel admin-form" onSubmit={checkDocument}>
          <h2><Brain size={17} /> Verificare document cu AI</h2>
          <div className="profile-form">
            <label>Document<select name="documentId" value={aiForm.documentId} onChange={updateAi} disabled={allDocs.length === 0}>{allDocs.map((doc) => <option key={doc.id} value={doc.id}>{doc.name} · {doc.appName}</option>)}</select></label>
            <label>Tip așteptat<input name="expectedType" value={aiForm.expectedType} onChange={updateAi} /></label>
            <label className="wide">Atașează fișier
              <span className="file-control"><Upload size={17} /><input type="file" onChange={handleDocumentFile} accept=".txt,.csv,.json,.xml,.pdf,.doc,.docx,image/*,application/pdf" /></span>
              <small className="field-note">Pentru PDF/scanări, completează textul extras/OCR în câmpul de mai jos.</small>
            </label>
            <label className="wide">Nume fișier<input name="fileName" value={aiForm.fileName} onChange={updateAi} /></label>
            <label className="wide">Text extras / OCR<textarea name="text" value={aiForm.text} onChange={updateAi} /></label>
          </div>
          {aiResult && <p className={aiResult.accepted ? "success-note" : "form-error"}>{aiResult.provider}: {aiResult.label} · {Math.round(aiResult.confidence * 100)}% · {aiResult.explanation}</p>}
          <div className="profile-actions"><button className="primary-button" disabled={checking || allDocs.length === 0}>{checking ? "Se verifică..." : "Verifică și adaugă"}</button></div>
        </form>
      </div>
      <section className="applications-card workspace-list">
        {applications.length === 0 && (
          <div className="inline-empty">
            <strong>Nu ai aplicații trimise încă.</strong>
            <span>Alege o universitate activă și trimite prima aplicație ca să apară documentele de verificat.</span>
          </div>
        )}
        {applications.map((app) => (
          <article className="workspace-row" key={app.id}>
            <div><strong>{app.Institution?.name}</strong><small>{app.program} · {app.faculty}</small></div>
            <div><strong>{statusLabels[app.status] || app.status}</strong><small>status</small></div>
            <div><strong>{app.documents?.filter((doc) => doc.verificationStatus === "verified").length || 0}/{app.documents?.length || 0}</strong><small>documente verificate</small></div>
            <div className="application-documents">
              {(app.documents || []).map((doc) => (
                <div key={doc.id} className={`application-doc-row ${doc.verificationStatus || "missing"}`}>
                  <span>{doc.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}</span>
                  <strong>{doc.name}</strong>
                  <small>{doc.fileName || "Fără fișier atașat"}</small>
                  <em>{documentStatusLabels[doc.verificationStatus] || doc.verificationStatus}</em>
                </div>
              ))}
              <form className="inline-doc-form" onSubmit={(event) => addApplicationDocument(event, app.id)}>
                <FileText size={16} />
                <input
                  value={customDocs[app.id] || ""}
                  onChange={(event) => setCustomDocs((current) => ({ ...current, [app.id]: event.target.value }))}
                  placeholder="Adaugă document lipsă..."
                />
                <button className="primary-button square" type="submit" title="Adaugă document în aplicație" aria-label="Adaugă document în aplicație">
                  <Plus size={17} />
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

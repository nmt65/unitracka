import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, CheckCircle2, Circle, ExternalLink, Eye, FileText, Plus, Send, Upload } from "lucide-react";
import { api } from "../services/api.js";
import { getProgramsForInstitution, programChoiceValue } from "../utils/programCatalog.js";
import { programTypes } from "../utils/status.js";

const ADMISSIONS_SELECTION_KEY = "unitrack_admissions_selection_v1";
const approvedStudentDocuments = [
  "Diplomă BAC",
  "Foaie matricolă",
  "CV Europass",
  "Scrisoare motivație",
  "Scrisori de recomandare",
  "Certificat limbă (IELTS/TOEFL)",
  "Cazier judiciar",
  "Adeverință medicală",
  "Portofoliu"
];

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

const mimeByExtension = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  xml: "application/xml"
};

function safeMimeType(file) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return mimeByExtension[extension] || "application/octet-stream";
}

function normalizeValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function sameProgram(app, form) {
  if (!app || !form.institutionId || !form.program) return false;
  if (app.InstitutionId !== form.institutionId) return false;
  if (form.programId && app.AdmissionProgramId) return app.AdmissionProgramId === form.programId;
  return normalizeValue(app.program) === normalizeValue(form.program)
    && normalizeValue(app.faculty) === normalizeValue(form.faculty)
    && app.programType === form.programType;
}

export function Admissions({ onToast }) {
  const [institutions, setInstitutions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({ institutionId: "", programId: "", program: "Informatică", faculty: "Facultatea de Matematică și Informatică", programType: "licenta", notes: "" });
  const [aiForm, setAiForm] = useState({ documentId: "", expectedType: "", fileName: "", mimeType: "", fileSize: null, fileDataUrl: "", text: "" });
  const [aiResult, setAiResult] = useState(null);
  const [customDocs, setCustomDocs] = useState({});
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  async function load() {
    const [institutionData, appData] = await Promise.all([api.publicInstitutions(), api.myApplications()]);
    const nextInstitutions = institutionData.institutions || [];
    setInstitutions(nextInstitutions);
    setApplications(appData.applications || []);
    const preferredName = localStorage.getItem(ADMISSIONS_SELECTION_KEY);
    const preferredInstitution = preferredName
      ? nextInstitutions.find((item) => item.name === preferredName)
      : null;
    if (preferredInstitution) localStorage.removeItem(ADMISSIONS_SELECTION_KEY);
    setForm((current) => ({ ...current, institutionId: preferredInstitution?.id || current.institutionId || nextInstitutions[0]?.id || "" }));
    const firstDoc = appData.applications?.flatMap((app) => app.documents || [])?.[0];
    if (firstDoc) setAiForm((current) => ({
      ...current,
      documentId: current.documentId || firstDoc.id,
      expectedType: current.expectedType || firstDoc.name
    }));
  }

  useEffect(() => {
    load().catch((error) => onToast(error.message));
  }, []);

  const selectedInstitution = useMemo(() => institutions.find((item) => item.id === form.institutionId) || null, [institutions, form.institutionId]);
  const programOptions = useMemo(() => getProgramsForInstitution(selectedInstitution), [selectedInstitution]);
  const allDocs = useMemo(() => applications.flatMap((app) => (app.documents || []).map((doc) => ({ ...doc, appName: app.Institution?.name }))), [applications]);
  const duplicateApplication = useMemo(() => applications.some((app) => sameProgram(app, form)), [applications, form]);

  useEffect(() => {
    if (!programOptions.length) return;
    const current = programOptions.find((option) => option.program === form.program && option.faculty === form.faculty);
    if (current) return;
    const first = programOptions[0];
    setForm((value) => ({ ...value, programId: first.id || "", program: first.program, faculty: first.faculty, programType: first.programType }));
  }, [form.institutionId, programOptions]);

  function updateForm(event) {
    if (event.target.name === "institutionId") {
      const institution = institutions.find((item) => item.id === event.target.value);
      const firstProgram = getProgramsForInstitution(institution)[0];
      setForm((current) => ({
        ...current,
        institutionId: event.target.value,
        programId: firstProgram?.id || "",
        program: firstProgram?.program || "",
        faculty: firstProgram?.faculty || "",
        programType: firstProgram?.programType || "licenta"
      }));
      return;
    }
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateProgramChoice(event) {
    const [programId, faculty, program, programType] = event.target.value.split("|||");
    setForm((current) => ({ ...current, programId, faculty, program, programType }));
  }

  function updateAi(event) {
    const { name, value } = event.target;
    setAiResult(null);
    if (name === "documentId") {
      const selectedDoc = allDocs.find((doc) => doc.id === value);
      setAiForm((current) => ({
        ...current,
        documentId: value,
        expectedType: selectedDoc?.name || current.expectedType,
        fileName: "",
        mimeType: "",
        fileSize: null,
        fileDataUrl: "",
        text: ""
      }));
      return;
    }
    setAiForm((current) => ({ ...current, [name]: value }));
  }

  async function handleDocumentFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      onToast("Fișierul trebuie să aibă maximum 5 MB.");
      return;
    }
    const canReadText = file.type.startsWith("text/") || /\.(txt|csv|json|xml)$/i.test(file.name);
    const [text, fileDataUrl] = await Promise.all([
      canReadText ? file.text() : Promise.resolve(""),
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
    ]);
    setAiResult(null);
    setAiForm((current) => ({
      ...current,
      fileName: file.name,
      mimeType: safeMimeType(file),
      fileSize: file.size,
      fileDataUrl,
      text
    }));
    onToast(canReadText
      ? "Fișier citit și atașat. Conținutul real va fi analizat la verificare."
      : "Fișier atașat. Analiza va folosi documentul real, nu numele fișierului sau text introdus manual.");
  }

  async function submitApplication(event) {
    event.preventDefault();
    if (duplicateApplication) {
      onToast("Ai deja o aplicație pentru această universitate și acest program.");
      return;
    }
    setSending(true);
    try {
      await api.createApplication(form);
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
    if (!aiForm.fileDataUrl) {
      onToast("Atașează fișierul real înainte de verificare.");
      return;
    }
    if (!aiForm.fileName.trim()) {
      onToast("Numele fișierului lipsește.");
      return;
    }
    setChecking(true);
    try {
      const data = await api.checkDocumentAi(aiForm);
      setAiResult(data.result);
      onToast(data.result.accepted
        ? "Tipul documentului a fost confirmat automat."
        : data.result.reviewRequired
          ? "Documentul a fost păstrat pentru verificarea universității."
          : "Documentul nu corespunde tipului selectat. Verifică fișierul și reîncarcă-l.");
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
          <p>Trimite aplicații către universități și verifică documentele înainte de evaluare.</p>
        </div>
      </div>
      <div className="admin-grid">
        <form className="profile-panel admin-form" onSubmit={submitApplication}>
          <h2><Send size={17} /> Trimite aplicație</h2>
          <div className="profile-form">
            <label>Universitate<select name="institutionId" value={form.institutionId} onChange={updateForm}>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            {selectedInstitution && (
              <div className="institution-preview wide">
                <strong>{selectedInstitution.name}</strong>
                <span>{selectedInstitution.city || selectedInstitution.country} · {selectedInstitution.offerSummary || selectedInstitution.description || "Universitate activă în platformă, disponibilă pentru aplicații online."}</span>
                <div className="offer-list compact-offers">
                  {programOptions.slice(0, 4).map((program) => (
                    <span key={programChoiceValue(program)}>{program.program} · {programTypes.find((entry) => entry.value === program.programType)?.label || program.programType}</span>
                  ))}
                </div>
                {selectedInstitution.website && <a href={selectedInstitution.website} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Site oficial</a>}
              </div>
            )}
            <label className="wide">Program / facultate
              <select value={programChoiceValue({ id: form.programId, faculty: form.faculty, program: form.program, programType: form.programType })} onChange={updateProgramChoice}>
                {programOptions.map((option) => (
                  <option key={programChoiceValue(option)} value={programChoiceValue(option)}>
                    {option.program} · {option.faculty} · {programTypes.find((entry) => entry.value === option.programType)?.label || option.programType}
                  </option>
                ))}
              </select>
            </label>
            <label>Tip<select name="programType" value={form.programType} onChange={updateForm} disabled><option value="licenta">Licență</option><option value="master">Master</option><option value="doctorat">Doctorat</option></select></label>
            <label>Facultate<input name="faculty" value={form.faculty} onChange={updateForm} readOnly /></label>
            <label className="wide">Note<textarea name="notes" value={form.notes} onChange={updateForm} /></label>
            <p className="field-note wide">Media BAC și scorurile de limbă se completează din profil doar după ce ai documente atestatoare verificate.</p>
          </div>
          {duplicateApplication && <p className="form-error">Există deja o aplicație pe aceeași universitate și program.</p>}
          <div className="profile-actions"><button className="primary-button" disabled={sending || !form.institutionId || !form.program || duplicateApplication}>{sending ? "Se trimite..." : "Trimite către universitate"}</button></div>
        </form>
        <form className="profile-panel admin-form" onSubmit={checkDocument}>
          <h2><ClipboardCheck size={17} /> Verificare document</h2>
          <div className="profile-form">
            <label>Document<select name="documentId" value={aiForm.documentId} onChange={updateAi} disabled={allDocs.length === 0}>{allDocs.map((doc) => <option key={doc.id} value={doc.id}>{doc.name} · {doc.appName}</option>)}</select></label>
            <label>Tip așteptat<input name="expectedType" value={aiForm.expectedType} readOnly /></label>
            <label className="wide">Atașează fișier
              <span className="file-control"><Upload size={17} /><input type="file" onChange={handleDocumentFile} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,.csv,.json,.xml,application/pdf,image/jpeg,image/png,image/webp" /></span>
              <small className="field-note">Acceptăm PDF, DOC/DOCX, JPG, PNG, WebP și documente text de maximum 5 MB. Tipul, extensia și conținutul sunt comparate înainte de analiză.</small>
            </label>
            <label className="wide">Nume fișier<input name="fileName" value={aiForm.fileName} readOnly placeholder="Se completează din fișierul ales" /></label>
            <label className="wide">Conținut citit din fișier<textarea name="text" value={aiForm.text} readOnly placeholder="Pentru PDF, imagini și documente Word, modelul AI citește fișierul direct." /></label>
          </div>
          {aiResult && (
            <section className={`document-ai-result ${aiResult.accepted ? "verified" : aiResult.reviewRequired ? "pending" : "rejected"}`} aria-live="polite">
              <header>
                <strong>{aiResult.accepted ? "Tip confirmat automat" : aiResult.reviewRequired ? "Verificare manuală necesară" : "Document necorespunzător"}</strong>
                <span>{aiResult.provider === "gemini" ? "Gemini multimodal" : aiResult.provider === "file-security" ? "Control fișier" : "Verificare UniTrack"}</span>
              </header>
              <p>{aiResult.label} · {Math.round(aiResult.confidence * 100)}% · {aiResult.explanation}</p>
              {aiResult.evidence?.length > 0 && <ul>{aiResult.evidence.map((item) => <li key={item}>{item}</li>)}</ul>}
            </section>
          )}
          <div className="profile-actions"><button className="primary-button" disabled={checking || allDocs.length === 0 || !aiForm.fileDataUrl}>{checking ? "Se verifică..." : "Verifică și adaugă"}</button></div>
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
            <div className="application-feedback">
              <strong>Feedback universitate</strong>
              <span>{app.reviewerNotes || "Încă nu există feedback de la comisia de admitere."}</span>
            </div>
            <div className="application-documents">
              {(app.documents || []).map((doc) => (
                <div key={doc.id} className={`application-doc-row ${doc.verificationStatus || "missing"}`}>
                  <span>{doc.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}</span>
                  <strong>{doc.name}</strong>
                  <small>{doc.fileName || "Fără fișier atașat"}</small>
                  <em>{documentStatusLabels[doc.verificationStatus] || doc.verificationStatus}</em>
                  {doc.fileSize ? <a className="tiny-link" href={api.documentFileUrl(doc.id)} target="_blank" rel="noreferrer"><Eye size={14} /> Vezi</a> : null}
                </div>
              ))}
              <form className="inline-doc-form" onSubmit={(event) => addApplicationDocument(event, app.id)}>
                <FileText size={16} />
                <select
                  value={customDocs[app.id] || ""}
                  onChange={(event) => setCustomDocs((current) => ({ ...current, [app.id]: event.target.value }))}
                >
                  <option value="">Alege document aprobat...</option>
                  {approvedStudentDocuments
                    .filter((name) => !(app.documents || []).some((doc) => doc.name === name))
                    .map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <button className="primary-button square" type="submit" disabled={!customDocs[app.id]} title="Adaugă document în aplicație" aria-label="Adaugă document în aplicație">
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

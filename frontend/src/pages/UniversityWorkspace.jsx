import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { BookOpen, CheckCircle2, Circle, Download, Eye, FileText, Plus, Search, X } from "lucide-react";
import { t } from "../i18n.js";

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

const workflowStages = [
  ["submitted", "Primite"],
  ["under_review", "În review"],
  ["waitlist", "Waitlist"],
  ["accepted", "Acceptate"],
  ["rejected", "Respinse"]
];

const emptyProgram = {
  faculty: "",
  name: "",
  programType: "licenta",
  academicYear: "2026-2027",
  deadline: "",
  annualTuition: "",
  seats: "",
  language: "Română",
  admissionMethod: "",
  website: "",
  description: "",
  status: "active"
};

export function UniversityWorkspace({ user, onToast, language = "ro" }) {
  const [applications, setApplications] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [programForm, setProgramForm] = useState(emptyProgram);
  const [institutionForm, setInstitutionForm] = useState({ website: "", contactEmail: "", description: "" });
  const [filter, setFilter] = useState({ status: "all", sort: "newest", documents: "all", search: "" });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [activeSection, setActiveSection] = useState("applications");

  async function load() {
    const [data, institutionData] = await Promise.all([
      api.workspaceApplications(filter),
      api.myInstitution().catch(() => ({ institution: null }))
    ]);
    const programData = await api.myInstitutionPrograms().catch(() => ({ programs: [] }));
    setApplications(data.applications || []);
    setPrograms(programData.programs || []);
    setReviewNotes(Object.fromEntries((data.applications || []).map((item) => [item.id, item.reviewerNotes || ""])));
    if (institutionData.institution) {
      setInstitution(institutionData.institution);
      setInstitutionForm({
        website: institutionData.institution.website || "",
        contactEmail: institutionData.institution.contactEmail || "",
        description: institutionData.institution.description || ""
      });
    }
  }

  useEffect(() => {
    load().catch((error) => onToast(error.message));
  }, [filter.status, filter.sort, filter.documents, filter.search]);

  const stats = useMemo(() => ({
    total: applications.length,
    review: applications.filter((item) => item.status === "under_review" || item.status === "submitted").length,
    accepted: applications.filter((item) => item.status === "accepted").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
    incomplete: applications.filter((item) => (item.documents || []).some((doc) => !doc.isOptional && doc.verificationStatus !== "verified")).length
  }), [applications]);

  async function updateStatus(id, status) {
    try {
      await api.updateApplicationStatus(id, { status, reviewerNotes: reviewNotes[id] || "" });
      onToast("Status actualizat și notificare trimisă elevului.");
      await load();
    } catch (error) {
      onToast(error.message);
    }
  }

  function updateInstitutionField(event) {
    setInstitutionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateProgramField(event) {
    setProgramForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateReviewNote(id, value) {
    setReviewNotes((current) => ({ ...current, [id]: value }));
  }

  function exportWorkspaceCsv() {
    const rows = [
      ["student", "email", "program", "faculty", "status", "verified_documents", "total_documents", "reviewer_notes"],
      ...applications.map((application) => [
        application.Student?.name || "",
        application.Student?.email || "",
        application.program || "",
        application.faculty || "",
        statusLabels[application.status] || application.status,
        (application.documents || []).filter((doc) => doc.verificationStatus === "verified").length,
        (application.documents || []).length,
        reviewNotes[application.id] || application.reviewerNotes || ""
      ])
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `unitrack-aplicatii-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function reviewDocument(document, verificationStatus) {
    try {
      const data = await api.updateDocument(document.id, { verificationStatus });
      setSelectedDocument((current) => current ? { ...current, ...data.document } : current);
      onToast(verificationStatus === "verified" ? "Document aprobat manual." : "Document respins manual.");
      await load();
    } catch (error) {
      onToast(error.message);
    }
  }

  async function saveInstitution(event) {
    event.preventDefault();
    try {
      const data = await api.updateMyInstitution(institutionForm);
      setInstitution(data.institution);
      onToast("Prezentarea universității a fost salvată.");
    } catch (error) {
      onToast(error.message);
    }
  }

  async function createProgram(event) {
    event.preventDefault();
    try {
      await api.createMyInstitutionProgram({
        ...programForm,
        annualTuition: programForm.annualTuition === "" ? null : Number(programForm.annualTuition),
        seats: programForm.seats === "" ? null : Number(programForm.seats),
        deadline: programForm.deadline || null
      });
      setProgramForm(emptyProgram);
      onToast("Program adăugat în oferta universității.");
      await load();
    } catch (error) {
      onToast(error.message);
    }
  }

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>{t("Workspace admitere", language)}</h1>
          <p>
            {user.institution?.name || t("Universitate", language)}
            {" · "}
            {language === "en" ? "application review and educational offer." : "evaluarea aplicațiilor și oferta educațională."}
          </p>
        </div>
      </div>

      <nav className="workspace-tabs" aria-label="Secțiuni workspace">
        <button className={activeSection === "applications" ? "active" : ""} type="button" onClick={() => setActiveSection("applications")}>{t("Aplicații", language)}</button>
        <button className={activeSection === "offer" ? "active" : ""} type="button" onClick={() => setActiveSection("offer")}>{t("Ofertă educațională", language)}</button>
        <button className={activeSection === "profile" ? "active" : ""} type="button" onClick={() => setActiveSection("profile")}>{t("Profil universitate", language)}</button>
      </nav>

      {activeSection === "applications" && (
        <>
          <div className="stats-grid compact-stats workspace-stats">
            <article className="stat-card"><strong>{stats.total}</strong><span>{t("Aplicații", language)}</span><small>{t("total", language)}</small></article>
            <article className="stat-card warning"><strong>{stats.review}</strong><span>{t("De evaluat", language)}</span><small>{t("noi / în lucru", language)}</small></article>
            <article className="stat-card success"><strong>{stats.accepted}</strong><span>{t("Acceptate", language)}</span><small>{t("notificate", language)}</small></article>
            <article className="stat-card warning"><strong>{stats.incomplete}</strong><span>{t("Incomplete", language)}</span><small>{t("documente lipsă", language)}</small></article>
          </div>
          <section className="review-pipeline" aria-label="Flux evaluare aplicații">
            {workflowStages.map(([key, label], index) => {
              const count = applications.filter((item) => item.status === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  className={filter.status === key ? "active" : ""}
                  onClick={() => setFilter((current) => ({ ...current, status: current.status === key ? "all" : key }))}
                >
                  <span>{index + 1}</span>
                  <strong>{t(label, language)}</strong>
                  <small>
                    {count} {language === "en" ? (count === 1 ? "application" : "applications") : (count === 1 ? "aplicație" : "aplicații")}
                  </small>
                </button>
              );
            })}
          </section>
        </>
      )}

      {activeSection === "profile" && institution && (
        <section className="profile-panel university-pitch-panel">
          <h2>De ce să vină studenții aici?</h2>
          <form className="profile-form" onSubmit={saveInstitution}>
            <label className="wide">
              Prezentare scurtă
              <textarea
                name="description"
                value={institutionForm.description}
                onChange={updateInstitutionField}
                rows="4"
                placeholder="Scrie 2-4 fraze despre ce face universitatea memorabilă: laboratoare, comunitate, cariere, proiecte, oraș."
              />
            </label>
            <label>
              Link oficial
              <input name="website" type="url" value={institutionForm.website} onChange={updateInstitutionField} placeholder="https://..." />
            </label>
            <label>
              Email admitere
              <input name="contactEmail" type="email" value={institutionForm.contactEmail} onChange={updateInstitutionField} placeholder="admitere@..." />
            </label>
            <div className="profile-actions inline-actions">
              <button className="primary-button" type="submit">Salvează prezentarea</button>
              {institutionForm.website && <a className="soft-button" href={institutionForm.website} target="_blank" rel="noreferrer">Vezi site oficial</a>}
            </div>
          </form>
        </section>
      )}
      {activeSection === "offer" && institution && (
        <section className="profile-panel university-offer-panel">
          <h2><BookOpen size={17} /> Oferta educațională</h2>
          <form className="profile-form" onSubmit={createProgram}>
            <label>
              Facultate
              <input name="faculty" value={programForm.faculty} onChange={updateProgramField} required placeholder="Facultatea de..." />
            </label>
            <label>
              Program
              <input name="name" value={programForm.name} onChange={updateProgramField} required placeholder="Informatică" />
            </label>
            <label>
              Tip
              <select name="programType" value={programForm.programType} onChange={updateProgramField}>
                <option value="licenta">Licență</option>
                <option value="master">Master</option>
                <option value="doctorat">Doctorat</option>
              </select>
            </label>
            <label>
              Deadline
              <input name="deadline" type="date" value={programForm.deadline} onChange={updateProgramField} />
            </label>
            <label>
              Locuri
              <input name="seats" type="number" min="1" value={programForm.seats} onChange={updateProgramField} />
            </label>
            <label>
              Taxă anuală
              <input name="annualTuition" type="number" min="0" step="0.01" value={programForm.annualTuition} onChange={updateProgramField} />
            </label>
            <label className="wide">
              Metodă admitere
              <textarea name="admissionMethod" value={programForm.admissionMethod} onChange={updateProgramField} rows="3" placeholder="Dosar, probă, interviu, criterii de departajare..." />
            </label>
            <div className="profile-actions inline-actions">
              <button className="primary-button" type="submit"><Plus size={17} /> Adaugă program</button>
            </div>
          </form>
          <div className="program-list">
            {programs.length === 0 && <p className="muted">Nu ai programe configurate încă. Elevii văd momentan oferta de catalog.</p>}
            {programs.slice(0, 12).map((program) => (
              <article key={program.id}>
                <span className="uni-logo tone-primary">{program.name.slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{program.name}</strong>
                  <small>{program.faculty} · {program.programType} · {program.academicYear}</small>
                </span>
                <em>{program.deadline || "fără deadline"}</em>
                <small>{program.requirements?.length || 0} documente</small>
              </article>
            ))}
          </div>
        </section>
      )}
      {activeSection === "applications" && <div className="filter-bar">
        <label className="search-control">
          <Search size={17} />
          <input
            value={filter.search}
            onChange={(event) => setFilter((current) => ({ ...current, search: event.target.value }))}
            placeholder="Caută student, email, program..."
          />
        </label>
        <select value={filter.status} onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value }))}>
          <option value="all">Toate statusurile</option>
          <option value="submitted">Trimise</option>
          <option value="under_review">În evaluare</option>
          <option value="accepted">Acceptate</option>
          <option value="rejected">Respinse</option>
          <option value="waitlist">Waitlist</option>
        </select>
        <select value={filter.sort} onChange={(event) => setFilter((current) => ({ ...current, sort: event.target.value }))}>
          <option value="newest">Cele mai noi</option>
          <option value="oldest">Cele mai vechi</option>
          <option value="documents">Documente complete</option>
          <option value="status">Status</option>
        </select>
        <select value={filter.documents} onChange={(event) => setFilter((current) => ({ ...current, documents: event.target.value }))}>
          <option value="all">Toate documentele</option>
          <option value="complete">Dosare complete</option>
          <option value="incomplete">Dosare incomplete</option>
          <option value="missing">Fișiere lipsă</option>
          <option value="rejected">Documente respinse</option>
        </select>
        <button className="soft-button" type="button" onClick={exportWorkspaceCsv}><Download size={16} /> Export listă</button>
      </div>}
      {activeSection === "applications" && <section className="applications-card workspace-list">
        {applications.length === 0 && (
          <div className="inline-empty">
            <strong>Nu există aplicații pentru filtrul curent.</strong>
            <span>Schimbă statusul sau așteaptă aplicații noi de la elevi.</span>
          </div>
        )}
        {applications.map((application) => (
          <article className="workspace-row workspace-row-expanded" key={application.id}>
            <div>
              <strong>{application.Student?.name}</strong>
              <small>{application.Student?.email} · CNP ****{application.Student?.cnpLast4 || "----"}</small>
              <span>{application.program} · {application.faculty || application.Institution?.name}</span>
            </div>
            <div>
              <strong>{application.documents?.filter((doc) => doc.verificationStatus === "verified").length || 0}/{application.documents?.length || 0}</strong>
              <small>documente</small>
            </div>
            <div>
              <span className="status-pill info">{statusLabels[application.status] || application.status}</span>
              <small>{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("ro-RO") : "fără dată"}</small>
            </div>
            <div className="row-buttons">
              <button type="button" onClick={() => updateStatus(application.id, "under_review")}>Review</button>
              <button type="button" onClick={() => updateStatus(application.id, "waitlist")}>Waitlist</button>
              <button type="button" onClick={() => updateStatus(application.id, "accepted")}>Acceptă</button>
              <button type="button" onClick={() => updateStatus(application.id, "rejected")}>Respinge</button>
            </div>
            <div className="review-notes-panel">
              {application.notes && <p><strong>Notă student:</strong> {application.notes}</p>}
              <label>
                Feedback pentru student
                <textarea
                  value={reviewNotes[application.id] || ""}
                  onChange={(event) => updateReviewNote(application.id, event.target.value)}
                  placeholder="Ex: dosarul este complet, lipsește certificatul de limbă, revino cu documentul semnat..."
                  rows="3"
                />
              </label>
            </div>
            <div className="application-documents reviewer-documents">
              {(application.documents || []).length === 0 && (
                <div className="inline-empty compact"><strong>Nu există documente atașate.</strong></div>
              )}
              {(application.documents || []).map((doc) => (
                <div key={doc.id} className={`application-doc-row ${doc.verificationStatus || "missing"}`}>
                  <span>{doc.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}</span>
                  <strong>{doc.name}</strong>
                  <small>
                    <FileText size={14} />
                    {doc.fileName || "fără fișier"}
                  </small>
                  <em>{documentStatusLabels[doc.verificationStatus] || doc.verificationStatus}</em>
                  <small>{doc.aiLabel ? `${doc.aiLabel} · ${Math.round((doc.aiConfidence || 0) * 100)}%` : "neverificat automat"}</small>
                  {doc.fileSize ? (
                    <button className="tiny-link as-button" type="button" onClick={() => setSelectedDocument({ ...doc, application })}>
                      <Eye size={14} /> Vezi document
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>}
      {selectedDocument && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card document-viewer" role="dialog" aria-modal="true" aria-label="Document aplicant">
            <header>
              <div>
                <h2>{selectedDocument.name}</h2>
                <p>{selectedDocument.application?.Student?.name} · {selectedDocument.fileName || "fără fișier"}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedDocument(null)} aria-label="Închide">
                <X size={18} />
              </button>
            </header>
            <div className="document-meta-grid">
              <span><strong>Status</strong>{documentStatusLabels[selectedDocument.verificationStatus] || selectedDocument.verificationStatus}</span>
              <span><strong>Verificare</strong>{selectedDocument.aiLabel ? `${selectedDocument.aiLabel} · ${Math.round((selectedDocument.aiConfidence || 0) * 100)}%` : "Neverificat"}</span>
              <span><strong>Fișier</strong>{selectedDocument.fileName || "-"}</span>
            </div>
            {selectedDocument.aiExplanation && <p className="field-note">{selectedDocument.aiExplanation}</p>}
            {selectedDocument.fileSize ? (
              <iframe title={selectedDocument.name} src={api.documentFileUrl(selectedDocument.id)} />
            ) : (
              <p className="muted">Nu există fișier atașat pentru acest document.</p>
            )}
            <label>
              Text extras / OCR
              <textarea value={selectedDocument.extractedText || ""} readOnly rows="8" />
            </label>
            <footer className="document-review-actions">
              <button className="soft-button" type="button" onClick={() => reviewDocument(selectedDocument, "verified")}><CheckCircle2 size={16} /> Aprobă document</button>
              <button className="danger-button" type="button" onClick={() => reviewDocument(selectedDocument, "rejected")}><X size={16} /> Respinge document</button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

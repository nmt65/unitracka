import { useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, Copy, Database, Gauge, MailCheck, Plus, UserPlus } from "lucide-react";
import { api } from "../services/api.js";

const emptyInstitution = {
  name: "",
  shortName: "",
  country: "România",
  countryCode: "RO",
  city: "",
  website: "",
  contactEmail: "",
  status: "active",
  description: ""
};

const emptyProgram = {
  institutionId: "",
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

const roleLabels = {
  admin: "Admin",
  student: "Elev",
  university: "Universitate"
};

const adminSections = [
  ["health", "Sănătate"],
  ["catalog", "Catalog & ofertă"],
  ["users", "Conturi"],
  ["audit", "Audit"]
];

export function AdminPanel({ onToast }) {
  const [institutions, setInstitutions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [institutionForm, setInstitutionForm] = useState(emptyInstitution);
  const [programForm, setProgramForm] = useState(emptyProgram);
  const [staffForm, setStaffForm] = useState({ email: "", password: "", name: "", institutionId: "" });
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [importingCatalog, setImportingCatalog] = useState(false);
  const [activeSection, setActiveSection] = useState("health");

  async function load() {
    const [statusData, institutionData, programData, userData, auditData] = await Promise.all([api.adminSystemStatus(), api.adminInstitutions(), api.adminPrograms(), api.adminUsers(), api.adminAuditLogs()]);
    setSystemStatus(statusData.status || null);
    setInstitutions(institutionData.institutions || []);
    setPrograms(programData.programs || []);
    setUsers(userData.users || []);
    setAuditLogs(auditData.logs || []);
    setStaffForm((current) => ({ ...current, institutionId: current.institutionId || institutionData.institutions?.[0]?.id || "" }));
    setProgramForm((current) => ({ ...current, institutionId: current.institutionId || institutionData.institutions?.[0]?.id || "" }));
  }

  useEffect(() => {
    load().catch((error) => onToast(error.message));
  }, []);

  const stats = useMemo(() => ({
    institutions: institutions.length,
    students: users.filter((user) => user.role === "student").length,
    universities: users.filter((user) => user.role === "university").length,
    admins: users.filter((user) => user.role === "admin").length
  }), [institutions, users]);

  const healthScore = useMemo(() => {
    if (!systemStatus) return 0;
    const checks = [
      systemStatus.database === "postgres" && systemStatus.databaseReady,
      systemStatus.smtpConfigured,
      systemStatus.aiConfigured,
      !systemStatus.seedDemo,
      !systemStatus.bootstrapAdmin
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [systemStatus]);

  function updateInstitution(event) {
    setInstitutionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateStaff(event) {
    setStaffForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateProgram(event) {
    setProgramForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createInstitution(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.createInstitution(institutionForm);
      setInstitutionForm(emptyInstitution);
      onToast("Universitate adăugată de admin.");
      await load();
    } catch (error) {
      onToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createStaff(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.createUniversityUser(staffForm);
      setStaffForm({ email: "", password: "", name: "", institutionId: institutions[0]?.id || "" });
      onToast("Cont universitate creat.");
      await load();
    } catch (error) {
      onToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createProgram(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.createProgram({
        ...programForm,
        annualTuition: programForm.annualTuition === "" ? null : Number(programForm.annualTuition),
        seats: programForm.seats === "" ? null : Number(programForm.seats),
        deadline: programForm.deadline || null
      });
      setProgramForm((current) => ({ ...emptyProgram, institutionId: current.institutionId || institutions[0]?.id || "" }));
      onToast("Program de admitere adăugat cu cerințe implicite.");
      await load();
    } catch (error) {
      onToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function importCatalog() {
    setImportingCatalog(true);
    try {
      const data = await api.importCatalogInstitutions();
      onToast(`Catalog importat: ${data.created} noi, ${data.existing} existente.`);
      await load();
    } catch (error) {
      onToast(error.message);
    } finally {
      setImportingCatalog(false);
    }
  }

  async function sendTestEmail(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.sendTestEmail({ email: testEmail || undefined });
      onToast(data.message || "Email test trimis.");
    } catch (error) {
      onToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeInstitutionStatus(institution, status) {
    try {
      await api.updateInstitution(institution.id, { status });
      onToast(`${institution.shortName} este acum ${status}.`);
      await load();
    } catch (error) {
      onToast(error.message);
    }
  }

  async function copyAiEnv() {
    await navigator.clipboard.writeText([
      "OPENAI_API_KEY=sk-...",
      "OPENAI_DOCUMENT_MODEL=gpt-4o-mini",
      "OPENAI_ADVISOR_MODEL=gpt-4o-mini",
      "# sau",
      "GEMINI_API_KEY=...",
      "GEMINI_DOCUMENT_MODEL=gemini-2.5-flash",
      "GEMINI_ADVISOR_MODEL=gemini-2.5-flash",
      "GEMINI_FALLBACK_MODELS=gemini-2.5-flash",
      "GEMINI_REQUEST_TIMEOUT_MS=25000"
    ].join("\n"));
    onToast("Variabilele de analiză au fost copiate.");
  }

  async function copyGmailSmtpEnv() {
    await navigator.clipboard.writeText([
      "SMTP_HOST=smtp.gmail.com",
      "SMTP_PORT=465",
      "SMTP_USER=adresa-ta@gmail.com",
      "SMTP_PASS=parola-app-google-16-caractere",
      "SMTP_FROM=UniTrack <adresa-ta@gmail.com>"
    ].join("\n"));
    onToast("Variabilele SMTP Gmail au fost copiate.");
  }

  return (
    <section className="unitrack-page admin-page">
      <div className="page-heading">
        <div>
          <h1>Panou Admin</h1>
          <p>Catalog, conturi instituționale și configurarea platformei.</p>
        </div>
        <div className="admin-health-summary">
          <Gauge size={18} />
          <strong>{healthScore}%</strong>
          <span>servicii active</span>
        </div>
      </div>

      <div className="stats-grid compact-stats">
        <article className="stat-card"><strong>{stats.institutions}</strong><span>Universități</span><small>în platformă</small></article>
        <article className="stat-card success"><strong>{stats.students}</strong><span>Elevi</span><small>CNP unic</small></article>
        <article className="stat-card warning"><strong>{stats.universities}</strong><span>Conturi universitate</span><small>workspace admitere</small></article>
        <article className="stat-card"><strong>{stats.admins}</strong><span>Admini</span><small>control platformă</small></article>
      </div>

      <nav className="admin-section-tabs" aria-label="Secțiuni admin">
        {adminSections.map(([key, label]) => (
          <button key={key} className={activeSection === key ? "active" : ""} type="button" onClick={() => setActiveSection(key)}>
            {label}
          </button>
        ))}
      </nav>

      {activeSection === "health" && systemStatus && (
        <section className="system-status-grid">
          <article>
            <strong>{systemStatus.nodeEnv}</strong>
            <span>Mediu</span>
          </article>
          <article>
            <strong>{systemStatus.databaseReady ? "Conectată" : "În reconectare"}</strong>
            <span>{systemStatus.database}</span>
          </article>
          <article className={systemStatus.smtpConfigured ? "ok" : "warn"}>
            <strong>{systemStatus.smtpConfigured ? "SMTP activ" : "SMTP lipsă"}</strong>
            <span>{systemStatus.smtpHost || "Email resetări/notificări"}</span>
          </article>
          <article className={systemStatus.aiConfigured ? "ok" : "warn"}>
            <strong>{systemStatus.aiConfigured ? "Analiză avansată" : "Analiză locală"}</strong>
            <span>{systemStatus.openaiModel || systemStatus.geminiModel || "verificare locală"}</span>
          </article>
          {systemStatus.aiConfigured && (
            <article>
              <strong>{systemStatus.geminiRequestTimeoutMs ? `${Math.round(systemStatus.geminiRequestTimeoutMs / 1000)} sec` : "-"}</strong>
              <span>timeout analiză document</span>
            </article>
          )}
          <article>
            <strong>{systemStatus.aiDocumentDailyLimit || 0}/zi</strong>
            <span>Limită verificări documente</span>
          </article>
          <article>
            <strong>{systemStatus.aiAdvisorDailyLimit || 0}/zi</strong>
            <span>Limită asistent dosar</span>
          </article>
          <article className={systemStatus.seedDemo ? "warn" : "ok"}>
            <strong>{systemStatus.seedDemo ? "Seed test ON" : "Seed test OFF"}</strong>
            <span>Date de test publice</span>
          </article>
          <article className={systemStatus.bootstrapAdmin ? "warn" : "ok"}>
            <strong>{systemStatus.bootstrapAdmin ? "Bootstrap ON" : "Bootstrap OFF"}</strong>
            <span>Primul admin</span>
          </article>
          <article>
            <strong>{systemStatus.catalogCount || 0}</strong>
            <span>Catalog seed</span>
          </article>
        </section>
      )}

      {activeSection === "catalog" && systemStatus && (
        <section className="profile-panel catalog-import-panel">
          <h2><Database size={17} /> Import catalog universități</h2>
          <div className="ai-config-body">
            <div>
              <strong>Top Europa + România</strong>
              <p>Importă automat catalogul UniTrack în lista publică de instituții, fără duplicate. Studenții pot aplica imediat la universitățile active.</p>
            </div>
            <button className="primary-button" type="button" disabled={importingCatalog} onClick={importCatalog}>
              {importingCatalog ? "Se importă..." : "Importă catalog universități"}
            </button>
          </div>
        </section>
      )}

      {activeSection === "health" && systemStatus && (
        <section className={`profile-panel ai-config-panel ${systemStatus.aiConfigured ? "ready" : "missing"}`}>
          <h2><Brain size={17} /> Verificare automată</h2>
          <div className="ai-config-body">
            <div>
              <strong>{systemStatus.aiConfigured ? "Motor de analiză activ" : "Motor de analiză local"}</strong>
              <p>
                {systemStatus.aiConfigured
                  ? `Documentele sunt citite din fișierul real de ${systemStatus.geminiModel || systemStatus.openaiModel}. Dacă modelul nu poate decide, dosarul rămâne în verificare manuală, nu este respins automat.`
                  : "Momentan rulează verificarea locală. Pentru PDF-uri scanate, imagini și CV-uri reale, setează cheia providerului în Render > Environment."}
              </p>
            </div>
            <button className="soft-button" type="button" onClick={copyAiEnv}><Copy size={16} /> Copiază env analiză</button>
          </div>
        </section>
      )}

      {activeSection === "health" && systemStatus && (
        <section className={`profile-panel ai-config-panel ${systemStatus.smtpConfigured ? "ready" : "missing"}`}>
          <h2><MailCheck size={17} /> SMTP resetare parolă</h2>
          <div className="ai-config-body">
            <div>
              <strong>{systemStatus.smtpConfigured ? "Email activ" : "Email neconfigurat"}</strong>
              <p>
                {systemStatus.smtpConfigured
                  ? `Resetările de parolă și notificările sunt trimise prin ${systemStatus.smtpHost || "SMTP"}.`
                  : "Pentru Gmail trebuie parolă de aplicație Google, nu parola normală a contului. Pune variabilele SMTP în Render > Environment și redeploy."}
              </p>
            </div>
            <button className="soft-button" type="button" onClick={copyGmailSmtpEnv}><Copy size={16} /> Copiază SMTP Gmail</button>
          </div>
          <form className="inline-admin-form" onSubmit={sendTestEmail}>
            <input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="email pentru test (opțional)" />
            <button className="soft-button" disabled={loading || !systemStatus.smtpConfigured}>Trimite email test</button>
          </form>
        </section>
      )}

      {(activeSection === "catalog" || activeSection === "users") && <div className="admin-grid">
        {activeSection === "catalog" && (
        <form className="profile-panel admin-form" onSubmit={createInstitution}>
          <h2><Plus size={17} /> Adaugă universitate</h2>
          <div className="profile-form">
            <label>Nume<input name="name" value={institutionForm.name} onChange={updateInstitution} required /></label>
            <label>Abreviere<input name="shortName" value={institutionForm.shortName} onChange={updateInstitution} required /></label>
            <label>Țară<input name="country" value={institutionForm.country} onChange={updateInstitution} required /></label>
            <label>Cod țară<input name="countryCode" value={institutionForm.countryCode} onChange={updateInstitution} /></label>
            <label>Oraș<input name="city" value={institutionForm.city} onChange={updateInstitution} /></label>
            <label>Email contact<input name="contactEmail" type="email" value={institutionForm.contactEmail} onChange={updateInstitution} /></label>
            <label className="wide">Website<input name="website" value={institutionForm.website} onChange={updateInstitution} placeholder="https://..." /></label>
          </div>
          <div className="profile-actions"><button className="primary-button" disabled={loading}>Salvează universitate</button></div>
        </form>
        )}

        {activeSection === "catalog" && (
        <form className="profile-panel admin-form" onSubmit={createProgram}>
          <h2><BookOpen size={17} /> Adaugă program de admitere</h2>
          <div className="profile-form">
            <label>Universitate<select name="institutionId" value={programForm.institutionId} onChange={updateProgram} required>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Tip<select name="programType" value={programForm.programType} onChange={updateProgram}><option value="licenta">Licență</option><option value="master">Master</option><option value="doctorat">Doctorat</option></select></label>
            <label>Facultate<input name="faculty" value={programForm.faculty} onChange={updateProgram} required placeholder="Facultatea de..." /></label>
            <label>Program<input name="name" value={programForm.name} onChange={updateProgram} required placeholder="Informatică" /></label>
            <label>An academic<input name="academicYear" value={programForm.academicYear} onChange={updateProgram} required /></label>
            <label>Deadline<input name="deadline" type="date" value={programForm.deadline} onChange={updateProgram} /></label>
            <label>Locuri<input name="seats" type="number" min="1" value={programForm.seats} onChange={updateProgram} /></label>
            <label>Taxă anuală<input name="annualTuition" type="number" min="0" step="0.01" value={programForm.annualTuition} onChange={updateProgram} /></label>
            <label>Limbă<input name="language" value={programForm.language} onChange={updateProgram} /></label>
            <label className="wide">Website<input name="website" type="url" value={programForm.website} onChange={updateProgram} placeholder="https://..." /></label>
            <label className="wide">Metodă admitere<textarea name="admissionMethod" value={programForm.admissionMethod} onChange={updateProgram} placeholder="Ex: dosar, eseu motivațional, interviu, probă scrisă..." /></label>
            <label className="wide">Descriere scurtă<textarea name="description" value={programForm.description} onChange={updateProgram} placeholder="Ce oferă programul, pe scurt." /></label>
          </div>
          <p className="field-note">La creare se atașează automat setul standard de documente obligatorii; le putem rafina apoi pe fiecare program.</p>
          <div className="profile-actions"><button className="primary-button" disabled={loading || !programForm.institutionId}>Salvează program</button></div>
        </form>
        )}

        {activeSection === "users" && (
        <form className="profile-panel admin-form" onSubmit={createStaff}>
          <h2><UserPlus size={17} /> Creează cont universitate</h2>
          <div className="profile-form">
            <label>Email<input name="email" type="email" value={staffForm.email} onChange={updateStaff} required /></label>
            <label>Parolă<input name="password" type="password" minLength={8} value={staffForm.password} onChange={updateStaff} required /></label>
            <label>Nume afișat<input name="name" value={staffForm.name} onChange={updateStaff} /></label>
            <label>Universitate<select name="institutionId" value={staffForm.institutionId} onChange={updateStaff} required>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          <div className="profile-actions"><button className="primary-button" disabled={loading}>Creează cont</button></div>
        </form>
        )}
      </div>}

      {activeSection === "catalog" && <section className="university-table-card admin-list">
        <header className="table-card-heading">
          <div>
            <h2>Oferta educațională 2026-2027</h2>
            <p>Programele apar în admitere și comparație; elevii nu mai introduc facultăți după capul lor.</p>
          </div>
        </header>
        <table className="university-table admin-table">
          <thead><tr><th>Program</th><th>Universitate</th><th>Tip</th><th>Deadline</th><th>Locuri</th><th>Cerințe</th></tr></thead>
          <tbody>{programs.slice(0, 80).map((program) => (
            <tr key={program.id}>
              <td><strong>{program.name}</strong><small>{program.faculty}</small></td>
              <td>{program.Institution?.shortName || institutions.find((item) => item.id === program.InstitutionId)?.shortName || "-"}</td>
              <td>{program.programType}</td>
              <td>{program.deadline || "-"}</td>
              <td>{program.seats || "-"}</td>
              <td>{program.requirements?.length || 0} documente</td>
            </tr>
          ))}</tbody>
        </table>
      </section>}

      {activeSection === "catalog" && <section className="university-table-card admin-list">
        <table className="university-table admin-table">
          <thead><tr><th>Universitate</th><th>Țară</th><th>Website</th><th>Email</th><th>Status</th></tr></thead>
          <tbody>{institutions.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.name}</strong><small>{item.shortName}</small></td>
              <td>{item.country}</td>
              <td>{item.website ? <a href={item.website} target="_blank" rel="noreferrer">{item.website}</a> : "-"}</td>
              <td>{item.contactEmail || "-"}</td>
              <td>
                <select className="compact-select" value={item.status} onChange={(event) => changeInstitutionStatus(item, event.target.value)}>
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="disabled">disabled</option>
                </select>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </section>}

      {activeSection === "users" && <section className="university-table-card admin-list">
        <header className="table-card-heading">
          <div>
            <h2>Conturi platformă</h2>
            <p>Vizibilitate rapidă pe roluri, instituții și conturi de elev cu CNP verificat.</p>
          </div>
        </header>
        <table className="university-table admin-table">
          <thead><tr><th>Utilizator</th><th>Rol</th><th>Instituție</th><th>CNP</th><th>Notificări</th></tr></thead>
          <tbody>{users.map((user) => {
            const institution = user.Institution || user.institution;
            return (
              <tr key={user.id}>
                <td><strong>{user.name}</strong><small>{user.email}</small></td>
                <td>{roleLabels[user.role] || user.role}</td>
                <td>{institution?.shortName || institution?.name || "-"}</td>
                <td>{user.role === "student" ? `****${user.cnpLast4 || "----"}` : "-"}</td>
                <td>{user.emailNotifications ? `cu ${user.notifyBeforeDays || 14} zile înainte` : "dezactivate"}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </section>}

      {activeSection === "audit" && <section className="university-table-card admin-list">
        <header className="table-card-heading">
          <div>
            <h2>Audit securitate</h2>
            <p>Ultimele acțiuni importante: login, resetare, aplicații, verificări de documente și operațiuni admin.</p>
          </div>
        </header>
        <table className="university-table audit-table">
          <thead><tr><th>Acțiune</th><th>Actor</th><th>Entitate</th><th>Metadata</th><th>Data</th></tr></thead>
          <tbody>{auditLogs.slice(0, 12).map((log) => (
            <tr key={log.id}>
              <td><strong>{log.action}</strong><small>{log.actorRole || "anonymous"}</small></td>
              <td>{log.actorEmail || "-"}</td>
              <td>{log.entityType || "-"}<small>{log.entityId || ""}</small></td>
              <td>{JSON.stringify(log.metadata || {}).slice(0, 90)}</td>
              <td>{log.createdAt ? new Date(log.createdAt).toLocaleString("ro-RO") : "-"}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>}
    </section>
  );
}

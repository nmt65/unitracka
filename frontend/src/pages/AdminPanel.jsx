import { useEffect, useMemo, useState } from "react";
import { Brain, Copy, Plus, UserPlus } from "lucide-react";
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

const roleLabels = {
  admin: "Admin",
  student: "Elev",
  university: "Universitate"
};

export function AdminPanel({ onToast }) {
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [institutionForm, setInstitutionForm] = useState(emptyInstitution);
  const [staffForm, setStaffForm] = useState({ email: "", password: "", name: "", institutionId: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const [statusData, institutionData, userData, auditData] = await Promise.all([api.adminSystemStatus(), api.adminInstitutions(), api.adminUsers(), api.adminAuditLogs()]);
    setSystemStatus(statusData.status || null);
    setInstitutions(institutionData.institutions || []);
    setUsers(userData.users || []);
    setAuditLogs(auditData.logs || []);
    setStaffForm((current) => ({ ...current, institutionId: current.institutionId || institutionData.institutions?.[0]?.id || "" }));
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

  function updateInstitution(event) {
    setInstitutionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateStaff(event) {
    setStaffForm((current) => ({ ...current, [event.target.name]: event.target.value }));
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
      "GEMINI_DOCUMENT_MODEL=gemini-1.5-flash",
      "GEMINI_ADVISOR_MODEL=gemini-1.5-flash"
    ].join("\n"));
    onToast("Variabilele AI au fost copiate.");
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
          <p>Doar adminul adaugă universități și conturi instituționale.</p>
        </div>
      </div>

      <div className="stats-grid compact-stats">
        <article className="stat-card"><strong>{stats.institutions}</strong><span>Universități</span><small>în platformă</small></article>
        <article className="stat-card success"><strong>{stats.students}</strong><span>Elevi</span><small>CNP unic</small></article>
        <article className="stat-card warning"><strong>{stats.universities}</strong><span>Conturi universitate</span><small>workspace admitere</small></article>
        <article className="stat-card"><strong>{stats.admins}</strong><span>Admini</span><small>control platformă</small></article>
      </div>

      {systemStatus && (
        <section className="system-status-grid">
          <article>
            <strong>{systemStatus.nodeEnv}</strong>
            <span>Mediu</span>
          </article>
          <article>
            <strong>{systemStatus.database}</strong>
            <span>Bază date</span>
          </article>
          <article className={systemStatus.smtpConfigured ? "ok" : "warn"}>
            <strong>{systemStatus.smtpConfigured ? "SMTP activ" : "SMTP lipsă"}</strong>
            <span>Email resetări/notificări</span>
          </article>
          <article className={systemStatus.aiConfigured ? "ok" : "warn"}>
            <strong>{systemStatus.aiConfigured ? "AI extern" : "AI local"}</strong>
            <span>{systemStatus.openaiModel || systemStatus.geminiModel || "fallback euristic"}</span>
          </article>
          <article className={systemStatus.seedDemo ? "warn" : "ok"}>
            <strong>{systemStatus.seedDemo ? "Demo seed ON" : "Demo seed OFF"}</strong>
            <span>Date demo publice</span>
          </article>
          <article className={systemStatus.bootstrapAdmin ? "warn" : "ok"}>
            <strong>{systemStatus.bootstrapAdmin ? "Bootstrap ON" : "Bootstrap OFF"}</strong>
            <span>Primul admin</span>
          </article>
        </section>
      )}

      {systemStatus && (
        <section className={`profile-panel ai-config-panel ${systemStatus.aiConfigured ? "ready" : "missing"}`}>
          <h2><Brain size={17} /> Configurare AI live</h2>
          <div className="ai-config-body">
            <div>
              <strong>{systemStatus.aiConfigured ? "AI extern activ" : "AI extern neconfigurat"}</strong>
              <p>
                {systemStatus.aiConfigured
                  ? `Documentele și consilierul folosesc ${systemStatus.openaiModel || systemStatus.geminiModel}.`
                  : "Momentan rulează clasificatorul local. Pentru citire mai bună pe PDF-uri, imagini și CV-uri reale, setează cheia API în Render > Environment."}
              </p>
            </div>
            <button className="soft-button" type="button" onClick={copyAiEnv}><Copy size={16} /> Copiază env AI</button>
          </div>
        </section>
      )}

      {systemStatus && (
        <section className={`profile-panel ai-config-panel ${systemStatus.smtpConfigured ? "ready" : "missing"}`}>
          <h2>SMTP resetare parolă</h2>
          <div className="ai-config-body">
            <div>
              <strong>{systemStatus.smtpConfigured ? "Email activ" : "Email neconfigurat"}</strong>
              <p>
                {systemStatus.smtpConfigured
                  ? "Resetările de parolă și notificările sunt trimise prin SMTP."
                  : "Pentru Gmail trebuie parolă de aplicație Google, nu parola normală a contului. Pune variabilele SMTP în Render > Environment și redeploy."}
              </p>
            </div>
            <button className="soft-button" type="button" onClick={copyGmailSmtpEnv}><Copy size={16} /> Copiază SMTP Gmail</button>
          </div>
        </section>
      )}

      <div className="admin-grid">
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
      </div>

      <section className="university-table-card admin-list">
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
      </section>

      <section className="university-table-card admin-list">
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
      </section>

      <section className="university-table-card admin-list">
        <header className="table-card-heading">
          <div>
            <h2>Audit securitate</h2>
            <p>Ultimele acțiuni importante: login, resetare, aplicații, AI documente și operațiuni admin.</p>
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
      </section>
    </section>
  );
}

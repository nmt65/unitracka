import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { CheckCircle2, Circle, FileText } from "lucide-react";

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

export function UniversityWorkspace({ user, onToast }) {
  const [applications, setApplications] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [institutionForm, setInstitutionForm] = useState({ website: "", contactEmail: "", description: "" });
  const [filter, setFilter] = useState({ status: "all", sort: "newest" });

  async function load() {
    const [data, institutionData] = await Promise.all([
      api.workspaceApplications(filter),
      api.myInstitution().catch(() => ({ institution: null }))
    ]);
    setApplications(data.applications || []);
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
  }, [filter.status, filter.sort]);

  const stats = useMemo(() => ({
    total: applications.length,
    review: applications.filter((item) => item.status === "under_review" || item.status === "submitted").length,
    accepted: applications.filter((item) => item.status === "accepted").length,
    rejected: applications.filter((item) => item.status === "rejected").length
  }), [applications]);

  async function updateStatus(id, status) {
    try {
      await api.updateApplicationStatus(id, { status });
      onToast("Status actualizat și notificare trimisă elevului.");
      await load();
    } catch (error) {
      onToast(error.message);
    }
  }

  function updateInstitutionField(event) {
    setInstitutionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
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

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Workspace admitere</h1>
          <p>{user.institution?.name || "Universitate"} primește și sortează aplicațiile elevilor.</p>
        </div>
      </div>
      <div className="stats-grid compact-stats">
        <article className="stat-card"><strong>{stats.total}</strong><span>Aplicații</span><small>total</small></article>
        <article className="stat-card warning"><strong>{stats.review}</strong><span>De evaluat</span><small>noi / în lucru</small></article>
        <article className="stat-card success"><strong>{stats.accepted}</strong><span>Acceptate</span><small>notificate</small></article>
        <article className="stat-card"><strong>{stats.rejected}</strong><span>Respinse</span><small>arhivate</small></article>
      </div>
      {institution && (
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
      <div className="filter-bar">
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
          <option value="score">Scor admitere</option>
          <option value="status">Status</option>
        </select>
      </div>
      <section className="applications-card workspace-list">
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
              <strong>{application.admissionScore ?? "-"} </strong>
              <small>scor</small>
            </div>
            <div>
              <span className="status-pill info">{statusLabels[application.status] || application.status}</span>
              <small>{application.documents?.filter((doc) => doc.verificationStatus === "verified").length || 0}/{application.documents?.length || 0} documente verificate</small>
            </div>
            <div className="row-buttons">
              <button type="button" onClick={() => updateStatus(application.id, "under_review")}>Review</button>
              <button type="button" onClick={() => updateStatus(application.id, "accepted")}>Acceptă</button>
              <button type="button" onClick={() => updateStatus(application.id, "rejected")}>Respinge</button>
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
                  <small>{doc.aiLabel ? `${doc.aiLabel} · ${Math.round((doc.aiConfidence || 0) * 100)}%` : "neverificat AI"}</small>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { AlertTriangle, BellRing, CheckCircle2, FileCheck2, Fingerprint, ImagePlus, KeyRound, LogOut, Mail, Plus, Save, Target, Trash2, X } from "lucide-react";
import { api } from "../services/api.js";

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function countryCode(university) {
  return university.countryCode || (university.country === "România" || university.country === "Romania" ? "RO" : university.country.slice(0, 2).toUpperCase());
}

function hasVerifiedEvidence(universities, pattern) {
  const matcher = new RegExp(pattern, "i");
  return universities
    .flatMap((university) => university.documents || [])
    .some((doc) => matcher.test(doc.name) && doc.verificationStatus === "verified" && doc.fileName && Number(doc.fileSize || 0) > 0);
}

function hasLongDecimalScore(value) {
  return /\d+[.,]\d{3,}/.test(String(value || ""));
}

function initialsFor(name = "") {
  return name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "AM";
}

function resizeAvatar(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const size = 320;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function ProfilePhotoEditor({ value, name, onFile, onClear }) {
  return (
    <div className="profile-photo-editor">
      <div className="profile-photo-preview">
        {value ? <img src={value} alt="" /> : <span>{initialsFor(name)}</span>}
      </div>
      <div className="profile-photo-copy">
        <strong>Poză de profil</strong>
        <small>Folosește JPG, PNG sau WebP. Imaginea este optimizată automat pentru viteză.</small>
        <div className="profile-photo-actions">
          <label className="soft-button file-button">
            <ImagePlus size={16} /> Alege poză
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
          </label>
          {value && (
            <button className="soft-button" type="button" onClick={onClear}>
              <X size={16} /> Elimină
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PasskeyPanel({ onToast }) {
  const [passkeys, setPasskeys] = useState([]);
  const [supported, setSupported] = useState(() => browserSupportsWebAuthn());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadPasskeys() {
    try {
      const data = await api.passkeys();
      setSupported(Boolean(data.supported) && browserSupportsWebAuthn());
      setPasskeys(data.passkeys || []);
    } catch (error) {
      setSupported(false);
      onToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPasskeys();
  }, []);

  async function createPasskey() {
    setCreating(true);
    try {
      const optionsJSON = await api.passkeyRegistrationOptions();
      const response = await startRegistration({ optionsJSON });
      const deviceName = /Windows/i.test(navigator.userAgent)
        ? "Windows Hello"
        : /iPhone|iPad|Mac/i.test(navigator.userAgent)
          ? "Apple passkey"
          : "Passkey personal";
      await api.passkeyRegistrationVerification({ response, name: deviceName });
      await loadPasskeys();
      onToast("Passkey adăugat. Te poți autentifica fără parolă.");
    } catch (error) {
      if (error?.name !== "NotAllowedError") onToast(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function removePasskey(passkey) {
    if (!window.confirm(`Elimini passkey-ul „${passkey.name}”?`)) return;
    try {
      await api.deletePasskey(passkey.id);
      setPasskeys((current) => current.filter((item) => item.id !== passkey.id));
      onToast("Passkey eliminat.");
    } catch (error) {
      onToast(error.message);
    }
  }

  return (
    <section className="profile-panel passkey-panel">
      <div className="panel-heading-row">
        <div>
          <h2><Fingerprint size={18} /> Passkey-uri</h2>
          <p className="muted">Intră cu Windows Hello, Face ID sau cheia de securitate. UniTrack păstrează doar cheia publică.</p>
        </div>
        {supported && (
          <button className="primary-button compact" type="button" onClick={createPasskey} disabled={creating}>
            <Plus size={16} /> {creating ? "Se configurează..." : "Adaugă passkey"}
          </button>
        )}
      </div>
      {loading && <p className="muted">Verificăm dispozitivul...</p>}
      {!loading && !supported && (
        <div className="security-note">
          <ShieldCheck size={18} />
          <span>Passkey-urile sunt disponibile pe HTTPS sau pe <strong>localhost</strong>, într-un browser compatibil.</span>
        </div>
      )}
      {!loading && supported && passkeys.length === 0 && (
        <div className="security-note">
          <Fingerprint size={18} />
          <span>Nu ai încă un passkey. Adaugă-l acum și păstrează parola ca metodă de recuperare.</span>
        </div>
      )}
      {passkeys.length > 0 && (
        <div className="passkey-list">
          {passkeys.map((passkey) => (
            <article key={passkey.id}>
              <span className="passkey-icon"><Fingerprint size={19} /></span>
              <span>
                <strong>{passkey.name}</strong>
                <small>
                  {passkey.backedUp ? "Sincronizat" : "Acest dispozitiv"}
                  {" · "}
                  adăugat {new Date(passkey.createdAt).toLocaleDateString("ro-RO")}
                </small>
              </span>
              <button className="icon-button" type="button" onClick={() => removePasskey(passkey)} title="Elimină passkey" aria-label="Elimină passkey">
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function Profile({ user, universities = [], stats, onUser, onLogout, onToast }) {
  const accepted = universities.filter((uni) => uni.status === "Acceptat");
  const [applicationDocs, setApplicationDocs] = useState([]);
  const evidenceSources = useMemo(() => [
    ...universities,
    { id: "applications", documents: applicationDocs }
  ], [universities, applicationDocs]);
  const hasAcademicEvidence = hasVerifiedEvidence(evidenceSources, "bac|bacalaureat|matricol");
  const hasLanguageEvidence = hasVerifiedEvidence(evidenceSources, "limb|ielts|toefl|cambridge");
  const allDocs = evidenceSources.flatMap((source) => source.documents || []);
  const verifiedDocs = allDocs.filter((doc) => doc.verificationStatus === "verified" || doc.isCompleted);
  const requiredMissing = universities.reduce((sum, uni) => sum + Number(uni.remainingRequiredDocuments || 0), 0);
  const readinessScore = Math.min(100, Math.round(
    (hasAcademicEvidence ? 24 : 0)
    + (hasLanguageEvidence ? 16 : 0)
    + Math.min(30, verifiedDocs.length * 4)
    + Math.min(18, accepted.length * 9)
    + (user.emailNotifications ? 12 : 0)
  ));
  const nextDeadline = (stats?.upcomingDeadlines || []).find((item) => item.daysUntilDeadline >= 0);
  const [form, setForm] = useState({
    name: user.name || "",
    bacAverage: user.bacAverage ?? "",
    languageResults: user.languageResults || "",
    interests: (user.interests || []).join(", "),
    emailNotifications: user.emailNotifications,
    notifyBeforeDays: user.notifyBeforeDays || 14,
    avatarDataUrl: user.avatarDataUrl || ""
  });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [deleteForm, setDeleteForm] = useState({ password: "", confirmation: "" });
  const [profileSection, setProfileSection] = useState("overview");

  useEffect(() => {
    if (user.role !== "student") return;
    let active = true;
    api.myApplications()
      .then((data) => {
        if (active) setApplicationDocs((data.applications || []).flatMap((app) => app.documents || []));
      })
      .catch(() => {
        if (active) setApplicationDocs([]);
      });
    return () => {
      active = false;
    };
  }, [user.id, user.role]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    if (name === "bacAverage" && value && !/^\d{0,2}([.,]\d{0,2})?$/.test(value)) return;
    if (name === "languageResults" && hasLongDecimalScore(value)) return;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updatePasswordField(event) {
    setPasswordForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateDeleteField(event) {
    setDeleteForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onToast("Alege o imagine JPG, PNG sau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onToast("Poza trebuie să fie sub 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const avatarDataUrl = await resizeAvatar(String(reader.result || ""));
        setForm((current) => ({ ...current, avatarDataUrl }));
      } catch {
        onToast("Nu am putut optimiza imaginea.");
      }
    };
    reader.onerror = () => onToast("Nu am putut citi imaginea.");
    reader.readAsDataURL(file);
  }

  function clearAvatar() {
    setForm((current) => ({ ...current, avatarDataUrl: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        bacAverage: form.bacAverage === "" ? null : Math.round(Number(String(form.bacAverage).replace(",", ".")) * 100) / 100,
        notifyBeforeDays: Number(form.notifyBeforeDays),
        interests: form.interests.split(",").map((item) => item.trim()).filter(Boolean)
      };
      const data = await api.updateProfile(payload);
      onUser(data.user);
      onToast("Profil salvat.");
    } catch (error) {
      onToast(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    try {
      await api.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      onToast("Parola a fost schimbată.");
    } catch (error) {
      onToast(error.message);
    }
  }

  async function deleteAccount(event) {
    event.preventDefault();
    if (!window.confirm("Contul și datele asociate vor fi șterse definitiv. Continui?")) return;
    try {
      await api.deleteAccount(deleteForm);
      onToast("Cont șters.");
      await onLogout({ localOnly: true });
    } catch (error) {
      onToast(error.message);
    }
  }

  async function submitAccount(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await api.updateProfile({
        name: form.name,
        emailNotifications: form.emailNotifications,
        notifyBeforeDays: Number(form.notifyBeforeDays),
        avatarDataUrl: form.avatarDataUrl
      });
      onUser(data.user);
      onToast("Cont salvat.");
    } catch (error) {
      onToast(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (user.role !== "student") {
    const isUniversity = user.role === "university";
    return (
      <section className="unitrack-page profile-page account-page">
        <div className="page-heading">
          <div>
            <h1>{isUniversity ? "Profil universitate" : "Profil administrator"}</h1>
            <p>{isUniversity ? "Setări pentru contul de admitere al universității." : "Setări pentru contul de administrare UniTrack."}</p>
          </div>
        </div>

        <nav className="profile-tabs" aria-label="Secțiuni profil">
          <button className={profileSection === "overview" ? "active" : ""} type="button" onClick={() => setProfileSection("overview")}>Cont</button>
          <button className={profileSection === "security" ? "active" : ""} type="button" onClick={() => setProfileSection("security")}>Securitate</button>
        </nav>

        {profileSection === "overview" && isUniversity && user.institution && (
          <section className="profile-panel account-context-panel">
            <h2>Workspace asociat</h2>
            <div className="institution-preview">
              <strong>{user.institution.name}</strong>
              <span>{user.institution.shortName} · cont de evaluare aplicații</span>
            </div>
            <p className="muted">Prezentarea publică, linkul oficial și aplicațiile primite se gestionează din pagina „Aplicații primite”.</p>
          </section>
        )}

        {profileSection === "overview" && <form className="profile-stack" onSubmit={submitAccount}>
          <section className="profile-panel">
            <h2>Informații cont</h2>
            <ProfilePhotoEditor value={form.avatarDataUrl} name={form.name || user.name} onFile={updateAvatar} onClear={clearAvatar} />
            <div className="profile-form">
              <label>
                Nume afișat
                <input name="name" value={form.name} onChange={updateField} required />
              </label>
              <label>
                Email
                <input value={user.email} disabled />
              </label>
            </div>
          </section>
          <section className="profile-panel">
            <h2>Notificări</h2>
            <div className="profile-form">
              <label className="switch-row">
                <input type="checkbox" name="emailNotifications" checked={form.emailNotifications} onChange={updateField} />
                Trimite notificări pentru aplicații și deadline-uri
              </label>
              <label>
                Reminder cu zile înainte
                <input name="notifyBeforeDays" type="number" min="1" max="60" value={form.notifyBeforeDays} onChange={updateField} />
              </label>
            </div>
          </section>
          <div className="profile-actions">
            <button className="primary-button" type="submit" disabled={saving}><Save size={18} /> {saving ? "Se salvează..." : "Salvează cont"}</button>
          </div>
        </form>}

        {profileSection === "security" && <section className="profile-panel security-panel">
          <h2><KeyRound size={17} /> Securitate cont</h2>
          <form className="profile-form" onSubmit={changePassword}>
            <label>
              Parola curentă
              <input name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={updatePasswordField} required />
            </label>
            <label>
              Parola nouă
              <input name="newPassword" type="password" minLength={8} value={passwordForm.newPassword} onChange={updatePasswordField} required />
            </label>
            <div className="profile-actions inline-actions">
              <button className="soft-button" type="submit"><KeyRound size={17} /> Schimbă parola</button>
              <button className="soft-button" type="button" onClick={onLogout}><LogOut size={17} /> Deconectare</button>
            </div>
          </form>
        </section>}

        {profileSection === "security" && <PasskeyPanel onToast={onToast} />}

        {profileSection === "security" && <section className="profile-panel danger-panel">
          <h2><AlertTriangle size={17} /> Zonă periculoasă</h2>
          <p className="muted">Ștergerea contului elimină accesul și datele asociate. Ultimul cont admin nu poate fi șters.</p>
          <form className="profile-form" onSubmit={deleteAccount}>
            <label>
              Parola
              <input name="password" type="password" value={deleteForm.password} onChange={updateDeleteField} required />
            </label>
            <label>
              Confirmare
              <input name="confirmation" value={deleteForm.confirmation} onChange={updateDeleteField} placeholder="STERG CONTUL" required />
            </label>
            <div className="profile-actions inline-actions">
              <button className="danger-button" type="submit"><Trash2 size={17} /> Șterge contul definitiv</button>
            </div>
          </form>
        </section>}
      </section>
    );
  }

  return (
    <section className="unitrack-page profile-page">
      <div className="page-heading">
        <div>
          <h1>Profilul meu</h1>
          <p>Date personale, rezultate verificate și securitatea contului.</p>
        </div>
      </div>

      <nav className="profile-tabs" aria-label="Secțiuni profil">
        <button className={profileSection === "overview" ? "active" : ""} type="button" onClick={() => setProfileSection("overview")}>Rezumat</button>
        <button className={profileSection === "details" ? "active" : ""} type="button" onClick={() => setProfileSection("details")}>Date și rezultate</button>
        <button className={profileSection === "security" ? "active" : ""} type="button" onClick={() => setProfileSection("security")}>Securitate</button>
      </nav>

      {profileSection === "overview" && <>
      <section className="profile-hero">
        <div className="profile-hero-main">
          <h2>{user.name}</h2>
          <p>Notele și certificatele sunt folosite în aplicații numai după verificarea documentelor.</p>
        </div>
        <div className="readiness-card">
          <span>Scor pregătire</span>
          <strong>{readinessScore}%</strong>
          <div className="readiness-track"><i style={{ width: `${readinessScore}%` }} /></div>
          <small>{requiredMissing ? `${requiredMissing} documente obligatorii lipsă` : "Dosarele din tracker arată complet"}</small>
        </div>
      </section>

      <section className="profile-insights">
        <article className={hasAcademicEvidence ? "ok" : "warn"}>
          <FileCheck2 size={18} />
          <strong>{hasAcademicEvidence ? "Note validate" : "Note blocate"}</strong>
          <span>{hasAcademicEvidence ? "BAC / foaie matricolă verificată" : "Încarcă dovada înainte să modifici media"}</span>
        </article>
        <article className={hasLanguageEvidence ? "ok" : "warn"}>
          <Target size={18} />
          <strong>{hasLanguageEvidence ? "Limbi validate" : "Certificat necesar"}</strong>
          <span>{hasLanguageEvidence ? "Scorurile pot fi folosite în aplicații" : "IELTS/TOEFL se salvează după document"}</span>
        </article>
        <article>
          <BellRing size={18} />
          <strong>{user.emailNotifications ? "Reminder activ" : "Reminder oprit"}</strong>
          <span>{nextDeadline ? `Următorul deadline: ${nextDeadline.name} în ${nextDeadline.daysUntilDeadline} zile` : "Nu ai deadline-uri active"}</span>
        </article>
        <article>
          <Mail size={18} />
          <strong>{verifiedDocs.length}/{allDocs.length || 0}</strong>
          <span>documente verificate în tracker și aplicații</span>
        </article>
      </section>

      <section className="accepted-panel">
        <h2><CheckCircle2 size={17} /> Universități acceptate</h2>
        {accepted.length === 0 && <p className="muted">Încă nu ai universități acceptate.</p>}
        {accepted.map((uni) => (
          <article key={uni.id}>
            <span className="uni-logo tone-success">{shortName(uni)}</span>
            <span>
              <strong>{uni.name}</strong>
              <small>{uni.program} · {countryCode(uni)} {uni.country}</small>
            </span>
            <strong className="accepted-status">Acceptat ✓</strong>
          </article>
        ))}
      </section>
      </>}

      {profileSection === "details" && <>
      <form className="profile-stack" onSubmit={submit}>
        <section className="profile-panel">
          <h2>Informații personale</h2>
          <ProfilePhotoEditor value={form.avatarDataUrl} name={form.name || user.name} onFile={updateAvatar} onClear={clearAvatar} />
          <div className="profile-form">
            <label>
              Nume complet
              <input name="name" value={form.name} onChange={updateField} required />
            </label>
            <label>
              Email
              <input value={user.email} disabled />
            </label>
          </div>
        </section>
        <section className="profile-panel">
          <h2>Rezultate academice</h2>
          <p className="muted">Media și scorurile se pot salva doar după ce documentele atestatoare sunt verificate în dosar. Nu acceptăm valori introduse fără dovadă.</p>
          <div className="evidence-strip">
            <span className={hasAcademicEvidence ? "ok" : "blocked"}>{hasAcademicEvidence ? "Dovadă BAC verificată" : "Încarcă și verifică Diplomă BAC / Foaie matricolă"}</span>
            <span className={hasLanguageEvidence ? "ok" : "blocked"}>{hasLanguageEvidence ? "Certificat limbă verificat" : "Certificat limbă necesar pentru IELTS/TOEFL"}</span>
          </div>
          <div className="profile-form three">
            <label>
              Medie BAC
              <input name="bacAverage" type="number" min="1" max="10" step="0.01" value={form.bacAverage} onChange={updateField} disabled={!hasAcademicEvidence} />
            </label>
            <label>
              Scor IELTS
              <input name="languageResults" value={form.languageResults} onChange={updateField} disabled={!hasLanguageEvidence} placeholder="ex. IELTS 7.5 / TOEFL 100" />
            </label>
            <label>
              Dovadă necesară
              <input value="Diplomă BAC / Foaie matricolă / Certificat limbă verificat" disabled />
            </label>
            <label className="wide">
              Domenii de interes
              <input name="interests" value={form.interests} onChange={updateField} placeholder="Informatică, Medicină, Business" />
            </label>
          </div>
        </section>
        <section className="profile-panel">
          <h2>Notificări email</h2>
          <div className="profile-form">
            <label className="switch-row">
              <input type="checkbox" name="emailNotifications" checked={form.emailNotifications} onChange={updateField} />
              Trimite reminder pentru deadline-uri
            </label>
            <label>
              Reminder cu zile înainte
              <input name="notifyBeforeDays" type="number" min="1" max="60" value={form.notifyBeforeDays} onChange={updateField} />
            </label>
          </div>
        </section>
        <div className="profile-actions">
          <button className="primary-button" type="submit" disabled={saving}><Save size={18} /> {saving ? "Se salvează..." : "Salvează profil"}</button>
        </div>
      </form>

      </>}

      {profileSection === "security" && <>
      <section className="profile-panel security-panel">
        <h2><KeyRound size={17} /> Securitate cont</h2>
        <form className="profile-form" onSubmit={changePassword}>
          <label>
            Parola curentă
            <input name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={updatePasswordField} required />
          </label>
          <label>
            Parola nouă
            <input name="newPassword" type="password" minLength={8} value={passwordForm.newPassword} onChange={updatePasswordField} required />
          </label>
          <div className="profile-actions inline-actions">
            <button className="soft-button" type="submit"><KeyRound size={17} /> Schimbă parola</button>
            <button className="soft-button" type="button" onClick={onLogout}><LogOut size={17} /> Deconectare</button>
          </div>
        </form>
      </section>

      <PasskeyPanel onToast={onToast} />

      <section className="profile-panel danger-panel">
        <h2><AlertTriangle size={17} /> Zonă periculoasă</h2>
        <p className="muted">Ștergerea contului elimină profilul, aplicațiile, documentele și notificările asociate. Pentru admini, ultimul cont admin nu poate fi șters.</p>
        <form className="profile-form" onSubmit={deleteAccount}>
          <label>
            Parola
            <input name="password" type="password" value={deleteForm.password} onChange={updateDeleteField} required />
          </label>
          <label>
            Confirmare
            <input name="confirmation" value={deleteForm.confirmation} onChange={updateDeleteField} placeholder="STERG CONTUL" required />
          </label>
          <div className="profile-actions inline-actions">
            <button className="danger-button" type="submit"><Trash2 size={17} /> Șterge contul definitiv</button>
          </div>
        </form>
      </section>
      </>}
    </section>
  );
}

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, KeyRound, Link2, LogOut, Save, Trash2 } from "lucide-react";
import { api } from "../services/api.js";
import { StatCards } from "../components/StatCards.jsx";

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function countryCode(university) {
  return university.countryCode || (university.country === "România" || university.country === "Romania" ? "RO" : university.country.slice(0, 2).toUpperCase());
}

export function Profile({ user, universities = [], stats, onUser, onLogout, onToast }) {
  const accepted = universities.filter((uni) => uni.status === "Acceptat");
  const publicProfileUrl = new URL(`public/${user.publicShareId}`, window.location.href).toString();
  const [form, setForm] = useState({
    name: user.name || "",
    bacAverage: user.bacAverage ?? "",
    languageResults: user.languageResults || "",
    interests: (user.interests || []).join(", "),
    emailNotifications: user.emailNotifications,
    notifyBeforeDays: user.notifyBeforeDays || 14
  });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [deleteForm, setDeleteForm] = useState({ password: "", confirmation: "" });

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updatePasswordField(event) {
    setPasswordForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateDeleteField(event) {
    setDeleteForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        bacAverage: form.bacAverage === "" ? null : Number(form.bacAverage),
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

  async function rotateLink() {
    const data = await api.rotateShareLink();
    onUser({ ...user, publicShareId: data.publicShareId });
    onToast("Link public regenerat.");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicProfileUrl);
    onToast("Link copiat.");
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

  return (
    <section className="unitrack-page profile-page">
      <div className="page-heading">
        <div>
          <h1>Profilul meu</h1>
          <p>Completează profilul pentru a urmări progresul aplicațiilor tale</p>
        </div>
      </div>
      <StatCards stats={stats} />

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

      <form className="profile-stack" onSubmit={submit}>
        <section className="profile-panel">
          <h2>Informații personale</h2>
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
          <p className="muted">Media și scorurile se pot salva doar după ce documentele atestatoare sunt verificate în dosar.</p>
          <div className="profile-form three">
            <label>
              Medie BAC
              <input name="bacAverage" type="number" min="1" max="10" step="0.01" value={form.bacAverage} onChange={updateField} />
            </label>
            <label>
              Scor IELTS
              <input name="languageResults" value={form.languageResults} onChange={updateField} />
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

      <section className="share-panel">
        <h2>Profil public</h2>
        <p>{publicProfileUrl}</p>
        <div className="export-row">
          <button className="soft-button" type="button" onClick={copyLink}><Copy size={17} /> Copiază</button>
          <button className="soft-button" type="button" onClick={rotateLink}><Link2 size={17} /> Regenerează</button>
        </div>
      </section>

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
    </section>
  );
}

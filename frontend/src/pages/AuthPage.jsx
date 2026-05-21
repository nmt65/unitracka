import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, GraduationCap, Languages, Lock, Mail, Moon, RotateCcw, ShieldCheck, Sun, UserPlus } from "lucide-react";
import { api } from "../services/api.js";

const demoAccounts = [
  { label: "Student", email: "andrei@unitracker.ro", password: "Demo1234!" },
  { label: "Admin", email: "admin@unitracker.ro", password: "Demo1234!" },
  { label: "Universitate", email: "admitere@unibuc.ro", password: "Demo1234!" }
];

const showDemoAccounts = import.meta.env.DEV || import.meta.env.VITE_STATIC_MODE === "true";

function passwordScore(password) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
}

export function AuthPage({ onLogin, onRegister, checkingSession = false, darkMode = true, onToggleTheme, language = "ro", onToggleLanguage }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    cnp: "",
    resetToken: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cnpStatus, setCnpStatus] = useState(null);

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get("reset_token");
    if (!resetToken) return;
    setMode("reset");
    setForm((current) => ({ ...current, resetToken }));
  }, []);

  useEffect(() => {
    if (mode !== "register" || form.cnp.length < 13) {
      setCnpStatus(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      setCnpStatus({ state: "checking", message: "Verific CNP-ul..." });
      try {
        const result = await api.checkCnp({ cnp: form.cnp });
        setCnpStatus(result.available
          ? { state: "ok", message: `CNP valid, cont disponibil. Ultimele cifre: ${result.last4}` }
          : { state: "error", message: "Există deja un cont pentru acest CNP." });
      } catch (err) {
        setCnpStatus({ state: "error", message: err.message });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [form.cnp, mode]);

  const strength = useMemo(() => passwordScore(form.password), [form.password]);
  const strengthLabel = ["Slabă", "Slabă", "Medie", "Bună", "Puternică", "Foarte puternică"][strength];

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function fillDemo(account) {
    setMode("login");
    setError("");
    setNotice("");
    setForm((current) => ({ ...current, email: account.email, password: account.password }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") await onLogin({ email: form.email, password: form.password });
      if (mode === "register") {
        await onRegister({
          email: form.email,
          password: form.password,
          name: form.name,
          role: "student",
          cnp: form.cnp
        });
      }
      if (mode === "forgot") {
        const data = await api.forgotPassword({ email: form.email });
        if (data.mailConfigured === false) {
          setError("Emailul de resetare nu poate fi trimis încă: SMTP nu este configurat pe server.");
        } else {
          setNotice(data.resetToken ? `Token resetare local: ${data.resetToken}` : data.message);
        }
      }
      if (mode === "reset") {
        await api.resetPassword({ token: form.resetToken, password: form.password });
        setMode("login");
        setNotice("Parola a fost resetată. Te poți autentifica.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <button
        className="auth-theme-toggle"
        type="button"
        onClick={onToggleTheme}
        aria-label={darkMode ? "Activează tema luminoasă" : "Activează tema întunecată"}
        title={darkMode ? "Tema luminoasă" : "Tema întunecată"}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button className="auth-language-toggle" type="button" onClick={onToggleLanguage} aria-label="Schimbă limba" title="RO / EN">
        <Languages size={17} />
        <span>{language === "ro" ? "EN" : "RO"}</span>
      </button>
      <section className="auth-shell">
        <div className="auth-visual">
          <div className="brand large"><span className="brand-dot" /> UniTrack</div>
          <GraduationCap size={72} />
          <h1>Portal complet pentru admitere.</h1>
          <p>Cont unic per CNP, workspace pentru universități, verificare documente cu AI și statusuri urmărite cap-coadă.</p>
          <div className="auth-proof-list" aria-label="Capabilități platformă">
            <span><ShieldCheck size={16} /> CNP hash-uit, fără stocare în clar</span>
            <span><CheckCircle2 size={16} /> RLS, CSRF, rate-limit și validare server</span>
            <span><CheckCircle2 size={16} /> Exporturi, notificări și workspace admitere</span>
          </div>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">Acces securizat</p>
            <h2>{mode === "login" ? "Intră în cont" : mode === "register" ? "Creează cont" : mode === "forgot" ? "Recuperare parolă" : "Resetare parolă"}</h2>
            {checkingSession && <p className="auth-meta">Inițializăm conexiunea securizată în fundal.</p>}
          </div>
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Cont nou</button>
          </div>
          {mode === "register" && (
            <>
              <p className="field-note ok">Conturile de universitate sunt create de admin după aprobarea instituției.</p>
              <label>
                Nume
                <span className="input-icon"><UserPlus size={17} /><input name="name" value={form.name} onChange={updateField} required /></span>
              </label>
              <label>
                CNP
                <input name="cnp" value={form.cnp} onChange={updateField} placeholder="13 cifre" inputMode="numeric" pattern="[0-9]{13}" maxLength="13" required />
                {cnpStatus && <small className={`field-note ${cnpStatus.state}`} aria-live="polite">{cnpStatus.message}</small>}
              </label>
            </>
          )}
          <label>
            Email
            <span className="input-icon"><Mail size={17} /><input name="email" type="email" value={form.email} onChange={updateField} required /></span>
          </label>
          {mode === "reset" && (
            <label>
              Token resetare
              <span className="input-icon"><RotateCcw size={17} /><input name="resetToken" value={form.resetToken} onChange={updateField} required /></span>
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Parola
              <span className="input-icon with-action">
                <Lock size={17} />
                <input name="password" type={showPassword ? "text" : "password"} minLength={mode === "login" ? 1 : 8} value={form.password} onChange={updateField} required />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                  title={showPassword ? "Ascunde parola" : "Arată parola"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              {mode !== "login" && form.password && (
                <span className="password-meter" aria-live="polite">
                  <span style={{ width: `${Math.max(strength, 1) * 20}%` }} />
                  <small>Parolă {strengthLabel.toLowerCase()}</small>
                </span>
              )}
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="success-note">{notice}</p>}
          <button className="primary-button full" type="submit" disabled={loading}>
            {loading ? "Se verifică..." : mode === "login" ? "Intră în cont" : mode === "register" ? "Creează cont" : mode === "forgot" ? "Trimite resetare" : "Resetează parola"}
          </button>
          <div className="auth-links">
            <button type="button" onClick={() => setMode("forgot")}>Parolă pierdută</button>
          </div>
          {showDemoAccounts && (
            <>
              <div className="auth-demo-grid" aria-label="Conturi demo">
                {demoAccounts.map((account) => (
                  <button key={account.email} type="button" onClick={() => fillDemo(account)}>
                    <strong>{account.label}</strong>
                    <small>{account.email}</small>
                  </button>
                ))}
              </div>
              <p className="auth-meta">Conturile demo apar doar în dezvoltare sau în build-ul static.</p>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

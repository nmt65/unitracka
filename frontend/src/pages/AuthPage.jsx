import { useEffect, useMemo, useState } from "react";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import { CheckCircle2, Eye, EyeOff, Fingerprint, GraduationCap, Languages, Lock, Mail, Moon, RotateCcw, ShieldCheck, Sun, UserPlus } from "lucide-react";
import { api } from "../services/api.js";
import { t } from "../i18n.js";

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

export function AuthPage({ onLogin, onRegister, onAuthenticated, checkingSession = false, darkMode = false, onToggleTheme, language = "ro", onToggleLanguage }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    cnp: "",
    resetToken: "",
    verificationCode: "",
    acceptedPrivacyPolicy: false
  });
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
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
      setCnpStatus({ state: "checking", message: t("Verific CNP-ul...", language) });
      try {
        const result = await api.checkCnp({ cnp: form.cnp });
        setCnpStatus(result.available
          ? { state: "ok", message: `${t("CNP valid, cont disponibil.", language)} ${t("Ultimele cifre", language)}: ${result.last4}` }
          : { state: "error", message: t("Există deja un cont pentru acest CNP.", language) });
      } catch (err) {
        setCnpStatus({ state: "error", message: t(err.message, language) });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [form.cnp, language, mode]);

  const strength = useMemo(() => passwordScore(form.password), [form.password]);
  const strengthLabel = useMemo(() => t(["Slabă", "Slabă", "Medie", "Bună", "Puternică", "Foarte puternică"][strength], language), [language, strength]);
  const passwordLabel = `${t("Parolă", language)} ${strengthLabel.toLowerCase()}`;
  const passkeySupported = typeof window !== "undefined" && browserSupportsWebAuthn();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function fillDemo(account) {
    setMode("login");
    setError("");
    setNotice("");
    setForm((current) => ({ ...current, email: account.email, password: account.password }));
  }

  function openVerification(data) {
    setMode("verify");
    setForm((current) => ({
      ...current,
      email: data.email || current.email,
      password: "",
      verificationCode: data.verificationCode || ""
    }));
    if (data.verificationCode) {
      setNotice(`Cod local: ${data.verificationCode}`);
    } else if (data.mailSent) {
      setNotice("Ți-am trimis un cod de 6 cifre pe email.");
    } else {
      setError(data.mailReason || "Codul a fost generat, dar emailul nu a putut fi trimis.");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        const data = await onLogin({ email: form.email, password: form.password });
        if (data?.verificationRequired) openVerification(data);
      }
      if (mode === "register") {
        const data = await onRegister({
          email: form.email,
          password: form.password,
          name: form.name,
          role: "student",
          cnp: form.cnp,
          acceptedPrivacyPolicy: form.acceptedPrivacyPolicy
        });
        if (data?.verificationRequired) openVerification(data);
      }
      if (mode === "forgot") {
        const data = await api.forgotPassword({ email: form.email });
        if (data.resetToken) {
          setForm((current) => ({ ...current, resetToken: data.resetToken, password: "" }));
          setMode("reset");
          setNotice(`Cod resetare local: ${data.resetToken}`);
        } else if (data.mailConfigured === false) {
          setNotice(t("Dacă emailul există, am pregătit resetarea. Dacă nu primești mesajul, administratorul trebuie să verifice configurarea emailului.", language));
        } else if (data.mailSent === false && data.mailReason) {
          setError(data.mailReason);
        } else {
          setNotice(data.message);
        }
      }
      if (mode === "reset") {
        await api.resetPassword({ token: form.resetToken, password: form.password });
        setMode("login");
        window.history.replaceState({}, "", window.location.pathname);
        setNotice(t("Parola a fost resetată. Te poți autentifica.", language));
      }
      if (mode === "verify") {
        const data = await api.verifyEmail({ email: form.email, code: form.verificationCode });
        onAuthenticated(data.user);
      }
    } catch (err) {
      setError(t(err.message, language));
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const data = await api.resendEmailVerification({ email: form.email });
      if (data.verificationCode) {
        setForm((current) => ({ ...current, verificationCode: data.verificationCode }));
        setNotice(`Cod local: ${data.verificationCode}`);
      } else if (data.mailSent === false && data.mailReason) {
        setError(data.mailReason);
      } else {
        setNotice(data.message);
      }
    } catch (err) {
      setError(t(err.message, language));
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPasskey() {
    if (!form.email) {
      setError("Introdu mai întâi adresa de email.");
      return;
    }
    setPasskeyLoading(true);
    setError("");
    setNotice("");
    try {
      const optionsJSON = await api.passkeyAuthenticationOptions({ email: form.email });
      const response = await startAuthentication({ optionsJSON });
      const data = await api.passkeyAuthenticationVerification({ email: form.email, response });
      onAuthenticated(data.user);
    } catch (err) {
      if (err?.name !== "NotAllowedError") setError(t(err.message, language));
    } finally {
      setPasskeyLoading(false);
    }
  }

  const authTitle = mode === "login"
    ? "Intră în cont"
    : mode === "register"
      ? "Creează cont"
      : mode === "forgot"
        ? "Recuperare parolă"
        : mode === "verify"
          ? "Verifică emailul"
          : "Resetare parolă";

  return (
    <main className="auth-page">
      <button
        className="auth-theme-toggle"
        type="button"
        onClick={onToggleTheme}
        aria-label={t(darkMode ? "Activează tema luminoasă" : "Activează tema întunecată", language)}
        title={t(darkMode ? "Tema luminoasă" : "Tema întunecată", language)}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button className="auth-language-toggle" type="button" onClick={onToggleLanguage} aria-label={t("Schimbă limba", language)} title="RO / EN">
        <Languages size={17} />
        <span>{language === "ro" ? "EN" : "RO"}</span>
      </button>
      <section className="auth-shell">
        <div className="auth-visual">
          <div className="brand large"><span className="brand-dot" /> UniTrack</div>
          <GraduationCap size={72} />
          <h1>{t("Admitere, dosare și statusuri într-un singur loc.", language)}</h1>
          <p>{t("Cont unic per CNP, universități aprobate, documente verificate și aplicații urmărite până la răspuns.", language)}</p>
          <div className="auth-proof-list" aria-label={t("Capabilități platformă", language)}>
            <span><ShieldCheck size={16} /> {t("CNP hash-uit, fără stocare în clar", language)}</span>
            <span><CheckCircle2 size={16} /> {t("RLS, CSRF, rate-limit și validare server", language)}</span>
            <span><CheckCircle2 size={16} /> {t("Exporturi, notificări și workspace admitere", language)}</span>
          </div>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">{t("Acces securizat", language)}</p>
            <h2>{t(authTitle, language)}</h2>
            {checkingSession && <p className="auth-meta">{t("Inițializăm conexiunea securizată în fundal.", language)}</p>}
            {mode === "verify" && <p className="auth-meta">Am trimis codul către <strong>{form.email}</strong>. Verificarea este necesară o singură dată.</p>}
          </div>
          {(mode === "login" || mode === "register") && (
            <div className="segmented">
              <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
              <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>{t("Cont nou", language)}</button>
            </div>
          )}
          {mode === "register" && (
            <>
              <p className="field-note ok">{t("Conturile de universitate sunt create de admin după aprobarea instituției.", language)}</p>
              <label>
                {t("Nume", language)}
                <span className="input-icon"><UserPlus size={17} /><input name="name" value={form.name} onChange={updateField} required /></span>
              </label>
              <label>
                CNP
                <input name="cnp" value={form.cnp} onChange={updateField} placeholder={t("13 cifre", language)} inputMode="numeric" pattern="[0-9]{13}" maxLength="13" required />
                {cnpStatus && <small className={`field-note ${cnpStatus.state}`} aria-live="polite">{cnpStatus.message}</small>}
              </label>
            </>
          )}
          {["login", "register", "forgot"].includes(mode) && (
            <label>
              Email
              <span className="input-icon"><Mail size={17} /><input name="email" type="email" autoComplete={mode === "login" ? "username webauthn" : "email"} value={form.email} onChange={updateField} required /></span>
            </label>
          )}
          {mode === "verify" && (
            <label>
              Cod de verificare
              <span className="input-icon verification-code-input">
                <ShieldCheck size={17} />
                <input
                  name="verificationCode"
                  value={form.verificationCode}
                  onChange={updateField}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </span>
            </label>
          )}
          {mode === "reset" && (
            <label>
              {t("Cod resetare", language)}
              <span className="input-icon"><RotateCcw size={17} /><input name="resetToken" value={form.resetToken} onChange={updateField} required /></span>
            </label>
          )}
          {mode !== "forgot" && mode !== "verify" && (
            <label>
              {t("Parola", language)}
              <span className="input-icon with-action">
                <Lock size={17} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "login" ? 1 : 8}
                  value={form.password}
                  onChange={updateField}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={t(showPassword ? "Ascunde parola" : "Arată parola", language)}
                  title={t(showPassword ? "Ascunde parola" : "Arată parola", language)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              {mode !== "login" && form.password && (
                <span className={`password-meter score-${strength}`} aria-live="polite">
                  <span style={{ width: `${Math.max(strength, 1) * 20}%` }} />
                  <small>{passwordLabel}</small>
                </span>
              )}
            </label>
          )}
          {mode === "register" && (
            <label className="auth-consent">
              <input
                name="acceptedPrivacyPolicy"
                type="checkbox"
                checked={form.acceptedPrivacyPolicy}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  acceptedPrivacyPolicy: event.target.checked
                }))}
                required
              />
              <span>{t("Accept politica de confidențialitate și prelucrarea datelor necesare dosarului.", language)}</span>
            </label>
          )}
          {error && <p className="form-error">{t(error, language)}</p>}
          {notice && <p className="success-note">{t(notice, language)}</p>}
          <button className="primary-button full" type="submit" disabled={loading}>
            {loading
              ? t("Se verifică...", language)
              : t(mode === "login"
                ? "Intră în cont"
                : mode === "register"
                  ? "Creează cont"
                  : mode === "forgot"
                    ? "Trimite resetare"
                    : mode === "verify"
                      ? "Confirmă codul"
                      : "Resetează parola", language)}
          </button>
          {mode === "login" && passkeySupported && (
            <button className="passkey-button full" type="button" onClick={loginWithPasskey} disabled={passkeyLoading}>
              <Fingerprint size={19} />
              {passkeyLoading ? "Se deschide passkey..." : "Intră cu passkey"}
            </button>
          )}
          <div className="auth-links">
            {mode === "login" && <button type="button" onClick={() => setMode("forgot")}>{t("Parolă pierdută", language)}</button>}
            {mode === "verify" && <button type="button" onClick={resendVerification} disabled={loading}>Retrimite codul</button>}
            {!["login", "register"].includes(mode) && <button type="button" onClick={() => setMode("login")}>Înapoi la login</button>}
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

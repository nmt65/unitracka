import { ArrowRight, Building2, Check, FileCheck2, GraduationCap, Languages, ShieldCheck } from "lucide-react";
import { t } from "../i18n.js";

const workflow = [
  { number: "01", title: "Alegi programul", text: "Cauți și compari ofertele educaționale relevante." },
  { number: "02", title: "Pregătești dosarul", text: "Documentele sunt organizate și verificate înainte de trimitere." },
  { number: "03", title: "Urmărești admiterea", text: "Studentul și universitatea lucrează în același flux." }
];

export function LandingPage({ onLogin, onRegister, language = "ro", onToggleLanguage }) {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label={t("UniTrack, început", language)}>
          <span><GraduationCap size={20} /></span>
          <strong>UniTrack</strong>
        </a>
        <nav aria-label={t("Navigare prezentare", language)}>
          <a href="#workflow">{t("Cum funcționează", language)}</a>
          <a href="#roles">{t("Pentru cine", language)}</a>
        </nav>
        <div className="landing-nav-actions">
          <button
            className="landing-language"
            type="button"
            onClick={onToggleLanguage}
            aria-label={t("Schimbă limba", language)}
            title={t("Schimbă limba", language)}
          >
            <Languages size={16} />
            <span>{language === "ro" ? "EN" : "RO"}</span>
          </button>
          <button className="landing-login" type="button" onClick={onLogin}>
            <span className="landing-login-full">{t("Autentificare", language)}</span>
            <span className="landing-login-short">{t("Intră", language)}</span>
          </button>
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-media" aria-hidden="true" />
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <p className="landing-kicker">{t("Platformă unificată pentru admitere", language)}</p>
          <h1>{t("Dosarul tău universitar, de la alegere la admitere.", language)}</h1>
          <p>{t("Compară programe, verifică documente și urmărește fiecare candidatură într-un singur loc.", language)}</p>
          <div className="landing-actions">
            <button className="landing-primary" type="button" onClick={onRegister}>
              {t("Creează cont", language)} <ArrowRight size={18} />
            </button>
            <button className="landing-secondary" type="button" onClick={onLogin}>{t("Intră în platformă", language)}</button>
          </div>
          <ul className="landing-trust" aria-label={t("Avantaje principale", language)}>
            <li><Check size={16} /> {t("Cont student unic", language)}</li>
            <li><Check size={16} /> {t("Documente verificate", language)}</li>
            <li><Check size={16} /> {t("Date separate pe roluri", language)}</li>
          </ul>
        </div>
      </section>

      <section className="landing-section" id="workflow">
        <header className="landing-section-heading">
          <p>{t("Un singur proces", language)}</p>
          <h2>{t("Trei pași, fără dosare pierdute.", language)}</h2>
        </header>
        <div className="landing-workflow">
          {workflow.map((item) => (
            <article key={item.number}>
              <span>{item.number}</span>
              <h3>{t(item.title, language)}</h3>
              <p>{t(item.text, language)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-roles" id="roles">
        <div>
          <p className="landing-kicker">{t("Un flux comun, acces controlat", language)}</p>
          <h2>{t("Fiecare vede exact ce are de făcut.", language)}</h2>
        </div>
        <div className="landing-role-list">
          <article><GraduationCap size={22} /><strong>{t("Student", language)}</strong><span>{t("Catalog, dosar, comparații și statusuri.", language)}</span></article>
          <article><Building2 size={22} /><strong>{t("Universitate", language)}</strong><span>{t("Ofertă educațională și evaluarea candidaților.", language)}</span></article>
          <article><ShieldCheck size={22} /><strong>{t("Administrator", language)}</strong><span>{t("Instituții, conturi și control operațional.", language)}</span></article>
          <article><FileCheck2 size={22} /><strong>{t("Documente", language)}</strong><span>{t("Validare explicabilă și trasabilitate.", language)}</span></article>
        </div>
      </section>

      <footer className="landing-footer">
        <strong>UniTrack</strong>
        <span>{t("Admitere universitară organizată.", language)}</span>
        <button type="button" onClick={onRegister}>{t("Începe acum", language)} <ArrowRight size={16} /></button>
      </footer>
    </main>
  );
}

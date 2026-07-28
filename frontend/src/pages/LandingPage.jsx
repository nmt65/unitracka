import { ArrowRight, Building2, Check, FileCheck2, GraduationCap, ShieldCheck } from "lucide-react";

const workflow = [
  { number: "01", title: "Alegi programul", text: "Cauți și compari ofertele educaționale relevante." },
  { number: "02", title: "Pregătești dosarul", text: "Documentele sunt organizate și verificate înainte de trimitere." },
  { number: "03", title: "Urmărești admiterea", text: "Studentul și universitatea lucrează în același flux." }
];

export function LandingPage({ onLogin, onRegister }) {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="UniTrack, început">
          <span><GraduationCap size={20} /></span>
          <strong>UniTrack</strong>
        </a>
        <nav aria-label="Navigare prezentare">
          <a href="#workflow">Cum funcționează</a>
          <a href="#roles">Pentru cine</a>
        </nav>
        <button className="landing-login" type="button" onClick={onLogin}>
          <span className="landing-login-full">Autentificare</span>
          <span className="landing-login-short">Intră</span>
        </button>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-media" aria-hidden="true" />
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <p className="landing-kicker">Platformă unificată pentru admitere</p>
          <h1>Dosarul tău universitar, de la alegere la admitere.</h1>
          <p>Compară programe, verifică documente și urmărește fiecare candidatură într-un singur loc.</p>
          <div className="landing-actions">
            <button className="landing-primary" type="button" onClick={onRegister}>
              Creează cont <ArrowRight size={18} />
            </button>
            <button className="landing-secondary" type="button" onClick={onLogin}>Intră în platformă</button>
          </div>
          <ul className="landing-trust" aria-label="Avantaje principale">
            <li><Check size={16} /> Cont student unic</li>
            <li><Check size={16} /> Documente verificate</li>
            <li><Check size={16} /> Date separate pe roluri</li>
          </ul>
        </div>
      </section>

      <section className="landing-section" id="workflow">
        <header className="landing-section-heading">
          <p>Un singur proces</p>
          <h2>Trei pași, fără dosare pierdute.</h2>
        </header>
        <div className="landing-workflow">
          {workflow.map((item) => (
            <article key={item.number}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-roles" id="roles">
        <div>
          <p className="landing-kicker">Un flux comun, acces controlat</p>
          <h2>Fiecare vede exact ce are de făcut.</h2>
        </div>
        <div className="landing-role-list">
          <article><GraduationCap size={22} /><strong>Student</strong><span>Catalog, dosar, comparații și statusuri.</span></article>
          <article><Building2 size={22} /><strong>Universitate</strong><span>Ofertă educațională și evaluarea candidaților.</span></article>
          <article><ShieldCheck size={22} /><strong>Administrator</strong><span>Instituții, conturi și control operațional.</span></article>
          <article><FileCheck2 size={22} /><strong>Documente</strong><span>Validare explicabilă și trasabilitate.</span></article>
        </div>
      </section>

      <footer className="landing-footer">
        <strong>UniTrack</strong>
        <span>Admitere universitară organizată.</span>
        <button type="button" onClick={onRegister}>Începe acum <ArrowRight size={16} /></button>
      </footer>
    </main>
  );
}

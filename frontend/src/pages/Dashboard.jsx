import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardList, Compass, Flame, GraduationCap, Plus, Scale, Sparkles } from "lucide-react";
import { EmptyState } from "../components/EmptyState.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { StatCards } from "../components/StatCards.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { DeadlinePanel } from "../components/DeadlinePanel.jsx";
import { formatDate } from "../utils/date.js";

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function countryCode(university) {
  return university.countryCode || (university.country === "România" || university.country === "Romania" ? "RO" : university.country.slice(0, 2).toUpperCase());
}

function progressTone(value) {
  if (value >= 90) return "success";
  if (value >= 50) return "primary";
  if (value > 20) return "warning";
  return "danger";
}

export function Dashboard({ user, universities, stats, onAdd, onEdit, onManageUniversities, onNavigate }) {
  const [activeTab, setActiveTab] = useState("Toate");
  const firstName = user?.name?.split(" ")[0] || "Andrei";
  const addLabel = user?.role === "admin" ? "Adaugă universitate" : "Adaugă aplicație";
  const urgentCount = universities.filter((uni) => uni.daysUntilDeadline >= 0 && uni.daysUntilDeadline <= 14).length;
  const completedDocs = universities.reduce((sum, uni) => sum + (uni.documents?.filter((doc) => doc.isCompleted).length || 0), 0);
  const totalDocs = universities.reduce((sum, uni) => sum + (uni.documents?.length || 0), 0);
  const missingDocs = Math.max(0, totalDocs - completedDocs);
  const readinessScore = universities.length ? Math.round(universities.reduce((sum, uni) => sum + Number(uni.progress || 0), 0) / universities.length) : 0;
  const nextDeadline = (stats?.upcomingDeadlines || []).find((item) => item.daysUntilDeadline >= 0);
  const mostReady = [...universities].sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0))[0];
  const needsWork = [...universities]
    .filter((uni) => uni.status !== "Acceptat")
    .sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))[0];
  const nextAction = missingDocs
    ? `Începe cu ${needsWork?.name || "dosarul cu progres mic"}: mai sunt ${missingDocs} documente lipsă în tracker.`
    : nextDeadline
      ? `Dosarele arată bine. Următorul deadline: ${nextDeadline.name}, în ${nextDeadline.daysUntilDeadline} zile.`
      : "Ai dosarele pregătite. Poți compara opțiunile sau trimite o aplicație nouă.";
  const tabs = [
    ["Toate", universities.length],
    ["Wishlist", universities.filter((uni) => uni.status === "Wishlist").length],
    ["Cercetare", universities.filter((uni) => uni.status === "Cercetare").length],
    ["Aplicate", universities.filter((uni) => uni.status === "Aplicat").length],
    ["Acceptate", universities.filter((uni) => uni.status === "Acceptat").length],
    ["Respinse", universities.filter((uni) => uni.status === "Respins").length]
  ];
  const visibleUniversities = useMemo(() => {
    if (activeTab === "Toate") return universities;
    if (activeTab === "Acceptate") return universities.filter((uni) => uni.status === "Acceptat");
    if (activeTab === "Aplicate") return universities.filter((uni) => uni.status === "Aplicat");
    if (activeTab === "Respinse") return universities.filter((uni) => uni.status === "Respins");
    return universities.filter((uni) => uni.status === activeTab);
  }, [activeTab, universities]);

  return (
    <div className="dashboard-layout">
      <section className="main-column">
        <section className="student-hero">
          <div className="student-hero-copy">
            <span className="hero-kicker"><Sparkles size={16} /> Mission control</span>
            <h1>Bună, {firstName}</h1>
            <p>{nextAction}</p>
            <div className="student-hero-actions">
              <button className="primary-button" type="button" onClick={onAdd}><Plus size={18} /> {addLabel}</button>
              <button className="soft-button" type="button" onClick={() => onNavigate?.("documents")}><ClipboardList size={17} /> Verifică documente</button>
              <button className="soft-button" type="button" onClick={() => onNavigate?.("compare")}><Scale size={17} /> Compară opțiuni</button>
            </div>
          </div>
          <div className="readiness-card dashboard-readiness">
            <span>Scor pregătire</span>
            <strong>{readinessScore}%</strong>
            <div className="readiness-track"><i style={{ width: `${readinessScore}%` }} /></div>
            <small>{completedDocs}/{totalDocs || 0} documente pregătite</small>
          </div>
        </section>
        <section className="dashboard-action-grid">
          <button type="button" onClick={onManageUniversities}>
            <GraduationCap size={18} />
            <strong>{universities.length}</strong>
            <span>universități urmărite</span>
          </button>
          <button type="button" onClick={() => setActiveTab("Aplicate")}>
            <Compass size={18} />
            <strong>{tabs.find(([label]) => label === "Aplicate")?.[1] || 0}</strong>
            <span>aplicații trimise</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("documents")}>
            <ClipboardList size={18} />
            <strong>{missingDocs}</strong>
            <span>documente de rezolvat</span>
          </button>
          <button type="button" onClick={() => setActiveTab("Acceptate")}>
            <CheckCircle2 size={18} />
            <strong>{tabs.find(([label]) => label === "Acceptate")?.[1] || 0}</strong>
            <span>acceptări confirmate</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("calendar")}>
            <Flame size={18} />
            <strong>{urgentCount}</strong>
            <span>deadline-uri urgente</span>
          </button>
        </section>
        <StatCards stats={stats} />
        {universities.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <section className="applications-card">
            <header>
              <h2>Aplicațiile mele</h2>
              <button type="button" onClick={onManageUniversities}>Gestionează →</button>
            </header>
            <nav className="app-tabs" aria-label="Filtrare aplicații">
              {tabs.map(([label, count]) => (
                <button key={label} className={label === activeTab ? "active" : ""} type="button" onClick={() => setActiveTab(label)}>
                  {label} <span>{count}</span>
                </button>
              ))}
            </nav>
            {visibleUniversities.map((university) => (
              <button className="application-row" key={university.id} type="button" onClick={() => onEdit(university)}>
                <span className={`uni-logo tone-${progressTone(university.progress)}`}>{shortName(university)}</span>
                <span className="application-copy">
                  <strong>{university.name} <small>{countryCode(university)}</small></strong>
                  <small>{university.program} — {university.faculty}</small>
                  <span>
                    <StatusPill status={university.status} />
                    {university.daysUntilDeadline <= 14 ? (
                      <em><CalendarDays size={13} /> {university.daysUntilDeadline} zile rămase</em>
                    ) : (
                      <em><CalendarDays size={13} /> {formatDate(university.deadline)}</em>
                    )}
                  </span>
                </span>
                <span className="application-progress">
                  <ProgressBar value={university.progress} tone={progressTone(university.progress)} />
                  <strong>{university.progress}%</strong>
                  <small>{university.documents?.filter((doc) => doc.isCompleted).length || 0}/{university.documents?.length || 0} documente</small>
                </span>
              </button>
            ))}
            {visibleUniversities.length === 0 && (
              <div className="inline-empty compact">
                <strong>Nu există aplicații în filtrul {activeTab}.</strong>
                <span>Alege alt status sau adaugă o aplicație nouă.</span>
              </div>
            )}
          </section>
        )}
      </section>
      <div className="side-column">
        <section className="right-panel next-steps-panel">
          <h3>Plan rapid</h3>
          <div className="next-step-list">
            <button type="button" onClick={() => onNavigate?.("documents")}>
              <span>1</span>
              <strong>{missingDocs ? "Închide documentele lipsă" : "Documentele sunt în regulă"}</strong>
              <small>{missingDocs ? `${missingDocs} elemente rămase de verificat` : "Poți trece la comparație sau aplicații noi"}</small>
            </button>
            <button type="button" onClick={() => onNavigate?.("compare")}>
              <span>2</span>
              <strong>Compară realist opțiunile</strong>
              <small>{mostReady ? `${mostReady.name} este cel mai pregătit dosar` : "Alege 2-4 universități din catalog"}</small>
            </button>
            <button type="button" onClick={onAdd}>
              <span>3</span>
              <strong>Trimite următoarea aplicație</strong>
              <small>{nextDeadline ? `${nextDeadline.name}: ${nextDeadline.daysUntilDeadline} zile` : "Alege un program activ din catalog"}</small>
            </button>
          </div>
        </section>
        <DeadlinePanel items={stats?.upcomingDeadlines || []} />
      </div>
    </div>
  );
}

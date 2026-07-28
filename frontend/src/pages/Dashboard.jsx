import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, ClipboardList, GraduationCap, Plus, Send } from "lucide-react";
import { EmptyState } from "../components/EmptyState.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
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
  const completedDocs = universities.reduce((sum, uni) => sum + (uni.documents?.filter((doc) => doc.isCompleted).length || 0), 0);
  const totalDocs = universities.reduce((sum, uni) => sum + (uni.documents?.length || 0), 0);
  const missingDocs = Math.max(0, totalDocs - completedDocs);
  const readinessScore = universities.length ? Math.round(universities.reduce((sum, uni) => sum + Number(uni.progress || 0), 0) / universities.length) : 0;
  const nextDeadline = (stats?.upcomingDeadlines || []).find((item) => item.daysUntilDeadline >= 0);
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
  const appliedCount = tabs.find(([label]) => label === "Aplicate")?.[1] || 0;

  return (
    <div className="dashboard-layout">
      <section className="main-column">
        <header className="dashboard-header">
          <div>
            <h1>Bună, {firstName}</h1>
            <p>{nextAction}</p>
          </div>
          <div className="dashboard-header-actions">
            <button className="soft-button" type="button" onClick={() => onNavigate?.("documents")}><ClipboardList size={17} /> Documente</button>
            <button className="primary-button" type="button" onClick={onAdd}><Plus size={18} /> {addLabel}</button>
          </div>
        </header>

        <section className="dashboard-summary" aria-label="Rezumat aplicații">
          <button type="button" onClick={onManageUniversities}>
            <GraduationCap size={18} />
            <strong>{universities.length}</strong>
            <span>universități urmărite</span>
          </button>
          <button type="button" onClick={() => setActiveTab("Aplicate")}>
            <Send size={18} />
            <strong>{appliedCount}</strong>
            <span>aplicații trimise</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("documents")}>
            <ClipboardList size={18} />
            <strong>{missingDocs}</strong>
            <span>documente lipsă</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("profile")}>
            <span className="summary-progress-label">Pregătire dosar</span>
            <strong>{readinessScore}%</strong>
            <span>{completedDocs}/{totalDocs || 0} documente verificate</span>
            <i className="summary-progress-track"><b style={{ width: `${readinessScore}%` }} /></i>
          </button>
        </section>

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
                    {university.daysUntilDeadline < 0 ? (
                      <em className="deadline-expired"><CalendarDays size={13} /> Deadline expirat</em>
                    ) : university.daysUntilDeadline <= 14 ? (
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
        <section className="right-panel next-action-panel">
          <span>Următorul pas</span>
          <strong>{missingDocs ? "Completează documentele lipsă" : "Dosarele sunt pregătite"}</strong>
          <p>{missingDocs ? `${missingDocs} documente necesită atenție.` : nextDeadline ? `${nextDeadline.name}: ${nextDeadline.daysUntilDeadline} zile până la deadline.` : "Poți trimite o aplicație nouă."}</p>
          <button type="button" onClick={missingDocs ? () => onNavigate?.("documents") : onAdd}>
            {missingDocs ? "Deschide documentele" : "Adaugă aplicație"} <ArrowRight size={16} />
          </button>
        </section>
        <DeadlinePanel items={stats?.upcomingDeadlines || []} />
      </div>
    </div>
  );
}

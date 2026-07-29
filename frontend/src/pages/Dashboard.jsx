import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, ClipboardList, GraduationCap, Plus, Send } from "lucide-react";
import { EmptyState } from "../components/EmptyState.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { DeadlinePanel } from "../components/DeadlinePanel.jsx";
import { formatDate } from "../utils/date.js";
import { t } from "../i18n.js";

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

export function Dashboard({ user, universities, stats, onAdd, onEdit, onManageUniversities, onNavigate, language = "ro" }) {
  const [activeTab, setActiveTab] = useState("Toate");
  const firstName = user?.name?.split(" ")[0] || "Andrei";
  const addLabel = t(user?.role === "admin" ? "Adaugă universitate" : "Adaugă aplicație", language);
  const completedDocs = universities.reduce((sum, uni) => sum + (uni.documents?.filter((doc) => doc.isCompleted).length || 0), 0);
  const totalDocs = universities.reduce((sum, uni) => sum + (uni.documents?.length || 0), 0);
  const missingDocs = Math.max(0, totalDocs - completedDocs);
  const readinessScore = universities.length ? Math.round(universities.reduce((sum, uni) => sum + Number(uni.progress || 0), 0) / universities.length) : 0;
  const nextDeadline = (stats?.upcomingDeadlines || []).find((item) => item.daysUntilDeadline >= 0);
  const needsWork = [...universities]
    .filter((uni) => uni.status !== "Acceptat")
    .sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))[0];
  const nextAction = language === "en"
    ? missingDocs
      ? `Start with ${needsWork?.name || "the least complete application"}: ${missingDocs} documents are still missing.`
      : nextDeadline
        ? `Your applications look good. The next deadline is ${nextDeadline.name}, in ${nextDeadline.daysUntilDeadline} days.`
        : "Your applications are ready. Compare your options or submit a new application."
    : missingDocs
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
            <h1>{language === "en" ? "Hello" : "Bună"}, {firstName}</h1>
            <p>{nextAction}</p>
          </div>
          <div className="dashboard-header-actions">
            <button className="soft-button" type="button" onClick={() => onNavigate?.("documents")}><ClipboardList size={17} /> {t("Documente", language)}</button>
            <button className="primary-button" type="button" onClick={onAdd}><Plus size={18} /> {addLabel}</button>
          </div>
        </header>

        <section className="dashboard-summary" aria-label={t("Rezumat aplicații", language)}>
          <button type="button" onClick={onManageUniversities}>
            <GraduationCap size={18} />
            <strong>{universities.length}</strong>
            <span>{t("universități urmărite", language)}</span>
          </button>
          <button type="button" onClick={() => setActiveTab("Aplicate")}>
            <Send size={18} />
            <strong>{appliedCount}</strong>
            <span>{t("aplicații trimise", language)}</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("documents")}>
            <ClipboardList size={18} />
            <strong>{missingDocs}</strong>
            <span>{t("documente lipsă", language)}</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("profile")}>
            <span className="summary-progress-label">{t("Pregătire dosar", language)}</span>
            <strong>{readinessScore}%</strong>
            <span>{completedDocs}/{totalDocs || 0} {t("documente verificate", language)}</span>
            <i className="summary-progress-track"><b style={{ width: `${readinessScore}%` }} /></i>
          </button>
        </section>

        {universities.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <section className="applications-card">
            <header>
              <h2>{t("Aplicațiile mele", language)}</h2>
              <button type="button" onClick={onManageUniversities}>{t("Gestionează", language)} <ArrowRight size={15} /></button>
            </header>
            <nav className="app-tabs" aria-label={t("Filtrare aplicații", language)}>
              {tabs.map(([label, count]) => (
                <button key={label} className={label === activeTab ? "active" : ""} type="button" onClick={() => setActiveTab(label)}>
                  {t(label, language)} <span>{count}</span>
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
                    <StatusPill status={university.status} language={language} />
                    {university.daysUntilDeadline < 0 ? (
                      <em className="deadline-expired"><CalendarDays size={13} /> {t("Deadline expirat", language)}</em>
                    ) : university.daysUntilDeadline <= 14 ? (
                      <em><CalendarDays size={13} /> {university.daysUntilDeadline} {t("zile rămase", language)}</em>
                    ) : (
                      <em><CalendarDays size={13} /> {formatDate(university.deadline, language)}</em>
                    )}
                  </span>
                </span>
                <span className="application-progress">
                  <ProgressBar value={university.progress} tone={progressTone(university.progress)} />
                  <strong>{university.progress}%</strong>
                  <small>{university.documents?.filter((doc) => doc.isCompleted).length || 0}/{university.documents?.length || 0} {t("documente", language)}</small>
                </span>
              </button>
            ))}
            {visibleUniversities.length === 0 && (
              <div className="inline-empty compact">
                <strong>{language === "en" ? `There are no applications in the ${t(activeTab, language)} filter.` : `Nu există aplicații în filtrul ${activeTab}.`}</strong>
                <span>{t("Alege alt status sau adaugă o aplicație nouă.", language)}</span>
              </div>
            )}
          </section>
        )}
      </section>
      <div className="side-column">
        <section className="right-panel next-action-panel">
          <span>{t("Următorul pas", language)}</span>
          <strong>{t(missingDocs ? "Completează documentele lipsă" : "Dosarele sunt pregătite", language)}</strong>
          <p>{missingDocs
            ? language === "en" ? `${missingDocs} documents require attention.` : `${missingDocs} documente necesită atenție.`
            : nextDeadline
              ? language === "en" ? `${nextDeadline.name}: ${nextDeadline.daysUntilDeadline} days until the deadline.` : `${nextDeadline.name}: ${nextDeadline.daysUntilDeadline} zile până la deadline.`
              : t("Poți trimite o aplicație nouă.", language)}</p>
          <button type="button" onClick={missingDocs ? () => onNavigate?.("documents") : onAdd}>
            {t(missingDocs ? "Deschide documentele" : "Adaugă aplicație", language)} <ArrowRight size={16} />
          </button>
        </section>
        <DeadlinePanel items={stats?.upcomingDeadlines || []} language={language} />
      </div>
    </div>
  );
}

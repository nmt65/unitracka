import { CalendarDays, Plus } from "lucide-react";
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

export function Dashboard({ user, universities, stats, onAdd, onEdit, onManageUniversities }) {
  const firstName = user?.name?.split(" ")[0] || "Andrei";
  const addLabel = user?.role === "admin" ? "Adaugă universitate" : "Adaugă aplicație";
  const urgentCount = universities.filter((uni) => uni.daysUntilDeadline >= 0 && uni.daysUntilDeadline <= 14).length;
  const tabs = [
    ["Toate", universities.length],
    ["Wishlist", universities.filter((uni) => uni.status === "Wishlist").length],
    ["Cercetare", universities.filter((uni) => uni.status === "Cercetare").length],
    ["Aplicate", universities.filter((uni) => uni.status === "Aplicat").length],
    ["Acceptate", universities.filter((uni) => uni.status === "Acceptat").length],
    ["Respinse", universities.filter((uni) => uni.status === "Respins").length]
  ];

  return (
    <div className="dashboard-layout">
      <section className="main-column">
        <div className="page-heading">
          <div>
            <h1>Aplicațiile mele</h1>
            <p>Bună dimineața, {firstName} — ai {urgentCount} deadline-uri în mai puțin de 14 zile</p>
          </div>
          <button className="primary-button" type="button" onClick={onAdd}><Plus size={18} /> {addLabel}</button>
        </div>
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
                <button key={label} className={label === "Toate" ? "active" : ""} type="button">
                  {label} <span>{count}</span>
                </button>
              ))}
            </nav>
            {universities.map((university) => (
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
          </section>
        )}
      </section>
      <div className="side-column">
        <DeadlinePanel items={stats?.upcomingDeadlines || []} />
      </div>
    </div>
  );
}

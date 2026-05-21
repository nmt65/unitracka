import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, ExternalLink, Plus, Scale, Search, Send } from "lucide-react";
import { api } from "../services/api.js";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { formatDate } from "../utils/date.js";
import { programTypes } from "../utils/status.js";

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function truncate(value, max = 30) {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function countryCode(university) {
  return university.countryCode || (university.country === "România" || university.country === "Romania" ? "RO" : String(university.country || "").slice(0, 2).toUpperCase());
}

function progressTone(value) {
  if (value >= 90) return "success";
  if (value >= 50) return "primary";
  if (value > 20) return "warning";
  return "danger";
}

const COMPARE_SELECTION_KEY = "unitrack_compare_selection_v1";
const ADMISSIONS_SELECTION_KEY = "unitrack_admissions_selection_v1";

export function Universities({ user, universities, onAdd, onEdit, onNavigate, onToast }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Toate");
  const [type, setType] = useState("toate");
  const [view, setView] = useState("catalog");
  const [catalog, setCatalog] = useState([]);
  const [compareSelection, setCompareSelection] = useState([]);
  const addLabel = user?.role === "admin" ? "Adaugă universitate" : "Trimite aplicație";

  useEffect(() => {
    let active = true;
    api.catalog(query)
      .then((data) => {
        if (active) setCatalog(data.universities || []);
      })
      .catch((error) => onToast?.(error.message));
    return () => {
      active = false;
    };
  }, [query, onToast]);

  const trackerByName = useMemo(() => new Map(universities.map((uni) => [uni.name.toLowerCase(), uni])), [universities]);

  const filteredTracker = useMemo(() => {
    return universities.filter((uni) => {
      const matchesStatus = status === "Toate" || uni.status === status;
      const matchesType = type === "toate" || uni.programType === type;
      const haystack = [uni.name, uni.country, uni.faculty, uni.program].join(" ").toLowerCase();
      return matchesStatus && matchesType && haystack.includes(query.toLowerCase());
    });
  }, [universities, query, status, type]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const offer = item.offerPrograms || [];
      const matchesType = type === "toate" || offer.some((program) => program.programType === type);
      const haystack = [item.name, item.country, item.city, item.offerSummary, ...(item.strengths || []), ...offer.map((program) => `${program.program} ${program.faculty}`)].join(" ").toLowerCase();
      return matchesType && haystack.includes(query.toLowerCase());
    });
  }, [catalog, query, type]);

  async function exportCsv() {
    try {
      await api.downloadExport("csv");
      onToast?.("CSV exportat.");
    } catch (error) {
      onToast?.(error.message);
    }
  }

  function applyToCatalog(item) {
    localStorage.setItem(ADMISSIONS_SELECTION_KEY, item.name);
    onNavigate?.("admissions");
  }

  function applyToTrackedUniversity(university) {
    localStorage.setItem(ADMISSIONS_SELECTION_KEY, university.name);
    onNavigate?.("admissions");
  }

  function toggleCompare(item) {
    setCompareSelection((current) => {
      if (current.includes(item.name)) return current.filter((name) => name !== item.name);
      if (current.length >= 4) {
        onToast?.("Poți compara maximum 4 universități.");
        return current;
      }
      return [...current, item.name];
    });
  }

  function openCompare() {
    if (compareSelection.length < 2) {
      onToast?.("Selectează cel puțin 2 universități pentru comparație.");
      return;
    }
    localStorage.setItem(COMPARE_SELECTION_KEY, JSON.stringify(compareSelection));
    onNavigate?.("compare");
  }

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Universități</h1>
          <p>{catalog.length || universities.length} universități disponibile — alege din catalogul curent, compară oferta 2026-2027 și trimite aplicații</p>
        </div>
        <div className="heading-actions">
          <button className="soft-button" type="button" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          {user?.role === "student" && (
            <button className="soft-button" type="button" onClick={openCompare}><Scale size={16} /> Compară selecția ({compareSelection.length}/4)</button>
          )}
          <button className="primary-button" type="button" onClick={onAdd}><Plus size={17} /> {addLabel}</button>
        </div>
      </div>

      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută universitate, program, domeniu..." />
        </label>
        <div className="filter-tabs">
          <button className={view === "catalog" ? "active" : ""} type="button" onClick={() => setView("catalog")}>Catalog public</button>
          <button className={view === "tracker" ? "active" : ""} type="button" onClick={() => setView("tracker")}>Trackerul meu</button>
        </div>
        {view === "tracker" && (
          <div className="filter-tabs">
            {["Toate", "Wishlist", "Cercetare", "Aplicat", "Acceptat", "Respins"].map((item) => (
              <button key={item} className={status === item ? "active" : ""} type="button" onClick={() => setStatus(item)}>{item}</button>
            ))}
          </div>
        )}
        <div className="filter-tabs type-tabs">
          <button className={type === "toate" ? "active" : ""} type="button" onClick={() => setType("toate")}>Toate</button>
          {programTypes.map((item) => (
            <button key={item.value} className={type === item.value ? "active" : ""} type="button" onClick={() => setType(item.value)}>{item.label}</button>
          ))}
        </div>
        <span className="result-count">{view === "catalog" ? filteredCatalog.length : filteredTracker.length} rezultate</span>
      </div>

      {view === "catalog" ? (
        <div className="catalog-grid">
          {filteredCatalog.map((item) => {
            const tracked = trackerByName.get(item.name.toLowerCase());
            const offers = item.offerPrograms || [];
            return (
              <article className="catalog-card" key={`${item.name}-${item.city || item.country}`}>
                <header>
                  <span className="uni-logo tone-primary">{shortName(item)}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{countryCode(item)} {item.country}{item.city ? ` · ${item.city}` : ""}</small>
                  </span>
                </header>
                <p><strong>Ofertă {item.academicYear || "2026-2027"}:</strong> {item.offerSummary || "Programe disponibile prin site-ul oficial."}</p>
                <div className="offer-list">
                  {offers.slice(0, 3).map((program) => (
                    <span key={`${item.name}-${program.program}`}>
                      <BookOpen size={13} /> {program.program} · {programTypes.find((entry) => entry.value === program.programType)?.label || program.programType}
                    </span>
                  ))}
                </div>
                <div className="catalog-tags">
                  {(item.strengths || []).slice(0, 4).map((strength) => <span key={strength}>{strength}</span>)}
                </div>
                <footer>
                  {item.website && <a className="tiny-link" href={item.website} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Site oficial</a>}
                  {tracked && <span className="catalog-state">În tracker</span>}
                  <button className="soft-button" type="button" onClick={() => toggleCompare(item)}>
                    <Scale size={15} /> {compareSelection.includes(item.name) ? "Selectată" : "Compară"}
                  </button>
                  <button className="primary-button compact" type="button" onClick={() => applyToCatalog(item)}>
                    <Send size={15} /> Aplică
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="university-table-card">
          <table className="university-table">
            <thead>
              <tr>
                <th>Universitate</th>
                <th>Program / Facultate</th>
                <th>Țară</th>
                <th>Tip</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Documente</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracker.map((uni) => {
                const completed = uni.documents?.filter((doc) => doc.isCompleted).length || 0;
                const total = uni.documents?.length || 0;
                return (
                  <tr key={uni.id}>
                    <td>
                      <div className="uni-cell">
                        <span className={`uni-logo tone-${progressTone(uni.progress)}`}>{shortName(uni)}</span>
                        <span>
                          <strong>{truncate(uni.name, 27)}</strong>
                          <small>{countryCode(uni)} {uni.country}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{truncate(uni.program, 32)}</strong>
                      <small>{truncate(uni.faculty, 38)}</small>
                    </td>
                    <td><strong>{countryCode(uni)} {uni.country}</strong></td>
                    <td><span className="type-pill">{programTypes.find((item) => item.value === uni.programType)?.label || uni.programType}</span></td>
                    <td>
                      <strong className={uni.daysUntilDeadline <= 14 ? "deadline-hot" : ""}>{formatDate(uni.deadline)}</strong>
                      {uni.daysUntilDeadline >= 0 && <small>{uni.daysUntilDeadline} zile rămase</small>}
                    </td>
                    <td><StatusPill status={uni.status} /></td>
                    <td>
                      <div className="doc-progress">
                        <ProgressBar value={uni.progress} tone={progressTone(uni.progress)} />
                        <strong>{uni.progress}%</strong>
                      </div>
                      <small>{completed}/{total} verificate</small>
                    </td>
                    <td>
                      <button className="row-action text" type="button" onClick={() => user?.role === "student" ? applyToTrackedUniversity(uni) : onEdit(uni)}>
                        {user?.role === "student" ? "Aplică" : "Editează"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Afișând {filteredTracker.length} din {universities.length} universități urmărite</span>
            <strong>{universities.length}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

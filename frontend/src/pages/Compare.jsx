import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { api } from "../services/api.js";
import { CompareTable } from "../components/CompareTable.jsx";
import { getProgramsForInstitution } from "../utils/programCatalog.js";
import { programTypes } from "../utils/status.js";

const COMPARE_SELECTION_KEY = "unitrack_compare_selection_v1";

function countryCode(university) {
  return university.countryCode || (university.country === "România" || university.country === "Romania" ? "RO" : String(university.country || "").slice(0, 2).toUpperCase());
}

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function catalogRating(item) {
  const source = String(item.qsBand || item.source || "");
  if (/top 50|top 100|THE Europe 2026/i.test(source)) return 8;
  if (/top 150|800|850/i.test(source)) return 7;
  return 6;
}

function normalizeCatalogItem(item, tracked) {
  if (tracked) return { ...tracked, sourceType: "tracker" };
  const offer = item.offerPrograms?.[0] || getProgramsForInstitution(item)[0];
  return {
    id: `catalog:${item.name}`,
    sourceType: "catalog",
    name: item.name,
    shortName: item.shortName || shortName(item),
    country: item.country,
    countryCode: item.countryCode,
    faculty: offer.faculty,
    program: offer.program,
    programType: offer.programType,
    deadline: `${new Date().getFullYear()}-07-15`,
    officialLink: item.website || "",
    annualTuition: null,
    rating: catalogRating(item),
    status: "Catalog",
    documents: [],
    remainingRequiredDocuments: null,
    offerPrograms: item.offerPrograms || [offer],
    offerSummary: item.offerSummary,
    academicYear: item.academicYear,
    strengths: item.strengths || []
  };
}

export function Compare({ universities, onToast }) {
  const [selected, setSelected] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [programType, setProgramType] = useState("all");

  useEffect(() => {
    api.catalog()
      .then((data) => setCatalog(data.universities || []))
      .catch((error) => onToast?.(error.message));
  }, [onToast]);

  const available = useMemo(() => {
    const byName = new Map(universities.map((uni) => [uni.name.toLowerCase(), uni]));
    const catalogRows = catalog.map((item) => normalizeCatalogItem(item, byName.get(item.name.toLowerCase())));
    const extraTracked = universities.filter((uni) => !catalogRows.some((row) => row.name.toLowerCase() === uni.name.toLowerCase()));
    return [...catalogRows, ...extraTracked.map((uni) => ({ ...uni, sourceType: "tracker" }))];
  }, [catalog, universities]);

  const filtered = useMemo(() => {
    const value = query.toLowerCase();
    return available.filter((uni) => {
      const matchesSource = source === "all" || uni.sourceType === source;
      const matchesType = programType === "all" || uni.programType === programType || (uni.offerPrograms || []).some((offer) => offer.programType === programType);
      const haystack = [uni.name, uni.country, uni.city, uni.program, uni.faculty, uni.offerSummary, ...(uni.strengths || [])].filter(Boolean).join(" ").toLowerCase();
      return matchesSource && matchesType && haystack.includes(value);
    });
  }, [available, programType, query, source]);

  useEffect(() => {
    if (selected.length || available.length < 2) return;
    let seededNames = [];
    try {
      seededNames = JSON.parse(localStorage.getItem(COMPARE_SELECTION_KEY) || "[]");
    } catch {
      seededNames = [];
    }
    const seededIds = available
      .filter((uni) => seededNames.includes(uni.name) || seededNames.includes(uni.id))
      .slice(0, 4)
      .map((uni) => uni.id);
    if (seededIds.length) {
      setSelected(seededIds);
      localStorage.removeItem(COMPARE_SELECTION_KEY);
      return;
    }
    setSelected(available.slice(0, 2).map((uni) => uni.id));
  }, [selected.length, available]);

  const selectedUniversities = useMemo(
    () => available.filter((uni) => selected.includes(uni.id)).slice(0, 4),
    [available, selected]
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const visibleResults = filtered.slice(0, 36);

  function toggle(id) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) {
        onToast?.("Poți compara maximum 4 universități.");
        return current;
      }
      return [...current, id];
    });
  }

  function clearSelection() {
    setSelected([]);
  }

  function removeSelection(id) {
    setSelected((current) => current.filter((item) => item !== id));
  }

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Compară Universități</h1>
          <p>Selectează 2–4 universități din catalogul public sau din trackerul tău</p>
        </div>
        <div className="compare-heading-count">
          <strong>{selectedUniversities.length}/4</strong>
          <span>selectate</span>
        </div>
      </div>
      <div className="compare-layout">
        <aside className="compare-picker-card">
          <div className="compare-toolbar">
            <div>
              <h2>Alege universitățile</h2>
              <p>{filtered.length} rezultate disponibile</p>
            </div>
            <button className="soft-button compact" type="button" onClick={clearSelection} disabled={selected.length === 0}>Reset</button>
          </div>
          <label className="search-field compare-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută universitate, țară, program..." />
          </label>
          <div className="compare-filter-row" aria-label="Sursă universități">
            {[
              ["all", "Toate"],
              ["tracker", "Tracker"],
              ["catalog", "Catalog"]
            ].map(([value, label]) => (
              <button key={value} type="button" className={source === value ? "active" : ""} onClick={() => setSource(value)}>{label}</button>
            ))}
          </div>
          <div className="compare-filter-row compact-row" aria-label="Tip program">
            <button type="button" className={programType === "all" ? "active" : ""} onClick={() => setProgramType("all")}>Toate</button>
            {programTypes.map((type) => (
              <button key={type.value} type="button" className={programType === type.value ? "active" : ""} onClick={() => setProgramType(type.value)}>{type.label}</button>
            ))}
          </div>
          <div className="compare-results">
            {visibleResults.map((uni) => {
              const active = selectedSet.has(uni.id);
              return (
                <button className={`compare-result ${active ? "active" : ""}`} type="button" key={uni.id} onClick={() => toggle(uni.id)}>
                  <span className="uni-logo tone-primary">{shortName(uni)}</span>
                  <span>
                    <strong>{uni.name}</strong>
                    <small>{countryCode(uni)} {uni.country} · {uni.program}</small>
                  </span>
                  <em>{uni.sourceType === "tracker" ? "tracker" : "catalog"}</em>
                  {active ? <Check size={17} /> : <Plus size={17} />}
                </button>
              );
            })}
            {filtered.length > visibleResults.length && <p className="field-note">Mai sunt {filtered.length - visibleResults.length} rezultate. Rafinează căutarea ca să le vezi mai repede.</p>}
          </div>
        </aside>

        <div className="compare-workspace">
          <div className="compare-selection-strip">
            {Array.from({ length: 4 }).map((_, index) => {
              const uni = selectedUniversities[index];
              return (
                <div className={`compare-slot ${uni ? "filled" : ""}`} key={uni?.id || `slot-${index}`}>
                  {uni ? (
                    <>
                      <span className="uni-logo tone-primary">{shortName(uni)}</span>
                      <span>
                        <strong>{uni.name}</strong>
                        <small>{countryCode(uni)} {uni.country} · {uni.sourceType === "tracker" ? "tracker" : "catalog"}</small>
                      </span>
                      <button type="button" onClick={() => removeSelection(uni.id)} aria-label="Elimină din comparație"><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <span className="empty-slot-index">{index + 1}</span>
                      <small>{index < 2 ? "Necesar" : "Opțional"}</small>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <CompareTable universities={selectedUniversities} />
        </div>
      </div>
    </section>
  );
}

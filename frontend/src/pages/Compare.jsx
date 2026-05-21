import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../services/api.js";
import { CompareTable } from "../components/CompareTable.jsx";
import { getProgramsForInstitution } from "../utils/programCatalog.js";

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
    return available.filter((uni) => [uni.name, uni.country, uni.city, uni.program, uni.faculty, uni.offerSummary, ...(uni.strengths || [])].filter(Boolean).join(" ").toLowerCase().includes(value));
  }, [available, query]);

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

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Compară Universități</h1>
          <p>Selectează 2–4 universități din catalogul public sau din trackerul tău</p>
        </div>
      </div>
      <div className="compare-picker-card">
        <div className="compare-toolbar">
          <h2>Selectează universități ({selected.length}/4)</h2>
          <label className="search-field compact">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută pentru comparație..." />
          </label>
        </div>
        <div className="compare-picker">
          {filtered.map((uni) => (
            <label className={`compare-chip ${selected.includes(uni.id) ? "active" : ""}`} key={uni.id}>
              <input type="checkbox" checked={selected.includes(uni.id)} onChange={() => toggle(uni.id)} />
              <strong>{countryCode(uni)}</strong>
              {shortName(uni)}
              <small>{uni.sourceType === "tracker" ? "tracker" : "catalog"}</small>
            </label>
          ))}
        </div>
      </div>
      <CompareTable universities={selectedUniversities} />
    </section>
  );
}

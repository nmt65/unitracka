import { useEffect, useMemo, useState } from "react";
import { CompareTable } from "../components/CompareTable.jsx";

function countryCode(university) {
  return university.countryCode || (university.country === "România" || university.country === "Romania" ? "RO" : university.country.slice(0, 2).toUpperCase());
}

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

export function Compare({ universities }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (selected.length || universities.length < 2) return;
    setSelected(universities.slice(0, 2).map((uni) => uni.id));
  }, [selected.length, universities]);

  const selectedUniversities = useMemo(
    () => universities.filter((uni) => selected.includes(uni.id)).slice(0, 4),
    [universities, selected]
  );

  function toggle(id) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) return current;
      return [...current, id];
    });
  }

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Compară Universități</h1>
          <p>Selectează 2–4 universități pentru comparație side-by-side</p>
        </div>
      </div>
      <div className="compare-picker-card">
        <h2>Selectează universități ({selected.length}/4)</h2>
        <div className="compare-picker">
        {universities.map((uni) => (
          <label className={`compare-chip ${selected.includes(uni.id) ? "active" : ""}`} key={uni.id}>
            <input type="checkbox" checked={selected.includes(uni.id)} onChange={() => toggle(uni.id)} />
            <strong>{countryCode(uni)}</strong>
            {shortName(uni)}
          </label>
        ))}
        </div>
      </div>
      <CompareTable universities={selectedUniversities} />
    </section>
  );
}

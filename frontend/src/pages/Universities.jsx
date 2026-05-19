import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { api } from "../services/api.js";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { formatDate } from "../utils/date.js";
import { programTypes, statuses } from "../utils/status.js";

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function truncate(value, max = 30) {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
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

export function Universities({ user, universities, onAdd, onEdit, onToast }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Toate");
  const [type, setType] = useState("toate");
  const addLabel = user?.role === "admin" ? "Adaugă universitate" : "Adaugă aplicație";

  const filtered = useMemo(() => {
    return universities.filter((uni) => {
      const matchesStatus = status === "Toate" || uni.status === status;
      const matchesType = type === "toate" || uni.programType === type;
      const haystack = [uni.name, uni.country, uni.faculty, uni.program].join(" ").toLowerCase();
      return matchesStatus && matchesType && haystack.includes(query.toLowerCase());
    });
  }, [universities, query, status, type]);

  async function exportCsv() {
    try {
      await api.downloadExport("csv");
      onToast?.("CSV exportat.");
    } catch (error) {
      onToast?.(error.message);
    }
  }

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Universități</h1>
          <p>{universities.length} universități în tracker — gestionează aplicațiile, documentele și statusul</p>
        </div>
        <div className="heading-actions">
          <button className="soft-button" type="button" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          <button className="primary-button" type="button" onClick={onAdd}><Plus size={17} /> {addLabel}</button>
        </div>
      </div>

      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută universitate, program..." />
        </label>
        <div className="filter-tabs">
          {["Toate", "Wishlist", "Cercetare", "Aplicat", "Acceptat", "Respins"].map((item) => (
            <button key={item} className={status === item ? "active" : ""} type="button" onClick={() => setStatus(item)}>{item}</button>
          ))}
        </div>
        <div className="filter-tabs type-tabs">
          <button className={type === "toate" ? "active" : ""} type="button" onClick={() => setType("toate")}>Toate</button>
          {programTypes.map((item) => (
            <button key={item.value} className={type === item.value ? "active" : ""} type="button" onClick={() => setType(item.value)}>{item.label}</button>
          ))}
        </div>
        <span className="result-count">{filtered.length} din {universities.length}</span>
      </div>

      <div className="university-table-card">
        <table className="university-table">
          <thead>
            <tr>
              <th><input type="checkbox" aria-label="Selectează toate" /></th>
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
            {filtered.map((uni) => {
              const completed = uni.documents?.filter((doc) => doc.isCompleted).length || 0;
              const total = uni.documents?.length || 0;
              return (
                <tr key={uni.id}>
                  <td><input type="checkbox" aria-label={`Selectează ${uni.name}`} /></td>
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
                    <small>{completed}/{total} complete</small>
                  </td>
                  <td>
                    <button className="row-action" type="button" onClick={() => onEdit(uni)}>Editează</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Afișând {filtered.length} din {universities.length} universități</span>
          <strong>1</strong>
        </div>
      </div>
    </section>
  );
}

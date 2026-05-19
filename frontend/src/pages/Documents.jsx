import { useEffect, useMemo, useState } from "react";
import { Check, Circle, Plus, Trash2 } from "lucide-react";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { formatDate } from "../utils/date.js";

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function progressTone(value) {
  if (value >= 90) return "success";
  if (value >= 50) return "primary";
  if (value > 20) return "warning";
  return "danger";
}

const predefined = [
  "Diplomă BAC",
  "Foaie matricolă",
  "CV Europass",
  "Scrisoare motivație",
  "Scrisori de recomandare",
  "Certificat limbă (IELTS/TOEFL)",
  "Cazier judiciar",
  "Adeverință medicală",
  "Portofoliu (opțional)"
];

export function Documents({ universities, onToggleDocument, onAddDocument, onDeleteDocument }) {
  const [selectedId, setSelectedId] = useState(universities[0]?.id || "");
  const [tab, setTab] = useState("toate");
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    if (!selectedId && universities[0]) setSelectedId(universities[0].id);
  }, [selectedId, universities]);

  const selected = useMemo(() => universities.find((uni) => uni.id === selectedId) || universities[0], [universities, selectedId]);
  const docs = selected?.documents || [];
  const visibleDocs = docs.filter((doc) => {
    if (tab === "complete") return doc.isCompleted;
    if (tab === "lipsa") return !doc.isCompleted;
    return true;
  });
  const completed = docs.filter((doc) => doc.isCompleted).length;

  async function addCustom(event) {
    event.preventDefault();
    if (!customName.trim() || !selected) return;
    await onAddDocument(selected.id, { name: customName.trim(), category: "Custom", isOptional: false });
    setCustomName("");
  }

  return (
    <section className="unitrack-page documents-page">
      <div className="page-heading">
        <div>
          <h1>Documente</h1>
          <p>Gestionează checklist-ul de documente pentru fiecare universitate</p>
        </div>
      </div>

      <div className="documents-layout">
        <aside className="doc-selector">
          <h2>Universități ({universities.length})</h2>
          {universities.map((uni) => {
            const done = uni.documents?.filter((doc) => doc.isCompleted).length || 0;
            const total = uni.documents?.length || 0;
            return (
              <button key={uni.id} className={selected?.id === uni.id ? "active" : ""} type="button" onClick={() => setSelectedId(uni.id)}>
                <span className={`uni-logo tone-${progressTone(uni.progress)}`}>{shortName(uni)}</span>
                <span className="selector-copy">
                  <strong>{uni.name}</strong>
                  <small>{uni.program}</small>
                  <span className="selector-progress"><ProgressBar value={uni.progress} tone={progressTone(uni.progress)} /> {uni.progress}%</span>
                  <small>{done}/{total} · {uni.progress}%</small>
                </span>
              </button>
            );
          })}
        </aside>

        <div className="doc-main">
          {selected && (
            <>
              <header className="doc-hero">
                <div className="uni-cell">
                  <span className={`uni-logo tone-${progressTone(selected.progress)}`}>{shortName(selected)}</span>
                  <span>
                    <h2>{selected.name}</h2>
                    <p>{selected.program} · {selected.faculty}</p>
                    <span className="hero-meta"><StatusPill status={selected.status} /> Deadline: {formatDate(selected.deadline)}</span>
                  </span>
                </div>
                <div className="doc-percent">
                  <strong>{selected.progress}%</strong>
                  <span>{completed}/{docs.length} documente</span>
                  <ProgressBar value={selected.progress} tone={progressTone(selected.progress)} />
                </div>
              </header>

              <div className="doc-tabs">
                {[
                  ["toate", "Toate"],
                  ["lipsa", "Lipsă"],
                  ["complete", "Complete"]
                ].map(([key, label]) => (
                  <button key={key} className={tab === key ? "active" : ""} type="button" onClick={() => setTab(key)}>{label}</button>
                ))}
              </div>

              <div className="doc-checklist-card">
                {visibleDocs.map((doc) => (
                  <div key={doc.id} className={`doc-row ${doc.isCompleted ? "done" : ""}`}>
                    <button className="doc-toggle-button" type="button" onClick={() => onToggleDocument(doc)}>
                      <span className="doc-check">{doc.isCompleted ? <Check size={15} /> : <Circle size={19} />}</span>
                      <span className="doc-row-content">
                        <strong>{doc.name}</strong>
                        {doc.isCompleted && <small>Finalizat pe {formatDate(doc.completedAt)}</small>}
                      </span>
                    </button>
                    {doc.category === "Custom" && (
                      <button
                        className="doc-delete-button"
                        type="button"
                        aria-label={`Șterge ${doc.name}`}
                        title={`Șterge ${doc.name}`}
                        onClick={() => onDeleteDocument?.(doc)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <form className="custom-doc-form" onSubmit={addCustom}>
                  <label>
                    Adaugă document custom
                    <span>
                      <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Nume document..." />
                      <button className="primary-button square" type="submit" aria-label="Adaugă document custom" title="Adaugă document custom"><Plus size={18} /></button>
                    </span>
                  </label>
                </form>
              </div>

              <div className="predefined-docs">
                <h3>Documente predefinite disponibile</h3>
                <div>
                  {predefined.map((name) => {
                    const exists = docs.some((doc) => doc.name === name);
                    return <span key={name} className={exists ? "available" : ""}>{exists ? "✓ " : ""}{name}</span>;
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

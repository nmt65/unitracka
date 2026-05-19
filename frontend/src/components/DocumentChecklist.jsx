import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

export function DocumentChecklist({ university, onToggle, onAdd, onDelete }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Custom");

  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    await onAdd(university.id, { name, category, isOptional: false });
    setName("");
  }

  if (!university) return <p className="muted">Selecteaza o universitate.</p>;

  return (
    <section className="document-panel">
      <div className="section-heading">
        <div>
          <h2>{university.name}</h2>
          <p>{university.program}</p>
        </div>
        <strong>{university.progress}%</strong>
      </div>
      <div className="checklist">
        {university.documents.map((doc) => (
          <div className={`document-row ${doc.isCompleted ? "done" : ""}`} key={doc.id}>
            <button className="check-button" type="button" onClick={() => onToggle(doc)}>
              {doc.isCompleted && <Check size={16} />}
            </button>
            <div>
              <strong>{doc.name}</strong>
              <span>{doc.category}{doc.isOptional ? " · optional" : ""}</span>
            </div>
            <small>{doc.completedAt || ""}</small>
            <button className="icon-button small danger-action" type="button" onClick={() => onDelete(doc)} title="Sterge document">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Document custom" />
        <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Categorie" />
        <button className="primary-button" type="submit"><Plus size={17} /> Adauga</button>
      </form>
    </section>
  );
}


import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "../services/api.js";
import { programTypes, statuses } from "../utils/status.js";

const emptyForm = {
  name: "",
  shortName: "",
  country: "",
  countryCode: "",
  faculty: "",
  program: "",
  programType: "licenta",
  deadline: "",
  officialLink: "",
  notes: "",
  status: "Wishlist",
  annualTuition: "",
  rating: ""
};

export function UniversityModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...emptyForm, ...initial, annualTuition: initial.annualTuition ?? "", rating: initial.rating ?? "" } : emptyForm);
    api.catalog().then((data) => setCatalog(data.universities)).catch(() => setCatalog([]));
  }, [open, initial]);

  const selectedCatalog = useMemo(() => catalog.find((item) => item.name === form.name), [catalog, form.name]);

  useEffect(() => {
    if (!selectedCatalog || initial) return;
    const offer = selectedCatalog.offerPrograms?.[0];
    setForm((current) => ({
      ...current,
      shortName: selectedCatalog.shortName || current.shortName,
      country: selectedCatalog.country || current.country,
      countryCode: selectedCatalog.countryCode || current.countryCode,
      faculty: offer?.faculty || current.faculty,
      program: offer?.program || current.program,
      programType: offer?.programType || current.programType,
      officialLink: selectedCatalog.website || current.officialLink,
      notes: selectedCatalog.offerSummary || current.notes
    }));
  }, [selectedCatalog, initial]);

  if (!open) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        annualTuition: form.annualTuition === "" ? null : Number(form.annualTuition),
        rating: form.rating === "" ? null : Number(form.rating)
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <h2>{initial ? "Editează universitatea" : "Adaugă universitate nouă"}</h2>
          <button className="icon-button" type="button" onClick={onClose} title="Inchide">
            <X size={18} />
          </button>
        </div>
        <section className="modal-section">
          <h3>Informații generale</h3>
          <div className="form-grid">
            <label className="wide">
              Numele universității *
            <input name="name" list="catalog" value={form.name} onChange={updateField} required />
          </label>
          <datalist id="catalog">
            {catalog.map((item) => <option key={`${item.name}-${item.city}`} value={item.name}>{item.country} · {item.offerSummary || ""}</option>)}
          </datalist>
          <label>
              Abreviere *
              <input name="shortName" value={form.shortName || ""} onChange={updateField} placeholder="ex. UB" required />
          </label>
          <label>
              Țara *
            <input name="country" value={form.country} onChange={updateField} placeholder="România" required />
          </label>
          <label>
              Emoji steag
              <input name="countryCode" value={form.countryCode || ""} onChange={updateField} placeholder="RO" />
          </label>
          </div>
        </section>

        <section className="modal-section">
          <h3>Program academic</h3>
          <div className="form-grid">
            <label className="wide">
              Facultate *
            <input name="faculty" value={form.faculty} onChange={updateField} required />
          </label>
            <label className="wide">
              Programul de studiu *
            <input name="program" value={form.program} onChange={updateField} required />
          </label>
          <label>
              Tip studii *
            <select name="programType" value={form.programType} onChange={updateField}>
              {programTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
              Status inițial
            <select name="status" value={form.status} onChange={updateField}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          </div>
        </section>

        <section className="modal-section">
          <h3>Deadline și taxe</h3>
          <div className="form-grid">
            <label>
              Deadline aplicație *
            <input name="deadline" type="date" value={form.deadline} onChange={updateField} required />
          </label>
            <label>
              Rating personal (1–5)
              <input name="rating" type="number" min="1" max="5" value={form.rating} onChange={updateField} />
            </label>
          <label>
            Link oficial
            <input name="officialLink" type="url" value={form.officialLink || ""} onChange={updateField} placeholder="https://..." />
          </label>
          <label>
              Taxă aplicație
            <input name="annualTuition" type="number" min="0" value={form.annualTuition} onChange={updateField} />
          </label>
          <label className="wide">
              Note personale
            <textarea name="notes" value={form.notes || ""} onChange={updateField} rows="4" />
          </label>
          </div>
        </section>
        <div className="modal-footer">
          <button className="ghost-button" type="button" onClick={onClose}>Anulează</button>
          <button className="primary-button" type="submit" disabled={saving}>{saving ? "Se salvează..." : "Salvează"}</button>
        </div>
      </form>
    </div>
  );
}

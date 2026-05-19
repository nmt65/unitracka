import { PlusCircle } from "lucide-react";

export function EmptyState({ onAdd }) {
  return (
    <section className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>Nu ai adăugat încă universități</h2>
      <p>Adaugă primul program și UniTrack va construi automat checklist-ul, deadline-urile și progresul.</p>
      <button className="primary-button" type="button" onClick={onAdd}>
        <PlusCircle size={18} />
        Adaugă universitate
      </button>
    </section>
  );
}

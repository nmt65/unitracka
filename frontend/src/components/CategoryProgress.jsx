import { ProgressBar } from "./ProgressBar.jsx";

export function CategoryProgress({ items = [] }) {
  return (
    <section className="category-panel">
      <h3>Progres documente</h3>
      {items.length === 0 && <p className="muted">Checklist-ul apare dupa prima universitate adaugata.</p>}
      {items.map((item) => (
        <div className="category-row" key={item.category}>
          <div>
            <strong>{item.category}</strong>
            <span>
              {item.completed}/{item.total}
            </span>
          </div>
          <ProgressBar value={item.percent} tone={item.percent > 70 ? "success" : item.percent > 35 ? "warning" : "danger"} />
        </div>
      ))}
    </section>
  );
}


import { CalendarClock } from "lucide-react";
import { deadlineTone, formatDate } from "../utils/date.js";

export function DeadlinePanel({ items = [] }) {
  return (
    <aside className="right-panel">
      <h3>Deadline-uri</h3>
      <div className="deadline-list">
        {items.length === 0 && <p className="muted">Nu ai deadline-uri active.</p>}
        {items.map((item) => (
          <div className="deadline-item" key={item.id}>
            <CalendarClock size={16} />
            <div>
              <strong>{item.name}</strong>
              <span>{item.program}</span>
              <small>{formatDate(item.deadline)}</small>
            </div>
            <span className={`tiny-pill ${deadlineTone(item.deadline)}`}>{item.daysUntilDeadline < 0 ? "Trecut" : `${item.daysUntilDeadline} zile`}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}


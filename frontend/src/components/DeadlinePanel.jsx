import { CalendarClock } from "lucide-react";
import { deadlineTone, formatDate } from "../utils/date.js";
import { t } from "../i18n.js";

export function DeadlinePanel({ items = [], language = "ro" }) {
  return (
    <aside className="right-panel">
      <h3>{t("Deadline-uri", language)}</h3>
      <div className="deadline-list">
        {items.length === 0 && <p className="muted">{t("Nu ai deadline-uri active.", language)}</p>}
        {items.map((item) => (
          <div className="deadline-item" key={item.id}>
            <CalendarClock size={16} />
            <div>
              <strong>{item.name}</strong>
              <span>{item.program}</span>
              <small>{formatDate(item.deadline, language)}</small>
            </div>
            <span className={`tiny-pill ${deadlineTone(item.deadline)}`}>
              {item.daysUntilDeadline < 0
                ? t("Trecut", language)
                : `${item.daysUntilDeadline} ${t("zile", language)}`}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

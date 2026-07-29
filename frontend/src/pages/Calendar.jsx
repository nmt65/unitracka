import { useState } from "react";
import { CalendarMonth } from "../components/CalendarMonth.jsx";
import { DeadlinePanel } from "../components/DeadlinePanel.jsx";
import { t } from "../i18n.js";

export function Calendar({ universities, language = "ro" }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const upcoming = universities.filter((uni) => uni.daysUntilDeadline >= 0).sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
  const urgent = upcoming.filter((uni) => uni.daysUntilDeadline <= 14).length;

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>{t("Calendar Deadline-uri", language)}</h1>
          <p>{t("Vizualizează deadline-urile și prioritățile dosarelor tale", language)}</p>
        </div>
        <div className="calendar-summary">
          <span><strong>{upcoming.length}</strong> {t("viitoare", language)}</span>
          <span className={urgent ? "danger" : ""}><strong>{urgent}</strong> {t("urgente", language)}</span>
        </div>
      </div>
      <div className="calendar-layout">
        <CalendarMonth
          monthDate={monthDate}
          universities={universities}
          language={language}
          onPrev={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          onNext={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        />
        <DeadlinePanel items={upcoming} language={language} />
      </div>
    </section>
  );
}

import { useState } from "react";
import { CalendarMonth } from "../components/CalendarMonth.jsx";
import { DeadlinePanel } from "../components/DeadlinePanel.jsx";

export function Calendar({ universities, onToast }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const upcoming = universities.filter((uni) => uni.daysUntilDeadline >= 0).sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
  const urgent = upcoming.filter((uni) => uni.daysUntilDeadline <= 14).length;

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Calendar Deadline-uri</h1>
          <p>Vizualizează deadline-urile și prioritățile dosarelor tale</p>
        </div>
        <div className="calendar-summary">
          <span><strong>{upcoming.length}</strong> viitoare</span>
          <span className={urgent ? "danger" : ""}><strong>{urgent}</strong> urgente</span>
        </div>
      </div>
      <div className="calendar-layout">
        <CalendarMonth
          monthDate={monthDate}
          universities={universities}
          onPrev={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          onNext={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        />
        <DeadlinePanel items={upcoming} />
      </div>
    </section>
  );
}

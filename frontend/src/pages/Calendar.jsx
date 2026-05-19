import { useState } from "react";
import { Download } from "lucide-react";
import { CalendarMonth } from "../components/CalendarMonth.jsx";
import { DeadlinePanel } from "../components/DeadlinePanel.jsx";
import { api } from "../services/api.js";

export function Calendar({ universities, onToast }) {
  const [monthDate, setMonthDate] = useState(new Date());

  async function exportCalendar() {
    try {
      await api.downloadExport("ics");
      onToast("Calendar exportat.");
    } catch (error) {
      onToast(error.message);
    }
  }

  return (
    <section className="unitrack-page">
      <div className="page-heading">
        <div>
          <h1>Calendar Deadline-uri</h1>
          <p>Vizualizează toate deadline-urile pe calendar</p>
        </div>
        <button className="soft-button" type="button" onClick={exportCalendar}><Download size={18} /> Export .ics</button>
      </div>
      <div className="calendar-layout">
        <CalendarMonth
          monthDate={monthDate}
          universities={universities}
          onPrev={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          onNext={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        />
        <DeadlinePanel items={universities.filter((uni) => uni.daysUntilDeadline >= 0).sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)} />
      </div>
    </section>
  );
}

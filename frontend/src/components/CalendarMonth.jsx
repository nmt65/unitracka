import { ChevronLeft, ChevronRight } from "lucide-react";
import { deadlineTone, formatDate } from "../utils/date.js";

const weekDays = ["LU", "MA", "MI", "JO", "VI", "SÂ", "DU"];

function sameDay(a, b) {
  return a.toISOString().slice(0, 10) === b;
}

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

export function CalendarMonth({ monthDate, universities, onPrev, onNext }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = Array.from({ length: offset + daysInMonth }, (_, index) => {
    if (index < offset) return null;
    return new Date(year, month, index - offset + 1);
  });

  return (
    <section className="calendar-panel">
      <div className="calendar-header">
        <button className="icon-button" type="button" onClick={onPrev} title="Luna anterioara"><ChevronLeft size={18} /></button>
        <h2>{new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric" }).format(monthDate)}</h2>
        <button className="icon-button" type="button" onClick={onNext} title="Luna urmatoare"><ChevronRight size={18} /></button>
      </div>
      <div className="calendar-grid weekday-grid">
        {weekDays.map((day) => <strong key={day}>{day}</strong>)}
      </div>
      <div className="calendar-grid">
        {cells.map((date, index) => {
          const events = date ? universities.filter((uni) => sameDay(date, uni.deadline)) : [];
          return (
            <div className="calendar-cell" key={index}>
              {date && <span className={date.toDateString() === today.toDateString() ? "today" : ""}>{date.getDate()}</span>}
              {events.map((event) => (
                <div className={`calendar-event ${deadlineTone(event.deadline)}`} key={event.id} title={formatDate(event.deadline)}>
                  {shortName(event)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

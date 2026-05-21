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
  const today = new Date();
  const startDate = new Date(year, month, 1 - offset);
  const cells = Array.from({ length: 42 }, (_, index) => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index));
  const monthEvents = universities.filter((uni) => {
    const deadline = new Date(uni.deadline);
    return deadline.getFullYear() === year && deadline.getMonth() === month;
  });

  return (
    <section className="calendar-panel">
      <div className="calendar-header">
        <button className="icon-button" type="button" onClick={onPrev} title="Luna anterioara"><ChevronLeft size={18} /></button>
        <div>
          <h2>{new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric" }).format(monthDate)}</h2>
          <small>{monthEvents.length ? `${monthEvents.length} deadline-uri în luna curentă` : "Fără deadline-uri în luna curentă"}</small>
        </div>
        <button className="icon-button" type="button" onClick={onNext} title="Luna urmatoare"><ChevronRight size={18} /></button>
      </div>
      <div className="calendar-grid weekday-grid">
        {weekDays.map((day) => <strong key={day}>{day}</strong>)}
      </div>
      <div className="calendar-grid">
        {cells.map((date) => {
          const events = universities.filter((uni) => sameDay(date, uni.deadline));
          const visibleEvents = events.slice(0, 2);
          const isOutside = date.getMonth() !== month;
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div className={`calendar-cell ${isOutside ? "outside" : ""} ${events.length ? "has-events" : ""}`} key={date.toISOString()}>
              <span className={`calendar-day-number ${isToday ? "today" : ""}`}>{date.getDate()}</span>
              {visibleEvents.map((event) => (
                <div className={`calendar-event ${deadlineTone(event.deadline)}`} key={event.id} title={`${event.name} · ${formatDate(event.deadline)}`}>
                  <strong>{shortName(event)}</strong>
                  <small>{event.program}</small>
                </div>
              ))}
              {events.length > visibleEvents.length && <em className="calendar-more">+{events.length - visibleEvents.length}</em>}
            </div>
          );
        })}
      </div>
      <footer className="calendar-legend">
        <span><i className="danger" /> ≤ 7 zile</span>
        <span><i className="warning" /> ≤ 14 zile</span>
        <span><i className="ok" /> OK</span>
      </footer>
    </section>
  );
}

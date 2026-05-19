import { Clock3, FileClock, GraduationCap, ShieldCheck } from "lucide-react";

export function StatCards({ stats }) {
  const cards = [
    { label: "Total Universități", hint: "în tracker", value: stats?.total ?? 0, icon: GraduationCap, tone: "primary" },
    { label: "Acceptate", hint: "confirmate", value: stats?.accepted ?? 0, icon: ShieldCheck, tone: "success" },
    { label: "În Așteptare", hint: "aplicate, fără răspuns", value: stats?.pending ?? 0, icon: FileClock, tone: "warning" },
    { label: "Zile Deadline", hint: "URGENT — acționează acum", value: stats?.nextDeadlineDays ?? "-", icon: Clock3, tone: "orange" }
  ];
  return (
    <section className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className={`stat-card ${card.tone}`} key={card.label}>
            <Icon size={20} />
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <small>{card.hint}</small>
          </article>
        );
      })}
    </section>
  );
}

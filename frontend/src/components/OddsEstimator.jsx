import { Target } from "lucide-react";
import { ProgressBar } from "./ProgressBar.jsx";

function chanceFor(user, university) {
  const bac = Number(user?.bacAverage || 0);
  if (!bac) return null;
  const selectivityPenalty = Number(university.rating || 6) * 3;
  const statusBonus = university.status === "Acceptat" ? 28 : university.status === "Aplicat" ? 8 : 0;
  const chance = Math.round(bac * 9 + university.progress * 0.12 + statusBonus - selectivityPenalty);
  return Math.max(5, Math.min(96, chance));
}

export function OddsEstimator({ user, universities }) {
  const rows = universities.map((uni) => ({ university: uni, chance: chanceFor(user, uni) })).filter((row) => row.chance !== null).slice(0, 5);
  if (!rows.length) return null;

  return (
    <section className="odds-panel">
      <h3><Target size={17} /> Odds estimator</h3>
      {rows.map(({ university, chance }) => (
        <div className="odds-row" key={university.id}>
          <div>
            <strong>{university.name}</strong>
            <span>{chance}% estimare</span>
          </div>
          <ProgressBar value={chance} tone={chance > 70 ? "success" : chance > 45 ? "warning" : "danger"} />
        </div>
      ))}
    </section>
  );
}

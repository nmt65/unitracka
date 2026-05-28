import { formatDate } from "../utils/date.js";
import { StatusPill } from "./StatusPill.jsx";

function shortName(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function countryCode(university) {
  return university.countryCode || (university.country === "România" || university.country === "Romania" ? "RO" : String(university.country || "").slice(0, 2).toUpperCase());
}

function starRating(value = 0) {
  const stars = Math.max(0, Math.min(5, Math.round(value || 0)));
  return `${"★".repeat(stars)}${"☆".repeat(5 - stars)}`;
}

function winnerIds(universities) {
  const tuitionValues = universities.map((uni) => uni.annualTuition).filter((value) => value !== null && value !== undefined);
  const missingValues = universities.map((uni) => uni.remainingRequiredDocuments).filter((value) => value !== null && value !== undefined);
  const ratingValues = universities.map((uni) => uni.rating).filter((value) => value !== null && value !== undefined);
  const minTuition = tuitionValues.length ? Math.min(...tuitionValues) : null;
  const minMissing = missingValues.length ? Math.min(...missingValues) : null;
  const maxRating = ratingValues.length ? Math.max(...ratingValues) : null;
  return {
    tuition: minTuition === null ? [] : universities.filter((uni) => uni.annualTuition === minTuition).map((uni) => uni.id),
    missing: minMissing === null ? [] : universities.filter((uni) => uni.remainingRequiredDocuments === minMissing).map((uni) => uni.id),
    rating: maxRating === null ? [] : universities.filter((uni) => uni.rating === maxRating).map((uni) => uni.id)
  };
}

function daysUntil(date) {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((target - start) / 86400000);
}

function compareScore(uni) {
  const rating = Math.max(0, Math.min(10, Number(uni.rating || 0))) * 2.2;
  const tuition = uni.annualTuition === null || uni.annualTuition === undefined
    ? 9
    : Number(uni.annualTuition || 0) === 0
      ? 18
      : Math.max(4, 18 - Math.min(14, Number(uni.annualTuition || 0) / 450));
  const docs = uni.remainingRequiredDocuments === null || uni.remainingRequiredDocuments === undefined
    ? 9
    : Math.max(0, 24 - Number(uni.remainingRequiredDocuments || 0) * 4);
  const days = daysUntil(uni.deadline);
  const timing = days === null ? 8 : days < 0 ? 0 : days <= 7 ? 6 : days <= 21 ? 14 : 18;
  const offer = Math.min(12, (uni.offerPrograms?.length || 1) * 3);
  return Math.round(Math.min(100, rating + tuition + docs + timing + offer + 6));
}

function scoreLabel(score) {
  if (score >= 82) return "Foarte potrivită";
  if (score >= 68) return "Bună opțiune";
  if (score >= 52) return "Merită analizată";
  return "Risc mai mare";
}

export function CompareTable({ universities = [] }) {
  if (universities.length < 2) return <p className="muted">Selectează între 2 și 4 universități.</p>;
  const winners = winnerIds(universities);
  const ranked = [...universities]
    .map((uni) => ({ ...uni, compareScore: compareScore(uni) }))
    .sort((a, b) => b.compareScore - a.compareScore);
  const best = ranked[0];

  return (
    <div className="compare-analysis">
      <section className="compare-verdict">
        <article className="compare-winner-card">
          <span>Recomandare UniTrack</span>
          <strong>{best.name}</strong>
          <p>{scoreLabel(best.compareScore)} pentru profilul curent: scor bun, deadline gestionabil și dosar comparativ mai pregătit.</p>
        </article>
        <div className="compare-score-grid">
          {ranked.map((uni) => (
            <article key={uni.id}>
              <span className="uni-logo tone-primary">{shortName(uni)}</span>
              <span className="compare-score-name">{uni.name}</span>
              <strong>{uni.compareScore}</strong>
              <small>{scoreLabel(uni.compareScore)}</small>
              <div className="readiness-track"><i style={{ width: `${uni.compareScore}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Criteriu</th>
              {universities.map((uni) => (
                <th key={uni.id}>
                  <span className="uni-logo tone-primary">{shortName(uni)}</span>
                  <strong>{uni.name}</strong>
                  <small>{countryCode(uni)} {uni.country}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Status</th>
              {universities.map((uni) => <td key={uni.id}><StatusPill status={uni.status} /></td>)}
            </tr>
            <tr>
              <th>Scor potrivire</th>
              {universities.map((uni) => {
                const score = compareScore(uni);
                return (
                  <td className={uni.id === best.id ? "winner-cell" : ""} key={uni.id}>
                    <strong>{score}/100</strong>
                    <small>{scoreLabel(score)}</small>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th>Program</th>
              {universities.map((uni) => (
                <td key={uni.id}>
                  <strong>{uni.program}</strong>
                  <small>{uni.programType === "master" ? "Master" : uni.programType === "doctorat" ? "Doctorat" : "Licență"}</small>
                </td>
              ))}
            </tr>
            <tr>
              <th>Ofertă {universities[0]?.academicYear || "2026-2027"}</th>
              {universities.map((uni) => (
                <td key={uni.id}>
                  <strong>{uni.offerPrograms?.slice(0, 2).map((program) => program.program).join(", ") || uni.program}</strong>
                  <small>{uni.offerSummary || uni.faculty}</small>
                </td>
              ))}
            </tr>
            <tr>
              <th>Deadline</th>
              {universities.map((uni) => <td key={uni.id}><strong>{formatDate(uni.deadline)}</strong><small>{daysUntil(uni.deadline) ?? "-"} zile</small></td>)}
            </tr>
            <tr>
              <th>Rating</th>
              {universities.map((uni) => (
                <td className={winners.rating.includes(uni.id) ? "winner-cell" : ""} key={uni.id}>
                  <strong className="stars">{starRating(uni.rating)}</strong>
                  {winners.rating.includes(uni.id) && <small>Cel mai bun</small>}
                </td>
              ))}
            </tr>
            <tr>
              <th>Taxă aplicație</th>
              {universities.map((uni) => (
                <td className={winners.tuition.includes(uni.id) ? "winner-cell" : ""} key={uni.id}>
                  <strong>{uni.annualTuition === null || uni.annualTuition === undefined ? "Nespecificat" : Number(uni.annualTuition || 0) === 0 ? "Gratuit" : `${uni.annualTuition} RON`}</strong>
                  {winners.tuition.includes(uni.id) && <small>Cel mai mic cost</small>}
                </td>
              ))}
            </tr>
            <tr>
              <th>Documente lipsă</th>
              {universities.map((uni) => (
                <td className={winners.missing.includes(uni.id) ? "winner-cell" : ""} key={uni.id}>
                  <strong>{uni.remainingRequiredDocuments === null || uni.remainingRequiredDocuments === undefined ? "Nu este în tracker" : uni.remainingRequiredDocuments === 0 ? "Complet" : `${uni.remainingRequiredDocuments} lipsă`}</strong>
                  <small>{uni.documents?.length ? `${uni.documents.filter((doc) => doc.isCompleted).length}/${uni.documents.length} pregătite` : "Trimite aplicație pentru checklist"}</small>
                </td>
              ))}
            </tr>
            <tr>
              <th>Site oficial</th>
              {universities.map((uni) => (
                <td key={uni.id}>
                  {uni.officialLink ? <a href={uni.officialLink} target="_blank" rel="noreferrer">Vizitează</a> : <span className="muted">Nedisponibil</span>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

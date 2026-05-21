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

export function CompareTable({ universities = [] }) {
  if (universities.length < 2) return <p className="muted">Selectează între 2 și 4 universități.</p>;
  const winners = winnerIds(universities);

  return (
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
            {universities.map((uni) => <td key={uni.id}><strong>{formatDate(uni.deadline)}</strong></td>)}
          </tr>
          <tr>
            <th>Rating</th>
            {universities.map((uni) => (
              <td className={winners.rating.includes(uni.id) ? "winner-cell" : ""} key={uni.id}>
                <strong className="stars">{starRating(uni.rating)}</strong>
                {winners.rating.includes(uni.id) && <small>↑ Cel mai bun</small>}
              </td>
            ))}
          </tr>
          <tr>
            <th>Taxă aplicație</th>
            {universities.map((uni) => (
              <td className={winners.tuition.includes(uni.id) ? "winner-cell" : ""} key={uni.id}>
                <strong>{uni.annualTuition === null || uni.annualTuition === undefined ? "Nespecificat" : Number(uni.annualTuition || 0) === 0 ? "Gratuit" : `${uni.annualTuition} RON`}</strong>
                {winners.tuition.includes(uni.id) && <small>↓ Cel mai mic</small>}
              </td>
            ))}
          </tr>
          <tr>
            <th>Documente lipsă</th>
            {universities.map((uni) => (
              <td className={winners.missing.includes(uni.id) ? "winner-cell" : ""} key={uni.id}>
                <strong>{uni.remainingRequiredDocuments === null || uni.remainingRequiredDocuments === undefined ? "Nu este în tracker" : uni.remainingRequiredDocuments === 0 ? "✓ Complet" : `${uni.remainingRequiredDocuments} lipsă`}</strong>
                <small>{uni.documents?.length ? `${uni.documents.filter((doc) => doc.isCompleted).length}/${uni.documents.length} pregătite` : "Trimite aplicație pentru checklist"}</small>
              </td>
            ))}
          </tr>
          <tr>
            <th>Site oficial</th>
            {universities.map((uni) => (
              <td key={uni.id}>
                {uni.officialLink ? <a href={uni.officialLink} target="_blank" rel="noreferrer">↗ Vizitează</a> : <span className="muted">Nedisponibil</span>}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

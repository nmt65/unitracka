import { CalendarDays, Edit3, ExternalLink, Trash2 } from "lucide-react";
import { formatDate } from "../utils/date.js";
import { StatusPill } from "./StatusPill.jsx";
import { ProgressBar } from "./ProgressBar.jsx";

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function UniCard({ university, onEdit, onDelete }) {
  return (
    <article className="uni-card">
      <div className="uni-avatar">{initials(university.name)}</div>
      <div className="uni-main">
        <div className="uni-heading">
          <div>
            <h3>{university.name}</h3>
            <p>{university.program} - {university.faculty}</p>
          </div>
          <div className="card-actions">
            {university.officialLink && (
              <a className="icon-button small" href={university.officialLink} target="_blank" rel="noreferrer" title="Site oficial">
                <ExternalLink size={16} />
              </a>
            )}
            <button className="icon-button small" type="button" onClick={() => onEdit(university)} title="Editeaza">
              <Edit3 size={16} />
            </button>
            <button className="icon-button small danger-action" type="button" onClick={() => onDelete(university)} title="Sterge">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="uni-meta">
          <StatusPill status={university.status} />
          <span><CalendarDays size={15} /> {formatDate(university.deadline)}</span>
          <span>{university.country}</span>
        </div>
        <div className="card-progress">
          <span>Documente</span>
          <strong>{university.progress}%</strong>
        </div>
        <ProgressBar value={university.progress} tone={university.progress > 70 ? "success" : university.progress > 35 ? "warning" : "primary"} />
      </div>
    </article>
  );
}


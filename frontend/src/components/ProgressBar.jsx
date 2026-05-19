export function ProgressBar({ value = 0, tone = "primary" }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress" aria-label={`Progres ${safeValue}%`}>
      <span className={`progress-fill ${tone}`} style={{ width: `${safeValue}%` }} />
    </div>
  );
}


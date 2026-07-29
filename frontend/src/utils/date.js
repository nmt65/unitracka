export function daysUntil(dateLike) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

export function formatDate(dateLike, language = "ro") {
  if (!dateLike) return "-";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(dateLike));
}

export function deadlineTone(dateLike) {
  const days = daysUntil(dateLike);
  if (days < 0) return "late";
  if (days <= 7) return "danger";
  if (days <= 14) return "warning";
  return "ok";
}

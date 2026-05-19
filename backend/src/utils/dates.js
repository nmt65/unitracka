export function daysUntil(dateLike) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

export function formatIcsDate(dateLike) {
  return String(dateLike).replaceAll("-", "");
}


const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function getEventDates(event) {
  const values = [...(Array.isArray(event.dates) ? event.dates : []), event.startsAt].filter(Boolean);
  const unique = new Map();
  values.forEach((value) => {
    const date = toDate(value);
    if (date) unique.set(date.toISOString(), date);
  });
  return [...unique.values()].sort((left, right) => left.getTime() - right.getTime());
}

export function getNextEventDate(event, now = Date.now()) {
  const dates = getEventDates(event);
  return dates.find((date) => date.getTime() >= now) ?? (dates.length ? dates[dates.length - 1] : null);
}

export function eventMatchesDateRange(event, range, now = new Date()) {
  if (range === "all") return true;
  const dates = getEventDates(event);
  const endDate = toDate(event.endsAt) ?? dates.at(-1);
  if (!dates.length || !endDate || endDate < now) return false;

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const limit =
    range === "today"
      ? endOfToday
      : range === "week"
        ? new Date(endOfToday.setDate(endOfToday.getDate() + 7))
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return dates.some((date) => date >= now && date <= limit) || Boolean(event.endsAt && dates[0] <= limit);
}

export function formatEventDates(event) {
  const dates = getEventDates(event);
  if (!dates.length) return "Fecha por confirmar";
  if (dates.length === 1 && event.endsAt) {
    return `Del ${dates[0].toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })} al ${new Date(
      event.endsAt,
    ).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  if (dates.length === 1) {
    return dates[0].toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
  }

  const sameMonth = dates.every(
    (date) => date.getMonth() === dates[0].getMonth() && date.getFullYear() === dates[0].getFullYear(),
  );
  if (sameMonth) {
    const days = dates.map((date) => date.getDate());
    const dayLabel = days.length === 1 ? String(days[0]) : `${days.slice(0, -1).join(", ")} y ${days.at(-1)}`;
    const month = dates[0].toLocaleDateString("es-AR", { month: "long" });
    return `${dayLabel} de ${month} de ${dates[0].getFullYear()}`;
  }

  return dates
    .map((date) => date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }))
    .join(" · ");
}

export function isMultiDateEvent(event) {
  return getEventDates(event).length > 1 || Boolean(event.endsAt && event.startsAt);
}

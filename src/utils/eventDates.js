const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isUtcDateOnly = (date) =>
  date.getUTCHours() === 0 &&
  date.getUTCMinutes() === 0 &&
  date.getUTCSeconds() === 0 &&
  date.getUTCMilliseconds() === 0;

const eventDateOptions = (date, options) => ({
  ...options,
  ...(isUtcDateOnly(date) ? { timeZone: "UTC" } : {}),
});

export function formatEventDateValue(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  const date = value instanceof Date ? value : toDate(value);
  if (!date) return "Fecha por confirmar";
  return new Intl.DateTimeFormat("es-AR", eventDateOptions(date, options)).format(date);
}

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

  const isDiscreteSchedule = Array.isArray(event.dates) && event.dates.length > 1;
  return (
    dates.some((date) => date >= now && date <= limit) ||
    (!isDiscreteSchedule && Boolean(event.endsAt && dates[0] <= limit))
  );
}

export function formatEventDates(event) {
  const dates = getEventDates(event);
  if (!dates.length) return "Fecha por confirmar";
  if (dates.length === 1 && event.endsAt) {
    return `Del ${formatEventDateValue(dates[0])} al ${formatEventDateValue(event.endsAt)}`;
  }
  if (dates.length === 1)
    return formatEventDateValue(
      dates[0],
      isUtcDateOnly(dates[0]) ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" },
    );

  const groups = [];
  dates.forEach((date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const group = groups.find((candidate) => candidate.key === key);
    if (group) group.dates.push(date);
    else groups.push({ key, dates: [date] });
  });

  return groups
    .map(({ dates: monthDates }) => {
      const calendarParts = monthDates.map((date) => {
        const parts = new Intl.DateTimeFormat(
          "en-CA",
          eventDateOptions(date, { day: "numeric", month: "numeric", year: "numeric" }),
        ).formatToParts(date);
        return Object.fromEntries(
          parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]),
        );
      });
      const days = calendarParts.map(({ day }) => day).join(", ");
      const month = formatEventDateValue(monthDates[0], { month: "long" });
      return `${days} de ${month} de ${calendarParts[0].year}`;
    })
    .join(", ");
}

export function isMultiDateEvent(event) {
  return getEventDates(event).length > 1 || Boolean(event.endsAt && event.startsAt);
}

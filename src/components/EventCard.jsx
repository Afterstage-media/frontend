export function EventCard({ event }) {
  const date = event.startsAt ? new Date(event.startsAt) : null;
  return (
    <article className="event">
      <div className="event-date">
        <b>{date ? date.toLocaleDateString("es-AR", { month: "short" }).toUpperCase() : "PRÓX"}</b>
        <strong>{date ? date.getDate() : ""}</strong>
      </div>
      <div>
        <small>
          {event.artist || "Evento"} · {event.venue || event.city || "Agenda"}
          {event.distanceKm !== undefined ? ` · ${event.distanceKm} km` : ""}
        </small>
        <h3>{event.name}</h3>
        <p>
          {date
            ? date.toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Fecha por confirmar"}{" "}
          {event.city && `· ${event.city}`}
        </p>
        {event.url && (
          <a href={event.url} target="_blank" rel="noreferrer">
            Más información ↗
          </a>
        )}
      </div>
    </article>
  );
}

export function EventCard({ event, index = 0 }) {
  const date = event.startsAt ? new Date(event.startsAt) : null;
  const mapQuery = [event.venue, event.address, event.city, event.country].filter(Boolean).join(", ");
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : "";
  const eventUrl = event.url || "";
  const internalUrl = eventUrl.startsWith("/") || eventUrl.startsWith("#") || !/^https?:\/\//i.test(eventUrl);
  return (
    <article className="event" style={{ "--event-index": index }}>
      <div className="event-date">
        <b>{date ? date.toLocaleDateString("es-AR", { month: "short" }).toUpperCase() : "PRÓX"}</b>
        <strong>{date ? date.getDate() : ""}</strong>
      </div>
      <div className="event-content">
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
        {(event.address || event.venue) && <p className="event-location">⌖ {event.address || event.venue}</p>}
        <div className="event-links">
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noreferrer">
              Ver ubicación ↗
            </a>
          )}
          {eventUrl && (
            <a href={eventUrl} {...(internalUrl ? {} : { target: "_blank", rel: "noreferrer" })}>
              Más información ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

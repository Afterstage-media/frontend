import { Link } from "react-router-dom";
import { Countdown } from "./Countdown.jsx";
import { formatEventDateValue, formatEventDates, getNextEventDate, isMultiDateEvent } from "../utils/eventDates.js";

export function EventCard({ event, index = 0 }) {
  const date = getNextEventDate(event);
  const isMultiDate = isMultiDateEvent(event);
  const mapQuery = [event.venue, event.address, event.city, event.country].filter(Boolean).join(", ");
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : "";
  const eventUrl = event.url || "";
  const internalUrl = eventUrl.startsWith("/") || eventUrl.startsWith("#") || !/^https?:\/\//i.test(eventUrl);
  const eventContext = new URLSearchParams({
    from: "agenda",
    ...(event.id ? { eventId: event.id } : {}),
    ...(event.name ? { eventName: event.name } : {}),
    ...(event.artist ? { artist: event.artist } : {}),
    ...(event.city ? { city: event.city } : {}),
    ...(event.venue ? { venue: event.venue } : {}),
    ...(date ? { date: date.toISOString() } : {}),
  }).toString();
  const marketplaceLink = `/marketplace?${eventContext}&category=merch`;
  const transportLink = `/traslados?${eventContext}`;
  const communityLink = `/red?${eventContext}`;
  const notesLink = `/notas?q=${encodeURIComponent(event.artist || event.name || "")}`;
  return (
    <article className="event" style={{ "--event-index": index }}>
      <div className="event-date">
        <b>{date ? formatEventDateValue(date, { month: "short" }).toUpperCase() : "PRÓX"}</b>
        <strong>{date ? formatEventDateValue(date, { day: "numeric" }) : ""}</strong>
      </div>
      <div className="event-content">
        <small className="event-meta">
          {event.artist || "Evento"} · {event.venue || event.city || "Agenda"}
          {event.distanceKm !== undefined ? ` · ${event.distanceKm} km` : ""}
        </small>
        <h3>{event.name}</h3>
        <p className="event-time">
          {formatEventDates(event)} {event.city && `· ${event.city}`}
        </p>
        {isMultiDate && <p className="event-duration">Varias fechas</p>}
        {(event.address || event.venue) && <p className="event-location">⌖ {event.address || event.venue}</p>}
      </div>
      <div className="event-aside">
        {date && <Countdown endTarget={event.endsAt} target={date.toISOString()} />}
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
        <div aria-label={`Explorar ${event.name || "este evento"}`} className="event-related-links">
          <Link className="event-context-link event-context-link-accent" to={marketplaceLink}>
            Merch ↗
          </Link>
          <Link className="event-context-link" to={transportLink}>
            Traslado ↗
          </Link>
          <Link className="event-context-link" to={communityLink}>
            Comunidad ↗
          </Link>
          <Link className="event-context-link" to={notesLink}>
            Notas ↗
          </Link>
        </div>
      </div>
    </article>
  );
}

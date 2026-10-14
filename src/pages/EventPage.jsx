import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { ErrorMessage, Layout, Loading } from "../components/Layout.jsx";

export function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/public/events/${id}`)
      .then(setEvent)
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  if (error)
    return (
      <Layout>
        <section className="page-intro">
          <p className="eyebrow">Agenda</p>
          <h1>Evento no disponible.</h1>
          <ErrorMessage error={error} />
          <Link className="button dark" to="/agenda">
            Volver a la agenda
          </Link>
        </section>
      </Layout>
    );

  if (!event)
    return (
      <Layout>
        <section className="page-intro">
          <Loading />
        </section>
      </Layout>
    );

  const date = event.startsAt ? new Date(event.startsAt) : null;
  const mapQuery = [event.venue, event.address, event.city, event.country].filter(Boolean).join(", ");
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : "";

  return (
    <Layout>
      <article className="article event-detail">
        <Link className="back-link" to="/agenda">
          ← Volver a la agenda
        </Link>
        <p className="eyebrow">Agenda abierta</p>
        <small>
          {event.artist || "Evento"} · {event.venue || event.city || "Agenda"}
        </small>
        <h1>{event.name}</h1>
        <p className="lead">
          {date ? date.toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" }) : "Fecha por confirmar"}
          {event.city && ` · ${event.city}`}
        </p>
        {(event.address || event.venue) && <p>{event.address || event.venue}</p>}
        {event.notes && <p>{event.notes}</p>}
        <div className="actions">
          {mapUrl && (
            <a className="button dark" href={mapUrl} target="_blank" rel="noreferrer">
              Ver ubicación ↗
            </a>
          )}
          <Link className="button ghost" to="/agenda">
            Explorar más eventos
          </Link>
        </div>
      </article>
    </Layout>
  );
}

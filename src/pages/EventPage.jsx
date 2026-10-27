import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout, Loading } from "../components/Layout.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { formatEventDates, isMultiDateEvent } from "../utils/eventDates.js";

const emptyThread = { title: "", body: "", authorName: "", authorEmail: "" };
const emptyTransport = { name: "", email: "", partySize: "1", origin: "", notes: "", offerId: "" };

function HubNotice({ error, status }) {
  return error ? <ErrorMessage error={error} /> : status ? <p className="success">{status}</p> : null;
}

export function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [hub, setHub] = useState(null);
  const [error, setError] = useState("");
  const [thread, setThread] = useState(emptyThread);
  const [replyFor, setReplyFor] = useState("");
  const [reply, setReply] = useState({ body: "", authorName: "", authorEmail: "" });
  const [transport, setTransport] = useState(emptyTransport);
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");

  const load = () => {
    setError("");
    Promise.all([api(`/api/public/events/${id}`), api(`/api/public/events/${id}/hub`)])
      .then(([nextEvent, nextHub]) => {
        setEvent(nextEvent);
        setHub(nextHub);
      })
      .catch((requestError) => {
        api(`/api/public/events/${id}`)
          .then(setEvent)
          .catch(() => setError(requestError.message));
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  const submitThread = async (submitEvent) => {
    submitEvent.preventDefault();
    setStatus("");
    setFormError("");
    try {
      const result = await api(`/api/public/events/${id}/forum/threads`, {
        method: "POST",
        body: JSON.stringify(thread),
      });
      setStatus(result.message);
      setThread(emptyThread);
      load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const submitTransport = async (submitEvent) => {
    submitEvent.preventDefault();
    setStatus("");
    setFormError("");
    try {
      const result = await api(`/api/public/events/${id}/transport-requests`, {
        method: "POST",
        body: JSON.stringify({
          ...transport,
          partySize: Number(transport.partySize || 1),
          offerId: transport.offerId || null,
        }),
      });
      setStatus(result.message);
      setTransport(emptyTransport);
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const submitReply = async (submitEvent) => {
    submitEvent.preventDefault();
    setStatus("");
    setFormError("");
    try {
      const result = await api(`/api/public/forum/threads/${replyFor}/posts`, {
        method: "POST",
        body: JSON.stringify(reply),
      });
      setStatus(result.message);
      setReplyFor("");
      setReply({ body: "", authorName: "", authorEmail: "" });
      load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

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

  const isMultiDate = isMultiDateEvent(event);
  const mapQuery = [event.venue, event.address, event.city, event.country].filter(Boolean).join(", ");
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : "";
  return (
    <Layout>
      <SignalTicker items={["Agenda abierta", "Fecha", "Foro", "Coberturas", "Traslados"]} />
      <article className="article event-detail event-hub">
        <Link className="back-link" to="/agenda">
          ← Volver a la agenda
        </Link>
        <p className="eyebrow">Agenda abierta / Espacio del evento</p>
        <small>
          {event.artist || "Evento"} · {event.venue || event.city || "Agenda"}
        </small>
        <h1>{event.name}</h1>
        <p className="lead">
          {formatEventDates(event)}
          {event.city && ` · ${event.city}`}
        </p>
        {isMultiDate && <p>Evento con varias fechas.</p>}
        {(event.address || event.venue) && <p>{event.address || event.venue}</p>}
        {event.notes && <p>{event.notes}</p>}
        <div className="actions">
          {mapUrl && (
            <a className="button dark" href={mapUrl} target="_blank" rel="noreferrer">
              Ver ubicación ↗
            </a>
          )}
          <Link className="button ghost" to={`/red?eventId=${event.id}`}>
            Ver red y coberturas
          </Link>
          <Link className="button ghost" to={`/seguros?eventId=${event.id}`}>
            Consultar seguro
          </Link>
        </div>
      </article>

      <section className="event-hub-grid">
        <div className="event-hub-main">
          <section className="hub-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Meet fan</p>
                <h2>Conversación previa al show.</h2>
              </div>
              <span className="network-count">{hub?.threads?.length || 0} temas</span>
            </div>
            {hub?.threads?.length ? (
              <div className="forum-list">
                {hub.threads.map((item) => (
                  <article className="forum-thread" key={item.id}>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <small>
                      {item.authorName} · {item.posts?.length || 0} respuestas
                    </small>
                    {!!item.posts?.length && (
                      <div className="forum-post-list">
                        {item.posts.map((post) => (
                          <div className="forum-post" key={post.id}>
                            <p>{post.body}</p>
                            <small>{post.authorName}</small>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="button ghost" onClick={() => setReplyFor(item.id)} type="button">
                      Responder ↗
                    </button>
                    {replyFor === item.id && (
                      <form className="compact-form forum-reply-form" onSubmit={submitReply}>
                        <label>
                          Tu nombre
                          <input
                            required
                            value={reply.authorName}
                            onChange={(input) => setReply({ ...reply, authorName: input.target.value })}
                          />
                        </label>
                        <label>
                          Email
                          <input
                            required
                            type="email"
                            value={reply.authorEmail}
                            onChange={(input) => setReply({ ...reply, authorEmail: input.target.value })}
                          />
                        </label>
                        <label>
                          Respuesta
                          <textarea
                            required
                            rows="3"
                            value={reply.body}
                            onChange={(input) => setReply({ ...reply, body: input.target.value })}
                          />
                        </label>
                        <div className="actions">
                          <button className="button dark" type="submit">
                            Publicar respuesta ↗
                          </button>
                          <button className="button ghost" onClick={() => setReplyFor("")} type="button">
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Todavía no hay conversaciones. Abrí la primera.</p>
            )}
            <form className="compact-form event-action-form" onSubmit={submitThread}>
              <h3>Abrir conversación</h3>
              <div className="form-grid">
                <label>
                  Título
                  <input
                    required
                    value={thread.title}
                    onChange={(input) => setThread({ ...thread, title: input.target.value })}
                  />
                </label>
                <label>
                  Tu nombre
                  <input
                    required
                    value={thread.authorName}
                    onChange={(input) => setThread({ ...thread, authorName: input.target.value })}
                  />
                </label>
              </div>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={thread.authorEmail}
                  onChange={(input) => setThread({ ...thread, authorEmail: input.target.value })}
                />
              </label>
              <label>
                Mensaje
                <textarea
                  required
                  rows="3"
                  value={thread.body}
                  onChange={(input) => setThread({ ...thread, body: input.target.value })}
                />
              </label>
              <button className="button" type="submit">
                Publicar en el foro ↗
              </button>
              <HubNotice error={formError} status={status} />
            </form>
          </section>
          <section className="hub-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Cobertura</p>
                <h2>Personas que pueden contar la fecha.</h2>
              </div>
              <Link className="button ghost" to={`/red?eventId=${event.id}`}>
                Ver búsquedas ↗
              </Link>
            </div>
            {hub?.coverageRequests?.length ? (
              <div className="hub-item-list">
                {hub.coverageRequests.map((item) => (
                  <article className="hub-item" key={item.id}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <Link className="button dark" to={`/red?eventId=${event.id}`}>
                      Postularme
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">La cobertura de este evento todavía no tiene una búsqueda abierta.</p>
            )}
          </section>
        </div>
        <aside className="event-hub-side">
          <section className="hub-panel transport-panel">
            <p className="eyebrow">Traslados</p>
            <h2>Organizá cómo llegar.</h2>
            {hub?.transportOffers?.length ? (
              <div className="hub-item-list">
                {hub.transportOffers.map((offer) => (
                  <article className="transport-offer" key={offer.id}>
                    <strong>{offer.title}</strong>
                    <span>
                      {offer.origin} → {offer.destination}
                    </span>
                    <small>
                      {offer.seats} lugares · {offer.priceLabel}
                    </small>
                    <button
                      className="button ghost"
                      onClick={() => setTransport({ ...transport, offerId: offer.id })}
                      type="button"
                    >
                      Elegir este traslado
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Todavía no hay traslados publicados para esta fecha.</p>
            )}
            <form className="compact-form event-action-form" onSubmit={submitTransport}>
              <label>
                Nombre
                <input
                  required
                  value={transport.name}
                  onChange={(input) => setTransport({ ...transport, name: input.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={transport.email}
                  onChange={(input) => setTransport({ ...transport, email: input.target.value })}
                />
              </label>
              <label>
                Desde dónde
                <input
                  required
                  value={transport.origin}
                  onChange={(input) => setTransport({ ...transport, origin: input.target.value })}
                />
              </label>
              <label>
                Personas
                <input
                  min="1"
                  type="number"
                  value={transport.partySize}
                  onChange={(input) => setTransport({ ...transport, partySize: input.target.value })}
                />
              </label>
              <label>
                Nota
                <textarea
                  rows="2"
                  value={transport.notes}
                  onChange={(input) => setTransport({ ...transport, notes: input.target.value })}
                />
              </label>
              <button className="button dark" type="submit">
                Pedir lugar ↗
              </button>
            </form>
          </section>
          <section className="hub-panel">
            <p className="eyebrow">Servicios de la escena</p>
            <h2>También podés resolver la producción.</h2>
            <div className="hub-links">
              <Link to={`/seguros?eventId=${event.id}`}>Cotizar seguro ↗</Link>
              <Link to="/marketplace">Ver marketplace ↗</Link>
              <Link to="/red">Encontrar fotógrafos ↗</Link>
            </div>
          </section>
        </aside>
      </section>
    </Layout>
  );
}

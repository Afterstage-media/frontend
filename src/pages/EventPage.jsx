import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout, Loading } from "../components/Layout.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { Button, ButtonLink } from "../components/ui/Button.jsx";
import { Notice } from "../components/ui/Notice.jsx";
import { formatEventDates, isMultiDateEvent } from "../utils/eventDates.js";
import { transportRequestEs as transportText } from "../i18n/es-AR.dictionary.js";
import { clearStableIdempotencyKey, getStableIdempotencyKey } from "../utils/idempotency.js";
import { Dialog } from "../components/ui/Dialog.jsx";

const emptyThread = { title: "", body: "", authorName: "", authorEmail: "" };
const emptyReply = { body: "", authorName: "", authorEmail: "" };
const emptyTransport = { name: "", email: "", partySize: "1", origin: "", notes: "", offerId: "" };

function HubNotice({ error, status }) {
  return error ? <ErrorMessage error={error} /> : status ? <Notice>{status}</Notice> : null;
}

export function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [hub, setHub] = useState(null);
  const [error, setError] = useState("");
  const [thread, setThread] = useState(emptyThread);
  const [activeDialog, setActiveDialog] = useState(null);
  const [reply, setReply] = useState(emptyReply);
  const [transport, setTransport] = useState(emptyTransport);
  const [transportSubmitting, setTransportSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");

  const openDialog = (dialog) => {
    setFormError("");
    setStatus("");
    setActiveDialog(dialog);
  };
  const closeDialog = () => {
    setActiveDialog(null);
    setFormError("");
  };
  const openReplyDialog = (threadId) => {
    if (activeDialog?.type !== "reply" || activeDialog.threadId !== threadId) setReply(emptyReply);
    openDialog({ type: "reply", threadId });
  };
  const openTransportDialog = (offerId = transport.offerId) => {
    setTransport((current) => ({ ...current, offerId }));
    openDialog({ type: "transport" });
  };

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
      const scope = `forum-thread-${id}`;
      const idempotencyKey = await getStableIdempotencyKey(scope, thread);
      const result = await api(`/api/public/events/${id}/forum/threads`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(thread),
      });
      setStatus(result.message);
      setThread(emptyThread);
      clearStableIdempotencyKey(scope);
      setActiveDialog(null);
      load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const submitTransport = async (submitEvent) => {
    submitEvent.preventDefault();
    if (transportSubmitting) return;
    setStatus("");
    setFormError("");
    setTransportSubmitting(true);
    try {
      const payload = {
        ...transport,
        partySize: Number(transport.partySize || 1),
        offerId: transport.offerId || null,
      };
      const idempotencyKey = await getStableIdempotencyKey(`transport-request-${id}`, payload);
      const result = await api(`/api/public/events/${id}/transport-requests`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      setStatus(result.message);
      setTransport(emptyTransport);
      clearStableIdempotencyKey(`transport-request-${id}`);
      setActiveDialog(null);
      load();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setTransportSubmitting(false);
    }
  };

  const submitReply = async (submitEvent) => {
    submitEvent.preventDefault();
    const replyFor = activeDialog?.type === "reply" ? activeDialog.threadId : "";
    if (!replyFor) return;
    setStatus("");
    setFormError("");
    try {
      const scope = `forum-post-${replyFor}`;
      const idempotencyKey = await getStableIdempotencyKey(scope, reply);
      const result = await api(`/api/public/forum/threads/${replyFor}/posts`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(reply),
      });
      setStatus(result.message);
      setReply(emptyReply);
      clearStableIdempotencyKey(scope);
      setActiveDialog(null);
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
          <ButtonLink className="dark" to="/agenda">
            Volver a la agenda
          </ButtonLink>
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
            <ButtonLink className="dark" href={mapUrl} target="_blank" rel="noreferrer">
              Ver ubicación ↗
            </ButtonLink>
          )}
          <ButtonLink className="ghost" to={`/red?eventId=${event.id}`}>
            Ver red y coberturas
          </ButtonLink>
          <ButtonLink className="ghost" to={`/seguros?eventId=${event.id}`}>
            Consultar seguro
          </ButtonLink>
        </div>
      </article>
      <HubNotice error={!activeDialog ? formError : ""} status={!activeDialog ? status : ""} />

      <section className="event-hub-grid">
        <div className="event-hub-main">
          <section className="hub-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Meet fan</p>
                <h2>Conversación previa al show.</h2>
              </div>
              <div className="actions">
                <span className="network-count">{hub?.threads?.length || 0} temas</span>
                <Button className="dark" onClick={() => openDialog({ type: "thread" })} type="button">
                  Abrir conversación ↗
                </Button>
              </div>
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
                    <Button variant="ghost" onClick={() => openReplyDialog(item.id)} type="button">
                      Responder ↗
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Todavía no hay conversaciones. Abrí la primera.</p>
            )}
          </section>
          <section className="hub-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Cobertura</p>
                <h2>Personas que pueden contar la fecha.</h2>
              </div>
              <ButtonLink className="ghost" to={`/red?eventId=${event.id}`}>
                Ver búsquedas ↗
              </ButtonLink>
            </div>
            {hub?.coverageRequests?.length ? (
              <div className="hub-item-list">
                {hub.coverageRequests.map((item) => (
                  <article className="hub-item" key={item.id}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <ButtonLink className="dark" to={`/red?eventId=${event.id}`}>
                      Postularme
                    </ButtonLink>
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
                    <button className="button ghost" onClick={() => openTransportDialog(offer.id)} type="button">
                      Elegir este traslado
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Todavía no hay traslados publicados para esta fecha.</p>
            )}
            <Button className="dark" onClick={() => openTransportDialog()} type="button">
              Pedir un traslado ↗
            </Button>
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
      {activeDialog && (
        <Dialog
          backdropClassName="modal-backdrop event-form-backdrop"
          labelledBy="event-action-dialog-title"
          onClose={closeDialog}
          panelClassName="event-form-dialog"
        >
          <div className="event-form-dialog-heading">
            <div>
              <p className="eyebrow">{event.name}</p>
              <h2 id="event-action-dialog-title">
                {activeDialog.type === "thread"
                  ? "Abrir conversación"
                  : activeDialog.type === "reply"
                    ? "Responder en el foro"
                    : "Pedir un traslado"}
              </h2>
            </div>
            <Button onClick={closeDialog} type="button" aria-label="Cerrar formulario">
              ×
            </Button>
          </div>
          {activeDialog.type === "thread" && (
            <form className="compact-form event-action-form" onSubmit={submitThread}>
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
              <div className="actions">
                <Button variant="dark" type="submit">
                  Publicar en el foro ↗
                </Button>
                <Button onClick={closeDialog} type="button">
                  Cancelar
                </Button>
              </div>
              <HubNotice error={formError} />
            </form>
          )}
          {activeDialog.type === "reply" && (
            <form className="compact-form event-action-form" onSubmit={submitReply}>
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
                <Button variant="dark" type="submit">
                  Publicar respuesta ↗
                </Button>
                <Button onClick={closeDialog} type="button">
                  Cancelar
                </Button>
              </div>
              <HubNotice error={formError} />
            </form>
          )}
          {activeDialog.type === "transport" && (
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
              <div className="actions">
                <Button disabled={transportSubmitting} variant="dark" type="submit">
                  {transportSubmitting ? transportText.submitting : transportText.submitEvent}
                </Button>
                <Button disabled={transportSubmitting} onClick={closeDialog} type="button">
                  Cancelar
                </Button>
              </div>
              <HubNotice error={formError} />
            </form>
          )}
        </Dialog>
      )}
    </Layout>
  );
}

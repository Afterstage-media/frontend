import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { EmptyState, LoadingState } from "../components/UiState.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";

const emptyInsurance = {
  name: "",
  organization: "",
  email: "",
  phone: "",
  coverageType: "Accidentes personales",
  startsAt: "",
  endsAt: "",
  peopleCount: "1",
  notes: "",
};

export function InsurancePage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [form, setForm] = useState(emptyInsurance);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    try {
      const result = await api("/api/public/insurance-requests", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          eventId: eventId || null,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          peopleCount: Number(form.peopleCount || 1),
        }),
      });
      setStatus(result.message);
      setForm(emptyInsurance);
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <Layout>
      <SignalTicker items={["Seguros", "Eventos", "Equipos", "Personas"]} />
      <section className="page-intro insurance-intro">
        <p className="eyebrow">Protección para la escena / 01</p>
        <h1>Que el evento avance con todo en regla.</h1>
        <p>Dejanos los datos básicos y coordinamos la cotización con un productor aliado.</p>
      </section>
      <section className="insurance-layout">
        <div className="insurance-copy">
          <p className="eyebrow">Circuito simple</p>
          <h2>Una consulta, una respuesta concreta.</h2>
          <ol>
            <li>Contás qué evento o actividad querés cubrir.</li>
            <li>Recibimos los datos y los enviamos al productor correspondiente.</li>
            <li>Te contactan para cotizar y resolver la póliza.</li>
          </ol>
          <p className="muted">La solicitud no contrata una póliza automáticamente. Es el primer paso de contacto.</p>
          {eventId && (
            <Link className="button ghost" to={`/agenda/evento/${eventId}`}>
              Volver al evento
            </Link>
          )}
        </div>
        <form className="form insurance-form" onSubmit={submit}>
          <label>
            Nombre y apellido
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Organización
            <input
              value={form.organization}
              onChange={(event) => setForm({ ...form, organization: event.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Teléfono
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>
            Tipo de cobertura
            <input
              required
              value={form.coverageType}
              onChange={(event) => setForm({ ...form, coverageType: event.target.value })}
            />
          </label>
          <div className="form-grid">
            <label>
              Desde
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
              />
            </label>
            <label>
              Hasta
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
              />
            </label>
          </div>
          <label>
            Personas involucradas
            <input
              min="1"
              type="number"
              value={form.peopleCount}
              onChange={(event) => setForm({ ...form, peopleCount: event.target.value })}
            />
          </label>
          <label>
            Detalles
            <textarea
              rows="5"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <button className="button dark" type="submit">
            Pedir cotización ↗
          </button>
          {error && <ErrorMessage error={error} />}
          {status && <p className="success">{status}</p>}
        </form>
      </section>
    </Layout>
  );
}

export function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    api(`/api/public/marketplace${category ? `?category=${encodeURIComponent(category)}` : ""}`)
      .then(setItems)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [category]);
  return (
    <Layout>
      <SignalTicker items={["Marketplace", "Orux", "Merch", "Beneficios"]} />
      <section className="page-intro marketplace-intro">
        <p className="eyebrow">Lo que queda después del show / 01</p>
        <h1>Una vidriera conectada a la escena.</h1>
        <p>Merchandising, servicios y beneficios administrados desde la infraestructura comercial de Orux.</p>
      </section>
      <section className="marketplace-toolbar" aria-label="Filtros del marketplace">
        <button className={!category ? "button dark" : "button ghost"} onClick={() => setCategory("")} type="button">
          Todo
        </button>
        <button
          className={category === "merch" ? "button dark" : "button ghost"}
          onClick={() => setCategory("merch")}
          type="button"
        >
          Merch
        </button>
        <button
          className={category === "service" ? "button dark" : "button ghost"}
          onClick={() => setCategory("service")}
          type="button"
        >
          Servicios
        </button>
        <button
          className={category === "benefit" ? "button dark" : "button ghost"}
          onClick={() => setCategory("benefit")}
          type="button"
        >
          Beneficios
        </button>
        <span>Catálogo sincronizado con Orux</span>
      </section>
      <section className="marketplace-grid">
        {loading ? (
          <LoadingState label="Cargando catálogo…" />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : items.length === 0 ? (
          <EmptyState
            title="El catálogo se está armando."
            message="Pronto vas a encontrar productos y beneficios de la escena."
          />
        ) : (
          items.map((item) => (
            <article className="marketplace-card" key={item.id}>
              {item.imageUrl && <img alt="" src={item.imageUrl} />}
              <span className="eyebrow">
                {item.category === "merch" ? "Merch" : item.category === "service" ? "Servicio" : "Beneficio"} ·{" "}
                {item.source === "orux" ? "Orux" : "Afterstage"}
              </span>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <strong>{item.priceLabel}</strong>
              {item.productUrl && (
                <a className="button dark" href={item.productUrl} rel="noreferrer" target="_blank">
                  Ver propuesta ↗
                </a>
              )}
            </article>
          ))
        )}
      </section>
    </Layout>
  );
}

export function TransportPage() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get("eventId") || "");
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", origin: "", partySize: "1", notes: "", offerId: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/public/events?limit=80")
      .then((items) => setEvents(items))
      .catch((requestError) => setError(requestError.message));
  }, []);
  useEffect(() => {
    if (!selectedEvent) return;
    api(`/api/public/events/${selectedEvent}/transport`)
      .then(setOffers)
      .catch(() => setOffers([]));
  }, [selectedEvent]);
  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    try {
      const result = await api(`/api/public/events/${selectedEvent}/transport-requests`, {
        method: "POST",
        body: JSON.stringify({ ...form, offerId: form.offerId || null, partySize: Number(form.partySize || 1) }),
      });
      setStatus(result.message);
      setForm({ name: "", email: "", origin: "", partySize: "1", notes: "", offerId: "" });
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <Layout>
      <SignalTicker items={["Traslados", "Shows", "Cupos", "Viajes"]} />
      <section className="page-intro transport-intro">
        <p className="eyebrow">Llegar también es parte del show / 01</p>
        <h1>Organizá el viaje antes de salir.</h1>
        <p>Elegí una fecha, mirá los cupos disponibles y dejá tu pedido de traslado.</p>
      </section>
      <section className="transport-layout">
        <div className="transport-events">
          <p className="eyebrow">Fechas próximas</p>
          <h2>¿A qué show vas?</h2>
          {events.length === 0 ? (
            <LoadingState label="Buscando fechas…" />
          ) : (
            <div className="transport-event-list">
              {events.map((event) => (
                <button
                  className={`transport-event ${selectedEvent === event.id ? "is-selected" : ""}`}
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  type="button"
                >
                  <strong>{event.artist || event.name}</strong>
                  <span>{event.city || event.venue || "Fecha"}</span>
                  <small>
                    {event.startsAt ? new Date(event.startsAt).toLocaleDateString("es-AR") : "Consultar fecha"}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="transport-request-panel">
          {selectedEvent ? (
            <>
              <p className="eyebrow">
                {events.find((event) => event.id === selectedEvent)?.artist || "Evento seleccionado"}
              </p>
              <h2>Pedí tu lugar.</h2>
              {offers.length ? (
                <div className="transport-choice-list">
                  {offers.map((offer) => (
                    <label
                      className={`transport-choice ${form.offerId === offer.id ? "is-selected" : ""}`}
                      key={offer.id}
                    >
                      <input
                        checked={form.offerId === offer.id}
                        name="offer"
                        onChange={() => setForm({ ...form, offerId: offer.id })}
                        type="radio"
                      />
                      <span>
                        <strong>{offer.title}</strong>
                        <small>
                          {offer.origin} → {offer.destination} · {offer.seats} lugares · {offer.priceLabel}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  Todavía no hay un traslado publicado. Dejanos tu pedido y vemos cómo organizarlo.
                </p>
              )}
              <form className="form transport-form" onSubmit={submit}>
                <label>
                  Nombre
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </label>
                <label>
                  Desde dónde
                  <input
                    required
                    value={form.origin}
                    onChange={(event) => setForm({ ...form, origin: event.target.value })}
                  />
                </label>
                <label>
                  Personas
                  <input
                    min="1"
                    type="number"
                    value={form.partySize}
                    onChange={(event) => setForm({ ...form, partySize: event.target.value })}
                  />
                </label>
                <label>
                  Nota
                  <textarea
                    rows="3"
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  />
                </label>
                <button className="button dark" type="submit">
                  Pedir traslado ↗
                </button>
                {error && <ErrorMessage error={error} />}
                {status && <p className="success">{status}</p>}
              </form>
            </>
          ) : (
            <EmptyState
              title="Elegí una fecha."
              message="Vamos a mostrarte los traslados y cupos asociados a ese evento."
            />
          )}
        </div>
      </section>
    </Layout>
  );
}

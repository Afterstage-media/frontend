import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { EmptyState, LoadingState } from "../components/UiState.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { formatEventDateValue } from "../utils/eventDates.js";

const insuranceProducts = [
  { value: "ap", label: "Accidentes personales", hint: "Personas durante el evento" },
  { value: "art", label: "ART", hint: "Trabajadores y actividad" },
  { value: "vida", label: "Seguro de vida", hint: "Persona asegurada" },
  { value: "robo_equipos", label: "Robo de equipos", hint: "Equipos, inventario y valores" },
];

const createEmptyInsurance = () => ({
  name: "",
  dni: "",
  organization: "",
  email: "",
  phone: "",
  coverageTypes: ["ap"],
  startsAt: "",
  endsAt: "",
  peopleCount: "1",
  notes: "",
  productDetails: {
    eventName: "",
    eventLocation: "",
    eventDescription: "",
    apPeopleCount: "1",
    apInsuredSumLabel: "",
    artEmployer: "",
    artActivity: "",
    artWorkerCount: "",
    vidaInsuredName: "",
    vidaInsuredAge: "",
    vidaInsuredSumLabel: "",
    vidaBeneficiary: "",
    equipmentDescription: "",
    equipmentValueLabel: "",
    equipmentCount: "1",
    equipmentSerials: "",
  },
});

const insuranceProductLabel = (value) => insuranceProducts.find((product) => product.value === value)?.label || value;

const focusField = (name) => {
  window.setTimeout(() => document.querySelector(`[name="${name}"]`)?.focus(), 0);
};

export function InsurancePage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [form, setForm] = useState(createEmptyInsurance);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [insuranceStep, setInsuranceStep] = useState(1);
  const continueInsurance = (event) => {
    event.preventDefault();
    setError("");
    if (!form.coverageTypes.length) {
      setError("Elegí al menos un producto para cotizar.");
      focusField("coverageTypes");
      return;
    }
    if (!form.name.trim()) {
      setError("Ingresá tu nombre y apellido.");
      focusField("name");
      return;
    }
    if (!form.email.trim()) {
      setError("Ingresá un email para poder contactarte.");
      focusField("email");
      return;
    }
    setInsuranceStep(2);
  };
  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    if (!form.coverageTypes.length) {
      setError("Elegí al menos un producto para cotizar.");
      focusField("coverageTypes");
      return;
    }
    try {
      const details = form.productDetails;
      const result = await api("/api/public/insurance-requests", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          dni: form.dni,
          organization: form.organization,
          email: form.email,
          phone: form.phone,
          coverageTypes: form.coverageTypes,
          coverageType: form.coverageTypes.map(insuranceProductLabel).join(" + "),
          productDetails: {
            ...details,
            apPeopleCount: form.coverageTypes.includes("ap") ? Number(details.apPeopleCount || 1) : null,
            artWorkerCount: form.coverageTypes.includes("art") ? Number(details.artWorkerCount || 0) || null : null,
            vidaInsuredAge: details.vidaInsuredAge ? Number(details.vidaInsuredAge) : null,
            equipmentCount: form.coverageTypes.includes("robo_equipos") ? Number(details.equipmentCount || 1) : null,
          },
          eventId: eventId || null,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          peopleCount: Number(details.apPeopleCount || form.peopleCount || 1),
          notes: form.notes,
        }),
      });
      setStatus(result.message);
      setForm(createEmptyInsurance());
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <Layout>
      <section className="page-intro insurance-intro">
        <p className="eyebrow">Protección para la escena / 01</p>
        <h1>Que el evento avance con todo en regla.</h1>
        <p>
          Elegí uno o varios productos y armamos una solicitud específica para que un productor aliado pueda cotizarla.
        </p>
      </section>
      <section className="insurance-layout">
        <div className="insurance-copy">
          <p className="eyebrow">Circuito simple</p>
          <h2>Una consulta, una respuesta concreta.</h2>
          <ol>
            <li>Contás qué evento o actividad querés cubrir.</li>
            <li>Recibimos los datos y los enviamos con un detalle separado por producto.</li>
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
          <div className="form-progress" aria-label={`Paso ${insuranceStep} de 2`}>
            <span className={insuranceStep === 1 ? "is-active" : "is-complete"}>01 · Base del pedido</span>
            <span className={insuranceStep === 2 ? "is-active" : ""}>02 · Detalles de cobertura</span>
          </div>
          {insuranceStep === 1 && (
            <>
              <div className="form-grid insurance-contact-grid">
                <label>
                  Nombre y apellido
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </label>
              </div>
              <fieldset className="form-fieldset">
                <legend>¿Qué querés cotizar?</legend>
                <p className="muted">
                  Podés seleccionar más de un producto. La compañía puede pedir información adicional.
                </p>
                <div className="insurance-products">
                  {insuranceProducts.map((product) => {
                    const selected = form.coverageTypes.includes(product.value);
                    return (
                      <label className={`insurance-product ${selected ? "selected" : ""}`} key={product.value}>
                        <input
                          name="coverageTypes"
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setForm({
                              ...form,
                              coverageTypes: selected
                                ? form.coverageTypes.filter((value) => value !== product.value)
                                : [...form.coverageTypes, product.value],
                            })
                          }
                        />
                        <span>
                          <strong>{product.label}</strong>
                          <small>{product.hint}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <p className="form-step-note">
                Con estos datos alcanza para empezar. En el próximo paso te pedimos el contexto del evento.
              </p>
              <ErrorMessage error={error} />
              <button className="button dark" onClick={continueInsurance} type="button">
                Continuar con los detalles →
              </button>
            </>
          )}
          {insuranceStep === 2 && (
            <>
              <fieldset className="form-fieldset">
                <legend>Datos de contacto</legend>
                <div className="form-grid">
                  <label>
                    DNI
                    <input
                      name="dni"
                      required
                      value={form.dni}
                      onChange={(event) => setForm({ ...form, dni: event.target.value })}
                    />
                  </label>
                  <label>
                    Teléfono
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Organización
                  <input
                    name="organization"
                    value={form.organization}
                    onChange={(event) => setForm({ ...form, organization: event.target.value })}
                  />
                </label>
              </fieldset>
              <fieldset className="form-fieldset">
                <legend>Datos del evento</legend>
                <label>
                  Nombre del evento
                  <input
                    value={form.productDetails.eventName}
                    onChange={(event) =>
                      setForm({ ...form, productDetails: { ...form.productDetails, eventName: event.target.value } })
                    }
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Lugar
                    <input
                      value={form.productDetails.eventLocation}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, eventLocation: event.target.value },
                        })
                      }
                    />
                  </label>
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
                  Descripción de la actividad
                  <textarea
                    rows="3"
                    value={form.productDetails.eventDescription}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        productDetails: { ...form.productDetails, eventDescription: event.target.value },
                      })
                    }
                  />
                </label>
              </fieldset>
              {form.coverageTypes.includes("ap") && (
                <fieldset className="form-fieldset">
                  <legend>Accidentes personales</legend>
                  <div className="form-grid">
                    <label>
                      Personas a asegurar
                      <input
                        required
                        min="1"
                        type="number"
                        value={form.productDetails.apPeopleCount}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            peopleCount: event.target.value,
                            productDetails: { ...form.productDetails, apPeopleCount: event.target.value },
                          })
                        }
                      />
                    </label>
                    <label>
                      Suma asegurada por persona
                      <input
                        required
                        placeholder="Ej.: $10.000.000"
                        value={form.productDetails.apInsuredSumLabel}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            productDetails: { ...form.productDetails, apInsuredSumLabel: event.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                </fieldset>
              )}
              {form.coverageTypes.includes("art") && (
                <fieldset className="form-fieldset">
                  <legend>ART</legend>
                  <label>
                    Empleador o razón social
                    <input
                      required
                      value={form.productDetails.artEmployer}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, artEmployer: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Actividad
                    <input
                      required
                      value={form.productDetails.artActivity}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, artActivity: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Cantidad de trabajadores
                    <input
                      required
                      min="1"
                      type="number"
                      value={form.productDetails.artWorkerCount}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, artWorkerCount: event.target.value },
                        })
                      }
                    />
                  </label>
                </fieldset>
              )}
              {form.coverageTypes.includes("vida") && (
                <fieldset className="form-fieldset">
                  <legend>Seguro de vida</legend>
                  <label>
                    Persona asegurada
                    <input
                      required
                      value={form.productDetails.vidaInsuredName}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, vidaInsuredName: event.target.value },
                        })
                      }
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Edad
                      <input
                        min="0"
                        type="number"
                        value={form.productDetails.vidaInsuredAge}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            productDetails: { ...form.productDetails, vidaInsuredAge: event.target.value },
                          })
                        }
                      />
                    </label>
                    <label>
                      Suma asegurada
                      <input
                        required
                        placeholder="Ej.: $20.000.000"
                        value={form.productDetails.vidaInsuredSumLabel}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            productDetails: { ...form.productDetails, vidaInsuredSumLabel: event.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Beneficiario(s)
                    <input
                      value={form.productDetails.vidaBeneficiary}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, vidaBeneficiary: event.target.value },
                        })
                      }
                    />
                  </label>
                </fieldset>
              )}
              {form.coverageTypes.includes("robo_equipos") && (
                <fieldset className="form-fieldset">
                  <legend>Robo de equipos</legend>
                  <label>
                    Equipos a asegurar
                    <textarea
                      required
                      rows="3"
                      value={form.productDetails.equipmentDescription}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, equipmentDescription: event.target.value },
                        })
                      }
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Valor total
                      <input
                        required
                        placeholder="Ej.: USD 15.000"
                        value={form.productDetails.equipmentValueLabel}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            productDetails: { ...form.productDetails, equipmentValueLabel: event.target.value },
                          })
                        }
                      />
                    </label>
                    <label>
                      Cantidad de equipos
                      <input
                        required
                        min="1"
                        type="number"
                        value={form.productDetails.equipmentCount}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            productDetails: { ...form.productDetails, equipmentCount: event.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Números de serie o inventario (opcional)
                    <textarea
                      rows="2"
                      value={form.productDetails.equipmentSerials}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          productDetails: { ...form.productDetails, equipmentSerials: event.target.value },
                        })
                      }
                    />
                  </label>
                </fieldset>
              )}
              <label>
                Detalles
                <textarea
                  rows="5"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                />
              </label>
              <div className="form-step-actions">
                <button className="button ghost" onClick={() => setInsuranceStep(1)} type="button">
                  ← Volver
                </button>
                <button className="button dark" type="submit">
                  Pedir cotización ↗
                </button>
              </div>
              {error && <ErrorMessage error={error} />}
              {status && <p className="success">{status}</p>}
            </>
          )}
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
  useEffect(() => {
    load();
  }, [category]);
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
          <>
            <EmptyState
              title="El catálogo se está armando."
              message="Pronto vas a encontrar productos y beneficios de la escena."
            />
            <div className="empty-state-actions">
              <Link className="button dark" to="/servicios">
                Ver servicios
              </Link>
              <Link className="button ghost" to="/red">
                Explorar la red
              </Link>
            </div>
          </>
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
  const [eventQuery, setEventQuery] = useState("");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get("eventId") || "");
  const [offers, setOffers] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", origin: "", partySize: "1", notes: "", offerId: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setEventsLoading(true);
    api("/api/public/events?limit=80")
      .then((items) => setEvents(items))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setEventsLoading(false));
  }, []);
  useEffect(() => {
    if (!selectedEvent) return;
    api(`/api/public/events/${selectedEvent}/transport`)
      .then(setOffers)
      .catch(() => setOffers([]));
  }, [selectedEvent]);
  const matchingEvents = events.filter((event) => {
    const query = eventQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return [event.artist, event.name, event.city, event.venue, event.startsAt]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(query);
  });
  const visibleEvents = showAllEvents ? matchingEvents : matchingEvents.slice(0, 20);
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
          <label className="transport-search">
            Buscar por artista, ciudad o sala
            <input
              aria-label="Buscar una fecha de traslado"
              onChange={(event) => setEventQuery(event.target.value)}
              placeholder="Ej.: Rosario o nombre del artista"
              type="search"
              value={eventQuery}
            />
          </label>
          {eventsLoading ? (
            <LoadingState label="Buscando fechas…" />
          ) : events.length === 0 ? (
            <EmptyState
              title="No hay fechas cargadas."
              message="Cuando aparezcan eventos, vas a poder elegirlos y pedir tu traslado acá."
            />
          ) : (
            <>
              <p className="muted transport-results-count">
                {matchingEvents.length} {matchingEvents.length === 1 ? "fecha encontrada" : "fechas encontradas"}
              </p>
              <div className="transport-event-list">
                {visibleEvents.map((event) => (
                  <button
                    className={`transport-event ${selectedEvent === event.id ? "is-selected" : ""}`}
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    type="button"
                  >
                    <strong>{event.artist || event.name}</strong>
                    <span>{event.city || event.venue || "Fecha"}</span>
                    <small>{event.startsAt ? formatEventDateValue(event.startsAt) : "Consultar fecha"}</small>
                  </button>
                ))}
              </div>
              {matchingEvents.length > visibleEvents.length && (
                <button
                  className="button ghost transport-show-more"
                  onClick={() => setShowAllEvents(true)}
                  type="button"
                >
                  Mostrar las {matchingEvents.length - visibleEvents.length} fechas restantes ↓
                </button>
              )}
              {showAllEvents && matchingEvents.length > 20 && (
                <button
                  className="button ghost transport-show-more"
                  onClick={() => setShowAllEvents(false)}
                  type="button"
                >
                  Mostrar menos ↑
                </button>
              )}
              {!matchingEvents.length && <p className="muted">No encontramos fechas con esa búsqueda.</p>}
            </>
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

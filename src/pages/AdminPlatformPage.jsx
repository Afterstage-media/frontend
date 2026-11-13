import { useEffect, useRef, useState } from "react";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Notice } from "../components/ui/Notice.jsx";
import { StatusBadge } from "../components/ui/StatusBadge.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { api } from "../services/api.js";
import { adminPlatformEs as text } from "../i18n/es-AR.dictionary.js";

const emptyOffer = {
  eventId: "",
  title: "",
  kind: "bus",
  providerName: "",
  origin: "",
  destination: "",
  seats: "1",
  priceLabel: "Consultar",
  contactUrl: "",
};
const emptyListing = {
  name: "",
  category: "merch",
  description: "",
  imageUrl: "",
  productUrl: "",
  priceLabel: "Consultar",
  externalId: "",
};

const insuranceProductLabels = {
  ap: "Accidentes personales",
  art: "ART",
  vida: "Seguro de vida",
  robo_equipos: "Robo de equipos",
};

const insuranceProductsLabel = (item) =>
  item.coverageTypes?.length
    ? item.coverageTypes.map((product) => insuranceProductLabels[product] || product).join(" + ")
    : item.coverageType;

function PlatformAdmin({ actor }) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [offer, setOffer] = useState(emptyOffer);
  const [listing, setListing] = useState(emptyListing);
  const [creationDialog, setCreationDialog] = useState(null);
  const [creating, setCreating] = useState(false);
  const creationInFlight = useRef(false);
  const [insuranceDrafts, setInsuranceDrafts] = useState({});
  const [notice, setNotice] = useState("");
  const load = () => {
    setError("");
    return api("/api/platform/snapshot")
      .then(setSnapshot)
      .catch((requestError) => setError(requestError.message));
  };
  useEffect(() => {
    load();
  }, []);
  const patch = async (path, body) => {
    setError("");
    setNotice("");
    try {
      await api(path, { method: "PATCH", body: JSON.stringify(body) });
      setNotice("Cambio guardado.");
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const createOffer = async (event) => {
    event.preventDefault();
    if (creationInFlight.current) return;
    creationInFlight.current = true;
    setCreating(true);
    try {
      await api("/api/platform/transport-offers", {
        method: "POST",
        body: JSON.stringify({ ...offer, seats: Number(offer.seats || 1) }),
      });
      setOffer(emptyOffer);
      setNotice("Traslado publicado.");
      setCreationDialog(null);
      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      creationInFlight.current = false;
      setCreating(false);
    }
  };
  const createListing = async (event) => {
    event.preventDefault();
    if (creationInFlight.current) return;
    creationInFlight.current = true;
    setCreating(true);
    try {
      await api("/api/platform/marketplace", {
        method: "POST",
        body: JSON.stringify({ ...listing, source: "orux", active: true }),
      });
      setListing(emptyListing);
      setNotice("Propuesta agregada al catálogo.");
      setCreationDialog(null);
      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      creationInFlight.current = false;
      setCreating(false);
    }
  };
  const canEditCatalog = actor.roles?.some((role) => ["admin", "editor"].includes(role));
  const updateInsuranceDraft = (item, field, value) =>
    setInsuranceDrafts((current) => ({
      ...current,
      [item.id]: { ...current[item.id], [field]: value },
    }));
  const saveInsurance = (item) => {
    const draft = insuranceDrafts[item.id] || {};
    return patch(`/api/platform/insurance-requests/${item.id}`, {
      providerName: draft.providerName ?? item.providerName ?? "",
      quoteLabel: draft.quoteLabel ?? item.quoteLabel ?? "",
      quoteUrl: draft.quoteUrl ?? item.quoteUrl ?? "",
      policyNumber: draft.policyNumber ?? item.policyNumber ?? "",
      policyUrl: draft.policyUrl ?? item.policyUrl ?? "",
      commissionLabel: draft.commissionLabel ?? item.commissionLabel ?? "",
      commissionNotes: draft.commissionNotes ?? item.commissionNotes ?? "",
    });
  };
  const renewInsurance = async (item) => {
    setError("");
    setNotice("");
    try {
      await api(`/api/platform/insurance-requests/${item.id}/renew`, { method: "POST" });
      setNotice("Solicitud duplicada con los datos del cliente para una nueva póliza.");
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const updateInsuranceContract = (item, status) =>
    patch(`/api/platform/insurance-requests/${item.id}`, {
      contractStatus: status,
      contractedAt: status === "contracted" ? new Date().toISOString() : null,
    });
  if (!snapshot)
    return (
      <Layout>
        <section className="page-intro">
          <p className="eyebrow">Plataforma</p>
          {error ? (
            <>
              <h1>{text.loadErrorTitle}</h1>
              <ErrorMessage error={error} />
              <Button type="button" onClick={load}>
                {text.retryLoad}
              </Button>
            </>
          ) : (
            <h1>{text.loadingTitle}</h1>
          )}
        </section>
      </Layout>
    );
  return (
    <Layout>
      <section className="page-intro admin-platform-intro">
        <p className="eyebrow">Operaciones de la plataforma</p>
        <h1>Todo lo que conecta un evento.</h1>
        <p>Moderá perfiles, seguí coberturas y mantené activo el catálogo de la red.</p>
      </section>
      <main className="admin-platform">
        <ErrorMessage error={creationDialog ? "" : error} />
        {notice && <Notice tone="success">{notice}</Notice>}
        <section className="platform-metrics">
          <article>
            <strong>{snapshot.photographers.length}</strong>
            <span>Perfiles</span>
          </article>
          <article>
            <strong>{snapshot.coverageRequests.length}</strong>
            <span>Búsquedas</span>
          </article>
          <article>
            <strong>{snapshot.insuranceRequests.length}</strong>
            <span>Seguros</span>
          </article>
          <article>
            <strong>{snapshot.forumThreads.length}</strong>
            <span>Conversaciones</span>
          </article>
        </section>
        <div className="admin-platform-grid">
          <section className="admin-platform-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Moderación</p>
                <h2>Perfiles de fotógrafos.</h2>
              </div>
            </div>
            {snapshot.photographers.length ? (
              snapshot.photographers.map((item) => (
                <article className="platform-admin-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.city} · {item.contactEmail}
                    </span>
                  </div>
                  <div className="actions">
                    <StatusBadge className="status-pill" tone={item.status}>
                      {item.status}
                    </StatusBadge>
                    {item.status !== "published" && (
                      <Button
                        onClick={() => patch(`/api/platform/photographers/${item.id}`, { status: "published" })}
                        variant="ghost"
                        type="button"
                      >
                        Publicar
                      </Button>
                    )}
                    {item.status !== "archived" && (
                      <Button
                        onClick={() => patch(`/api/platform/photographers/${item.id}`, { status: "archived" })}
                        variant="ghost"
                        type="button"
                      >
                        Archivar
                      </Button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">Todavía no hay perfiles.</p>
            )}
          </section>
          <section className="admin-platform-panel">
            <p className="eyebrow">Producción</p>
            <h2>Consultas de seguros.</h2>
            {snapshot.insuranceRequests.length ? (
              snapshot.insuranceRequests.map((item) => (
                <article className="platform-admin-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {insuranceProductsLabel(item)} · {item.email} · {item.peopleCount} persona(s)
                    </span>
                    <small>
                      Aviso: {item.notificationStatus === "sent" ? "enviado" : item.notificationStatus || "pendiente"}
                      {item.mailThreadId ? " · hilo en bandeja creado" : ""}
                    </small>
                  </div>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      patch(`/api/platform/insurance-requests/${item.id}`, { status: event.target.value })
                    }
                  >
                    <option value="new">Nueva</option>
                    <option value="contacted">Contactada</option>
                    <option value="quoted">Cotizada</option>
                    <option value="closed">Cerrada</option>
                  </select>
                  <div className="platform-admin-fields">
                    <input
                      placeholder="Productor / aseguradora"
                      defaultValue={item.providerName || ""}
                      onChange={(event) => updateInsuranceDraft(item, "providerName", event.target.value)}
                    />
                    <input
                      placeholder="Cotización"
                      defaultValue={item.quoteLabel || ""}
                      onChange={(event) => updateInsuranceDraft(item, "quoteLabel", event.target.value)}
                    />
                    <input
                      placeholder="N.º de póliza"
                      defaultValue={item.policyNumber || ""}
                      onChange={(event) => updateInsuranceDraft(item, "policyNumber", event.target.value)}
                    />
                    <input
                      placeholder="URL de cotización"
                      type="url"
                      defaultValue={item.quoteUrl || ""}
                      onChange={(event) => updateInsuranceDraft(item, "quoteUrl", event.target.value)}
                    />
                    <input
                      placeholder="URL de póliza"
                      type="url"
                      defaultValue={item.policyUrl || ""}
                      onChange={(event) => updateInsuranceDraft(item, "policyUrl", event.target.value)}
                    />
                    <select
                      value={item.contractStatus || "pending"}
                      onChange={(event) => updateInsuranceContract(item, event.target.value)}
                    >
                      <option value="pending">Sin contratación</option>
                      <option value="contracted">Contratada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                    <input
                      placeholder="Comisión / reparto"
                      defaultValue={item.commissionLabel || ""}
                      onChange={(event) => updateInsuranceDraft(item, "commissionLabel", event.target.value)}
                    />
                    <input
                      placeholder="Notas para repartir la comisión"
                      defaultValue={item.commissionNotes || ""}
                      onChange={(event) => updateInsuranceDraft(item, "commissionNotes", event.target.value)}
                    />
                    <Button onClick={() => saveInsurance(item)} variant="ghost" type="button">
                      Guardar cotización
                    </Button>
                    <Button onClick={() => renewInsurance(item)} variant="ghost" type="button">
                      Reutilizar datos
                    </Button>
                    {item.mailThreadId && (
                      <a
                        className="button ghost"
                        href={`/admin/correo?thread=${encodeURIComponent(item.mailThreadId)}`}
                      >
                        Abrir bandeja
                      </a>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">No hay consultas pendientes.</p>
            )}
          </section>
          <section className="admin-platform-panel">
            <p className="eyebrow">Selección y entrega</p>
            <h2>Postulaciones de cobertura.</h2>
            {snapshot.coverageApplications.length ? (
              snapshot.coverageApplications.map((item) => {
                const request = snapshot.coverageRequests.find((candidate) => candidate.id === item.requestId);
                const photographer = snapshot.photographers.find((candidate) => candidate.id === item.photographerId);
                return (
                  <article className="platform-admin-row" key={item.id}>
                    <div>
                      <strong>{photographer?.name || item.applicantName}</strong>
                      <span>
                        {request?.title || "Cobertura"} · {item.applicantEmail}
                      </span>
                    </div>
                    <select
                      value={item.status}
                      onChange={(event) =>
                        patch(`/api/platform/coverage-applications/${item.id}`, { status: event.target.value })
                      }
                    >
                      <option value="pending">Pendiente</option>
                      <option value="shortlisted">Preseleccionada</option>
                      <option value="accepted">Aceptada</option>
                      <option value="rejected">Rechazada</option>
                      <option value="withdrawn">Retirada</option>
                    </select>
                    <div className="platform-admin-fields">
                      <input
                        placeholder="URL del material entregado"
                        defaultValue={item.deliveryUrl || ""}
                        onBlur={(event) =>
                          patch(`/api/platform/coverage-applications/${item.id}`, { deliveryUrl: event.target.value })
                        }
                      />
                      <textarea
                        placeholder="Notas de entrega / créditos"
                        defaultValue={item.deliveryNotes || ""}
                        onBlur={(event) =>
                          patch(`/api/platform/coverage-applications/${item.id}`, {
                            deliveryNotes: event.target.value,
                          })
                        }
                        rows="2"
                      />
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="muted">Todavía no hay postulaciones.</p>
            )}
          </section>
          <section className="admin-platform-panel">
            <p className="eyebrow">Coordinación</p>
            <h2>Pedidos de traslado.</h2>
            {snapshot.transportRequests.length ? (
              snapshot.transportRequests.map((item) => (
                <article className="platform-admin-row" key={item.id}>
                  <div>
                    <strong>
                      {item.name} · {item.partySize} persona(s)
                    </strong>
                    <span>
                      {item.origin} · {item.email}
                    </span>
                  </div>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      patch(`/api/platform/transport-requests/${item.id}`, { status: event.target.value })
                    }
                  >
                    <option value="new">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </article>
              ))
            ) : (
              <p className="muted">No hay pedidos de traslado.</p>
            )}
          </section>
          <section className="admin-platform-panel">
            <p className="eyebrow">Coberturas</p>
            <h2>Búsquedas abiertas.</h2>
            {snapshot.coverageRequests.length ? (
              snapshot.coverageRequests.map((item) => (
                <article className="platform-admin-row" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.organization || "Sin organización"} · {item.requesterEmail}
                    </span>
                  </div>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      patch(`/api/platform/coverage-requests/${item.id}`, { status: event.target.value })
                    }
                  >
                    <option value="open">Abierta</option>
                    <option value="screening">En selección</option>
                    <option value="assigned">Asignada</option>
                    <option value="closed">Cerrada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </article>
              ))
            ) : (
              <p className="muted">No hay búsquedas.</p>
            )}
          </section>
          <section className="admin-platform-panel platform-creation-actions" aria-labelledby="platform-creation-title">
            <p className="eyebrow">{text.creationActions}</p>
            <h2 id="platform-creation-title">{text.creationTitle}</h2>
            <div className="actions">
              <Button
                type="button"
                variant="dark"
                onClick={() => {
                  setError("");
                  setCreationDialog("transport");
                }}
              >
                {text.openTransportForm}
              </Button>
              {canEditCatalog && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setError("");
                    setCreationDialog("marketplace");
                  }}
                >
                  {text.openMarketplaceForm}
                </Button>
              )}
            </div>
          </section>
          {creationDialog === "transport" && (
            <Dialog
              className="admin-platform-modal-backdrop"
              labelledBy="platform-transport-title"
              onClose={() => setCreationDialog(null)}
              panelAs="form"
              panelClassName="form admin-platform-creation-dialog"
              onSubmit={createOffer}
            >
              <ErrorMessage error={error} />
              <Button
                className="platform-dialog-close"
                variant="ghost"
                type="button"
                onClick={() => setCreationDialog(null)}
              >
                {text.closeForm}
              </Button>
              <p className="eyebrow">Traslados</p>
              <h2 id="platform-transport-title">{text.transportTitle}</h2>
              <label>
                ID del evento
                <input
                  required
                  value={offer.eventId}
                  onChange={(event) => setOffer({ ...offer, eventId: event.target.value })}
                />
              </label>
              <label>
                Nombre
                <input
                  required
                  value={offer.title}
                  onChange={(event) => setOffer({ ...offer, title: event.target.value })}
                />
              </label>
              <div className="form-grid">
                <label>
                  Desde
                  <input
                    required
                    value={offer.origin}
                    onChange={(event) => setOffer({ ...offer, origin: event.target.value })}
                  />
                </label>
                <label>
                  Hasta
                  <input
                    required
                    value={offer.destination}
                    onChange={(event) => setOffer({ ...offer, destination: event.target.value })}
                  />
                </label>
              </div>
              <label>
                Proveedor
                <input
                  required
                  value={offer.providerName}
                  onChange={(event) => setOffer({ ...offer, providerName: event.target.value })}
                />
              </label>
              <div className="form-grid">
                <label>
                  Lugares
                  <input
                    min="1"
                    type="number"
                    value={offer.seats}
                    onChange={(event) => setOffer({ ...offer, seats: event.target.value })}
                  />
                </label>
                <label>
                  Precio
                  <input
                    value={offer.priceLabel}
                    onChange={(event) => setOffer({ ...offer, priceLabel: event.target.value })}
                  />
                </label>
              </div>
              <Button variant="dark" type="submit" disabled={creating}>
                {creating ? text.creatingTransport : text.submitTransport}
              </Button>
            </Dialog>
          )}
          {creationDialog === "marketplace" && canEditCatalog && (
            <Dialog
              className="admin-platform-modal-backdrop"
              labelledBy="platform-marketplace-title"
              onClose={() => setCreationDialog(null)}
              panelAs="form"
              panelClassName="form admin-platform-creation-dialog"
              onSubmit={createListing}
            >
              <ErrorMessage error={error} />
              <Button
                className="platform-dialog-close"
                variant="ghost"
                type="button"
                onClick={() => setCreationDialog(null)}
              >
                {text.closeForm}
              </Button>
              <p className="eyebrow">Orux / Marketplace</p>
              <h2 id="platform-marketplace-title">{text.addMarketplaceTitle}</h2>
              <label>
                Nombre
                <input
                  required
                  value={listing.name}
                  onChange={(event) => setListing({ ...listing, name: event.target.value })}
                />
              </label>
              <label>
                Categoría
                <select
                  value={listing.category}
                  onChange={(event) => setListing({ ...listing, category: event.target.value })}
                >
                  <option value="merch">Merch</option>
                  <option value="service">Servicio</option>
                  <option value="benefit">Beneficio</option>
                </select>
              </label>
              <label>
                Descripción
                <textarea
                  rows="3"
                  value={listing.description}
                  onChange={(event) => setListing({ ...listing, description: event.target.value })}
                />
              </label>
              <label>
                URL de Orux o producto
                <input
                  type="url"
                  value={listing.productUrl}
                  onChange={(event) => setListing({ ...listing, productUrl: event.target.value })}
                />
              </label>
              <label>
                Precio / leyenda
                <input
                  value={listing.priceLabel}
                  onChange={(event) => setListing({ ...listing, priceLabel: event.target.value })}
                />
              </label>
              <Button variant="dark" type="submit" disabled={creating}>
                {creating ? text.creatingMarketplaceItem : text.addMarketplaceItem}
              </Button>
            </Dialog>
          )}
        </div>
      </main>
    </Layout>
  );
}

export function AdminPlatformPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "community"]}>
      {(actor) => <PlatformAdmin actor={actor} />}
    </AuthGate>
  );
}

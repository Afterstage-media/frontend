import { useEffect, useState } from "react";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { api } from "../services/api.js";

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

function PlatformAdmin({ actor }) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [offer, setOffer] = useState(emptyOffer);
  const [listing, setListing] = useState(emptyListing);
  const [notice, setNotice] = useState("");
  const load = () =>
    api("/api/platform/snapshot")
      .then(setSnapshot)
      .catch((requestError) => setError(requestError.message));
  useEffect(load, []);
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
    try {
      await api("/api/platform/transport-offers", {
        method: "POST",
        body: JSON.stringify({ ...offer, seats: Number(offer.seats || 1) }),
      });
      setOffer(emptyOffer);
      setNotice("Traslado publicado.");
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const createListing = async (event) => {
    event.preventDefault();
    try {
      await api("/api/platform/marketplace", {
        method: "POST",
        body: JSON.stringify({ ...listing, source: "orux", active: true }),
      });
      setListing(emptyListing);
      setNotice("Propuesta agregada al catálogo.");
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  if (!snapshot)
    return (
      <Layout>
        <section className="page-intro">
          <p className="eyebrow">Plataforma</p>
          <h1>Cargando operaciones…</h1>
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
        <ErrorMessage error={error} />
        {notice && <p className="success">{notice}</p>}
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
                    <span className={`status-pill status-${item.status}`}>{item.status}</span>
                    {item.status !== "published" && (
                      <button
                        className="button ghost"
                        onClick={() => patch(`/api/platform/photographers/${item.id}`, { status: "published" })}
                        type="button"
                      >
                        Publicar
                      </button>
                    )}
                    {item.status !== "archived" && (
                      <button
                        className="button ghost"
                        onClick={() => patch(`/api/platform/photographers/${item.id}`, { status: "archived" })}
                        type="button"
                      >
                        Archivar
                      </button>
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
                      {item.coverageType} · {item.email}
                    </span>
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
                </article>
              ))
            ) : (
              <p className="muted">No hay consultas pendientes.</p>
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
          <form className="form admin-platform-panel" onSubmit={createOffer}>
            <p className="eyebrow">Traslados</p>
            <h2>Publicar un traslado.</h2>
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
            <button className="button dark" type="submit">
              Publicar traslado ↗
            </button>
          </form>
          <form className="form admin-platform-panel" onSubmit={createListing}>
            <p className="eyebrow">Orux / Marketplace</p>
            <h2>Agregar una propuesta.</h2>
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
            <button className="button dark" type="submit">
              Agregar al catálogo ↗
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}

export function AdminPlatformPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "community"]}>
      <PlatformAdmin />
    </AuthGate>
  );
}

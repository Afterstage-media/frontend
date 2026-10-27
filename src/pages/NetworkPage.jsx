import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ErrorMessage } from "../components/Layout.jsx";
import { EmptyState, LoadingState } from "../components/UiState.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";

const emptyPhotographer = {
  name: "",
  city: "",
  specialties: "",
  portfolioUrl: "",
  portfolioUrls: "",
  instagram: "",
  bio: "",
  sampleCount: "",
  availability: "",
  contactEmail: "",
};

const emptyCoverage = {
  title: "",
  description: "",
  requesterName: "",
  requesterEmail: "",
  organization: "",
  city: "",
  budget: "",
  deadlineAt: "",
};

function FormNotice({ message, error }) {
  return <>{error ? <ErrorMessage error={error} /> : message ? <p className="success">{message}</p> : null}</>;
}

export function NetworkPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [photographers, setPhotographers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photographerForm, setPhotographerForm] = useState(emptyPhotographer);
  const [coverageForm, setCoverageForm] = useState(emptyCoverage);
  const [photographerNotice, setPhotographerNotice] = useState("");
  const [coverageNotice, setCoverageNotice] = useState("");
  const [photographerError, setPhotographerError] = useState("");
  const [coverageError, setCoverageError] = useState("");
  const [networkMode, setNetworkMode] = useState("browse");
  const [applicationFor, setApplicationFor] = useState(null);
  const [application, setApplication] = useState({
    photographerId: "",
    applicantName: "",
    applicantEmail: "",
    portfolioUrl: "",
    message: "",
  });

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api("/api/public/photographers?limit=60"),
      api(`/api/public/coverage-requests?limit=60${eventId ? `&eventId=${eventId}` : ""}`),
    ])
      .then(([nextPhotographers, nextRequests]) => {
        setPhotographers(nextPhotographers);
        setRequests(nextRequests);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  const submitPhotographer = async (event) => {
    event.preventDefault();
    setPhotographerError("");
    setPhotographerNotice("");
    try {
      const result = await api("/api/public/photographers", {
        method: "POST",
        body: JSON.stringify({
          ...photographerForm,
          specialties: photographerForm.specialties
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          portfolioUrls: photographerForm.portfolioUrls
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 10),
          sampleCount: Number(photographerForm.sampleCount || 0),
        }),
      });
      setPhotographerNotice(result.message);
      setPhotographerForm(emptyPhotographer);
    } catch (requestError) {
      setPhotographerError(requestError.message);
    }
  };

  const submitCoverage = async (event) => {
    event.preventDefault();
    setCoverageError("");
    setCoverageNotice("");
    try {
      const result = await api("/api/public/coverage-requests", {
        method: "POST",
        body: JSON.stringify({
          ...coverageForm,
          eventId: eventId || null,
          deadlineAt: coverageForm.deadlineAt ? new Date(coverageForm.deadlineAt).toISOString() : null,
        }),
      });
      setCoverageNotice(result.message);
      setCoverageForm(emptyCoverage);
      load();
    } catch (requestError) {
      setCoverageError(requestError.message);
    }
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setCoverageError("");
    try {
      const result = await api(`/api/public/coverage-requests/${applicationFor.id}/applications`, {
        method: "POST",
        body: JSON.stringify(application),
      });
      setCoverageNotice(result.message);
      setApplicationFor(null);
      setApplication({ photographerId: "", applicantName: "", applicantEmail: "", portfolioUrl: "", message: "" });
    } catch (requestError) {
      setCoverageError(requestError.message);
    }
  };

  return (
    <Layout>
      <SignalTicker items={["Red abierta", "Fotógrafos", "Coberturas", "Colaboraciones"]} />
      <section className="page-intro network-intro">
        <p className="eyebrow">Red de trabajo / 01</p>
        <h1>La escena también se construye detrás de cámara.</h1>
        <p>Perfiles, coberturas y oportunidades reales para que cada evento encuentre a las personas que necesita.</p>
      </section>

      <nav className="network-mode-switcher" aria-label="Qué querés hacer en la red">
        <p className="eyebrow">Elegí un camino</p>
        <div role="tablist" aria-label="Acciones de la red">
          <button
            aria-selected={networkMode === "browse"}
            className={networkMode === "browse" ? "is-active" : ""}
            onClick={() => setNetworkMode("browse")}
            role="tab"
            type="button"
          >
            Explorar perfiles y búsquedas
          </button>
          <button
            aria-selected={networkMode === "photographer"}
            className={networkMode === "photographer" ? "is-active" : ""}
            onClick={() => setNetworkMode("photographer")}
            role="tab"
            type="button"
          >
            Sumá tu perfil
          </button>
          <button
            aria-selected={networkMode === "coverage"}
            className={networkMode === "coverage" ? "is-active" : ""}
            onClick={() => setNetworkMode("coverage")}
            role="tab"
            type="button"
          >
            Pedí una cobertura
          </button>
        </div>
      </nav>

      <section className="network-layout">
        <div className="network-main">
          <div className="section-head">
            <div>
              <p className="eyebrow">Directorio vivo</p>
              <h2>Fotógrafos y fotógrafas.</h2>
            </div>
            <span className="network-count">{photographers.length} perfiles publicados</span>
          </div>
          {loading ? (
            <LoadingState label="Buscando perfiles…" />
          ) : error ? (
            <ErrorMessage error={error} />
          ) : photographers.length === 0 ? (
            <EmptyState title="La red recién empieza." message="Podés ser la primera persona en sumar tu perfil." />
          ) : (
            <div className="network-profile-grid">
              {photographers.map((photographer) => (
                <article className="network-profile-card" key={photographer.id}>
                  <span className="network-card-index">
                    {String(photographer.sampleCount || 0).padStart(2, "0")} fotos
                  </span>
                  <h3>{photographer.name}</h3>
                  <p className="network-profile-meta">
                    {photographer.city} · {(photographer.specialties || []).join(" · ") || "Cobertura"}
                  </p>
                  {photographer.bio && <p>{photographer.bio}</p>}
                  {!!photographer.portfolioUrls?.length && (
                    <div className="network-portfolio-grid" aria-label={`Portfolio de ${photographer.name}`}>
                      {photographer.portfolioUrls.slice(0, 10).map((photoUrl) => (
                        <a href={photoUrl} key={photoUrl} rel="noreferrer" target="_blank">
                          <img alt={`Foto de portfolio de ${photographer.name}`} loading="lazy" src={photoUrl} />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="network-profile-links">
                    {photographer.portfolioUrl && (
                      <a href={photographer.portfolioUrl} target="_blank" rel="noreferrer">
                        Portfolio ↗
                      </a>
                    )}
                    {photographer.instagram && <span>{photographer.instagram}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="section-head network-subsection-head">
            <div>
              <p className="eyebrow">Oportunidades</p>
              <h2>Búsquedas de cobertura.</h2>
            </div>
            {eventId && (
              <Link className="button ghost" to={`/agenda/evento/${eventId}`}>
                Volver al evento
              </Link>
            )}
          </div>
          <div className="network-request-list">
            {requests.length === 0 ? (
              <EmptyState
                title="No hay búsquedas abiertas."
                message="Cuando aparezca una cobertura, va a quedar publicada acá."
              />
            ) : (
              requests.map((request) => (
                <article className="network-request-card" key={request.id}>
                  <div>
                    <span className="eyebrow">
                      {request.city || "Escena"} · {request.organization || "Afterstage"}
                    </span>
                    <h3>{request.title}</h3>
                    <p>{request.description}</p>
                    <small>
                      {request.budget || "Presupuesto a coordinar"}
                      {request.deadlineAt
                        ? ` · Cierra ${new Date(request.deadlineAt).toLocaleDateString("es-AR")}`
                        : ""}
                    </small>
                  </div>
                  <button className="button dark" onClick={() => setApplicationFor(request)} type="button">
                    Postularme ↗
                  </button>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="network-forms" aria-label="Acción seleccionada">
          {networkMode === "browse" && (
            <div className="network-form network-form-guide">
              <p className="eyebrow">Encontrar colaboradores</p>
              <h2>Explorá la red.</h2>
              <p>Revisá perfiles publicados y postulá a las búsquedas abiertas cuando encuentres una oportunidad.</p>
              <button
                className="button dark"
                onClick={() =>
                  document.querySelector(".network-subsection-head")?.scrollIntoView({ behavior: "smooth" })
                }
                type="button"
              >
                Ver búsquedas abiertas ↓
              </button>
            </div>
          )}
          {networkMode === "photographer" && (
            <form className="form network-form" onSubmit={submitPhotographer}>
              <p className="eyebrow">Sumar perfil</p>
              <h2>Quiero trabajar con la red.</h2>
              <p>
                Empezá con los datos básicos. El perfil queda en revisión antes de publicarse y después podés
                completarlo.
              </p>
              <label>
                Nombre
                <input
                  required
                  value={photographerForm.name}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, name: event.target.value })}
                />
              </label>
              <label>
                Ciudad
                <input
                  required
                  value={photographerForm.city}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, city: event.target.value })}
                />
              </label>
              <label>
                Especialidades
                <input
                  required
                  placeholder="Recitales, retrato, backstage"
                  value={photographerForm.specialties}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, specialties: event.target.value })}
                />
              </label>
              <label>
                Portfolio
                <input
                  type="url"
                  value={photographerForm.portfolioUrl}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, portfolioUrl: event.target.value })}
                />
              </label>
              <details className="form-optional-fields">
                <summary>Agregar portfolio y disponibilidad (opcional)</summary>
                <div className="form-optional-fields-content">
                  <label>
                    Fotos de portfolio (hasta 10 URLs, una por línea)
                    <textarea
                      placeholder="https://…/foto-01.jpg"
                      rows="3"
                      value={photographerForm.portfolioUrls}
                      onChange={(event) =>
                        setPhotographerForm({ ...photographerForm, portfolioUrls: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Instagram
                    <input
                      value={photographerForm.instagram}
                      onChange={(event) => setPhotographerForm({ ...photographerForm, instagram: event.target.value })}
                    />
                  </label>
                  <label>
                    Bio
                    <textarea
                      rows="3"
                      value={photographerForm.bio}
                      onChange={(event) => setPhotographerForm({ ...photographerForm, bio: event.target.value })}
                    />
                  </label>
                  <label>
                    Cantidad de fotos de referencia
                    <input
                      min="0"
                      type="number"
                      value={photographerForm.sampleCount}
                      onChange={(event) =>
                        setPhotographerForm({ ...photographerForm, sampleCount: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Disponibilidad
                    <input
                      placeholder="Fines de semana, AMBA…"
                      value={photographerForm.availability}
                      onChange={(event) =>
                        setPhotographerForm({ ...photographerForm, availability: event.target.value })
                      }
                    />
                  </label>
                </div>
              </details>
              <label>
                Email de contacto
                <input
                  required
                  type="email"
                  value={photographerForm.contactEmail}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, contactEmail: event.target.value })}
                />
              </label>
              <button className="button dark" type="submit">
                Enviar perfil ↗
              </button>
              <FormNotice error={photographerError} message={photographerNotice} />
            </form>
          )}
          {networkMode === "coverage" && (
            <form className="form network-form" onSubmit={submitCoverage}>
              <p className="eyebrow">Publicar búsqueda</p>
              <h2>Necesito cobertura.</h2>
              <label>
                Título
                <input
                  required
                  value={coverageForm.title}
                  onChange={(event) => setCoverageForm({ ...coverageForm, title: event.target.value })}
                />
              </label>
              <label>
                Qué necesitás
                <textarea
                  required
                  minLength="10"
                  rows="4"
                  value={coverageForm.description}
                  onChange={(event) => setCoverageForm({ ...coverageForm, description: event.target.value })}
                />
              </label>
              <label>
                Nombre
                <input
                  required
                  value={coverageForm.requesterName}
                  onChange={(event) => setCoverageForm({ ...coverageForm, requesterName: event.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={coverageForm.requesterEmail}
                  onChange={(event) => setCoverageForm({ ...coverageForm, requesterEmail: event.target.value })}
                />
              </label>
              <label>
                Productora / banda
                <input
                  value={coverageForm.organization}
                  onChange={(event) => setCoverageForm({ ...coverageForm, organization: event.target.value })}
                />
              </label>
              <label>
                Ciudad
                <input
                  value={coverageForm.city}
                  onChange={(event) => setCoverageForm({ ...coverageForm, city: event.target.value })}
                />
              </label>
              <label>
                Presupuesto
                <input
                  value={coverageForm.budget}
                  onChange={(event) => setCoverageForm({ ...coverageForm, budget: event.target.value })}
                />
              </label>
              <label>
                Fecha límite
                <input
                  type="datetime-local"
                  value={coverageForm.deadlineAt}
                  onChange={(event) => setCoverageForm({ ...coverageForm, deadlineAt: event.target.value })}
                />
              </label>
              <button className="button" type="submit">
                Publicar búsqueda ↗
              </button>
              <FormNotice error={coverageError} message={coverageNotice} />
            </form>
          )}
        </aside>
      </section>

      {applicationFor && (
        <div className="modal-backdrop" role="presentation">
          <form className="form network-application-modal" onSubmit={submitApplication}>
            <button aria-label="Cerrar" className="icon-button" onClick={() => setApplicationFor(null)} type="button">
              ×
            </button>
            <p className="eyebrow">Postulación</p>
            <h2>{applicationFor.title}</h2>
            <label>
              Perfil publicado (opcional)
              <select
                value={application.photographerId}
                onChange={(event) => setApplication({ ...application, photographerId: event.target.value })}
              >
                <option value="">Voy a enviar los datos manualmente</option>
                {photographers.map((photographer) => (
                  <option key={photographer.id} value={photographer.id}>
                    {photographer.name} · {photographer.city}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nombre
              <input
                required
                value={application.applicantName}
                onChange={(event) => setApplication({ ...application, applicantName: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={application.applicantEmail}
                onChange={(event) => setApplication({ ...application, applicantEmail: event.target.value })}
              />
            </label>
            <label>
              Portfolio
              <input
                type="url"
                value={application.portfolioUrl}
                onChange={(event) => setApplication({ ...application, portfolioUrl: event.target.value })}
              />
            </label>
            <label>
              Mensaje
              <textarea
                rows="4"
                value={application.message}
                onChange={(event) => setApplication({ ...application, message: event.target.value })}
              />
            </label>
            <button className="button dark" type="submit">
              Enviar postulación ↗
            </button>
            <FormNotice error={coverageError} message={coverageNotice} />
          </form>
        </div>
      )}
    </Layout>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { AuthGate, LoginForm } from "../components/AuthGate.jsx";

const statuses = ["idea", "draft", "review", "approved", "scheduled", "published", "failed"];
const labels = {
  idea: "Idea",
  draft: "Borrador",
  review: "Revisión",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
  failed: "Error",
};
const typeLabels = {
  article: "Nota",
  post: "Post",
  carousel: "Carrusel",
  reel: "Reel",
  story: "Story",
};
const mediaKitFieldLabels = {
  name: "Nombre del medio",
  tagline: "Bajada",
  mission: "Misión",
  audience: "Audiencia",
  team: "Equipo",
  services: "Servicios",
  email: "Email de contacto",
  website: "Sitio web",
  instagram: "Instagram",
};
const eventFieldLabels = {
  name: "Nombre del evento",
  artist: "Artista o banda",
  venue: "Sala o espacio",
  address: "Dirección del lugar",
  city: "Ciudad",
  dates: "Fechas del evento",
  url: "URL oficial",
};
const contactFieldLabels = {
  name: "Nombre del contacto",
  organization: "Organización",
  email: "Email",
  type: "Tipo de contacto",
};
const contactTypeLabels = {
  promoter: "Productora",
  venue: "Sala o espacio",
  label: "Sello",
  agency: "Agencia",
  press: "Prensa",
  artist: "Artista o banda",
  other: "Otro",
};
const socialPresets = {
  "weekly-band": {
    type: "post",
    title: "La banda de la semana",
    summary: "Una presentación breve para descubrir y compartir una banda de la escena.",
    instagramCopy: "Conocé a la banda de la semana: [VERIFICAR nombre, sonido y próximo show]. ¿Ya la escuchaste?",
  },
  discovery: {
    type: "carousel",
    title: "Descubrimiento de la semana",
    summary: "Una recomendación rápida para sumar algo nuevo a la playlist.",
    instagramCopy: "Un descubrimiento para poner en loop: [VERIFICAR artista y motivo de la recomendación].",
  },
  news: {
    type: "post",
    title: "Novedad de la escena",
    summary: "Una novedad breve para mantener a la comunidad al día.",
    instagramCopy: "Pasó esto en la escena: [VERIFICAR dato principal, fecha y fuente].",
  },
};
const workflowStages = [
  { key: "draft", label: "Borrador", description: "Escribí y guardá la pieza." },
  { key: "review", label: "Revisión", description: "Dejala lista para validar." },
  { key: "publish", label: "Publicación", description: "Publicá o programá los canales." },
];

const workflowStageFor = (status) => {
  if (["review", "approved"].includes(status)) return "review";
  if (["scheduled", "publishing", "published"].includes(status)) return "publish";
  return "draft";
};
export function TokenGate({ onReady }) {
  return <LoginForm onReady={onReady} />;
}

function ContentCard({ item, onSelect }) {
  return (
    <article
      className="admin-record"
      onClick={() => onSelect(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(item);
        }
      }}
      role="button"
      tabIndex="0"
    >
      <div>
        <small>
          {labels[item.status] || item.status} · {typeLabels[item.type] || item.type}
        </small>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
      </div>
      <span>{item.channels?.join(" · ")}</span>
    </article>
  );
}

function AdminDashboard({ actor }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [instagramMetrics, setInstagramMetrics] = useState(null);
  const [authorized, setAuthorized] = useState(Boolean(localStorage.getItem("afterstage-token")));
  const navigate = useNavigate();
  const load = () =>
    api("/api/content")
      .then(setItems)
      .catch((e) => {
        setError(e.message);
        if (/token|autoriz|401/i.test(e.message)) setAuthorized(false);
      });
  useEffect(() => {
    if (authorized) {
      load();
      api("/api/metrics/instagram")
        .then(setInstagramMetrics)
        .catch(() => undefined);
    }
  }, [authorized]);
  if (!authorized)
    return (
      <Layout>
        <TokenGate onReady={() => setAuthorized(true)} />
      </Layout>
    );
  const visible = items.filter(
    (item) =>
      (!statusFilter || item.status === statusFilter) &&
      (!query ||
        `${item.title} ${item.summary} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query.toLowerCase())),
  );
  return (
    <Layout>
      <section className="admin-overview">
        <div className="admin-overview-copy">
          <div className="admin-breadcrumb">
            <span>Afterstage</span>
            <span aria-hidden="true">/</span>
            <strong>Centro de contenidos</strong>
          </div>
          <p className="eyebrow">Hoy en la redacción</p>
          <h1>
            Publicar algo que
            <br />
            <em>mueva la escena.</em>
          </h1>
          <p className="admin-overview-lede">
            Notas para leer, piezas para compartir y una agenda que no se queda quieta.
          </p>
        </div>
        <div className="admin-overview-actions">
          <span className="admin-action-label">Crear contenido</span>
          <Link className="admin-primary-action" to="/admin/nueva">
            <strong>Nueva nota</strong>
            <span>
              Historia, entrevista o crónica <b>↗</b>
            </span>
          </Link>
          <Link className="admin-secondary-action" to="/admin/redes">
            <strong>Pieza para redes</strong>
            <span>
              Reel, post o descubrimiento <b>↗</b>
            </span>
          </Link>
        </div>
      </section>
      <section className="admin-utility-nav" aria-label="Herramientas de gestión">
        <span className="admin-utility-label">Atajos</span>
        <Link to="/admin/prensa">Agenda de prensa</Link>
        <Link to="/directorio">Directorio</Link>
        <Link to="/admin/reemplazos">Reemplazos</Link>
        {actor.roles.includes("admin") && <Link to="/admin/instagram">Cuenta de Instagram</Link>}
        {actor.roles.includes("admin") && <Link to="/admin/usuarios">Usuarios</Link>}
      </section>
      {instagramMetrics && (
        <section className="metrics-grid admin-metrics" aria-label="Métricas de Instagram">
          <article className="metric-card">
            <strong>{instagramMetrics.totals.reach}</strong>
            <span>Alcance acumulado</span>
          </article>
          <article className="metric-card">
            <strong>{instagramMetrics.totals.impressions}</strong>
            <span>Impresiones</span>
          </article>
          <article className="metric-card">
            <strong>{instagramMetrics.totals.totalInteractions}</strong>
            <span>Interacciones</span>
          </article>
          <article className="metric-card">
            <strong>{instagramMetrics.posts}</strong>
            <span>Posts medidos</span>
          </article>
        </section>
      )}
      <section className="admin-library">
        <div className="admin-library-heading">
          <div>
            <p className="eyebrow">Biblioteca de contenidos</p>
            <h2>Lo que está en movimiento.</h2>
          </div>
          <span>{visible.length} piezas</span>
        </div>
        <div className="admin-library-tools">
          <input
            aria-label="Buscar contenido"
            placeholder="Buscar por título o etiqueta"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select aria-label="Filtrar estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {labels[status]}
              </option>
            ))}
          </select>
        </div>
        <ErrorMessage error={error} />
        <div className="admin-list">
          {visible.length ? (
            visible.map((item) => (
              <ContentCard item={item} key={item.id} onSelect={(item) => navigate(`/admin/contenido/${item.id}`)} />
            ))
          ) : (
            <p className="muted">No hay contenidos que coincidan.</p>
          )}
        </div>
      </section>
    </Layout>
  );
}

function SocialContentCard({ item, onSelect }) {
  const media = item.assets?.[0];
  return (
    <article
      className="social-record"
      onClick={() => onSelect(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(item);
        }
      }}
      role="button"
      tabIndex="0"
    >
      <div className="social-record-media">
        {media?.mediaType === "video" ? (
          <video muted preload="metadata" src={media.url} />
        ) : media?.url ? (
          <img src={media.url} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">◎</span>
        )}
      </div>
      <div className="social-record-content">
        <div className="social-record-meta">
          <span>{typeLabels[item.type] || item.type}</span>
          <span className={`status-badge status-${item.status}`}>{labels[item.status] || item.status}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary || item.instagramCopy || "Sin descripción todavía."}</p>
        <small>
          {item.scheduledAt
            ? `Programado para ${new Date(item.scheduledAt).toLocaleDateString("es-AR")}`
            : "Sin fecha de publicación"}
        </small>
      </div>
    </article>
  );
}

function SocialDashboard() {
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const load = () => {
    setError("");
    api("/api/content")
      .then((content) => setItems(content.filter((item) => item.channels?.includes("instagram"))))
      .catch((e) => setError(e.message));
    api("/api/metrics/instagram")
      .then(setMetrics)
      .catch(() => undefined);
  };
  useEffect(load, []);
  const visible = items.filter((item) =>
    `${item.title} ${item.summary} ${item.instagramCopy} ${(item.tags || []).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Layout>
      <section className="social-admin-hero">
        <div>
          <Link className="editor-back" to="/admin">
            ← Volver a redacción
          </Link>
          <p className="eyebrow">Redes / Instagram</p>
          <h1>Lo que pasa entre una nota y la próxima.</h1>
          <p>Creá piezas rápidas para sostener la conversación: reels, descubrimientos, novedades y series propias.</p>
        </div>
        <div className="social-admin-signal" aria-hidden="true">
          <span>IG</span>
          <strong>
            EN
            <br />
            MOVIMIENTO
          </strong>
        </div>
      </section>

      <section className="social-create-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Empezar por una idea</p>
            <h2>¿Qué querés mover hoy?</h2>
          </div>
          <Link className="button dark" to="/admin/nueva?mode=instagram">
            Pieza libre ↗
          </Link>
        </div>
        <div className="social-template-grid">
          <Link
            className="social-template social-template-featured"
            to="/admin/nueva?mode=instagram&preset=weekly-band"
          >
            <span className="social-template-number">01</span>
            <strong>La banda de la semana</strong>
            <small>Post de descubrimiento</small>
            <span className="social-template-arrow">↗</span>
          </Link>
          <Link className="social-template" to="/admin/nueva?mode=instagram&preset=discovery">
            <span className="social-template-number">02</span>
            <strong>Descubrimiento</strong>
            <small>Carrusel para guardar</small>
            <span className="social-template-arrow">↗</span>
          </Link>
          <Link className="social-template" to="/admin/nueva?mode=instagram&preset=news">
            <span className="social-template-number">03</span>
            <strong>Novedad</strong>
            <small>Una señal breve</small>
            <span className="social-template-arrow">↗</span>
          </Link>
          <Link className="social-template" to="/admin/nueva?mode=instagram&type=reel">
            <span className="social-template-number">04</span>
            <strong>Reel</strong>
            <small>Video vertical</small>
            <span className="social-template-arrow">↗</span>
          </Link>
        </div>
      </section>

      {metrics && (
        <section className="social-metrics" aria-label="Rendimiento de Instagram">
          <div>
            <strong>{metrics.totals.reach}</strong>
            <span>alcance acumulado</span>
          </div>
          <div>
            <strong>{metrics.totals.totalInteractions}</strong>
            <span>interacciones</span>
          </div>
          <div>
            <strong>{metrics.totals.plays}</strong>
            <span>reproducciones</span>
          </div>
          <div>
            <strong>{metrics.posts}</strong>
            <span>piezas medidas</span>
          </div>
        </section>
      )}

      <section className="social-library">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Archivo social</p>
            <h2>Todo lo que está listo para salir.</h2>
          </div>
          <input
            aria-label="Buscar piezas para Instagram"
            placeholder="Buscar piezas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ErrorMessage error={error} />
        <div className="social-record-list">
          {visible.length ? (
            visible.map((item) => (
              <SocialContentCard
                key={item.id}
                item={item}
                onSelect={(selected) => navigate(`/admin/contenido/${selected.id}`)}
              />
            ))
          ) : (
            <p className="muted">Todavía no hay piezas para Instagram.</p>
          )}
        </div>
      </section>
    </Layout>
  );
}

export function SocialPage() {
  return <AuthGate allowedRoles={["admin", "editor"]}>{() => <SocialDashboard />}</AuthGate>;
}

export function AdminPage() {
  return <AuthGate allowedRoles={["admin", "editor"]}>{(actor) => <AdminDashboard actor={actor} />}</AuthGate>;
}

function NewContentEditor() {
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const socialMode = searchParams.get("mode") === "instagram";
  const preset = socialPresets[searchParams.get("preset")] || {};
  const requestedType = searchParams.get("type");
  const submit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const item = await api("/api/content", {
        method: "POST",
        body: JSON.stringify({
          type: data.get("type"),
          title: data.get("title"),
          summary: data.get("summary"),
          body: data.get("body"),
          instagramCopy: data.get("instagramCopy"),
          scheduledAt: data.get("scheduledAt") ? new Date(data.get("scheduledAt")).toISOString() : null,
          author: data.get("author"),
          photographer: data.get("photographer"),
          source: data.get("source"),
          tags: String(data.get("tags") || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          status: "draft",
          channels: socialMode
            ? ["instagram", ...(data.get("facebook") ? ["facebook"] : [])]
            : [
                "website",
                ...(data.get("instagram") ? ["instagram"] : []),
                ...(data.get("facebook") ? ["facebook"] : []),
              ],
        }),
      });
      setStatus("Borrador creado.");
      setTimeout(() => navigate(`/admin/contenido/${item.id}`), 350);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Layout>
      <section className="editor-page editor-page-create">
        <div className="editor-page-header">
          <div>
            <Link className="editor-back" to="/admin">
              ← Volver a redacción
            </Link>
            <div className="editor-kicker">
              <span>Redacción</span>
              <span className="status-badge status-draft">Nuevo borrador</span>
            </div>
            <h1>{socialMode ? "Nueva pieza para Instagram" : "Nueva nota"}</h1>
            <p className="editor-header-copy">
              {socialMode
                ? "Una publicación ágil para mantener la escena en movimiento."
                : "Abrí una nueva pieza editorial y dejala lista para revisar."}
            </p>
          </div>
        </div>
        <div className="editor-layout editor-layout-single">
          <ContentForm
            onSubmit={submit}
            error={error}
            status={status}
            submitLabel="Crear borrador"
            socialMode={socialMode}
            preset={{ ...preset, ...(requestedType ? { type: requestedType } : {}) }}
          />
        </div>
      </section>
    </Layout>
  );
}

export function NewContentPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor"]}>
      <NewContentEditor />
    </AuthGate>
  );
}

function ExistingMedia({ assets = [], onRemove, removingAssetKey }) {
  return (
    <div className="existing-media" aria-label="Medios asociados">
      <div className="existing-media-heading">
        <strong>
          {assets.length
            ? `${assets.length} medio${assets.length === 1 ? "" : "s"} asociado${assets.length === 1 ? "" : "s"}`
            : "Sin medios asociados"}
        </strong>
        {assets.length > 0 && <span>Se guardan junto con la publicación.</span>}
      </div>
      {assets.length > 0 ? (
        <div className="existing-media-list">
          {assets.map((asset, index) => {
            const label = asset.mediaType === "video" ? "Video" : "Imagen";
            const key = asset.id || `${asset.url}-${index}`;
            const isRemoving = removingAssetKey === (asset.id || asset.url);
            return (
              <figure className="existing-media-item" key={key}>
                {asset.mediaType === "video" ? (
                  <video controls preload="metadata" src={asset.url} />
                ) : (
                  <img src={asset.url} alt={asset.altText || `Medio adjunto ${index + 1}`} loading="lazy" />
                )}
                <figcaption>
                  <span>{label}</span>
                  {asset.credit && <small>Crédito: {asset.credit}</small>}
                  <a href={asset.url} target="_blank" rel="noreferrer">
                    Abrir medio ↗
                  </a>
                  {onRemove && (
                    <button
                      className="existing-media-remove"
                      disabled={isRemoving}
                      onClick={() => onRemove(asset)}
                      type="button"
                    >
                      {isRemoving ? "Quitando…" : "Quitar de la nota"}
                    </button>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <span className="existing-media-empty">Todavía no se adjuntó ninguna imagen o video.</span>
      )}
    </div>
  );
}

function ContentForm({
  item,
  onSubmit,
  error,
  status,
  submitLabel = "Guardar cambios",
  formRef,
  socialMode = false,
  preset = {},
}) {
  const scheduled = item?.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : "";
  const initialType = item?.type || preset.type || (socialMode ? "post" : "article");
  const initialTitle = item?.title || preset.title || "";
  const initialSummary = item?.summary || preset.summary || "";
  const initialInstagramCopy = item?.instagramCopy || preset.instagramCopy || "";
  return (
    <form className="form editor-form" onSubmit={onSubmit} ref={formRef}>
      <section className="editor-card editor-card-main">
        <div className="editor-card-heading">
          <div>
            <p className="eyebrow">Contenido</p>
            <h2>{socialMode ? "La pieza social" : "La pieza editorial"}</h2>
          </div>
          <span className="editor-card-index">01</span>
        </div>
        <div className="editor-form-grid">
          <label className="field field-half">
            <span>Formato</span>
            <select name="type" defaultValue={initialType}>
              <option value="article">Nota</option>
              <option value="post">Post</option>
              <option value="carousel">Carrusel</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
            </select>
          </label>
          <label className="field field-half">
            <span>Etiquetas</span>
            <input name="tags" defaultValue={(item?.tags || []).join(", ")} placeholder="música, under, recital" />
          </label>
          <label className="field field-wide field-title">
            <span>
              Título <small>Obligatorio</small>
            </span>
            <input
              name="title"
              required
              defaultValue={initialTitle}
              placeholder={socialMode ? "Ej: La banda de la semana · junio" : "Un título claro, directo y con ritmo"}
            />
          </label>
          <label className="field field-wide">
            <span>
              Bajada <small>Resumen visible en la portada</small>
            </span>
            <textarea
              name="summary"
              rows="3"
              defaultValue={initialSummary}
              placeholder={
                socialMode
                  ? "Qué tiene que llevarse la persona de esta publicación."
                  : "Una frase que ubique la historia y dé ganas de seguir leyendo."
              }
            />
          </label>
          <label className="field field-wide field-body">
            <span>
              Cuerpo <small>Podés escribir en texto plano</small>
            </span>
            <textarea
              name="body"
              required={!socialMode}
              rows="16"
              defaultValue={item?.body || ""}
              placeholder={
                socialMode ? "Guion, estructura, datos o notas para producir la pieza…" : "Desarrollá la historia acá…"
              }
            />
          </label>
          <label className="field field-wide social-copy-field">
            <span>
              Copy de Instagram <small>{socialMode ? "Texto que acompaña la publicación" : "Opcional"}</small>
            </span>
            <textarea
              name="instagramCopy"
              rows="6"
              maxLength="2200"
              defaultValue={initialInstagramCopy}
              placeholder={
                socialMode
                  ? "Escribí el texto, el gancho y el llamado a la acción…"
                  : "Un copy específico para Instagram…"
              }
            />
          </label>
        </div>
      </section>

      <section className="editor-card">
        <div className="editor-card-heading">
          <div>
            <p className="eyebrow">Distribución</p>
            <h2>Créditos</h2>
          </div>
          <span className="editor-card-index">02</span>
        </div>
        <div className="editor-form-grid">
          <label className="field field-third">
            <span>Autor</span>
            <input name="author" defaultValue={item?.author || ""} placeholder="Nombre y apellido" />
          </label>
          <label className="field field-third">
            <span>Fotógrafo</span>
            <input name="photographer" defaultValue={item?.photographer || ""} placeholder="Nombre y apellido" />
          </label>
          <label className="field field-third">
            <span>Fuente</span>
            <input name="source" defaultValue={item?.source || ""} placeholder="Link o referencia" />
          </label>
        </div>
      </section>

      <section className="editor-card editor-card-last">
        <div className="editor-card-heading">
          <div>
            <p className="eyebrow">Configuración</p>
            <h2>Salida y canales</h2>
          </div>
          <span className="editor-card-index">03</span>
        </div>
        <div className="editor-form-grid editor-form-grid-meta">
          <label className="field field-half">
            <span>Programar publicación</span>
            <input name="scheduledAt" type="datetime-local" defaultValue={scheduled} />
          </label>
          <fieldset className="channels-fieldset field-half">
            <legend>Canales de distribución</legend>
            {socialMode ? (
              <>
                <input type="hidden" name="instagram" value="on" />
                <label className="channel-fixed">
                  <span>●</span> Instagram <small>Canal principal</small>
                </label>
              </>
            ) : (
              <label>
                <input
                  type="checkbox"
                  name="instagram"
                  defaultChecked={item?.channels?.includes("instagram") ?? true}
                />
                Instagram
              </label>
            )}
            <label>
              <input type="checkbox" name="facebook" defaultChecked={item?.channels?.includes("facebook")} />
              Facebook
            </label>
          </fieldset>
        </div>
        <div className="editor-form-footer">
          <div>
            <ErrorMessage error={error} />
            {status && <p className="success">{status}</p>}
          </div>
          <button className="button dark">{submitLabel}</button>
        </div>
      </section>
    </form>
  );
}

function EditorialWorkflow({ item, onTransition, onPublish, onRepublishInstagram, onPreview }) {
  const currentStage = workflowStageFor(item.status);
  const currentIndex = workflowStages.findIndex((stage) => stage.key === currentStage);
  const isPublished = item.status === "published";
  const canPublish = ["approved", "scheduled", "failed"].includes(item.status);

  return (
    <section className="editor-side-card editor-workflow-card">
      <div className="editor-side-heading">
        <div>
          <p className="eyebrow">Flujo editorial</p>
          <h2>Qué sigue</h2>
        </div>
        <span className={`status-badge status-${item.status}`}>{labels[item.status] || item.status}</span>
      </div>
      <ol className="workflow-steps" aria-label="Progreso editorial">
        {workflowStages.map((stage, index) => (
          <li
            className={`${index < currentIndex ? "is-complete" : ""} ${index === currentIndex ? "is-current" : ""}`}
            key={stage.key}
          >
            <span className="workflow-step-number">{index < currentIndex ? "✓" : index + 1}</span>
            <span>
              <strong>{stage.label}</strong>
              <small>{stage.description}</small>
            </span>
          </li>
        ))}
      </ol>
      <div className="workflow-next">
        <span>Estado actual</span>
        <strong>{isPublished ? "La nota ya está publicada" : workflowStages[currentIndex]?.label}</strong>
        <p>
          {isPublished
            ? "Podés editar el contenido sin volver a recorrer el flujo."
            : "Guardá los cambios antes de avanzar al próximo paso."}
        </p>
      </div>
      <div className="workflow-actions">
        {item.status === "idea" && (
          <button className="button dark button-wide" onClick={() => onTransition("draft")} type="button">
            Empezar borrador
          </button>
        )}
        {item.status === "draft" && (
          <button className="button dark button-wide" onClick={() => onTransition("review")} type="button">
            Enviar a revisión
          </button>
        )}
        {item.status === "failed" && (
          <button className="button dark button-wide" onClick={() => onTransition("draft")} type="button">
            Volver a borrador
          </button>
        )}
        {item.status === "review" && (
          <>
            <button className="button dark button-wide" onClick={() => onTransition("approved")} type="button">
              Aprobar nota
            </button>
            <button className="button ghost button-wide" onClick={() => onTransition("draft")} type="button">
              Volver a borrador
            </button>
          </>
        )}
        {item.status === "approved" && item.scheduledAt && (
          <button className="button ghost button-wide" onClick={() => onTransition("scheduled")} type="button">
            Programar publicación
          </button>
        )}
        {canPublish && (
          <button className="button dark button-wide" onClick={() => onPublish(false)} type="button">
            Publicar ahora
          </button>
        )}
        {item.status === "publishing" && <p className="publish-hint">La publicación está en proceso.</p>}
        {isPublished && (
          <>
            <p className="publish-hint">La nota está publicada. Los cambios se guardan directamente.</p>
            <button
              className="button ghost button-wide"
              onClick={() => {
                if (window.confirm("¿Retirar esta nota del sitio público y devolverla a borrador?")) {
                  onTransition("draft");
                }
              }}
              type="button"
            >
              Retirar del sitio
            </button>
            {item.channels?.includes("instagram") && (
              <button className="button ghost button-wide" onClick={onRepublishInstagram} type="button">
                Recompartir en Instagram
              </button>
            )}
          </>
        )}
      </div>
      <details className="editor-advanced-actions">
        <summary>Acciones avanzadas</summary>
        <button className="button ghost button-wide" onClick={onPreview} type="button">
          Simular publicación
        </button>
      </details>
    </section>
  );
}

function ContentEditorPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState([]);
  const [removingAssetKey, setRemovingAssetKey] = useState("");
  const formRef = useRef(null);
  const navigate = useNavigate();
  const load = () =>
    api(`/api/content/${id}`)
      .then(setItem)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  if (!item)
    return (
      <Layout>
        <section className="page-intro">
          <ErrorMessage error={error} />
          <p className="muted">Cargando contenido…</p>
        </section>
      </Layout>
    );
  const socialMode = item.channels?.includes("instagram") && !item.channels?.includes("website");
  const saveCurrent = async () => {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    await api(`/api/content/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type: data.get("type"),
        title: data.get("title"),
        summary: data.get("summary"),
        body: data.get("body"),
        instagramCopy: data.get("instagramCopy"),
        scheduledAt: data.get("scheduledAt") ? new Date(data.get("scheduledAt")).toISOString() : null,
        author: data.get("author"),
        photographer: data.get("photographer"),
        source: data.get("source"),
        tags: String(data.get("tags") || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        channels: socialMode
          ? ["instagram", ...(data.get("facebook") ? ["facebook"] : [])]
          : ["website", ...(data.get("instagram") ? ["instagram"] : []), ...(data.get("facebook") ? ["facebook"] : [])],
      }),
    });
  };
  const update = async (event) => {
    event.preventDefault();
    try {
      await saveCurrent();
      setStatus("Cambios guardados.");
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const transition = async (next) => {
    try {
      await saveCurrent();
      await api(`/api/content/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setStatus(`Estado actualizado: ${labels[next]}`);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const generate = async (kind) => {
    try {
      await api(`/api/content/${id}/generate`, {
        method: "POST",
        body: JSON.stringify({ kind, instructions }),
      });
      setStatus("Contenido generado con IA.");
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const publish = async (dryRun) => {
    try {
      await api(`/api/content/${id}/publish`, {
        method: "POST",
        body: JSON.stringify({ dryRun }),
      });
      setStatus(dryRun ? "Simulación completada." : "Publicación enviada.");
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const repostInstagram = async () => {
    if (!window.confirm("¿Querés volver a publicar esta nota en Instagram? Se va a crear un post nuevo.")) return;
    try {
      await api(`/api/content/${id}/repost/instagram`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setStatus("Nota recompartida en Instagram.");
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const upload = async () => {
    if (!files.length) return;
    const data = new FormData();
    [...files].forEach((file) => data.append("images", file));
    try {
      const assets = await api("/api/assets", { method: "POST", body: data });
      await api(`/api/content/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ assets: [...item.assets, ...assets] }),
      });
      setStatus("Medios subidos.");
      setFiles([]);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const removeAsset = async (asset) => {
    const assetKey = asset.id || asset.url;
    if (!window.confirm("¿Querés quitar este medio de la nota? El archivo no se borra del almacenamiento.")) return;
    setRemovingAssetKey(assetKey);
    try {
      await api(`/api/content/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          assets: item.assets.filter((candidate) => (candidate.id || candidate.url) !== assetKey),
        }),
      });
      setStatus("Medio quitado de la nota.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRemovingAssetKey("");
    }
  };
  return (
    <Layout>
      <section className="editor-page">
        <div className="editor-page-header">
          <div>
            <button className="editor-back" onClick={() => navigate("/admin")} type="button">
              ← Volver a redacción
            </button>
            <div className="editor-kicker">
              <span>Editor</span>
              <span className={`status-badge status-${item.status}`}>{labels[item.status] || item.status}</span>
            </div>
            <h1>Editar publicación</h1>
            <p className="editor-header-copy">Revisá el contenido, prepará los canales y dejalo listo para publicar.</p>
          </div>
          <div className="editor-header-meta">
            <span className="editor-meta-label">Último cambio</span>
            <strong>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("es-AR") : "Sin registrar"}</strong>
          </div>
        </div>
        <div className="editor-layout">
          <ContentForm
            key={item.updatedAt}
            item={item}
            onSubmit={update}
            error={error}
            status={status}
            formRef={formRef}
            socialMode={socialMode}
          />
          <aside className="editor-sidebar">
            <section className="editor-side-card editor-ai-card">
              <div className="editor-side-heading">
                <div>
                  <p className="eyebrow">Asistencia</p>
                  <h2>Trabajá con IA</h2>
                </div>
                <span className="ai-mark">✦</span>
              </div>
              <p className="editor-side-copy">Dale una indicación breve y aplicá el resultado sobre este borrador.</p>
              <label className="sr-only" htmlFor="ai-instructions">
                Indicaciones para la IA
              </label>
              <textarea
                id="ai-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ej.: hacé la bajada más directa y cercana"
                rows="5"
              />
              <div className="editor-ai-actions">
                <button className="button" onClick={() => generate("full_article")} type="button">
                  Generar nota
                </button>
                <button className="button" onClick={() => generate("social_copy")} type="button">
                  Generar copys
                </button>
                <button className="button ghost" onClick={() => generate("improve")} type="button">
                  Mejorar texto
                </button>
              </div>
            </section>

            <section className="editor-side-card">
              <div className="editor-side-heading">
                <div>
                  <p className="eyebrow">Recursos</p>
                  <h2>Medios</h2>
                </div>
              </div>
              <ExistingMedia assets={item?.assets} onRemove={removeAsset} removingAssetKey={removingAssetKey} />
              <label className="upload upload-dropzone">
                <span className="upload-icon">＋</span>
                <strong>
                  {files.length
                    ? files.length +
                      " archivo" +
                      (files.length > 1 ? "s" : "") +
                      " seleccionado" +
                      (files.length > 1 ? "s" : "")
                    : "Agregar imágenes o videos"}
                </strong>
                <small>JPG, PNG, WEBP o MP4</small>
                <input type="file" accept="image/*,video/*" multiple onChange={(e) => setFiles(e.target.files)} />
              </label>
              <button className="button ghost button-wide" onClick={upload} disabled={!files.length} type="button">
                Subir medios
              </button>
            </section>

            <EditorialWorkflow
              item={item}
              onTransition={transition}
              onPublish={publish}
              onRepublishInstagram={repostInstagram}
              onPreview={() => publish(true)}
            />
          </aside>
        </div>
      </section>
    </Layout>
  );
}

export function ContentPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor"]}>
      <ContentEditorPage />
    </AuthGate>
  );
}

function MediaKitForm({ mediaKit, onSaved }) {
  const [value, setValue] = useState(mediaKit);
  const [status, setStatus] = useState("");
  useEffect(() => setValue(mediaKit), [mediaKit]);
  const save = async (event) => {
    event.preventDefault();
    try {
      await api("/api/press/media-kit", {
        method: "PATCH",
        body: JSON.stringify(value),
      });
      setStatus("Dossier actualizado.");
      onSaved?.();
    } catch (error) {
      setStatus(error.message);
    }
  };
  return (
    <form className="form press-dossier-form" onSubmit={save}>
      <div className="press-form-heading">
        <div>
          <p className="press-card-kicker">Identidad del medio</p>
          <h2>Dossier del medio</h2>
          <p>La información que recibe una productora cuando pide datos de Afterstage.</p>
        </div>
        <span className="press-form-index">01</span>
      </div>
      <div className="press-form-fields press-dossier-fields">
        {["name", "tagline", "mission", "audience", "team", "services", "email", "website", "instagram"].map((key) => (
          <label
            className={["mission", "audience", "team", "services"].includes(key) ? "press-field-wide" : ""}
            key={key}
          >
            {mediaKitFieldLabels[key]}
            {["mission", "audience", "team", "services"].includes(key) ? (
              <textarea
                rows="3"
                value={value[key] || ""}
                onChange={(e) => setValue({ ...value, [key]: e.target.value })}
              />
            ) : (
              <input
                type={key === "email" ? "email" : key === "website" ? "url" : "text"}
                value={value[key] || ""}
                onChange={(e) => setValue({ ...value, [key]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      <div className="press-form-actions">
        <button className="button dark" type="submit">
          Guardar dossier
        </button>
        {status && (
          <p aria-live="polite" className="success">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}

function PressDashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(Boolean(localStorage.getItem("afterstage-token")));
  const [event, setEvent] = useState({
    name: "",
    artist: "",
    venue: "",
    address: "",
    city: "",
    dates: [""],
    url: "",
  });
  const [contact, setContact] = useState({
    name: "",
    organization: "",
    email: "",
    type: "press",
  });
  const [accreditation, setAccreditation] = useState({
    eventId: "",
    contactId: "",
    subject: "Solicitud de acreditación",
    message: "",
    followUpAt: "",
  });
  const [coverage, setCoverage] = useState({
    eventId: "",
    title: "",
    url: "",
    notes: "",
  });
  const load = () =>
    api("/api/press/snapshot")
      .then(setSnapshot)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (authorized) load();
  }, [authorized]);
  const create = async (path, value, reset) => {
    try {
      const payload = { ...value };
      if (path === "/api/press/events") {
        payload.dates = payload.dates.filter(Boolean).map((date) => new Date(date).toISOString());
        payload.startsAt = payload.dates[0] ?? null;
        payload.endsAt = null;
      }
      payload.followUpAt = payload.followUpAt ? new Date(payload.followUpAt).toISOString() : null;
      await api(path, { method: "POST", body: JSON.stringify(payload) });
      reset();
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const send = async (id) => {
    try {
      await api(`/api/press/accreditations/${id}/send`, {
        method: "POST",
        body: JSON.stringify({ dryRun: false }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  if (!authorized)
    return (
      <Layout>
        <TokenGate onReady={() => setAuthorized(true)} />
      </Layout>
    );
  return (
    <Layout>
      <div className="press-page">
        <section className="page-intro press-hero">
          <p className="eyebrow">Prensa</p>
          <h1>Centro de prensa.</h1>
          <p>Organizá eventos, contactos, acreditaciones y coberturas desde un solo lugar.</p>
          <div className="press-hero-actions" aria-label="Acciones rápidas">
            <a className="button dark" href="#press-event-form">
              Nuevo evento
            </a>
            <a className="button ghost" href="#press-accreditation-form">
              Solicitar acreditación
            </a>
          </div>
          <ErrorMessage error={error} />
        </section>
        {snapshot && (
          <>
            <div className="press-stat-grid">
              <article className="press-stat-card">
                <strong>{snapshot.events.length}</strong>
                <span>Eventos</span>
              </article>
              <article className="press-stat-card">
                <strong>{snapshot.contacts.length}</strong>
                <span>Contactos</span>
              </article>
              <article className="press-stat-card">
                <strong>{snapshot.accreditations.length}</strong>
                <span>Acreditaciones</span>
              </article>
              <article className="press-stat-card">
                <strong>{snapshot.coverages.length}</strong>
                <span>Coberturas</span>
              </article>
            </div>
            <section className="press-dossier-section" id="press-dossier">
              <MediaKitForm mediaKit={snapshot.mediaKit} onSaved={load} />
            </section>
            <section className="press-operations" id="press-operations">
              <div className="press-section-heading">
                <div>
                  <p className="press-card-kicker">Operaciones</p>
                  <h2>Cargar y gestionar</h2>
                </div>
                <p>Completá solo lo que necesitás ahora.</p>
              </div>
              <div className="press-operation-grid">
                <form
                  className="form press-form-card"
                  id="press-event-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    create("/api/press/events", event, () =>
                      setEvent({
                        name: "",
                        artist: "",
                        venue: "",
                        address: "",
                        city: "",
                        dates: [""],
                        url: "",
                      }),
                    );
                  }}
                >
                  <h2>Nuevo evento</h2>
                  {Object.entries(event).map(([key, value]) =>
                    key === "dates" ? (
                      <fieldset className="event-dates-fieldset" key={key}>
                        <legend>{eventFieldLabels[key]}</legend>
                        <p>Agregá cada fecha en la que ocurre. No tienen que ser consecutivas.</p>
                        {value.map((date, index) => (
                          <div className="event-date-row" key={`${index}-${date}`}>
                            <label>
                              <span>Fecha {index + 1}</span>
                              <input
                                required={index === 0}
                                aria-label={`Fecha del evento ${index + 1}`}
                                type="datetime-local"
                                value={date}
                                onChange={(e) =>
                                  setEvent({
                                    ...event,
                                    dates: value.map((item, itemIndex) =>
                                      itemIndex === index ? e.target.value : item,
                                    ),
                                  })
                                }
                              />
                            </label>
                            {value.length > 1 && (
                              <button
                                className="button ghost"
                                type="button"
                                onClick={() =>
                                  setEvent({ ...event, dates: value.filter((_, itemIndex) => itemIndex !== index) })
                                }
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          className="button ghost"
                          type="button"
                          onClick={() => setEvent({ ...event, dates: [...value, ""] })}
                        >
                          + Agregar otra fecha
                        </button>
                      </fieldset>
                    ) : (
                      <label key={key}>
                        {eventFieldLabels[key]}
                        <input
                          required={key === "name"}
                          type={key === "url" ? "url" : "text"}
                          value={value}
                          onChange={(e) => setEvent({ ...event, [key]: e.target.value })}
                        />
                      </label>
                    ),
                  )}
                  <button className="button dark" type="submit">
                    Guardar evento
                  </button>
                </form>
                <form
                  className="form press-form-card"
                  onSubmit={(e) => {
                    e.preventDefault();
                    create("/api/press/contacts", contact, () =>
                      setContact({
                        name: "",
                        organization: "",
                        email: "",
                        type: "press",
                      }),
                    );
                  }}
                >
                  <h2>Nuevo contacto</h2>
                  {Object.entries(contact).map(([key, value]) => (
                    <label key={key}>
                      {contactFieldLabels[key]}
                      {key === "type" ? (
                        <select value={value} onChange={(e) => setContact({ ...contact, [key]: e.target.value })}>
                          {Object.entries(contactTypeLabels).map(([optionValue, optionLabel]) => (
                            <option key={optionValue} value={optionValue}>
                              {optionLabel}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={key === "name"}
                          type={key === "email" ? "email" : "text"}
                          value={value}
                          onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                        />
                      )}
                    </label>
                  ))}
                  <button className="button dark" type="submit">
                    Guardar contacto
                  </button>
                </form>
              </div>
            </section>
            <section className="press-operation-grid press-operation-grid-secondary">
              <form
                className="form press-form-card"
                id="press-accreditation-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  create(
                    "/api/press/accreditations",
                    {
                      ...accreditation,
                      status: "draft",
                      sentAt: null,
                      response: "",
                      deliverables: "Nota, fotos y publicación en redes",
                    },
                    () =>
                      setAccreditation({
                        eventId: "",
                        contactId: "",
                        subject: "Solicitud de acreditación",
                        message: "",
                        followUpAt: "",
                      }),
                  );
                }}
              >
                <h2>Solicitar acreditación</h2>
                <label>
                  Evento
                  <select
                    required
                    value={accreditation.eventId}
                    onChange={(e) =>
                      setAccreditation({
                        ...accreditation,
                        eventId: e.target.value,
                      })
                    }
                  >
                    <option value="">Elegir evento</option>
                    {snapshot.events.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Contacto
                  <select
                    required
                    value={accreditation.contactId}
                    onChange={(e) =>
                      setAccreditation({
                        ...accreditation,
                        contactId: e.target.value,
                      })
                    }
                  >
                    <option value="">Elegir contacto</option>
                    {snapshot.contacts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Asunto
                  <input
                    required
                    value={accreditation.subject}
                    onChange={(e) =>
                      setAccreditation({
                        ...accreditation,
                        subject: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Mensaje
                  <textarea
                    required
                    rows="6"
                    value={accreditation.message}
                    onChange={(e) =>
                      setAccreditation({
                        ...accreditation,
                        message: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Seguimiento
                  <input
                    type="datetime-local"
                    value={accreditation.followUpAt}
                    onChange={(e) =>
                      setAccreditation({
                        ...accreditation,
                        followUpAt: e.target.value,
                      })
                    }
                  />
                </label>
                <button className="button dark" type="submit">
                  Guardar solicitud
                </button>
              </form>
              <form
                className="form press-form-card"
                onSubmit={(e) => {
                  e.preventDefault();
                  create(
                    "/api/press/coverages",
                    {
                      ...coverage,
                      publishedAt: new Date().toISOString(),
                      reach: 0,
                    },
                    () => setCoverage({ eventId: "", title: "", url: "", notes: "" }),
                  );
                }}
              >
                <h2>Registrar cobertura</h2>
                <label>
                  Evento
                  <select
                    required
                    value={coverage.eventId}
                    onChange={(e) => setCoverage({ ...coverage, eventId: e.target.value })}
                  >
                    <option value="">Elegir evento</option>
                    {snapshot.events.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Título
                  <input
                    required
                    value={coverage.title}
                    onChange={(e) => setCoverage({ ...coverage, title: e.target.value })}
                  />
                </label>
                <label>
                  URL
                  <input
                    type="url"
                    value={coverage.url}
                    onChange={(e) => setCoverage({ ...coverage, url: e.target.value })}
                  />
                </label>
                <label>
                  Notas
                  <textarea
                    rows="5"
                    value={coverage.notes}
                    onChange={(e) => setCoverage({ ...coverage, notes: e.target.value })}
                  />
                </label>
                <button className="button dark" type="submit">
                  Guardar cobertura
                </button>
              </form>
            </section>
            <section className="press-records">
              <div className="press-section-heading">
                <div>
                  <p className="press-card-kicker">Seguimiento</p>
                  <h2>Actividad reciente</h2>
                </div>
                <p>Consultá lo que ya enviaste y registraste.</p>
              </div>
              <div className="press-records-grid">
                <div className="press-records-column">
                  <div className="press-records-heading">
                    <h3>Solicitudes enviadas</h3>
                    <span>{snapshot.accreditations.length}</span>
                  </div>
                  {snapshot.accreditations.length ? (
                    snapshot.accreditations.map((item) => (
                      <article className="press-record" key={item.id}>
                        <span>
                          {item.subject} · {item.status}
                        </span>
                        <button className="button ghost" onClick={() => send(item.id)} type="button">
                          Enviar correo
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="press-empty">Todavía no hay solicitudes enviadas.</p>
                  )}
                </div>
                <div className="press-records-column">
                  <div className="press-records-heading">
                    <h3>Coberturas registradas</h3>
                    <span>{snapshot.coverages.length}</span>
                  </div>
                  {snapshot.coverages.length ? (
                    snapshot.coverages.map((item) => (
                      <article className="press-record" key={item.id}>
                        <span>{item.title}</span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer">
                            Abrir ↗
                          </a>
                        )}
                      </article>
                    ))
                  ) : (
                    <p className="press-empty">Todavía no hay coberturas registradas.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

export function PressPage() {
  return (
    <AuthGate allowedRoles={["admin", "press"]}>
      <PressDashboard />
    </AuthGate>
  );
}

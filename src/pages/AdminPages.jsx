import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    <article className="admin-record" onClick={() => onSelect(item)}>
      <div>
        <small>
          {labels[item.status] || item.status} · {item.type}
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
      <section className="page-intro">
        <p className="eyebrow">Redacción</p>
        <h1>Gestor editorial.</h1>
        <p>Creá, revisá, generá con IA y publicá desde un solo lugar.</p>
        <div className="actions">
          <Link className="button" to="/admin/nueva">
            Nueva publicación ↗
          </Link>
          <Link className="button" to="/admin/prensa">
            Agenda de prensa ↗
          </Link>
          <Link className="button" to="/admin/reemplazos">
            Reemplazos ↗
          </Link>
          <Link className="button" to="/admin/directorio">
            Directorio ↗
          </Link>
          <Link className="button" to="/admin/monetizacion">
            Monetización ↗
          </Link>
          {actor.roles.includes("admin") && (
            <Link className="button accent-outline" to="/admin/usuarios">
              Usuarios ↗
            </Link>
          )}
          <button
            className="button ghost"
            onClick={() => {
              localStorage.removeItem("afterstage-token");
              window.dispatchEvent(new Event("afterstage-auth-changed"));
              setAuthorized(false);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </section>
      {instagramMetrics && (
        <section className="metrics-grid" aria-label="Métricas de Instagram">
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
      <div className="actions editor-tools">
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
    </Layout>
  );
}

export function AdminPage() {
  return <AuthGate allowedRoles={["admin", "editor"]}>{(actor) => <AdminDashboard actor={actor} />}</AuthGate>;
}

function NewContentEditor() {
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
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
          facebookCopy: data.get("facebookCopy"),
          scheduledAt: data.get("scheduledAt") ? new Date(data.get("scheduledAt")).toISOString() : null,
          author: data.get("author"),
          photographer: data.get("photographer"),
          source: data.get("source"),
          tags: String(data.get("tags") || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          status: "draft",
          channels: [
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
            <h1>Nueva publicación</h1>
            <p className="editor-header-copy">Abrí una nueva pieza editorial y dejala lista para revisar.</p>
          </div>
        </div>
        <div className="editor-layout editor-layout-single">
          <ContentForm onSubmit={submit} error={error} status={status} submitLabel="Crear borrador" />
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

function ContentForm({ item, onSubmit, error, status, submitLabel = "Guardar cambios", formRef }) {
  const scheduled = item?.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : "";
  return (
    <form className="form editor-form" onSubmit={onSubmit} ref={formRef}>
      <section className="editor-card editor-card-main">
        <div className="editor-card-heading">
          <div>
            <p className="eyebrow">Contenido</p>
            <h2>La pieza editorial</h2>
          </div>
          <span className="editor-card-index">01</span>
        </div>
        <div className="editor-form-grid">
          <label className="field field-half">
            <span>Formato</span>
            <select name="type" defaultValue={item?.type || "article"}>
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
              defaultValue={item?.title || ""}
              placeholder="Un título claro, directo y con ritmo"
            />
          </label>
          <label className="field field-wide">
            <span>
              Bajada <small>Resumen visible en la portada</small>
            </span>
            <textarea
              name="summary"
              rows="3"
              defaultValue={item?.summary || ""}
              placeholder="Una frase que ubique la historia y dé ganas de seguir leyendo."
            />
          </label>
          <label className="field field-wide field-body">
            <span>
              Cuerpo <small>Podés escribir en texto plano</small>
            </span>
            <textarea
              name="body"
              required
              rows="16"
              defaultValue={item?.body || ""}
              placeholder="Desarrollá la historia acá…"
            />
          </label>
        </div>
      </section>

      <section className="editor-card">
        <div className="editor-card-heading">
          <div>
            <p className="eyebrow">Distribución</p>
            <h2>Copys y créditos</h2>
          </div>
          <span className="editor-card-index">02</span>
        </div>
        <div className="editor-form-grid">
          <label className="field field-half">
            <span>Copy para Instagram</span>
            <textarea
              name="instagramCopy"
              rows="5"
              defaultValue={item?.instagramCopy || ""}
              placeholder="Texto para acompañar la publicación…"
            />
          </label>
          <label className="field field-half">
            <span>Copy para Facebook</span>
            <textarea
              name="facebookCopy"
              rows="5"
              defaultValue={item?.facebookCopy || ""}
              placeholder="Texto para compartir la nota…"
            />
          </label>
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
            <label>
              <input type="checkbox" name="instagram" defaultChecked={item?.channels?.includes("instagram") ?? true} />
              Instagram
            </label>
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

function EditorialWorkflow({ item, onTransition, onPublish, onPreview }) {
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
        {["draft", "failed"].includes(item.status) && (
          <button className="button dark button-wide" onClick={() => onTransition("review")} type="button">
            Enviar a revisión
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
        {isPublished && <p className="publish-hint">La nota está publicada. Los cambios se guardan directamente.</p>}
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
        facebookCopy: data.get("facebookCopy"),
        scheduledAt: data.get("scheduledAt") ? new Date(data.get("scheduledAt")).toISOString() : null,
        author: data.get("author"),
        photographer: data.get("photographer"),
        source: data.get("source"),
        tags: String(data.get("tags") || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        channels: [
          "website",
          ...(data.get("instagram") ? ["instagram"] : []),
          ...(data.get("facebook") ? ["facebook"] : []),
        ],
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
    <form className="form" onSubmit={save}>
      <h2>Dossier del medio</h2>
      {["name", "tagline", "mission", "audience", "team", "services", "email", "website", "instagram"].map((key) => (
        <label key={key}>
          {key}
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
      <button className="button dark">Guardar dossier</button>
      {status && <p className="success">{status}</p>}
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
    startsAt: "",
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
      payload.startsAt = payload.startsAt ? new Date(payload.startsAt).toISOString() : null;
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
      <section className="page-intro">
        <p className="eyebrow">Prensa</p>
        <h1>Eventos y acreditaciones.</h1>
        <p>Organizá contactos, pedidos de prensa y coberturas del medio.</p>
        <ErrorMessage error={error} />
      </section>
      {snapshot && (
        <>
          <div className="cards">
            <article className="card">
              <strong>{snapshot.events.length}</strong>
              <p>Eventos</p>
            </article>
            <article className="card">
              <strong>{snapshot.contacts.length}</strong>
              <p>Contactos</p>
            </article>
            <article className="card">
              <strong>{snapshot.accreditations.length}</strong>
              <p>Acreditaciones</p>
            </article>
            <article className="card">
              <strong>{snapshot.coverages.length}</strong>
              <p>Coberturas</p>
            </article>
          </div>
          <MediaKitForm mediaKit={snapshot.mediaKit} onSaved={load} />
          <section className="split-forms">
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                create("/api/press/events", event, () =>
                  setEvent({
                    name: "",
                    artist: "",
                    venue: "",
                    address: "",
                    city: "",
                    startsAt: "",
                    url: "",
                  }),
                );
              }}
            >
              <h2>Nuevo evento</h2>
              {Object.entries(event).map(([key, value]) => (
                <label key={key}>
                  {key === "address" ? "Dirección del lugar" : key}
                  <input
                    required={key === "name"}
                    type={key === "startsAt" ? "datetime-local" : key === "url" ? "url" : "text"}
                    value={value}
                    onChange={(e) => setEvent({ ...event, [key]: e.target.value })}
                  />
                </label>
              ))}
              <button className="button dark">Guardar evento</button>
            </form>
            <form
              className="form"
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
                  {key}
                  <input
                    required={key === "name"}
                    type={key === "email" ? "email" : "text"}
                    value={value}
                    onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                  />
                </label>
              ))}
              <button className="button dark">Guardar contacto</button>
            </form>
          </section>
          <section className="split-forms">
            <form
              className="form"
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
              <button className="button dark">Guardar solicitud</button>
            </form>
            <form
              className="form"
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
              <button className="button dark">Guardar cobertura</button>
            </form>
          </section>
          <section className="admin-list">
            <h2>Solicitudes enviadas</h2>
            {snapshot.accreditations.map((item) => (
              <article key={item.id}>
                <span>
                  {item.subject} · {item.status}
                </span>
                <button className="button" onClick={() => send(item.id)}>
                  Enviar correo
                </button>
              </article>
            ))}
            <h2>Coberturas registradas</h2>
            {snapshot.coverages.map((item) => (
              <article key={item.id}>
                <span>{item.title}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Abrir ↗
                  </a>
                )}
              </article>
            ))}
          </section>
        </>
      )}
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

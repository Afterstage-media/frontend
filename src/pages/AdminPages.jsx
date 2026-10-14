import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { LoginForm } from "../components/AuthGate.jsx";

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

export function AdminPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [instagramMetrics, setInstagramMetrics] = useState(null);
  const [authorized, setAuthorized] = useState(Boolean(localStorage.getItem("medio-under-token")));
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
          <button
            className="button ghost"
            onClick={() => {
              localStorage.removeItem("medio-under-token");
              window.dispatchEvent(new Event("medio-under-auth-changed"));
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

export function NewContentPage() {
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
      <section className="page-intro">
        <p className="eyebrow">Redacción</p>
        <h1>Nueva publicación.</h1>
      </section>
      <ContentForm onSubmit={submit} error={error} status={status} submitLabel="Crear borrador" />
    </Layout>
  );
}

function ContentForm({ item, onSubmit, error, status, submitLabel = "Guardar cambios" }) {
  const scheduled = item?.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : "";
  return (
    <form className="form editor-form" onSubmit={onSubmit}>
      <label>
        Tipo
        <select name="type" defaultValue={item?.type || "article"}>
          <option value="article">Nota</option>
          <option value="post">Post</option>
          <option value="carousel">Carrusel</option>
          <option value="reel">Reel</option>
          <option value="story">Story</option>
        </select>
      </label>
      <label>
        Título
        <input name="title" required defaultValue={item?.title || ""} />
      </label>
      <label>
        Bajada
        <textarea name="summary" rows="3" defaultValue={item?.summary || ""} />
      </label>
      <label>
        Cuerpo
        <textarea name="body" required rows="12" defaultValue={item?.body || ""} />
      </label>
      <label>
        Copy Instagram
        <textarea name="instagramCopy" rows="4" defaultValue={item?.instagramCopy || ""} />
      </label>
      <label>
        Copy Facebook
        <textarea name="facebookCopy" rows="4" defaultValue={item?.facebookCopy || ""} />
      </label>
      <label>
        Autor
        <input name="author" defaultValue={item?.author || ""} />
      </label>
      <label>
        Fotógrafo
        <input name="photographer" defaultValue={item?.photographer || ""} />
      </label>
      <label>
        Fuente
        <input name="source" defaultValue={item?.source || ""} />
      </label>
      <label>
        Programar publicación
        <input name="scheduledAt" type="datetime-local" defaultValue={scheduled} />
      </label>
      <label>
        Etiquetas
        <input name="tags" defaultValue={(item?.tags || []).join(", ")} placeholder="música, under, recital" />
      </label>
      <fieldset>
        <legend>Canales</legend>
        <label>
          <input type="checkbox" name="instagram" defaultChecked={item?.channels?.includes("instagram") ?? true} />{" "}
          Instagram
        </label>
        <label>
          <input type="checkbox" name="facebook" defaultChecked={item?.channels?.includes("facebook")} /> Facebook
        </label>
      </fieldset>
      <button className="button dark">{submitLabel}</button>
      <ErrorMessage error={error} />
      {status && <p className="success">{status}</p>}
    </form>
  );
}

export function ContentPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState([]);
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
  const update = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
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
      setStatus("Cambios guardados.");
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const transition = async (next) => {
    try {
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
      <section className="page-intro">
        <p className="eyebrow">Editor · {labels[item.status] || item.status}</p>
        <h1>{item.title}</h1>
        <button className="button ghost" onClick={() => navigate("/admin")}>
          ← Volver
        </button>
      </section>
      <ContentForm item={item} onSubmit={update} error={error} status={status} />
      <section className="editor-tools">
        <h2>Asistencia y publicación</h2>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Indicaciones para la IA (opcional)"
          rows="3"
        />
        <div className="actions">
          <button className="button" onClick={() => generate("full_article")}>
            Generar nota
          </button>
          <button className="button" onClick={() => generate("social_copy")}>
            Generar copys
          </button>
          <button className="button" onClick={() => generate("improve")}>
            Mejorar texto
          </button>
        </div>
        <label className="upload">
          Imágenes o videos
          <input type="file" accept="image/*,video/*" multiple onChange={(e) => setFiles(e.target.files)} />
        </label>
        <button className="button" onClick={upload} disabled={!files.length}>
          Subir medios
        </button>
        <div className="actions">
          <select value={item.status} onChange={(e) => transition(e.target.value)}>
            {statuses
              .filter((s) => !["published", "failed"].includes(s) || ["published", "failed"].includes(item.status))
              .map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
          </select>
          <button className="button ghost" onClick={() => publish(true)}>
            Simular publicación
          </button>
          <button
            className="button dark"
            disabled={!["approved", "scheduled", "failed"].includes(item.status)}
            onClick={() => publish(false)}
          >
            Publicar ahora
          </button>
        </div>
      </section>
    </Layout>
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

export function PressPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(Boolean(localStorage.getItem("medio-under-token")));
  const [event, setEvent] = useState({
    name: "",
    artist: "",
    venue: "",
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
      if (payload.startsAt) payload.startsAt = new Date(payload.startsAt).toISOString();
      if (payload.followUpAt) payload.followUpAt = new Date(payload.followUpAt).toISOString();
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
                  {key}
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

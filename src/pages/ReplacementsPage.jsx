import { useEffect, useState } from "react";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/UiState.jsx";
import { api } from "../services/api.js";

const profiles = {
  photographer: "Fotógrafo/a",
  notero: "Notero/a",
  cronista: "Cronista",
  videographer: "Videógrafo/a",
};

function Board() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ applicantName: "", applicantEmail: "", message: "", portfolioUrl: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    setError("");
    api("/api/public/replacements")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const apply = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/public/replacements/${selected.id}/applications`, {
        method: "POST",
        body: JSON.stringify({ ...form, profile: selected.profile }),
      });
      setSent("Postulación enviada");
      setSelected(null);
      setForm({ applicantName: "", applicantEmail: "", message: "", portfolioUrl: "" });
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Tablero de oportunidades</p>
        <h1>Búsquedas.</h1>
        <p>Encontrá fotógrafos, noteros, cronistas y videógrafos para cubrir eventos del medio.</p>
      </section>
      <ErrorMessage error={error} />
      {sent && <p className="success">{sent}</p>}
      {loading ? (
        <LoadingState label="Buscando oportunidades…" />
      ) : error ? (
        <ErrorState message="No pudimos cargar las búsquedas disponibles." onRetry={load} />
      ) : items.length ? (
        <div className="admin-grid">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <small>
                {profiles[item.profile]} · {item.city || "Ubicación a coordinar"}
              </small>
              <h2>{item.title}</h2>
              <p>{item.description || item.requirements}</p>
              <p className="muted">
                {item.startsAt ? new Date(item.startsAt).toLocaleString() : "Fecha a coordinar"}
                {item.compensation && ` · ${item.compensation}`}
              </p>
              <button className="button" onClick={() => setSelected(item)}>
                Postularme
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay búsquedas abiertas."
          message="Cuando aparezca una cobertura para sumar fotógrafos, noteros o videógrafos, la vas a encontrar acá."
        />
      )}
      {selected && (
        <form className="form" onSubmit={apply}>
          <h2>Postularme: {selected.title}</h2>
          <label>
            Nombre
            <input
              required
              value={form.applicantName}
              onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.applicantEmail}
              onChange={(e) => setForm({ ...form, applicantEmail: e.target.value })}
            />
          </label>
          <label>
            Portfolio / web
            <input
              type="url"
              value={form.portfolioUrl}
              onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
            />
          </label>
          <label>
            Mensaje
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </label>
          <div className="actions">
            <button className="button dark">Enviar postulación</button>
            <button type="button" className="button ghost" onClick={() => setSelected(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Layout>
  );
}

export function ReplacementsPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "community", "social"]}>
      <Board />
    </AuthGate>
  );
}

function AdminBoard() {
  const [items, setItems] = useState([]);
  const [applications, setApplications] = useState({});
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    profile: "photographer",
    city: "",
    contactEmail: "",
    description: "",
    startsAt: "",
  });
  const load = () =>
    api("/api/press/replacements")
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const showApplications = async (id) => {
    try {
      setApplications({ ...applications, [id]: await api(`/api/press/replacements/${id}/applications`) });
    } catch (e) {
      setError(e.message);
    }
  };
  const assign = async (id) => {
    try {
      await api(`/api/press/replacement-applications/${id}/assign`, {
        method: "POST",
        body: JSON.stringify({ dryRun: false }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const create = async (event) => {
    event.preventDefault();
    try {
      await api("/api/press/replacements", {
        method: "POST",
        body: JSON.stringify({ ...form, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null }),
      });
      setForm({ ...form, title: "", description: "" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Prensa</p>
        <h1>Gestión de reemplazos.</h1>
        <p>Revisá postulaciones y asigná coberturas cuando el equipo no puede asistir.</p>
      </section>
      <form className="form" onSubmit={create}>
        <h2>Nueva búsqueda</h2>
        <label>
          Título
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label>
          Perfil
          <select value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })}>
            {Object.entries(profiles).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ciudad
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </label>
        <label>
          Email de contacto
          <input
            required
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          />
        </label>
        <label>
          Fecha y hora
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </label>
        <label>
          Descripción
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <button className="button dark">Publicar búsqueda</button>
      </form>
      <ErrorMessage error={error} />
      <div className="admin-grid">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <small>
              {profiles[item.profile]} · {item.status}
            </small>
            <h2>{item.title}</h2>
            <p>
              {item.city} {item.startsAt && `· ${new Date(item.startsAt).toLocaleString()}`}
            </p>
            <button className="button" onClick={() => showApplications(item.id)}>
              Ver postulaciones
            </button>
            {(applications[item.id] || []).map((candidate) => (
              <div className="admin-record" key={candidate.id}>
                <strong>{candidate.applicantName}</strong>
                <span>{candidate.applicantEmail}</span>
                {candidate.portfolioUrl && (
                  <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer">
                    Portfolio ↗
                  </a>
                )}
                <button
                  className="button dark"
                  disabled={candidate.status === "accepted"}
                  onClick={() => assign(candidate.id)}
                >
                  Asignar
                </button>
              </div>
            ))}
          </article>
        ))}
      </div>
    </Layout>
  );
}

export function AdminReplacementsPage() {
  return (
    <AuthGate allowedRoles={["admin", "press"]}>
      <AdminBoard />
    </AuthGate>
  );
}

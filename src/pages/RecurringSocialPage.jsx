import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { Button } from "../components/ui/Button.jsx";
import "../styles/pages/recurring-social.css";

const cadenceLabels = { day: "día", week: "semana", month: "mes" };
const typeLabels = { story: "Historia", post: "Publicación", carousel: "Carrusel" };
const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const emptyForm = () => ({
  id: "",
  slug: "",
  name: "",
  description: "",
  templateSlug: "",
  editorialBrief: "",
  every: 1,
  unit: "week",
  nextRunAt: new Date().toISOString().slice(0, 10),
  active: true,
});

const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))
    : "Sin programar";

function cadenceLabel(cadence) {
  if (!cadence) return "Sin frecuencia";
  const unit = cadenceLabels[cadence.unit] || cadence.unit;
  return `Cada ${cadence.every} ${unit}${cadence.every === 1 ? "" : cadence.unit === "day" ? "s" : cadence.unit === "week" ? "s" : "es"}`;
}

function SeriesEditor({ templates, value, onCancel, onSave, saving, error }) {
  const [form, setForm] = useState(value || emptyForm());
  const selectedTemplate = templates.find((item) => item.slug === form.templateSlug);
  const set = (field, next) => setForm((current) => ({ ...current, [field]: next }));

  return (
    <form
      className="recurring-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
    >
      <div className="recurring-editor-heading">
        <div>
          <span className="eyebrow">{form.id ? "Editar serie" : "Nueva serie"}</span>
          <h2>{form.id ? form.name : "Dale una frecuencia a una idea"}</h2>
        </div>
        <button className="recurring-close" onClick={onCancel} type="button" aria-label="Cerrar editor">
          ×
        </button>
      </div>
      <div className="recurring-fields">
        <label>
          Nombre de la serie
          <input maxLength={120} onChange={(event) => set("name", event.target.value)} required value={form.name} />
        </label>
        <label>
          Formato editorial
          <select
            onChange={(event) => {
              const templateSlug = event.target.value;
              const template = templates.find((item) => item.slug === templateSlug);
              setForm((current) => ({
                ...current,
                templateSlug,
                editorialBrief: current.editorialBrief || template?.editorialGuidance?.purpose || "",
              }));
            }}
            required
            value={form.templateSlug}
          >
            <option value="">Elegí una plantilla</option>
            {templates.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name} · {typeLabels[item.outputType] || item.outputType}
              </option>
            ))}
          </select>
        </label>
        <label className="recurring-field-wide">
          Qué debe contar esta serie
          <textarea
            maxLength={1200}
            onChange={(event) => set("editorialBrief", event.target.value)}
            placeholder="La pauta editorial que se mantiene. Los datos y el texto cambian en cada entrega."
            required
            rows={3}
            value={form.editorialBrief}
          />
        </label>
        <label className="recurring-field-wide">
          Descripción breve
          <input
            maxLength={400}
            onChange={(event) => set("description", event.target.value)}
            placeholder="Para reconocer rápido de qué trata"
            value={form.description}
          />
        </label>
        <div className="recurring-cadence recurring-field-wide">
          <span>Frecuencia</span>
          <div>
            <span>Cada</span>
            <input
              aria-label="Cantidad de días, semanas o meses"
              min="1"
              max="365"
              onChange={(event) => set("every", Number(event.target.value))}
              required
              type="number"
              value={form.every}
            />
            <select
              aria-label="Unidad de frecuencia"
              onChange={(event) => set("unit", event.target.value)}
              value={form.unit}
            >
              <option value="day">días</option>
              <option value="week">semanas</option>
              <option value="month">meses</option>
            </select>
          </div>
        </div>
        <label>
          Próxima fecha
          <input
            onChange={(event) => set("nextRunAt", event.target.value)}
            required={form.active}
            type="date"
            value={form.nextRunAt || ""}
          />
        </label>
        <label className="recurring-active-toggle">
          <input checked={form.active} onChange={(event) => set("active", event.target.checked)} type="checkbox" />
          <span>
            <strong>Serie activa</strong>
            <small>Al crear cada entrega, la próxima fecha avanza automáticamente.</small>
          </span>
        </label>
      </div>
      {selectedTemplate && (
        <p className="recurring-format-note">
          {typeLabels[selectedTemplate.outputType]} · {selectedTemplate.canvas.width} × {selectedTemplate.canvas.height}
        </p>
      )}
      <ErrorMessage error={error} />
      <div className="recurring-editor-actions">
        <Button onClick={onCancel} type="button" variant="secondary">
          Cancelar
        </Button>
        <Button disabled={saving} type="submit">
          {saving ? "Guardando…" : "Guardar serie"}
        </Button>
      </div>
    </form>
  );
}

function RecurringSocialDashboard() {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedSeries, loadedTemplates] = await Promise.all([
        api("/api/social-series"),
        api("/api/social-templates?channel=instagram"),
      ]);
      setSeries(loadedSeries);
      setTemplates(loadedTemplates);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const ready = useMemo(() => series.filter((item) => item.active), [series]);
  const ideas = useMemo(
    () =>
      series
        .filter((item) => !item.active)
        .sort((a, b) => Number(b.template?.outputType === "story") - Number(a.template?.outputType === "story")),
    [series],
  );

  const save = async (form) => {
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...(form.id ? { id: form.id } : {}),
      slug: form.slug || slugify(form.name),
      name: form.name.trim(),
      description: form.description.trim(),
      templateSlug: form.templateSlug,
      editorialBrief: form.editorialBrief.trim(),
      cadence: { every: Number(form.every), unit: form.unit },
      nextRunAt: form.active ? form.nextRunAt || null : form.nextRunAt || null,
      active: form.active,
    };
    try {
      if (form.id) await api(`/api/social-series/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/social-series", { method: "POST", body: JSON.stringify(payload) });
      setEditing(null);
      setNotice("La serie quedó guardada. Cada entrega se prepara como borrador para revisar.");
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) =>
    setEditing({
      ...item,
      every: item.cadence.every,
      unit: item.cadence.unit,
      nextRunAt: item.nextRunAt || "",
    });

  const schedule = (item) => {
    const template = templates.find((candidate) => candidate.slug === item.templateSlug);
    if (!template) return setError("El formato de esta serie ya no está disponible.");
    const query = new URLSearchParams({
      mode: "instagram",
      type: template.outputType,
      templateId: template.id,
      seriesId: item.id,
    });
    navigate(`/admin/nueva?${query.toString()}`);
  };

  const dueCount = ready.filter((item) => item.nextRunAt && item.nextRunAt <= today).length;

  return (
    <Layout>
      <main className="recurring-social-page">
        <header className="recurring-page-header">
          <div>
            <span className="eyebrow">REDES · CONTENIDO RECURRENTE</span>
            <h1>Historias y series</h1>
            <p>
              Elegí qué formatos querés repetir y cada cuánto. Cada entrega queda como borrador para revisar antes de
              publicar.
            </p>
          </div>
          <Button onClick={() => setEditing(emptyForm())} type="button">
            + Nueva serie
          </Button>
        </header>

        {notice && (
          <div className="recurring-notice" role="status">
            {notice}
          </div>
        )}
        <ErrorMessage error={error} />
        {editing && (
          <SeriesEditor
            error={error}
            onCancel={() => {
              setEditing(null);
              setError("");
            }}
            onSave={save}
            saving={saving}
            templates={templates}
            value={editing}
          />
        )}

        <section className="recurring-summary" aria-label="Resumen de publicaciones recurrentes">
          <div>
            <strong>{ready.length}</strong>
            <span>series activas</span>
          </div>
          <div>
            <strong>{dueCount}</strong>
            <span>listas para preparar</span>
          </div>
          <p>
            <span className="recurring-dot" /> Sin publicación automática
          </p>
        </section>

        {loading ? (
          <p className="muted">Cargando series…</p>
        ) : (
          <>
            <section className="recurring-section recurring-ideas-section">
              <div className="recurring-section-heading">
                <div>
                  <span className="eyebrow">ELEGÍ QUÉ QUERÉS REPETIR</span>
                  <h2>Series listas para activar</h2>
                </div>
              </div>
              {ideas.length ? (
                <div className="recurring-ideas-grid">
                  {ideas.map((item) => (
                    <article className="recurring-idea-card" key={item.id}>
                      <span>
                        {item.template?.name || "Formato editorial"} ·{" "}
                        {typeLabels[item.template?.outputType] || "Serie"}
                      </span>
                      <h3>{item.name}</h3>
                      <p>{item.description || item.editorialBrief}</p>
                      <button className="recurring-text-button" onClick={() => edit(item)} type="button">
                        Activar y elegir frecuencia →
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="recurring-empty">
                  No hay formatos nuevos para activar. Podés crear una serie con “Nueva serie”.
                </p>
              )}
            </section>

            <section className="recurring-section">
              <div className="recurring-section-heading">
                <div>
                  <span className="eyebrow">EN ROTACIÓN</span>
                  <h2>Series activas</h2>
                </div>
                {dueCount > 0 && <span className="recurring-due-count">{dueCount} para preparar</span>}
              </div>
              {ready.length ? (
                <div className="recurring-list">
                  {ready.map((item) => {
                    const due = item.nextRunAt && item.nextRunAt <= today;
                    return (
                      <article className={`recurring-card${due ? " is-due" : ""}`} key={item.id}>
                        <div className="recurring-card-main">
                          <div className="recurring-card-mark" aria-hidden="true">
                            <span />
                          </div>
                          <div className="recurring-card-copy">
                            <div className="recurring-card-meta">
                              <span>{item.template?.name || "Formato editorial"}</span>
                              <span>{typeLabels[item.template?.outputType] || "Serie"}</span>
                            </div>
                            <h3>{item.name}</h3>
                            <p>{item.description || item.editorialBrief}</p>
                            <div className="recurring-card-schedule">
                              <strong>{cadenceLabel(item.cadence)}</strong>
                              <span>{due ? "Lista para preparar" : `Próxima: ${dateLabel(item.nextRunAt)}`}</span>
                              {item.lastDraftId && (
                                <Link to={`/admin/contenido/${item.lastDraftId}?mode=instagram&view=review`}>
                                  Ver último borrador ↗
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="recurring-card-actions">
                          <Button onClick={() => schedule(item)} type="button">
                            Preparar borrador
                          </Button>
                          <button className="recurring-text-button" onClick={() => edit(item)} type="button">
                            Editar frecuencia
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="recurring-empty">
                  Todavía no hay series activas. Elegí un formato y definí cuándo querés retomarlo.
                </p>
              )}
            </section>

            <aside className="recurring-footer-note">
              <span>01</span>
              <p>
                <strong>Una serie no es un texto fijo.</strong> La pauta y el formato se conservan; el tema, la fecha y
                las imágenes se actualizan en cada borrador.
              </p>
            </aside>
          </>
        )}
      </main>
    </Layout>
  );
}

export function RecurringSocialPage() {
  return <AuthGate allowedRoles={["admin", "editor"]}>{() => <RecurringSocialDashboard />}</AuthGate>;
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import "../styles/pages/ai-news.css";

const DEFAULT_QUERY = "música Argentina";
const freshSource = () => ({
  name: "",
  url: "",
  topic: "noticias musicales",
  format: "rss",
  enabled: true,
  itemPattern: "",
  titlePattern: "",
  linkPattern: "",
  summaryPattern: "",
  maxItems: 8,
});

function AiNewsWorkspace() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [days, setDays] = useState(7);
  const [instructions, setInstructions] = useState("");
  const [digest, setDigest] = useState(null);
  const [sources, setSources] = useState([]);
  const [sourceForm, setSourceForm] = useState(freshSource());
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createdDrafts, setCreatedDrafts] = useState([]);

  const refreshSources = async () => {
    const result = await api("/api/ai-news/sources");
    setSources(result.sources);
    setConfigured(result.geminiConfigured);
  };

  useEffect(() => {
    refreshSources().catch((e) => setError(e.message));
  }, []);

  const run = async (action) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const discover = () =>
    void run(async () => {
      const result = await api("/api/ai-news/discover-weekly", {
        method: "POST",
        body: JSON.stringify({ query: query.trim() || DEFAULT_QUERY, days, limit: 10 }),
      });
      setDigest(result);
      setCreatedDrafts([]);
      setMessage(
        result.stories?.length
          ? `Gemini encontró ${result.stories.length} temas para revisar.`
          : "No hubo temas rankeados. Ampliá la búsqueda o revisá las fuentes más tarde.",
      );
    });

  const createDraftForStory = async (story) => {
    const storyItems = story.items ?? [];
    if (!story.itemIds?.length || !storyItems.length)
      throw new Error("Esta historia no tiene fuentes para preparar un borrador.");
    const { copy } = await api("/api/ai-news/package", {
      method: "POST",
      body: JSON.stringify({ query: query.trim() || DEFAULT_QUERY, itemIds: story.itemIds, instructions }),
    });
    const source = storyItems
      .map((item) => `${item.sourceName}: ${item.url}`)
      .join("; ")
      .slice(0, 500);
    const instagramCopy = [
      copy.instagramPost,
      (copy.hashtags ?? []).map((tag) => `#${tag.replace(/^#/, "")}`).join(" "),
    ]
      .filter(Boolean)
      .join("\n\n");
    return api("/api/content/with-ai", {
      method: "POST",
      body: JSON.stringify({
        title: copy.articleTitle,
        summary: copy.articleSummary,
        body: copy.articleBody,
        instagramCopy,
        channels: ["website", "instagram"],
        tags: [query.trim() || DEFAULT_QUERY],
        source,
        images: [],
        idempotencyKey: `ai-news:${crypto.randomUUID()}`,
      }),
    });
  };

  const makeOneDraft = (story) =>
    void run(async () => {
      const draft = await createDraftForStory(story);
      setCreatedDrafts((current) => [...current, { ...draft, storyKey: story.itemIds.join("-") }]);
      setMessage("Borrador creado. No se publicó ni programó.");
    });

  const makeFiveDrafts = () =>
    void run(async () => {
      const stories = (digest?.stories ?? []).slice(0, 5);
      const completed = [];
      const failures = [];
      for (const [index, story] of stories.entries()) {
        try {
          completed.push({ ...(await createDraftForStory(story)), storyKey: story.itemIds.join("-") });
        } catch (e) {
          failures.push(`${index + 1}. ${e.message}`);
        }
      }
      setCreatedDrafts((current) => [...current, ...completed]);
      setMessage(
        `${completed.length} borradores creados${failures.length ? `; ${failures.length} no se pudieron generar` : ""}. Ninguno fue publicado.`,
      );
      if (failures.length) setError(failures.join("\n"));
    });

  const saveSource = (event) => {
    event.preventDefault();
    void run(async () => {
      const payload =
        sourceForm.format === "rss"
          ? {
              name: sourceForm.name,
              url: sourceForm.url,
              topic: sourceForm.topic,
              format: "rss",
              enabled: true,
              maxItems: Number(sourceForm.maxItems),
            }
          : { ...sourceForm, maxItems: Number(sourceForm.maxItems) };
      await api("/api/ai-news/sources", { method: "POST", body: JSON.stringify(payload) });
      setSourceForm(freshSource());
      await refreshSources();
      setMessage("Fuente adicional guardada.");
    });
  };

  return (
    <Layout>
      <main className="ai-news-page">
        <header className="ai-news-header">
          <div>
            <p className="eyebrow">Asistente editorial</p>
            <h1>Novedades musicales</h1>
            <p className="ai-news-lede">
              Buscá noticias, elegí los temas y dejá que Gemini arme borradores para revisar.
            </p>
          </div>
          <span className={`ai-news-status ${configured ? "is-ready" : ""}`}>
            {configured ? "Gemini listo" : "Gemini sin configurar"}
          </span>
        </header>

        <ol className="ai-news-steps" aria-label="Flujo editorial">
          <li className="is-current">
            <span>1</span>
            <div>
              <strong>Buscar noticias</strong>
              <small>Argentina · hasta 14 días</small>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Gemini prepara</strong>
              <small>Hasta cinco borradores</small>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Vos revisás</strong>
              <small>Antes de publicar</small>
            </div>
          </li>
        </ol>

        <ErrorMessage message={error} />
        {message && (
          <p className="ai-news-message" role="status">
            {message}
          </p>
        )}

        <section className="ai-news-panel ai-news-search">
          <span className="ai-news-kicker">PASO 1 · DESCUBRIR</span>
          <h2>¿Qué pasó esta semana en la música?</h2>
          <p className="ai-news-description">
            Buscamos medios de Argentina, agrupamos coberturas repetidas y ordenamos hasta diez temas.
          </p>
          <form
            className="ai-news-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              discover();
            }}
          >
            <label className="ai-news-query-label">
              Búsqueda
              <input
                maxLength={180}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej.: música Argentina"
              />
            </label>
            <label>
              Período
              <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
                <option value={3}>3 días</option>
                <option value={7}>Última semana</option>
                <option value={14}>14 días</option>
              </select>
            </label>
            <button className="button dark" type="submit" disabled={busy || !configured}>
              {busy ? "Procesando…" : "Buscar noticias"}
            </button>
          </form>
          {digest?.stories?.length > 0 && (
            <label className="ai-news-instructions">
              Indicaciones para los borradores <span>(opcional)</span>
              <textarea
                maxLength={3000}
                rows={2}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Ej.: tono cercano, priorizar impacto local"
              />
            </label>
          )}
          <p className="ai-news-note">
            La búsqueda se inicia con el botón. No hay una tarea recurrente activa: cada corrida la iniciás vos.
          </p>
        </section>

        {digest && (
          <section className="ai-news-panel ai-news-results" aria-live="polite">
            <div className="ai-news-results-heading">
              <div>
                <span className="ai-news-kicker">RESULTADOS</span>
                <h2>{digest.stories.length} temas encontrados</h2>
              </div>
              <div className="ai-news-result-meta">
                {digest.candidatesScanned} recortes · {digest.duplicateItemsGrouped ?? 0} repetidos agrupados
              </div>
            </div>
            {digest.rankingMethod === "recency-fallback" && (
              <p className="ai-news-fallback">
                Gemini no pudo ordenar esta vez; se muestran los temas agrupados por fecha para revisión.
              </p>
            )}
            {digest.stories.length > 0 && (
              <div className="ai-news-batch-bar">
                <span>Podés generar una nota por tema para los primeros cinco.</span>
                <button className="button dark" disabled={busy} onClick={makeFiveDrafts}>
                  {busy ? "Creando borradores…" : "Crear hasta 5 borradores"}
                </button>
              </div>
            )}
            <div className="ai-news-story-list">
              {digest.stories.map((story, index) => (
                <article className="ai-news-story" key={story.itemIds.join("-")}>
                  <div className="ai-news-story-number">{index + 1}</div>
                  <div className="ai-news-story-main">
                    <div className="ai-news-story-meta">
                      <strong>Relevancia {story.relevanceScore}/100</strong>
                      <span>
                        {story.items.length} {story.items.length === 1 ? "fuente" : "fuentes"}
                      </span>
                    </div>
                    <h3>{story.items[0]?.title}</h3>
                    <p>{story.reason}</p>
                    <div className="ai-news-sources-list">
                      {story.items.map((item) => (
                        <a href={item.url} key={item.id} target="_blank" rel="noreferrer">
                          {item.sourceName} · {new Date(item.scrapedAt).toLocaleDateString("es-AR")} ↗
                        </a>
                      ))}
                    </div>
                    {createdDrafts.some((draft) => draft.storyKey === story.itemIds.join("-")) && (
                      <span className="ai-news-created-label">Borrador creado</span>
                    )}
                  </div>
                  <button className="button subtle" disabled={busy} onClick={() => makeOneDraft(story)}>
                    Crear borrador
                  </button>
                </article>
              ))}
            </div>
            {!digest.stories.length && (
              <div className="ai-news-empty">
                <strong>No se encontraron temas.</strong>
                <p>Probá ampliar el período o cambiar la búsqueda.</p>
              </div>
            )}
            {createdDrafts.length > 0 && (
              <div className="ai-news-created-box">
                <strong>Borradores listos para revisión</strong>
                <ul>
                  {createdDrafts.map((draft) => (
                    <li key={draft.id}>
                      <Link to={`/admin/contenido/${draft.id}`}>{draft.title}</Link>
                    </li>
                  ))}
                </ul>
                <p>Quedaron en borrador. No se publicaron ni programaron.</p>
              </div>
            )}
          </section>
        )}

        <details className="ai-news-advanced">
          <summary>Configuración avanzada · fuentes extra</summary>
          <p>
            Estas fuentes se actualizan manualmente y se consultan por separado. No se mezclan con el ranking semanal de
            Google News. Para la búsqueda general no hace falta agregar fuentes ni configurar regex.
          </p>
          <form onSubmit={saveSource} className="ai-news-source-form">
            <label>
              Nombre
              <input
                required
                value={sourceForm.name}
                onChange={(event) => setSourceForm({ ...sourceForm, name: event.target.value })}
              />
            </label>
            <label>
              URL HTTPS
              <input
                required
                type="url"
                value={sourceForm.url}
                onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })}
              />
            </label>
            <label>
              Temática
              <input
                required
                value={sourceForm.topic}
                onChange={(event) => setSourceForm({ ...sourceForm, topic: event.target.value })}
              />
            </label>
            <label>
              Formato
              <select
                value={sourceForm.format}
                onChange={(event) => setSourceForm({ ...sourceForm, format: event.target.value })}
              >
                <option value="rss">RSS o Atom</option>
                <option value="html">Página HTML</option>
              </select>
            </label>
            {sourceForm.format === "html" && (
              <label>
                Regex para cada noticia
                <textarea
                  required
                  value={sourceForm.itemPattern}
                  onChange={(event) => setSourceForm({ ...sourceForm, itemPattern: event.target.value })}
                />
              </label>
            )}
            <button className="button subtle" disabled={busy}>
              Agregar fuente
            </button>
          </form>
          <ul className="ai-news-source-list">
            {sources.map((source) => (
              <li key={source.id}>
                <span>
                  {source.name} ·{" "}
                  {source.format === "html" || (!source.format && source.itemPattern) ? "HTML" : "RSS/Atom"} ·{" "}
                  {source.enabled ? "activa" : "pausada"}
                </span>
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await api(`/api/ai-news/scrape`, {
                        method: "POST",
                        body: JSON.stringify({ sourceId: source.id }),
                      });
                      await refreshSources();
                      setMessage(
                        `${result.items.length} recortes guardados de ${source.name}. Se consultan por separado y no se agregan al ranking semanal.`,
                      );
                    })
                  }
                >
                  Actualizar
                </button>
                <button
                  aria-label={`Eliminar ${source.name}`}
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api(`/api/ai-news/sources/${source.id}`, { method: "DELETE" });
                      await refreshSources();
                    })
                  }
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </details>
      </main>
    </Layout>
  );
}

export function AiNewsPage() {
  return <AuthGate allowedRoles={["admin", "editor"]}>{() => <AiNewsWorkspace />}</AuthGate>;
}

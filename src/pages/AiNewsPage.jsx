import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import "../styles/pages/ai-news.css";
import { Link } from "react-router-dom";

const initialSource = {
  name: "",
  url: "",
  topic: "noticias musicales",
  enabled: true,
  itemPattern: "<article\\b[^>]*>[\\s\\S]*?<\\/article>",
  titlePattern: "<h[1-3][^>]*>([\\s\\S]*?)<\\/h[1-3]>",
  linkPattern: "href=[\\\"']([^\\\"']+)[\\\"']",
  summaryPattern: "<p[^>]*>([\\s\\S]*?)<\\/p>",
  maxItems: 8,
};

const normalizedUrl = (value) => {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
};

function AiNewsWorkspace() {
  const [sources, setSources] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialSource);
  const [topic, setTopic] = useState("noticias musicales");
  const [analysis, setAnalysis] = useState(null);
  const [copy, setCopy] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [sourceFilter, setSourceFilter] = useState("");
  const [draftId, setDraftId] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [instructions, setInstructions] = useState("");
  const [weeklyQuery, setWeeklyQuery] = useState("música Argentina (artistas OR festivales OR discos OR recitales)");
  const [weeklyDays, setWeeklyDays] = useState(7);
  const [weeklyInstructions, setWeeklyInstructions] = useState("");
  const [weeklyDigest, setWeeklyDigest] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const refresh = async () => {
    const [sourceData, itemData] = await Promise.all([api("/api/ai-news/sources"), api("/api/ai-news/items")]);
    setSources(sourceData.sources);
    setItems(itemData.items);
    setConfigured(sourceData.geminiConfigured);
  };
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
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
  const visibleItems = items.filter((item) => {
    const matchesTopic = !topic || item.topic.toLowerCase().includes(topic.toLowerCase());
    const matchesSource = !sourceFilter || item.sourceName.toLowerCase().includes(sourceFilter.toLowerCase());
    return matchesTopic && matchesSource;
  });
  const uniqueVisibleItems = [
    ...new Map(
      [...visibleItems]
        .sort((left, right) => new Date(right.scrapedAt).getTime() - new Date(left.scrapedAt).getTime())
        .map((item) => [normalizedUrl(item.url), item]),
    ).values(),
  ];
  const selectedIds = selectedItemIds.filter((id) => uniqueVisibleItems.some((item) => item.id === id));
  const createDraft = () =>
    void run(async () => {
      const selectedSources = analysis.sourceIds.map((id) => items.find((item) => item.id === id)).filter(Boolean);
      if (!selectedSources.length) throw new Error("La propuesta no tiene fuentes vinculadas.");
      const source = selectedSources
        .reduce((entries, item) => {
          const entry = `${item.sourceName}: ${item.url}`;
          const next = [...entries, entry];
          return next.join("; ").length <= 500 ? next : entries;
        }, [])
        .join("; ");
      const instagramCopy = [
        copy.instagramPost.trim(),
        copy.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" "),
      ]
        .filter(Boolean)
        .join("\n\n");
      const note = {
        title: copy.articleTitle,
        summary: copy.articleSummary,
        body: copy.articleBody,
        instagramCopy,
        channels: ["website", "instagram"],
        tags: [topic, ...new Set(selectedSources.map((item) => item.sourceName.slice(0, 80)))],
        source,
      };
      const duplicates = await api("/api/content/duplicates", {
        method: "POST",
        body: JSON.stringify({ ...note, type: "article", status: "draft", images: [] }),
      });
      const sameSourceDraft = duplicates.find(
        (match) =>
          match.item.type === "article" &&
          match.item.status === "draft" &&
          selectedSources.some((item) => match.item.source.includes(item.url)),
      );
      if (duplicates.length && !sameSourceDraft) {
        throw new Error("Ya existe una nota parecida con otra fuente. Revisá ese borrador antes de crear otra.");
      }
      const result = sameSourceDraft
        ? await api(`/api/content/${sameSourceDraft.item.id}`, {
            method: "PATCH",
            body: JSON.stringify(note),
          })
        : await api("/api/content/with-ai", {
            method: "POST",
            body: JSON.stringify({ ...note, images: [], idempotencyKey: draftKey }),
          });
      setDraftId(result.id);
      setMessage(
        `${sameSourceDraft ? "Borrador actualizado" : "Nota y copy guardados como borrador"}. No se publicó nada.`,
      );
    });
  const saveSource = (event) => {
    event.preventDefault();
    void run(async () => {
      await api("/api/ai-news/sources", {
        method: "POST",
        body: JSON.stringify({ ...form, maxItems: Number(form.maxItems) }),
      });
      setForm(initialSource);
      await refresh();
      setMessage("Fuente guardada.");
    });
  };
  const discoverWeekly = () =>
    void run(async () => {
      const digest = await api("/api/ai-news/discover-weekly", {
        method: "POST",
        body: JSON.stringify({ query: weeklyQuery, days: Number(weeklyDays), limit: 10 }),
      });
      setWeeklyDigest(digest);
      setAnalysis(null);
      setCopy(null);
      setDraftId("");
      await refresh();
    });
  const prepareWeeklyStory = (story) =>
    void run(async () => {
      const storyItems = story.items || [];
      if (!storyItems.length) throw new Error("No hay fuentes disponibles para esta historia.");
      const storyTopic = weeklyDigest.query.slice(0, 80);
      const result = await api("/api/ai-news/package", {
        method: "POST",
        body: JSON.stringify({ query: storyTopic, itemIds: story.itemIds, instructions: weeklyInstructions }),
      });
      setTopic(storyTopic);
      setAnalysis({ sourceIds: story.itemIds });
      setCopy(result.copy);
      setDraftId("");
      setDraftKey(`ai-news:${crypto.randomUUID()}`);
    });
  return (
    <Layout>
      <main className="ai-news-page">
        <header className="page-intro">
          <p className="eyebrow">Redacción · Automatización</p>
          <h1>
            Novedades
            <br />
            musicales.
          </h1>
          <p>Fuentes configurables, recortes verificables y borradores asistidos por Gemini.</p>
          <span className={`ai-news-status ${configured ? "is-ready" : ""}`}>
            {configured ? "Gemini conectado" : "Falta configurar GEMINI_API_KEY"}
          </span>
        </header>
        <ErrorMessage message={error} />
        {message && <p role="status">{message}</p>}
        <section className="ai-news-panel ai-weekly-search">
          <p className="eyebrow">Búsqueda actual · Argentina</p>
          <h2>Las 10 noticias musicales más relevantes</h2>
          <p>
            Busca noticias de los últimos días, agrupa notas sobre el mismo hecho y Gemini las ordena. Las fuentes y
            fechas quedan visibles para revisión.
          </p>
          <div className="ai-weekly-controls">
            <label>
              Qué buscar
              <input maxLength={180} onChange={(event) => setWeeklyQuery(event.target.value)} value={weeklyQuery} />
            </label>
            <label>
              Período
              <select onChange={(event) => setWeeklyDays(Number(event.target.value))} value={weeklyDays}>
                <option value={3}>Últimos 3 días</option>
                <option value={7}>Última semana</option>
                <option value={14}>Últimos 14 días</option>
              </select>
            </label>
            <button
              className="button dark"
              disabled={busy || !configured || !weeklyQuery.trim()}
              onClick={discoverWeekly}
              type="button"
            >
              {busy ? "Buscando…" : "Buscar y ordenar con Gemini"}
            </button>
          </div>
          <label className="ai-weekly-instructions">
            Indicaciones editoriales (opcional)
            <textarea
              maxLength={3000}
              onChange={(event) => setWeeklyInstructions(event.target.value)}
              placeholder="Ej.: tono cercano, priorizar el impacto local, evitar adjetivos promocionales…"
              rows={3}
              value={weeklyInstructions}
            />
          </label>
          <small>
            Las noticias se obtienen de Google News para Argentina. Gemini rankea los resultados; no crea enlaces ni
            publica automáticamente.
          </small>
          {weeklyDigest && (
            <div className="ai-weekly-results">
              <div className="ai-weekly-summary">
                <h3>{weeklyDigest.stories.length} historias seleccionadas</h3>
                <span>
                  {weeklyDigest.candidatesScanned} resultados recientes revisados ·{" "}
                  {new Date(weeklyDigest.windowStart).toLocaleDateString("es-AR")}–
                  {new Date(weeklyDigest.windowEnd).toLocaleDateString("es-AR")}
                </span>
              </div>
              {weeklyDigest.stories.map((story, index) => (
                <article className="ai-weekly-story" key={story.itemIds.join("-")}>
                  <div className="ai-weekly-rank">{index + 1}</div>
                  <div className="ai-weekly-story-content">
                    <div className="ai-weekly-story-heading">
                      <strong>{story.relevanceScore}/100</strong>
                      <span>{story.items.map((item) => item.sourceName).join(" · ")}</span>
                    </div>
                    <h3>{story.items[0]?.title}</h3>
                    <p>{story.reason}</p>
                    <div className="ai-weekly-source-links">
                      {story.items.map((item) => (
                        <a href={item.url} key={item.id} rel="noreferrer" target="_blank">
                          {item.sourceName} · {new Date(item.scrapedAt).toLocaleDateString("es-AR")} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                  <button
                    className="button subtle"
                    disabled={busy}
                    onClick={() => prepareWeeklyStory(story)}
                    type="button"
                  >
                    Generar nota y copys
                  </button>
                </article>
              ))}
              {!weeklyDigest.stories.length && (
                <p>No hubo noticias suficientes para armar el ranking. Probá ampliar la búsqueda.</p>
              )}
            </div>
          )}
        </section>
        <section className="ai-news-grid">
          <article className="ai-news-panel">
            <p className="eyebrow">01 · Fuentes</p>
            <h2>Sumar página para scrapear</h2>
            <form onSubmit={saveSource} className="ai-news-form">
              <label>
                Nombre
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                URL pública HTTPS
                <input
                  type="url"
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </label>
              <label>
                Temática
                <input required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </label>
              <label>
                Regex de cada elemento
                <textarea
                  required
                  value={form.itemPattern}
                  onChange={(e) => setForm({ ...form, itemPattern: e.target.value })}
                />
              </label>
              <details>
                <summary>Patrones de extracción</summary>
                <label>
                  Título
                  <textarea
                    value={form.titlePattern}
                    onChange={(e) => setForm({ ...form, titlePattern: e.target.value })}
                  />
                </label>
                <label>
                  Enlace
                  <textarea
                    value={form.linkPattern}
                    onChange={(e) => setForm({ ...form, linkPattern: e.target.value })}
                  />
                </label>
                <label>
                  Resumen
                  <textarea
                    value={form.summaryPattern}
                    onChange={(e) => setForm({ ...form, summaryPattern: e.target.value })}
                  />
                </label>
              </details>
              <button className="button dark" disabled={busy}>
                Guardar fuente
              </button>
            </form>
            <ul className="ai-news-sources">
              {sources.map((s) => (
                <li key={s.id}>
                  <div>
                    <strong>{s.name}</strong>
                    <span>
                      {s.topic} · {s.enabled ? "activa" : "pausada"}
                    </span>
                  </div>
                  <button
                    className="button subtle"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await api("/api/ai-news/scrape", { method: "POST", body: JSON.stringify({ sourceId: s.id }) });
                        await refresh();
                      })
                    }
                  >
                    Scrapear
                  </button>
                  <button
                    aria-label={`Eliminar ${s.name}`}
                    className="ai-news-remove"
                    onClick={() =>
                      void run(async () => {
                        await api(`/api/ai-news/sources/${s.id}`, { method: "DELETE" });
                        await refresh();
                      })
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="button subtle"
              disabled={busy || !sources.length}
              onClick={() =>
                void run(async () => {
                  await api("/api/ai-news/scrape", { method: "POST", body: JSON.stringify({}) });
                  await refresh();
                })
              }
            >
              Scrapear todas las fuentes
            </button>
          </article>
          <article className="ai-news-panel">
            <p className="eyebrow">02 · Material crudo</p>
            <div className="ai-news-title-row">
              <h2>Novedades capturadas</h2>
              <input aria-label="Filtrar temática" value={topic} onChange={(e) => setTopic(e.target.value)} />
              <input
                aria-label="Filtrar fuente"
                onChange={(e) => setSourceFilter(e.target.value)}
                placeholder="Fuente"
                value={sourceFilter}
              />
            </div>
            <div className="ai-news-items">
              {uniqueVisibleItems.map((item) => (
                <article className={selectedIds.includes(item.id) ? "is-selected" : ""} key={item.id}>
                  <label className="ai-news-select">
                    <input
                      checked={selectedIds.includes(item.id)}
                      onChange={(event) =>
                        setSelectedItemIds((previous) =>
                          event.target.checked
                            ? [...new Set([...previous, item.id])]
                            : previous.filter((id) => id !== item.id),
                        )
                      }
                      type="checkbox"
                    />
                    Incluir en el análisis
                  </label>
                  <span>
                    {item.topic} · {item.sourceName} · {new Date(item.scrapedAt).toLocaleDateString("es-AR")}
                  </span>
                  <h3>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.title}
                    </a>
                  </h3>
                  <p>{item.summary || "Sin resumen capturado"}</p>
                </article>
              ))}
              {uniqueVisibleItems.length > 0 && (
                <small>
                  {uniqueVisibleItems.length} novedades únicas · {visibleItems.length - uniqueVisibleItems.length}{" "}
                  repetidas ocultas
                </small>
              )}
              {!items.length && (
                <p className="muted">Todavía no hay resultados. Configurá una fuente y ejecutá el scrapeo.</p>
              )}
            </div>
            <button
              className="button dark"
              disabled={busy || !configured || !uniqueVisibleItems.length}
              onClick={() =>
                void run(async () => {
                  const result = await api("/api/ai-news/analyze", {
                    method: "POST",
                    body: JSON.stringify({ topic, ...(selectedIds.length ? { itemIds: selectedIds } : {}) }),
                  });
                  setAnalysis(result.analysis);
                  setCopy(null);
                  setDraftId("");
                })
              }
            >
              Ordenar esta temática con Gemini
            </button>
          </article>
        </section>
        {analysis && (
          <section className="ai-news-panel ai-news-result">
            <p className="eyebrow">03 · Información limpia</p>
            <h2>{analysis.title}</h2>
            <p>{analysis.summary}</p>
            <h3>Hechos informados</h3>
            <ul>
              {analysis.facts.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
            {analysis.missingFacts.length > 0 && (
              <>
                <h3>Falta verificar</h3>
                <ul>
                  {analysis.missingFacts.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </>
            )}
            <p>
              <strong>Enfoque sugerido:</strong> {analysis.suggestedAngle}
            </p>
            <h3>Indicaciones para copy</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Tono, longitud, CTA u otras indicaciones"
            />
            <button
              className="button dark"
              disabled={busy || !configured}
              onClick={() =>
                void run(async () => {
                  const result = await api("/api/ai-news/copy", {
                    method: "POST",
                    body: JSON.stringify({ analysis, format: "both", instructions }),
                  });
                  setCopy(result.copy);
                  setDraftId("");
                  setDraftKey(`ai-news:${crypto.randomUUID()}`);
                })
              }
            >
              Crear copy e historias con Gemini
            </button>
          </section>
        )}
        {copy && (
          <section className="ai-news-panel ai-news-result">
            <p className="eyebrow">04 · Nota y redes · borradores</p>
            <h2>{copy.articleTitle}</h2>
            <p className="ai-news-article-summary">{copy.articleSummary}</p>
            <h3>Nota web</h3>
            <pre>{copy.articleBody}</pre>
            <h3>Copy de Instagram</h3>
            <pre>{copy.instagramPost}</pre>
            {copy.imageRecommendation && (
              <section className="ai-news-image-recommendation" aria-labelledby="image-recommendation-title">
                <p className="eyebrow">Recomendación visual de Gemini</p>
                <h3 id="image-recommendation-title">
                  {copy.imageRecommendation.kind === "source_image"
                    ? "Imagen de la fuente"
                    : copy.imageRecommendation.kind === "editorial_illustration"
                      ? "Ilustración editorial"
                      : "Publicar sin imagen"}
                </h3>
                <p>{copy.imageRecommendation.rationale}</p>
                {copy.imageRecommendation.sourceUrl && (
                  <p>
                    <a href={copy.imageRecommendation.sourceUrl} target="_blank" rel="noreferrer">
                      Abrir imagen de origen ↗
                    </a>
                  </p>
                )}
                {copy.imageRecommendation.searchQuery && (
                  <p>
                    <strong>Búsqueda / brief:</strong> {copy.imageRecommendation.searchQuery}
                  </p>
                )}
                {copy.imageRecommendation.altText && (
                  <p>
                    <strong>Texto alternativo:</strong> {copy.imageRecommendation.altText}
                  </p>
                )}
                {copy.imageRecommendation.kind === "editorial_illustration" && (
                  <small>Esto es un brief visual, no una foto documental ni un archivo adjunto.</small>
                )}
              </section>
            )}
            <h3>Historias</h3>
            {copy.stories.map((story, i) => (
              <p key={i}>
                <strong>{i + 1}.</strong> {story}
              </p>
            ))}
            <p>{copy.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}</p>
            <small>
              La nota y el copy son borradores. Revisá los hechos, la atribución y los horarios; guardar no publica ni
              programa nada.
            </small>
            {!draftId ? (
              <button
                className="button dark"
                disabled={busy || !copy.articleBody || !copy.instagramPost}
                onClick={createDraft}
              >
                Guardar nota y copy como borrador
              </button>
            ) : (
              <p role="status">
                Nota guardada como borrador. <Link to={`/admin/contenido/${draftId}`}>Abrir borrador</Link>
              </p>
            )}
            <p>
              <Link
                className="button subtle"
                to="/admin/redes"
                state={{
                  instagramCopy: `${copy.instagramPost}\n\n${copy.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}`,
                }}
              >
                Abrir compositor social
              </Link>
            </p>
          </section>
        )}
      </main>
    </Layout>
  );
}
export function AiNewsPage() {
  return <AuthGate allowedRoles={["admin", "editor"]}>{() => <AiNewsWorkspace />}</AuthGate>;
}

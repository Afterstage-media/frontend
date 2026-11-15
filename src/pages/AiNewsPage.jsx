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

function AiNewsWorkspace() {
  const [sources, setSources] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialSource);
  const [topic, setTopic] = useState("noticias musicales");
  const [analysis, setAnalysis] = useState(null);
  const [copy, setCopy] = useState(null);
  const [instructions, setInstructions] = useState("");
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
            </div>
            <div className="ai-news-items">
              {items
                .filter((i) => !topic || i.topic.toLowerCase().includes(topic.toLowerCase()))
                .map((item) => (
                  <article key={item.id}>
                    <span>
                      {item.topic} · {item.sourceName}
                    </span>
                    <h3>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.title}
                      </a>
                    </h3>
                    <p>{item.summary || "Sin resumen capturado"}</p>
                  </article>
                ))}
              {!items.length && (
                <p className="muted">Todavía no hay resultados. Configurá una fuente y ejecutá el scrapeo.</p>
              )}
            </div>
            <button
              className="button dark"
              disabled={busy || !configured || !items.length}
              onClick={() =>
                void run(async () => {
                  const result = await api("/api/ai-news/analyze", { method: "POST", body: JSON.stringify({ topic }) });
                  setAnalysis(result.analysis);
                  setCopy(null);
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
                })
              }
            >
              Crear copy e historias con Gemini
            </button>
          </section>
        )}
        {copy && (
          <section className="ai-news-panel ai-news-result">
            <p className="eyebrow">04 · Propuesta para revisión</p>
            <h2>Copy de Instagram</h2>
            <pre>{copy.instagramPost}</pre>
            <h3>Historias</h3>
            {copy.stories.map((story, i) => (
              <p key={i}>
                <strong>{i + 1}.</strong> {story}
              </p>
            ))}
            <p>{copy.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}</p>
            <small>
              Esto no se publica automáticamente. Revisá hechos y fuentes antes de pasar el texto al compositor social.
            </small>
            <p>
              <Link className="button dark" to="/admin/nueva">
                Continuar a crear una nota
              </Link>
            </p>
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

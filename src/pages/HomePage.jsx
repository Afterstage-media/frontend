import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ContentCard } from "../components/ContentCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/UiState.jsx";
export function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    api("/api/public/content?limit=3")
      .then(setItems)
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <Layout>
      <div className="scene-ticker" aria-label="Manifiesto de Medio Under">
        <div className="scene-ticker-track">
          <span>MEDIO UNDER</span>
          <i>✳</i>
          <span>RUIDO LOCAL</span>
          <i>✳</i>
          <span>HISTORIAS REALES</span>
          <i>✳</i>
          <span>BAJO LA SUPERFICIE</span>
          <i>✳</i>
          <span>MEDIO UNDER</span>
          <i>✳</i>
          <span>RUIDO LOCAL</span>
          <i>✳</i>
          <span>HISTORIAS REALES</span>
          <i>✳</i>
          <span>BAJO LA SUPERFICIE</span>
        </div>
      </div>
      <section className="hero hero-editorial">
        <div className="hero-copy">
          <p className="eyebrow">El diario de la escena / 2026</p>
          <h1>
            La música no pide permiso<span>.</span>
          </h1>
          <p className="hero-lede">
            Historias, personas y lugares que hacen ruido antes de que alguien les ponga una etiqueta.
          </p>
          <div className="actions hero-actions">
            <Link className="button" to="/notas">
              Entrar al archivo ↗
            </Link>
            <Link className="text-link" to="/agenda">
              Encontrar un plan hoy <span>↗</span>
            </Link>
          </div>
        </div>
        <div className="hero-poster" aria-label="Identidad visual de Medio Under">
          <span className="poster-index">N° 001</span>
          <span className="poster-word poster-word-top">VIVO</span>
          <span className="poster-word poster-word-bottom">AHORA</span>
          <span className="poster-disc" aria-hidden="true" />
          <span className="poster-caption">
            SIN FILTRO
            <br />
            SIN PAUSA
          </span>
          <span className="poster-arrow" aria-hidden="true">
            ↘
          </span>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Desde adentro</p>
            <h2>Lo último que nos movió</h2>
          </div>
          <Link className="section-link" to="/notas">
            Ver archivo completo <span>↗</span>
          </Link>
        </div>
        {loading ? (
          <LoadingState label="Buscando historias…" />
        ) : error ? (
          <ErrorState message="No pudimos cargar el archivo editorial." onRetry={load} />
        ) : items.length ? (
          <div className="cards">
            {items.map((item) => (
              <ContentCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="El archivo está tomando forma."
            message="Mientras tanto, explorá la agenda o conocé cómo podés ser parte de Medio Under."
            action={
              <Link className="button ghost" to="/colaborador">
                Sumate a la escena ↗
              </Link>
            }
          />
        )}
      </section>
    </Layout>
  );
}

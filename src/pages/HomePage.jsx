import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ContentCard } from "../components/ContentCard.jsx";
import { EditorialPoster, SectionHeading, SignalTicker } from "../components/EditorialPrimitives.jsx";
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
      <SignalTicker />
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
        <EditorialPoster />
      </section>
      <section className="section">
        <SectionHeading
          eyebrow="Desde adentro"
          title="Lo último que nos movió"
          to="/notas"
          linkLabel="Ver archivo completo"
        />
        {loading ? (
          <LoadingState label="Buscando historias…" />
        ) : error ? (
          <ErrorState message="No pudimos cargar el archivo editorial." onRetry={load} />
        ) : items.length ? (
          <div className="cards">
            {items.map((item, index) => (
              <ContentCard item={item} index={index} key={item.id} />
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

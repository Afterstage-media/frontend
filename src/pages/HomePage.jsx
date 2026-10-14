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
      <section className="hero">
        <p className="eyebrow">El diario de la escena</p>
        <h1>Historias para leer con el volumen alto.</h1>
        <p>Crónicas, entrevistas, fotos y agenda de la música que está pasando ahora.</p>
        <div className="actions hero-actions">
          <Link className="button" to="/notas">
            Ver historias ↗
          </Link>
          <Link className="button ghost" to="/agenda">
            Encontrar un plan
          </Link>
        </div>
        <div className="hero-note" aria-label="Identidad del medio">
          <span>01</span>
          <strong>Una escena viva, contada desde adentro.</strong>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Últimas historias</h2>
          <Link to="/notas">Ver todas →</Link>
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
            title="Estamos armando el próximo archivo."
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

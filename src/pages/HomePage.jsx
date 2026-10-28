import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ContentCard } from "../components/ContentCard.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { HomeHero, HomeIntent, HomeMission, HomeQuickLinks } from "../components/HomeEditorial.jsx";
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
      <HomeHero />
      <HomeQuickLinks />
      <HomeIntent />
      <HomeMission />
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
            message="Encontrar un plan en la agenda también es parte de la escena. Conocé cómo podés ser parte de afterstage."
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

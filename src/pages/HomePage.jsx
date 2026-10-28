import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ContentCard } from "../components/ContentCard.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { HomeHero, HomeIntent, HomeMission, HomeQuickLinks } from "../components/HomeEditorial.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/UiState.jsx";
import { ButtonLink } from "../components/ui/Button.jsx";
import { CardContainer } from "../components/ui/CardContainer.jsx";
import { Section } from "../components/ui/Section.jsx";
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
      <Section>
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
          <CardContainer>
            {items.map((item, index) => (
              <ContentCard item={item} index={index} key={item.id} />
            ))}
          </CardContainer>
        ) : (
          <EmptyState
            title="El archivo está tomando forma."
            message="Encontrar un plan en la agenda también es parte de la escena. Conocé cómo podés ser parte de afterstage."
            action={
              <ButtonLink className="ghost" to="/colaborador">
                Sumate a la escena ↗
              </ButtonLink>
            }
          />
        )}
      </Section>
    </Layout>
  );
}

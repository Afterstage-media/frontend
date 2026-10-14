import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { ContentCard } from "../components/ContentCard.jsx";
import { EditorialIntro, SectionHeading, SignalTicker } from "../components/EditorialPrimitives.jsx";
import { Layout } from "../components/Layout.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/UiState.jsx";
export function NotesPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    setError("");
    api("/api/public/content?limit=50")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <Layout>
      <SignalTicker items={["Archivo editorial", "Crónicas", "Entrevistas", "Fotos de la escena"]} />
      <EditorialIntro
        eyebrow="Archivo editorial / 02"
        title="Notas para leer con el volumen alto."
        description="Crónicas, entrevistas, columnas y fotos de la escena."
      />
      {loading ? (
        <section className="content-section">
          <LoadingState label="Abriendo el archivo…" />
        </section>
      ) : error ? (
        <section className="content-section">
          <ErrorState message="El archivo no está disponible en este momento." onRetry={load} />
        </section>
      ) : items.length ? (
        <div className="cards editorial-grid">
          {items.map((item, index) => (
            <ContentCard item={item} index={index} key={item.id} />
          ))}
        </div>
      ) : (
        <section className="content-section">
          <EmptyState
            title="Todavía no hay notas publicadas."
            message="La redacción está preparando las primeras historias. Volvé pronto o recorré la agenda."
          />
        </section>
      )}
    </Layout>
  );
}

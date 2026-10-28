import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ContentCard } from "../components/ContentCard.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { EditorialIntro } from "../components/ui/PageTitle.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { Layout } from "../components/Layout.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/UiState.jsx";
import { normalizeSearchText } from "../utils/search.js";
export function NotesPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
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
  const filteredItems = useMemo(() => {
    if (!query) return items;
    const normalizedQuery = normalizeSearchText(query);
    return items.filter((item) =>
      [item.title, item.summary, item.author, item.type]
        .filter(Boolean)
        .some((value) => normalizeSearchText(value).includes(normalizedQuery)),
    );
  }, [items, query]);
  return (
    <Layout>
      <SignalTicker items={["Archivo editorial", "Crónicas", "Entrevistas", "Fotos de la escena"]} />
      <EditorialIntro
        eyebrow={query ? `Resultados para “${query}”` : "Archivo editorial / 02"}
        title={query ? "Encontrá una historia." : "Notas para leer con el volumen alto."}
        description={
          query ? "Historias que coinciden con tu búsqueda." : "Crónicas, entrevistas, columnas y fotos de la escena."
        }
      />
      {loading ? (
        <section className="content-section">
          <LoadingState label="Abriendo el archivo…" />
        </section>
      ) : error ? (
        <section className="content-section">
          <ErrorState message="El archivo no está disponible en este momento." onRetry={load} />
        </section>
      ) : filteredItems.length ? (
        <div className="cards editorial-grid">
          {filteredItems.map((item, index) => (
            <ContentCard item={item} index={index} key={item.id} />
          ))}
        </div>
      ) : (
        <section className="content-section">
          <EmptyState
            title={query ? "No encontramos esa nota." : "Todavía no hay notas publicadas."}
            message={
              query
                ? "Probá con otra palabra o recorré todo el archivo editorial."
                : "La redacción está preparando las primeras historias. Volvé pronto o recorré la agenda."
            }
          />
          {!query && (
            <div className="empty-state-actions">
              <Link className="button dark" to="/agenda">
                Explorar la agenda ↗
              </Link>
              <Link className="button ghost" to="/como-funciona">
                Conocer Afterstage
              </Link>
            </div>
          )}
        </section>
      )}
    </Layout>
  );
}

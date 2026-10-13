import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { ContentCard } from "../components/ContentCard.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
export function NotesPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/public/content?limit=50")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Archivo editorial</p>
        <h1>Notas para leer con el volumen alto.</h1>
        <p>Crónicas, entrevistas, columnas y fotos de la escena.</p>
      </section>
      <ErrorMessage error={error} />
      <div className="cards">
        {items.length ? (
          items.map((item) => <ContentCard item={item} key={item.id} />)
        ) : (
          <p className="muted">Todavía no hay notas publicadas.</p>
        )}
      </div>
    </Layout>
  );
}

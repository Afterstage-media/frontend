import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ContentCard } from "../components/ContentCard.jsx";
export function HomePage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api("/api/public/content?limit=3")
      .then(setItems)
      .catch(() => {});
  }, []);
  return (
    <Layout>
      <section className="hero">
        <p className="eyebrow">El diario de la escena</p>
        <h1>Historias para leer con el volumen alto.</h1>
        <p>Crónicas, entrevistas, fotos y agenda de la música que está pasando ahora.</p>
        <Link className="button" to="/notas">
          Leer las notas ↗
        </Link>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Últimas historias</h2>
          <Link to="/notas">Ver todas →</Link>
        </div>
        <div className="cards">
          {items.length ? (
            items.map((item) => <ContentCard item={item} key={item.id} />)
          ) : (
            <p className="muted">Las próximas historias aparecerán acá.</p>
          )}
        </div>
      </section>
    </Layout>
  );
}

import { Link } from "react-router-dom";
export function ContentCard({ item }) {
  return (
    <article className="card">
      {item.assets?.[0]?.url && (
        <img
          className="card-image"
          src={item.assets[0].url}
          alt={item.assets[0].altText || item.title}
          loading="lazy"
        />
      )}
      <small>
        {item.type || "Nota"} · {item.author || "Medio Under"}
      </small>
      <h2>{item.title}</h2>
      <p>{item.summary}</p>
      <Link to={`/notas/${item.slug}`}>Leer la nota →</Link>
    </article>
  );
}

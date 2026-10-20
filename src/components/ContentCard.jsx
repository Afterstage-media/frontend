import { Link } from "react-router-dom";
export function ContentCard({ item, index = 0 }) {
  return (
    <article className={`card editorial-card editorial-card-${(index % 3) + 1}`}>
      {item.assets?.[0]?.url && (
        <img
          className="card-image"
          src={item.assets[0].url}
          alt={item.assets[0].altText || item.title}
          loading="lazy"
        />
      )}
      <div className="card-meta">
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <small>
          {item.type || "Nota"} · {item.author || "afterstage"}
        </small>
      </div>
      <h2>{item.title}</h2>
      <p>{item.summary}</p>
      <Link className="card-link" to={`/notas/${item.slug}`}>
        Leer la nota <span>↗</span>
      </Link>
    </article>
  );
}

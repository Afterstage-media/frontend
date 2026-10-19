import { Link } from "react-router-dom";

export function SignalTicker({
  items = ["Coberturas reales", "Agenda de acá", "Historias desde adentro", "Bajo la superficie"],
}) {
  const repeatedItems = [...items, ...items];
  return (
    <div className="scene-ticker" aria-label="Manifiesto de Medio Under">
      <div className="scene-ticker-track">
        {repeatedItems.map((item, index) => (
          <span className="scene-ticker-item" key={`${item}-${index}`}>
            {item}
            <i aria-hidden="true">✳</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export function EditorialIntro({ eyebrow, title, description, action, className = "" }) {
  return (
    <section className={`page-intro ${className}`.trim()}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {action && <div className="actions intro-actions">{action}</div>}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, to, linkLabel = "Ver todo" }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {to && (
        <Link className="section-link" to={to}>
          {linkLabel} <span>↗</span>
        </Link>
      )}
    </div>
  );
}

export function EditorialPoster({ index = "N° 001", top = "COBERTURA", bottom = "REAL" }) {
  return (
    <div className="hero-poster" aria-label="Identidad visual de Medio Under">
      <span className="poster-index">{index}</span>
      <span className="poster-word poster-word-top">{top}</span>
      <span className="poster-word poster-word-bottom">{bottom}</span>
      <span className="poster-disc" aria-hidden="true" />
      <span className="poster-caption">
        DESDE EL SHOW
        <br />
        SIN PAUSA
      </span>
      <span className="poster-arrow" aria-hidden="true">
        ↘
      </span>
    </div>
  );
}

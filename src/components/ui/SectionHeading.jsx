import { Link } from "react-router-dom";

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

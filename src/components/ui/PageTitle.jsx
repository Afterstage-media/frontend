export function PageTitle({ eyebrow, title, description, action, className = "" }) {
  return (
    <section className={`page-intro ${className}`.trim()}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {action && <div className="actions intro-actions">{action}</div>}
    </section>
  );
}

export const EditorialIntro = PageTitle;

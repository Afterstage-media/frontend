export function FormSection({ title, description, className = "", children }) {
  return (
    <fieldset className={`form-fieldset ${className}`.trim()}>
      {title && <legend>{title}</legend>}
      {description && <p className="muted">{description}</p>}
      {children}
    </fieldset>
  );
}

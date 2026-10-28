export function FormField({ label, htmlFor, hint, optional = false, className = "", children }) {
  return (
    <label className={`form-field ${className}`.trim()} htmlFor={htmlFor}>
      <span className="form-field-label">
        {label}
        {optional && <small>Opcional</small>}
      </span>
      {children}
      {hint && <span className="form-field-hint">{hint}</span>}
    </label>
  );
}

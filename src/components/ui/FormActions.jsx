export function FormActions({ children, className = "" }) {
  return <div className={`form-step-actions ${className}`.trim()}>{children}</div>;
}

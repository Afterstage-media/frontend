export function Notice({ children, tone = "success", title, className = "" }) {
  return (
    <div
      aria-live="polite"
      className={`notice notice-${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
    >
      {title && <strong>{title}</strong>}
      <span>{children}</span>
    </div>
  );
}

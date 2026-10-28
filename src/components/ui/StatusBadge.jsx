export function StatusBadge({ children, tone = "neutral", className = "" }) {
  return <span className={`status-badge status-${tone} ${className}`.trim()}>{children}</span>;
}

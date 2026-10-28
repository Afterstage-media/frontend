export function FilterBar({ children, label, role = "group", className = "", ...props }) {
  return (
    <div aria-label={label} className={`filter-bar ${className}`.trim()} role={role} {...props}>
      {children}
    </div>
  );
}

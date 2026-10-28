export function SectionDivider({ className = "" }) {
  return <hr aria-hidden="true" className={`section-divider ${className}`.trim()} />;
}

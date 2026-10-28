export function Section({ as: Element = "section", children, className = "", ...props }) {
  return (
    <Element className={["section", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Element>
  );
}

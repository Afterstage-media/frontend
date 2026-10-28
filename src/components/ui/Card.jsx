export function Card({ as: Element = "article", children, className = "", ...props }) {
  return (
    <Element className={["card", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Element>
  );
}

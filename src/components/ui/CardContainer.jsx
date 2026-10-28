export function CardContainer({ as: Element = "div", children, className = "", ...props }) {
  return (
    <Element className={["cards", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Element>
  );
}

export function Container({ as: Element = "div", children, className = "", size = "content", ...props }) {
  return (
    <Element
      className={["content-container", `content-container-${size}`, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Element>
  );
}

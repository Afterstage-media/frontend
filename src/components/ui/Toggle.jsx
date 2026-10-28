export function Toggle({ children, className = "", expanded, pressed, onClick, ...props }) {
  const ariaProps = {};
  if (expanded !== undefined) ariaProps["aria-expanded"] = expanded;
  if (pressed !== undefined) ariaProps["aria-pressed"] = pressed;

  return (
    <button className={className} onClick={onClick} type="button" {...ariaProps} {...props}>
      {children}
    </button>
  );
}

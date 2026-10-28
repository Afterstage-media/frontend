import { Button } from "./Button.jsx";

export function IconButton({ label, children = "×", className = "", ...props }) {
  return (
    <Button aria-label={label} className={`icon-button ${className}`.trim()} {...props}>
      {children}
    </Button>
  );
}

import { Link } from "react-router-dom";

function buttonClassName(className = "", variant = "") {
  return ["button", variant, className].filter(Boolean).join(" ");
}

export function Button({ children, className = "", variant = "", type = "button", ...props }) {
  return (
    <button className={buttonClassName(className, variant)} type={type} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ children, className = "", variant = "", href, to, ...props }) {
  const classes = buttonClassName(className, variant);
  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a className={classes} href={href} {...props}>
      {children}
    </a>
  );
}

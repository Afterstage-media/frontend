import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const themeStorageKey = "medio-under-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  let saved;
  try {
    saved = window.localStorage.getItem(themeStorageKey);
  } catch {
    saved = null;
  }
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function Layout({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Private browsing may disable localStorage; the theme still works per session.
    }
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <>
      <header className="header">
        <Link className="brand" to="/">
          <span className="mark" /> MEDIO UNDER
        </Link>
        <nav>
          <NavLink to="/notas">Notas</NavLink>
          <NavLink to="/agenda">Agenda</NavLink>
          <NavLink to="/directorio">Directorio</NavLink>
          <NavLink to="/comunidad">Comunidad</NavLink>
          <NavLink to="/publicar">Publicar</NavLink>
          <NavLink to="/reemplazos">Reemplazos</NavLink>
          <button
            aria-label={`Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}`}
            className="theme-toggle"
            onClick={() => setTheme(nextTheme)}
            title={`Modo ${nextTheme === "dark" ? "oscuro" : "claro"}`}
            type="button"
          >
            {theme === "dark" ? "☀ Claro" : "☾ Oscuro"}
          </button>
          <NavLink className="button dark" to="/admin">
            Redacción
          </NavLink>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <strong>MEDIO UNDER</strong>
        <span>Periodismo musical para la escena que hace.</span>
        <span>
          <Link to="/politica-editorial">Política editorial</Link> · <Link to="/codigo-de-creditos">Créditos</Link>
        </span>
      </footer>
    </>
  );
}
export const Loading = () => <p className="muted">Cargando…</p>;
export const ErrorMessage = ({ error }) => (error ? <p className="error">{error}</p> : null);

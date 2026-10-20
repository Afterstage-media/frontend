import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { api } from "../services/api.js";

const themeStorageKey = "afterstage-theme-v2";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  let saved;
  try {
    saved = window.localStorage.getItem(themeStorageKey);
  } catch {
    saved = null;
  }
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

export function Layout({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [roles, setRoles] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const reflectorRefs = useRef([]);
  const reflectorStageRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const refreshRoles = () => {
      if (!localStorage.getItem("afterstage-token")) {
        setRoles([]);
        return;
      }
      api("/api/auth/me")
        .then(({ user }) => setRoles(user.roles || []))
        .catch(() => setRoles([]));
    };
    refreshRoles();
    window.addEventListener("afterstage-auth-changed", refreshRoles);
    return () => window.removeEventListener("afterstage-auth-changed", refreshRoles);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Private browsing may disable localStorage; the theme still works per session.
    }
  }, [theme]);

  useEffect(() => {
    const stage = reflectorStageRef.current;
    if (!stage) return undefined;

    let frame = 0;
    let firingTimeout;
    let palette = 0;
    let pointer = { x: window.innerWidth / 2, y: 120 };

    const render = () => {
      frame = 0;
      const { x, y } = pointer;
      stage.style.setProperty("--pointer-x", `${x}px`);
      stage.style.setProperty("--pointer-y", `${y}px`);
      stage.style.setProperty("--lights-opacity", "1");

      reflectorRefs.current.forEach((reflector) => {
        if (!reflector) return;
        const bounds = reflector.getBoundingClientRect();
        const sourceX = bounds.left + bounds.width / 2;
        const sourceY = bounds.top + bounds.height / 2;
        const angle = (Math.atan2(y - sourceY, x - sourceX) * 180) / Math.PI - 90;
        const distance = Math.max(140, Math.hypot(x - sourceX, y - sourceY));
        reflector.style.setProperty("--beam-angle", `${angle}deg`);
        reflector.style.setProperty("--beam-distance", `${distance}px`);
        reflector.style.setProperty("--source-x", `${sourceX}px`);
        reflector.style.setProperty("--source-y", `${sourceY}px`);
      });
    };

    const onPointerMove = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    const onPointerLeave = () => stage.style.setProperty("--lights-opacity", "0");
    const onPointerOut = (event) => {
      if (!event.relatedTarget) onPointerLeave();
    };
    const onPointerDown = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(render);
      palette = (palette + 1) % 4;
      stage.dataset.palette = String(palette);
      stage.classList.remove("is-firing");
      void stage.offsetWidth;
      stage.classList.add("is-firing");
      window.clearTimeout(firingTimeout);
      firingTimeout = window.setTimeout(() => stage.classList.remove("is-firing"), 520);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    render();
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("pointerdown", onPointerDown);
      window.clearTimeout(firingTimeout);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const can = (...allowedRoles) => roles?.some((role) => allowedRoles.includes(role));

  return (
    <>
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <header className="header">
        <div aria-hidden="true" className="reflector-stage" ref={reflectorStageRef}>
          {[0, 1, 2, 3, 4].map((reflector) => (
            <span
              className="header-reflector"
              key={reflector}
              ref={(element) => {
                reflectorRefs.current[reflector] = element;
              }}
            >
              <span className="reflector-beam" />
              <span className="reflector-bulb" />
            </span>
          ))}
          <span className="pointer-glow" />
        </div>
        <Link className="brand" to="/">
          <span className="mark" /> AFTERSTAGE
        </Link>
        <button
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"}
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span /> <span /> <span />
        </button>
        <nav id="site-navigation" aria-label="Navegación principal" className={menuOpen ? "is-open" : ""}>
          <NavLink end to="/">
            Inicio
          </NavLink>
          <NavLink to="/notas">Notas</NavLink>
          {can("admin", "editor", "community") && <NavLink to="/comunidad">Comunidad</NavLink>}
          <NavLink to="/agenda">Agenda</NavLink>
          <NavLink to="/monetizar">Promocioná tu proyecto</NavLink>
          {can("admin", "editor", "press", "directory") && <NavLink to="/directorio">Directorio</NavLink>}
          {can("admin", "editor", "community") && <NavLink to="/publicar">Publicar</NavLink>}
          {can("admin", "editor", "press", "community", "social") && <NavLink to="/reemplazos">Reemplazos</NavLink>}
          <NavLink aria-label="Buscar en afterstage" className="header-search" to="/notas">
            ⌕
          </NavLink>
          {can("admin", "editor") && (
            <NavLink className="button dark" to="/admin">
              Redacción
            </NavLink>
          )}
        </nav>
        <NavLink className="button header-join" to="/colaborador">
          Sumate
        </NavLink>
      </header>
      <main id="main-content">{children}</main>
      <footer>
        <strong>AFTERSTAGE</strong>
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

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

const themeStorageKey = "afterstage-theme-v2";
const LayoutContext = createContext(false);

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
  if (useContext(LayoutContext)) return children;
  return <LayoutShell>{children}</LayoutShell>;
}

function LayoutShell({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [roles, setRoles] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState(() =>
    typeof window !== "undefined" && window.location.pathname.startsWith("/agenda") ? "eventos" : "notas",
  );
  const [collapsedSections, setCollapsedSections] = useState({});
  const reflectorRefs = useRef([]);
  const reflectorStageRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isWorkspace = roles?.length > 0;
  const isAdminPath = location.pathname.startsWith("/admin") && isWorkspace;

  useEffect(() => {
    const refreshRoles = () => {
      const token = localStorage.getItem("afterstage-token");
      if (!token) {
        setRoles([]);
        return;
      }
      api("/api/auth/me")
        .then(({ user }) => {
          if (localStorage.getItem("afterstage-token") === token) setRoles(user.roles || []);
        })
        .catch(() => setRoles([]));
    };
    refreshRoles();
    window.addEventListener("afterstage-auth-changed", refreshRoles);
    return () => window.removeEventListener("afterstage-auth-changed", refreshRoles);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

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
  const logOut = () => {
    localStorage.removeItem("afterstage-token");
    window.dispatchEvent(new Event("afterstage-auth-changed"));
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    const destination = searchScope === "eventos" ? "/agenda" : "/notas";
    navigate(query ? `${destination}?q=${encodeURIComponent(query)}` : destination);
  };

  const WorkspaceLink = ({ to, children, end = false }) => (
    <NavLink end={end} onClick={closeMenu} to={to}>
      {children}
    </NavLink>
  );

  const WorkspaceSection = ({ id, label, children }) => {
    const collapsed = collapsedSections[id] === true;
    return (
      <div className={`workspace-sidebar-section${collapsed ? " is-collapsed" : ""}`}>
        <button
          aria-controls={`workspace-sidebar-section-${id}`}
          aria-expanded={!collapsed}
          className="workspace-sidebar-label"
          onClick={() => setCollapsedSections((current) => ({ ...current, [id]: !current[id] }))}
          type="button"
        >
          <span>{label}</span>
          <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
        </button>
        {!collapsed && (
          <div className="workspace-sidebar-section-items" id={`workspace-sidebar-section-${id}`}>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <LayoutContext.Provider value>
      <div className="site-shell">
        <a className="skip-link" href="#main-content">
          Ir al contenido
        </a>
        <header
          className={`header ${isWorkspace ? "header-workspace" : isAdminPath ? "header-admin" : "header-public"}`}
        >
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
          {isWorkspace && <span className="header-workspace-label">ESPACIO DE TRABAJO</span>}
          <button
            aria-expanded={menuOpen}
            aria-controls={isWorkspace ? "workspace-sidebar" : "site-navigation"}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span /> <span /> <span />
          </button>
          <form aria-label="Buscar en Afterstage" className="header-search-form" onSubmit={submitSearch} role="search">
            <span aria-hidden="true" className="header-search-icon">
              ⌕
            </span>
            <label className="header-search-scope">
              <span className="sr-only">Buscar en</span>
              <select
                aria-label="Alcance de búsqueda"
                onChange={(event) => setSearchScope(event.target.value)}
                value={searchScope}
              >
                <option value="notas">Notas</option>
                <option value="eventos">Eventos</option>
              </select>
            </label>
            <input
              aria-label="Términos de búsqueda"
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitSearch(event);
              }}
              placeholder="Buscar en Afterstage"
              type="search"
              value={searchQuery}
            />
            <button className="sr-only" type="submit">
              Buscar
            </button>
          </form>
          {!isWorkspace && (
            <nav id="site-navigation" aria-label="Navegación principal" className={menuOpen ? "is-open" : ""}>
              {isAdminPath ? (
                <>
                  <span className="nav-group-label">Publicar</span>
                  <NavLink end to="/admin">
                    Contenido
                  </NavLink>
                  <NavLink to="/admin/redes">Redes</NavLink>
                  <NavLink to="/admin/prensa">Prensa</NavLink>
                  <NavLink to="/admin/correo">Correo</NavLink>
                  {can("admin", "editor", "press", "community") && <NavLink to="/admin/plataforma">Plataforma</NavLink>}
                  <span className="nav-divider" aria-hidden="true" />
                  <span className="nav-group-label">Gestionar</span>
                  <NavLink to="/admin/directorio">Directorio</NavLink>
                  <NavLink to="/admin/reemplazos">Reemplazos</NavLink>
                  {can("admin", "social") && <NavLink to="/admin/instagram">Cuenta IG</NavLink>}
                  {can("admin") && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
                  <span className="nav-divider" aria-hidden="true" />
                  <NavLink className="nav-site-link" to="/">
                    Ver sitio ↗
                  </NavLink>
                  <button className="nav-logout" onClick={logOut} type="button">
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <NavLink end to="/">
                    Inicio
                  </NavLink>
                  <NavLink to="/notas">Notas</NavLink>
                  <NavLink to="/agenda">Agenda</NavLink>
                  <NavLink to="/comunidad">Comunidad</NavLink>
                  <NavLink to="/red">Red</NavLink>
                  <NavLink to="/servicios">Servicios</NavLink>
                  <NavLink to="/marketplace">Marketplace</NavLink>
                  <NavLink to="/seguros">Seguros</NavLink>
                  <NavLink to="/traslados">Traslados</NavLink>
                  {can("admin", "editor", "press", "directory") && <NavLink to="/directorio">Directorio</NavLink>}
                  {can("admin", "editor", "community") && <NavLink to="/publicar">Publicar</NavLink>}
                  {can("admin", "editor", "press", "community", "social") && (
                    <NavLink to="/reemplazos">Reemplazos</NavLink>
                  )}
                  {roles?.length > 0 && <NavLink to="/cuenta/accesos-ia">Accesos IA</NavLink>}
                  {can("admin", "editor") && (
                    <NavLink className="nav-admin-link" to="/admin">
                      Admin ↗
                    </NavLink>
                  )}
                </>
              )}
            </nav>
          )}
        </header>
        {isWorkspace ? (
          <div className="workspace-layout">
            {menuOpen && (
              <button
                aria-label="Cerrar menú de trabajo"
                className="workspace-scrim"
                onClick={closeMenu}
                type="button"
              />
            )}
            <aside
              aria-label="Menú del espacio de trabajo"
              className={`workspace-sidebar ${menuOpen ? "is-open" : ""}`}
              id="workspace-sidebar"
            >
              <div className="workspace-sidebar-top">
                <div>
                  <span className="workspace-kicker">Afterstage</span>
                  <strong>Tu espacio</strong>
                </div>
                <button aria-label="Cerrar menú" className="workspace-sidebar-close" onClick={closeMenu} type="button">
                  ×
                </button>
              </div>
              <nav aria-label="Secciones del espacio de trabajo" className="workspace-sidebar-nav">
                <WorkspaceSection id="consultar" label="Consultar">
                  <WorkspaceLink end to="/">
                    Inicio
                  </WorkspaceLink>
                  <WorkspaceLink to="/notas">Notas</WorkspaceLink>
                  <WorkspaceLink to="/agenda">Agenda</WorkspaceLink>
                  <WorkspaceLink to="/servicios">Servicios</WorkspaceLink>
                  <WorkspaceLink to="/red">Red de trabajo</WorkspaceLink>
                  <WorkspaceLink to="/marketplace">Marketplace</WorkspaceLink>
                  <WorkspaceLink to="/seguros">Seguros</WorkspaceLink>
                  <WorkspaceLink to="/traslados">Traslados</WorkspaceLink>
                </WorkspaceSection>

                {(can("admin", "editor", "community") || can("press", "social")) && (
                  <WorkspaceSection id="trabajar" label="Trabajar">
                    {can("admin", "editor") && (
                      <WorkspaceLink end to="/admin">
                        Contenido
                      </WorkspaceLink>
                    )}
                    {can("admin", "editor") && <WorkspaceLink to="/admin/nueva">Nueva publicación</WorkspaceLink>}
                    {can("admin", "editor") && <WorkspaceLink to="/admin/redes">Redes</WorkspaceLink>}
                    {can("admin", "editor", "press") && <WorkspaceLink to="/admin/prensa">Prensa</WorkspaceLink>}
                    {can("admin", "editor", "press", "community") && (
                      <WorkspaceLink to="/admin/correo">Correo</WorkspaceLink>
                    )}
                    {can("admin", "editor", "community") && (
                      <WorkspaceLink to="/publicar">Proponer contenido</WorkspaceLink>
                    )}
                  </WorkspaceSection>
                )}

                <WorkspaceSection id="gestionar" label="Gestionar">
                  {can("admin", "editor", "press", "directory", "auditor") && (
                    <WorkspaceLink to="/directorio">Directorio</WorkspaceLink>
                  )}
                  {can("admin", "editor", "press", "community", "social") && (
                    <WorkspaceLink to="/reemplazos">Reemplazos</WorkspaceLink>
                  )}
                  {can("admin", "press") && (
                    <WorkspaceLink to="/admin/reemplazos">Administrar reemplazos</WorkspaceLink>
                  )}
                  {can("admin", "editor", "press", "community") && (
                    <WorkspaceLink to="/admin/plataforma">Operaciones de plataforma</WorkspaceLink>
                  )}
                  {can("admin", "social") && <WorkspaceLink to="/admin/instagram">Cuenta de Instagram</WorkspaceLink>}
                  {can("admin") && <WorkspaceLink to="/admin/usuarios">Usuarios</WorkspaceLink>}
                </WorkspaceSection>

                <WorkspaceSection id="cuenta" label="Cuenta">
                  <WorkspaceLink to="/cuenta/accesos-ia">Accesos IA</WorkspaceLink>
                  <WorkspaceLink to="/colaborador">Ver perfil</WorkspaceLink>
                </WorkspaceSection>
              </nav>
              <div className="workspace-sidebar-footer">
                <WorkspaceLink to="/">Ver sitio público ↗</WorkspaceLink>
                <button className="workspace-logout" onClick={logOut} type="button">
                  Cerrar sesión
                </button>
              </div>
            </aside>
            <main className="workspace-main" id="main-content">
              {children}
            </main>
          </div>
        ) : (
          <main id="main-content">{children}</main>
        )}
        <footer className={isAdminPath || isWorkspace ? "admin-footer" : undefined}>
          <strong>AFTERSTAGE</strong>
          <span>Periodismo musical para la escena que hace.</span>
          <span className="footer-links">
            <Link className="footer-contribute" to="/colaborador">
              Colaborá con Afterstage ↗
            </Link>
            <span>
              <Link to="/politica-editorial">Política editorial</Link> · <Link to="/codigo-de-creditos">Créditos</Link>
            </span>
          </span>
        </footer>
      </div>
    </LayoutContext.Provider>
  );
}
export const Loading = () => <p className="muted">Cargando…</p>;
export const ErrorMessage = ({ error }) => (error ? <p className="error">{error}</p> : null);

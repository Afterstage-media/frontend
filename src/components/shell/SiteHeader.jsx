import { Link, NavLink } from "react-router-dom";
import { SearchField } from "../ui/SearchField.jsx";
import { Toggle } from "../ui/Toggle.jsx";

export function SiteHeader({
  isWorkspace,
  isAdminPath,
  menuOpen,
  setMenuOpen,
  searchScope,
  setSearchScope,
  searchQuery,
  setSearchQuery,
  submitSearch,
  roles,
  can,
  logOut,
  reflectorRefs,
  reflectorStageRef,
}) {
  return (
    <header className={`header ${isWorkspace ? "header-workspace" : isAdminPath ? "header-admin" : "header-public"}`}>
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
      <Toggle
        aria-controls={isWorkspace ? "workspace-sidebar" : "site-navigation"}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        className="menu-toggle"
        expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span /> <span /> <span />
      </Toggle>
      <SearchField
        onQueryChange={setSearchQuery}
        onScopeChange={setSearchScope}
        onSubmit={submitSearch}
        query={searchQuery}
        scope={searchScope}
      />
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
              {can("admin", "editor", "press", "community", "social") && <NavLink to="/reemplazos">Reemplazos</NavLink>}
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
  );
}

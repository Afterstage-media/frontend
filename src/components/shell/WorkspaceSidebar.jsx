import { NavLink } from "react-router-dom";
import { Toggle } from "../ui/Toggle.jsx";

function WorkspaceLink({ to, children, end = false, closeMenu }) {
  return (
    <NavLink end={end} onClick={closeMenu} to={to}>
      {children}
    </NavLink>
  );
}

function WorkspaceSection({ id, label, collapsedSections, setCollapsedSections, children }) {
  const collapsed = collapsedSections[id] === true;
  return (
    <div className={`workspace-sidebar-section${collapsed ? " is-collapsed" : ""}`}>
      <Toggle
        aria-controls={`workspace-sidebar-section-${id}`}
        className="workspace-sidebar-label"
        expanded={!collapsed}
        onClick={() => setCollapsedSections((current) => ({ ...current, [id]: !current[id] }))}
      >
        <span>{label}</span>
        <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
      </Toggle>
      {!collapsed && (
        <div className="workspace-sidebar-section-items" id={`workspace-sidebar-section-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export function WorkspaceSidebar({ menuOpen, closeMenu, collapsedSections, setCollapsedSections, can, logOut }) {
  const link = (to, children, end = false) => (
    <WorkspaceLink closeMenu={closeMenu} end={end} to={to}>
      {children}
    </WorkspaceLink>
  );

  return (
    <>
      {menuOpen && (
        <button aria-label="Cerrar menú de trabajo" className="workspace-scrim" onClick={closeMenu} type="button" />
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
          <Toggle aria-label="Cerrar menú" className="workspace-sidebar-close" onClick={closeMenu}>
            ×
          </Toggle>
        </div>
        <nav aria-label="Secciones del espacio de trabajo" className="workspace-sidebar-nav">
          <WorkspaceSection
            collapsedSections={collapsedSections}
            id="consultar"
            label="Consultar"
            setCollapsedSections={setCollapsedSections}
          >
            {link("/", "Inicio", true)}
            {link("/notas", "Notas")}
            {link("/agenda", "Agenda")}
            {link("/servicios", "Servicios")}
            {link("/red", "Red de trabajo")}
            {link("/marketplace", "Marketplace")}
            {link("/seguros", "Seguros")}
            {link("/traslados", "Traslados")}
          </WorkspaceSection>

          {(can("admin", "editor", "community") || can("press", "social")) && (
            <WorkspaceSection
              collapsedSections={collapsedSections}
              id="trabajar"
              label="Trabajar"
              setCollapsedSections={setCollapsedSections}
            >
              {can("admin", "editor") && link("/admin", "Contenido", true)}
              {can("admin", "editor") && link("/admin/nueva", "Nueva publicación")}
              {can("admin", "editor") && link("/admin/redes", "Redes")}
              {can("admin", "editor", "press") && link("/admin/prensa", "Prensa")}
              {can("admin", "editor", "press", "community") && link("/admin/correo", "Correo")}
              {can("admin", "editor", "community") && link("/publicar", "Proponer contenido")}
              {can("admin", "editor", "press", "community", "social") && link("/reemplazos", "Postularse a coberturas")}
            </WorkspaceSection>
          )}

          <WorkspaceSection
            collapsedSections={collapsedSections}
            id="gestionar"
            label="Gestionar"
            setCollapsedSections={setCollapsedSections}
          >
            {can("admin", "editor", "press", "directory", "auditor") && link("/directorio", "Directorio")}
            {can("admin", "press") && link("/admin/reemplazos", "Gestionar coberturas")}
            {can("admin", "editor", "press", "community") && link("/admin/plataforma", "Operaciones de plataforma")}
            {can("admin", "social") && link("/admin/instagram", "Cuenta de Instagram")}
            {can("admin") && link("/admin/usuarios", "Usuarios")}
          </WorkspaceSection>

          <WorkspaceSection
            collapsedSections={collapsedSections}
            id="cuenta"
            label="Cuenta"
            setCollapsedSections={setCollapsedSections}
          >
            {link("/cuenta/accesos-ia", "Accesos IA")}
            {link("/colaborador", "Ver perfil")}
          </WorkspaceSection>
        </nav>
        <div className="workspace-sidebar-footer">
          {link("/", "Ver sitio público ↗")}
          <button className="workspace-logout" onClick={logOut} type="button">
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

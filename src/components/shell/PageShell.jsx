export function PageShell({ children, header, sidebar, footer, bottomNavigation, pageKey, workspace = false }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      {header}
      {workspace ? (
        <div className="workspace-layout">
          {sidebar}
          <main
            className={`workspace-main${bottomNavigation ? " has-bottom-navigation" : ""} route-transition`}
            id="main-content"
            key={pageKey}
          >
            {children}
          </main>
        </div>
      ) : (
        <main
          className={`${bottomNavigation ? "has-bottom-navigation " : ""}route-transition`}
          id="main-content"
          key={pageKey}
        >
          {children}
        </main>
      )}
      {footer}
      {bottomNavigation}
    </div>
  );
}

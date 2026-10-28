export function PageShell({ children, header, sidebar, footer, workspace = false }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      {header}
      {workspace ? (
        <div className="workspace-layout">
          {sidebar}
          <main className="workspace-main" id="main-content">
            {children}
          </main>
        </div>
      ) : (
        <main id="main-content">{children}</main>
      )}
      {footer}
    </div>
  );
}

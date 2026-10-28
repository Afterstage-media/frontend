import { Link } from "react-router-dom";

export function SiteFooter({ admin = false }) {
  return (
    <footer className={admin ? "admin-footer" : undefined}>
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
  );
}

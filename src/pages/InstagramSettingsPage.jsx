import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";

const formatExpiry = (value) => {
  if (!value) return "Sin vencimiento informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : date.toLocaleString("es-AR");
};

function InstagramSettings() {
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [removingAccountId, setRemovingAccountId] = useState("");

  const load = () => {
    setLoading(true);
    api("/api/integrations/instagram")
      .then(({ connections: next }) => setConnections(next || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const removeConnection = async (accountId) => {
    if (
      !window.confirm(
        "¿Querés remover esta conexión de Instagram? Se borrará el acceso guardado en Afterstage y podrás volver a conectarla después.",
      )
    ) {
      return;
    }

    setError("");
    setRemovingAccountId(accountId);
    try {
      await api(`/api/integrations/instagram/${encodeURIComponent(accountId)}`, { method: "DELETE" });
      setConnections((current) => current.filter((connection) => connection.accountId !== accountId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRemovingAccountId("");
    }
  };

  return (
    <Layout>
      <section className="page-intro">
        <Link className="editor-back" to="/admin">
          ← Volver a redacción
        </Link>
        <p className="eyebrow">Integraciones</p>
        <h1>Instagram conectado.</h1>
        <p>Autorizá la cuenta desde Instagram. Afterstage recibe el código en el backend y guarda el acceso cifrado.</p>
        <div className="actions">
          <button className="button" onClick={() => (window.location.href = "/api/integrations/instagram/connect")}>
            Conectar una cuenta ↗
          </button>
        </div>
      </section>
      <ErrorMessage error={error} />
      {loading ? (
        <p className="muted">Cargando conexiones…</p>
      ) : connections.length ? (
        <div className="admin-list">
          {connections.map((connection) => (
            <article className="admin-record" key={connection.accountId}>
              <div>
                <small>Cuenta profesional de Instagram</small>
                <h3>@{connection.username}</h3>
                <p>Conectada el {formatExpiry(connection.connectedAt)}.</p>
                <p>Token válido hasta: {formatExpiry(connection.expiresAt)}.</p>
              </div>
              <div className="actions">
                <span>{connection.scopes?.length || 0} permisos</span>
                <button
                  className="button ghost"
                  type="button"
                  disabled={removingAccountId === connection.accountId}
                  onClick={() => removeConnection(connection.accountId)}
                >
                  {removingAccountId === connection.accountId ? "Removiendo…" : "Remover conexión"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Todavía no hay una cuenta de Instagram conectada.</p>
      )}
    </Layout>
  );
}

export function InstagramSettingsPage() {
  return <AuthGate allowedRoles={["admin", "social"]}>{() => <InstagramSettings />}</AuthGate>;
}

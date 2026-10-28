import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Notice } from "../components/ui/Notice.jsx";

const scopeLabels = {
  "notes:read": "Leer notas",
  "notes:write": "Crear y editar notas",
  "agenda:read": "Leer agenda",
  "agenda:write": "Gestionar agenda",
  "directory:read": "Leer directorio",
  "directory:write": "Gestionar directorio",
  "replacements:read": "Leer reemplazos",
  "instagram:read": "Leer Instagram",
  "instagram:metrics": "Ver métricas de Instagram",
  "instagram:publish": "Publicar en Instagram",
  "voice:read": "Usar funciones de voz",
  "voice:write": "Gestionar funciones de voz",
};

const readableScope = (scope) =>
  scopeLabels[scope] ||
  String(scope || "")
    .replaceAll(":", " · ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

function AccessLedger() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setConnections(await api("/api/account/ai-access"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connectionGroups = useMemo(() => {
    const groups = new Map();
    connections.forEach((connection) => {
      const key = `${connection.application || "Aplicación"}::${connection.clientId || "sin-id"}`;
      const current = groups.get(key) || {
        key,
        application: connection.application || "Aplicación",
        clientId: connection.clientId,
        connections: [],
      };
      current.connections.push(connection);
      groups.set(key, current);
    });
    return [...groups.values()];
  }, [connections]);

  const revoke = async (connection) => {
    const confirmed = window.confirm(
      `¿Revocar el acceso de ${connection.application}? La aplicación dejará de poder trabajar con tu cuenta.`,
    );
    if (!confirmed) return;
    setRevoking(connection.id);
    setError("");
    setNotice("");
    try {
      await api(`/api/account/ai-access/${connection.id}`, { method: "DELETE" });
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      setNotice(`Acceso de ${connection.application} revocado.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRevoking("");
    }
  };

  return (
    <Layout>
      <section className="ai-access-hero">
        <div>
          <p className="eyebrow">Cuenta / seguridad</p>
          <h1>Accesos de IA.</h1>
          <p className="ai-access-lede">
            Decidí qué aplicaciones pueden trabajar con Afterstage y cortá una conexión cuando quieras. Tus claves no
            aparecen acá: sólo mostramos la autorización y los permisos concedidos.
          </p>
        </div>
        <div className="ai-access-counter" aria-label={`${connections.length} conexiones activas`}>
          <strong>{connections.length}</strong>
          <span>conexiones activas</span>
        </div>
      </section>

      <div className="ai-access-main">
        <aside className="ai-access-aside">
          <span className="ai-access-index">01</span>
          <h2>Tu control</h2>
          <p>
            Cada autorización tiene un alcance preciso. Revocar una conexión invalida sus tokens actuales y los que
            intente renovar.
          </p>
          <div className="ai-access-rule" />
          <p className="muted">Si una aplicación vuelve a necesitar acceso, tendrá que pedir autorización otra vez.</p>
        </aside>

        <section className="ai-access-list" aria-labelledby="ai-access-list-title">
          <div className="ai-access-list-heading">
            <div>
              <p className="eyebrow">Conexiones autorizadas</p>
              <h2 id="ai-access-list-title">Aplicaciones con acceso</h2>
            </div>
            <Button variant="ghost" type="button" onClick={load} disabled={loading}>
              {loading ? "Actualizando…" : "Actualizar"}
            </Button>
          </div>

          <ErrorMessage error={error} />
          {notice && <Notice>{notice}</Notice>}

          {loading ? (
            <div className="ai-access-state" role="status">
              <span className="ai-access-pulse" /> Cargando autorizaciones…
            </div>
          ) : connections.length === 0 ? (
            <div className="ai-access-state ai-access-empty">
              <span className="ai-access-state-mark">—</span>
              <strong>No hay conexiones activas</strong>
              <p>Cuando autorices ChatGPT, Codex u otra aplicación, la conexión va a aparecer en este registro.</p>
            </div>
          ) : (
            <div className="ai-access-connections">
              {connectionGroups.map((group) => (
                <article className="ai-access-connection" key={group.key}>
                  <div className="ai-access-connection-topline">
                    <span className="ai-access-status">
                      <span /> {group.connections.length}{" "}
                      {group.connections.length === 1 ? "autorización" : "autorizaciones"}
                    </span>
                    <span className="ai-access-date">Misma aplicación</span>
                  </div>
                  <div className="ai-access-connection-body">
                    <div>
                      <h3>{group.application}</h3>
                      <p className="muted">ID de aplicación: {group.clientId || "No informado"}</p>
                    </div>
                  </div>
                  <div className="ai-access-authorizations">
                    {group.connections.map((connection, index) => (
                      <div className="ai-access-authorization" key={connection.id}>
                        <div className="ai-access-authorization-heading">
                          <strong>Autorización {index + 1}</strong>
                          <span>Concedida {formatDate(connection.issuedAt)}</span>
                        </div>
                        <div className="ai-access-scopes">
                          <span className="ai-access-scopes-label">Permisos concedidos</span>
                          <div>
                            {connection.scopes.map((scope) => (
                              <span className="ai-access-scope" key={scope}>
                                {readableScope(scope)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ai-access-authorization-footer">
                          <p className="ai-access-expiry">Vigente hasta {formatDate(connection.expiresAt)}</p>
                          <Button
                            className="danger"
                            type="button"
                            disabled={revoking === connection.id}
                            onClick={() => revoke(connection)}
                          >
                            {revoking === connection.id ? "Revocando…" : "Revocar esta autorización"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export function AiAccessPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "directory", "community", "auditor", "social"]}>
      <AccessLedger />
    </AuthGate>
  );
}

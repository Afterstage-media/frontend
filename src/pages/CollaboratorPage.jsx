import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoginForm } from "../components/AuthGate.jsx";
import { Layout } from "../components/Layout.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { api } from "../services/api.js";

export function CollaboratorPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("afterstage-token")));

  useEffect(() => {
    if (!localStorage.getItem("afterstage-token")) {
      setLoading(false);
      return undefined;
    }
    api("/api/auth/me")
      .then(({ user: actor }) => setUser(actor))
      .catch(() => {
        localStorage.removeItem("afterstage-token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <SignalTicker items={["Comunidad", "Colaborá", "Contá", "Hacé archivo"]} />
      {loading ? (
        <section className="page-intro">
          <p className="muted">Verificando sesión…</p>
        </section>
      ) : user ? (
        <section className="page-intro">
          <p className="eyebrow">Colaboradores</p>
          <h1>Bienvenido a la comunidad.</h1>
          <p>Tu cuenta ya está activa y puede enviar propuestas autenticadas.</p>
          <div className="actions">
            <Link className="button dark" to="/publicar">
              Enviar una propuesta ↗
            </Link>
            <button
              className="button ghost"
              onClick={() => {
                localStorage.removeItem("afterstage-token");
                window.dispatchEvent(new Event("afterstage-auth-changed"));
                setUser(null);
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </section>
      ) : (
        <LoginForm collaboratorOnly onReady={setUser} />
      )}
    </Layout>
  );
}

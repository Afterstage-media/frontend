import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoginForm } from "../components/AuthGate.jsx";
import { Layout } from "../components/Layout.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { Button, ButtonLink } from "../components/ui/Button.jsx";
import { api } from "../services/api.js";
import { setSessionHint } from "../services/session.js";

export function CollaboratorPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/auth/session")
      .then(({ user: actor }) => {
        setSessionHint(Boolean(actor));
        setUser(actor);
      })
      .catch(() => {
        setSessionHint(false);
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
            <ButtonLink className="dark" to="/publicar">
              Enviar una propuesta ↗
            </ButtonLink>
            <Button
              variant="ghost"
              onClick={async () => {
                await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
                setSessionHint(false);
                window.dispatchEvent(new Event("afterstage-auth-changed"));
                setUser(null);
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </section>
      ) : (
        <LoginForm collaboratorOnly onReady={setUser} />
      )}
    </Layout>
  );
}

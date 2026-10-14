import { useState } from "react";
import { Link } from "react-router-dom";
import { LoginForm } from "../components/AuthGate.jsx";
import { Layout } from "../components/Layout.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";

export function CollaboratorPage() {
  const [user, setUser] = useState(null);

  return (
    <Layout>
      <SignalTicker items={["Comunidad", "Colaborá", "Contá", "Hacé archivo"]} />
      {user ? (
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
                localStorage.removeItem("medio-under-token");
                window.dispatchEvent(new Event("medio-under-auth-changed"));
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

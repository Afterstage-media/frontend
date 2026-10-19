import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { AuthGate } from "../components/AuthGate.jsx";
import { EditorialIntro, SignalTicker } from "../components/EditorialPrimitives.jsx";
export function CommunityPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "community"]}>
      <Layout>
        <SignalTicker items={["Comunidad", "Noteros", "Fotógrafos", "Bandas"]} />
        <EditorialIntro
          eyebrow="Comunidad / 03"
          title="La escena se cuenta entre todes."
          description="Buscamos noteros, fotógrafos, bandas y personas que quieran construir archivo."
          action={
            <Link className="button" to="/publicar">
              Publicar una propuesta ↗
            </Link>
          }
        />
      </Layout>
    </AuthGate>
  );
}
export function PublishPage() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await api("/api/public/submissions", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      setStatus(result.message);
      formElement.reset();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <AuthGate allowedRoles={["admin", "editor", "community"]}>
      <Layout>
        <section className="page-intro publish-intro">
          <p className="eyebrow">Sumate</p>
          <h1>Publicá una historia, búsqueda o cobertura.</h1>
        </section>
        <form className="form publish-form" onSubmit={submit}>
          <label>
            Tipo
            <input name="kind" required placeholder="Búsqueda, nota, cobertura…" />
          </label>
          <label>
            Título
            <input name="title" required minLength="3" />
          </label>
          <label>
            Descripción
            <textarea name="description" required minLength="10" rows="7" />
          </label>
          <label>
            Contacto
            <input name="contact" required type="email" />
          </label>
          <button className="button dark">Enviar propuesta ↗</button>
          <ErrorMessage error={error} />
          {status && <p className="success">{status}</p>}
        </form>
      </Layout>
    </AuthGate>
  );
}

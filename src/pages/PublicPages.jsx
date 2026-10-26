import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { AuthGate } from "../components/AuthGate.jsx";
import { EditorialIntro, SignalTicker } from "../components/EditorialPrimitives.jsx";
export function CommunityPage() {
  return (
    <Layout>
      <SignalTicker items={["Comunidad", "Noteros", "Fotógrafos", "Bandas", "Fans"]} />
      <EditorialIntro
        eyebrow="Comunidad / 03"
        title="La escena se cuenta entre todes."
        description="Una red para encontrar personas, oportunidades, coberturas, traslados y conversaciones alrededor de cada show."
        action={
          <div className="actions">
            <Link className="button" to="/red">
              Explorar la red ↗
            </Link>
            <Link className="button ghost" to="/agenda">
              Ver agenda
            </Link>
          </div>
        }
      />
      <section className="community-hub-grid">
        <Link className="community-hub-card" to="/red">
          <span className="eyebrow">01 · Trabajo</span>
          <h2>Fotógrafos y coberturas.</h2>
          <p>Perfiles con muestras concretas y búsquedas donde postularse.</p>
        </Link>
        <Link className="community-hub-card" to="/agenda">
          <span className="eyebrow">02 · Eventos</span>
          <h2>Cada fecha tiene su espacio.</h2>
          <p>Foro, traslados, prensa, notas y personas conectadas desde el evento.</p>
        </Link>
        <Link className="community-hub-card" to="/seguros">
          <span className="eyebrow">03 · Producción</span>
          <h2>Resolver lo que hace falta.</h2>
          <p>Consultas de seguros y servicios para que la escena pueda suceder.</p>
        </Link>
        <Link className="community-hub-card" to="/marketplace">
          <span className="eyebrow">04 · Catálogo</span>
          <h2>Lo que queda después.</h2>
          <p>Merch, servicios y beneficios administrados junto a Orux.</p>
        </Link>
      </section>
    </Layout>
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

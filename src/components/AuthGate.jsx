import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "./Layout.jsx";

const tokenKey = "medio-under-token";

export function LoginForm({ onReady }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      localStorage.setItem(tokenKey, result.accessToken);
      onReady(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form token-gate" onSubmit={signIn}>
      <h2>Iniciar sesión</h2>
      <p>Usá tu usuario o email y contraseña del medio.</p>
      <label>
        Usuario o email
        <input
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>
      <label>
        Contraseña
        <input
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button className="button dark" disabled={loading} type="submit">
        {loading ? "Verificando…" : "Ingresar"}
      </button>
      <ErrorMessage error={error} />
    </form>
  );
}

export function AuthGate({ allowedRoles, children }) {
  const rolesKey = allowedRoles.join(",");
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || "");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    setLoading(true);
    api("/api/auth/me")
      .then(({ user: actor }) => {
        if (!(actor.roles || []).some((role) => allowedRoles.includes(role)))
          throw new Error("Tus roles no tienen acceso a esta sección");
        setUser(actor);
        setError("");
      })
      .catch((requestError) => {
        localStorage.removeItem(tokenKey);
        setToken("");
        setUser(null);
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [rolesKey, token]);

  if (loading)
    return (
      <Layout>
        <section className="page-intro">
          <p className="muted">Verificando permisos…</p>
        </section>
      </Layout>
    );

  if (!user)
    return (
      <Layout>
        <LoginForm
          onReady={(actor) => {
            if (!(actor.roles || []).some((role) => allowedRoles.includes(role))) {
              localStorage.removeItem(tokenKey);
              setError("Tus roles no tienen acceso a esta sección");
              return;
            }
            setToken(localStorage.getItem(tokenKey) || "");
            setUser(actor);
            setError("");
          }}
        />
        {error && <p className="error token-gate">{error}</p>}
      </Layout>
    );

  return children;
}

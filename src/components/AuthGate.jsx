import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, encryptAuthSecret } from "../services/api.js";
import { ErrorMessage, Layout } from "./Layout.jsx";
import { TextField } from "./ui/TextField.jsx";

const tokenKey = "afterstage-token";

export function LoginForm({ onReady, collaboratorOnly = false, showCollaborator = true }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [collaborator, setCollaborator] = useState(collaboratorOnly);
  const [registering, setRegistering] = useState(false);
  const [mode, setMode] = useState(() =>
    searchParams.get("reset") ? "reset" : searchParams.get("recover") ? "recover" : "login",
  );
  const [recoverySent, setRecoverySent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetToken = searchParams.get("reset") || "";
  const setAuthMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setRecoverySent(false);
    setPassword("");
    setPasswordConfirmation("");
    if (nextMode === "login") setSearchParams({});
  };

  const signIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (registering && password !== passwordConfirmation) throw new Error("Las contraseñas no coinciden");
      const encryptionKey = await api("/api/auth/public-key");
      const passwordCiphertext = await encryptAuthSecret(password, encryptionKey.publicKey);
      const result = await api(registering ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(
          registering
            ? { email: identifier, keyId: encryptionKey.keyId, passwordCiphertext }
            : { identifier, keyId: encryptionKey.keyId, passwordCiphertext },
        ),
      });
      localStorage.setItem(tokenKey, result.accessToken);
      window.dispatchEvent(new Event("afterstage-auth-changed"));
      onReady(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const requestRecovery = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/recover", {
        method: "POST",
        body: JSON.stringify({ email: identifier }),
      });
      setRecoverySent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (password.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres");
      if (password !== passwordConfirmation) throw new Error("Las contraseñas no coinciden");
      const encryptionKey = await api("/api/auth/public-key");
      const passwordCiphertext = await encryptAuthSecret(password, encryptionKey.publicKey);
      await api("/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, keyId: encryptionKey.keyId, passwordCiphertext }),
      });
      setSearchParams({});
      setMode("login");
      setPassword("");
      setPasswordConfirmation("");
      setRecoverySent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === "recover")
    return (
      <form className="form token-gate auth-form" onSubmit={requestRecovery}>
        <p className="eyebrow">Volver a entrar</p>
        <h1>Recuperá tu acceso.</h1>
        <p>Indicá el email de tu cuenta y te enviamos un enlace de recuperación.</p>
        <TextField
          autoComplete="email"
          label="Email"
          name="recoveryEmail"
          onChange={(event) => setIdentifier(event.target.value)}
          required
          type="email"
          value={identifier}
        />
        <p className="auth-help">
          Por seguridad, siempre mostramos el mismo mensaje aunque el email no esté registrado.
        </p>
        {recoverySent && (
          <p className="success" role="status">
            Si la cuenta existe, vas a recibir un enlace para recuperar el acceso.
          </p>
        )}
        <ErrorMessage error={error} />
        <button className="button dark" disabled={loading} type="submit">
          {loading ? "Enviando…" : "Enviar enlace"}
        </button>
        <button className="button ghost" type="button" onClick={() => setAuthMode("login")}>
          Volver a iniciar sesión
        </button>
      </form>
    );

  if (mode === "reset")
    return (
      <form className="form token-gate auth-form" onSubmit={resetPassword}>
        <p className="eyebrow">Nuevo acceso</p>
        <h1>Elegí una contraseña nueva.</h1>
        <p>Usá al menos 12 caracteres. La contraseña se cifra antes de enviarse.</p>
        <TextField
          autoComplete="new-password"
          label="Nueva contraseña"
          minLength={12}
          name="newPassword"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <TextField
          autoComplete="new-password"
          label="Repetir contraseña"
          minLength={12}
          name="passwordConfirmation"
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          required
          type="password"
          value={passwordConfirmation}
        />
        {recoverySent && (
          <p className="success" role="status">
            Contraseña actualizada. Ya podés iniciar sesión.
          </p>
        )}
        <ErrorMessage error={error} />
        <button className="button dark" disabled={loading} type="submit">
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
        <button className="button ghost" type="button" onClick={() => setAuthMode("login")}>
          Volver a iniciar sesión
        </button>
      </form>
    );

  return (
    <form className="form token-gate auth-form" onSubmit={signIn}>
      <h1>
        {collaborator ? (registering ? "Registrarme como colaborador" : "Ingreso de colaborador") : "Iniciar sesión"}
      </h1>
      <p>
        {collaborator
          ? "Participá de la comunidad y enviá propuestas autenticadas."
          : "Usá tu usuario o email y contraseña del medio."}
      </p>
      <TextField
        autoComplete={collaborator ? "email" : "username"}
        label={collaborator ? "Email" : "Usuario o email"}
        name="identifier"
        onChange={(event) => setIdentifier(event.target.value)}
        required
        type={collaborator ? "email" : "text"}
        value={identifier}
      />
      <TextField
        autoComplete="current-password"
        label="Contraseña"
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      <button className="auth-recovery-link" type="button" onClick={() => setAuthMode("recover")}>
        ¿Perdiste el acceso? Recuperá tu contraseña
      </button>
      {collaborator && registering && (
        <TextField
          autoComplete="new-password"
          label="Repetir contraseña"
          minLength={12}
          name="passwordConfirmation"
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          required
          type="password"
          value={passwordConfirmation}
        />
      )}
      <button className="button dark" disabled={loading} type="submit">
        {loading ? "Procesando…" : registering ? "Crear cuenta" : "Ingresar"}
      </button>
      {collaborator && (
        <button className="button ghost" type="button" onClick={() => setRegistering((value) => !value)}>
          {registering ? "Ya tengo una cuenta" : "Registrarme"}
        </button>
      )}
      {!collaborator && showCollaborator && (
        <button className="button ghost" type="button" onClick={() => setCollaborator(true)}>
          Colaborador
        </button>
      )}
      <ErrorMessage error={error} />
    </form>
  );
}

export function AuthGate({ allowedRoles, children }) {
  const rolesKey = allowedRoles.join(",");
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || "");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
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
        if (!(actor.roles || []).some((role) => allowedRoles.includes(role))) {
          setAccessDenied(true);
          setUser(null);
          setError("");
          return;
        }
        setUser(actor);
        setAccessDenied(false);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.status === 401) {
          localStorage.removeItem(tokenKey);
          setToken("");
        }
        setUser(null);
        setAccessDenied(requestError.status === 403);
        setError(requestError.status === 403 ? "" : requestError.message);
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

  if (accessDenied)
    return (
      <Layout>
        <section className="page-intro">
          <p className="eyebrow">Acceso restringido</p>
          <h1>No tenés permiso para esta sección.</h1>
          <p className="muted">Tu sesión sigue activa. Pedí el rol correspondiente o volvé al inicio.</p>
          <Link className="button dark" to="/">
            Volver al inicio
          </Link>
        </section>
      </Layout>
    );

  if (!user)
    return (
      <Layout>
        <LoginForm
          onReady={(actor) => {
            if (!(actor.roles || []).some((role) => allowedRoles.includes(role))) {
              setAccessDenied(true);
              setError("");
              return;
            }
            setToken(localStorage.getItem(tokenKey) || "");
            setUser(actor);
            setAccessDenied(false);
            setError("");
          }}
        />
        {error && (
          <p aria-live="polite" className="error token-gate" role="alert">
            {error}
          </p>
        )}
      </Layout>
    );

  return typeof children === "function" ? children(user) : children;
}

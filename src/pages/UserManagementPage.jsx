import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, encryptAuthSecret } from "../services/api.js";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";

const roleOptions = [
  ["admin", "Administrador"],
  ["editor", "Editor"],
  ["press", "Prensa"],
  ["directory", "Directorio"],
  ["community", "Comunidad"],
  ["auditor", "Auditor"],
  ["social", "Social"],
];
const permissionOptions = [
  ["instagram:read", "Leer Instagram"],
  ["instagram:metrics", "Ver métricas"],
  ["instagram:publish", "Publicar en Instagram"],
];
const roleLabels = Object.fromEntries(roleOptions);
const permissionLabels = Object.fromEntries(permissionOptions);

const emptyForm = {
  username: "",
  email: "",
  roles: ["community"],
  permissions: [],
  active: true,
  password: "",
  passwordConfirmation: "",
};

const formatDate = (value) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin registro"
    : new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const initials = (user) =>
  (user.username || user.email || "?")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function RolePills({ roles }) {
  return (
    <div className="user-role-pills">
      {(roles || []).map((role) => (
        <span className={`user-role-pill user-role-${role}`} key={role}>
          {roleLabels[role] || role}
        </span>
      ))}
    </div>
  );
}

function UserForm({ user, onCancel, onSaved }) {
  const editing = Boolean(user);
  const [form, setForm] = useState(() =>
    user ? { ...emptyForm, ...user, password: "", passwordConfirmation: "" } : { ...emptyForm },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key, value) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    if (!form.roles.length) {
      setError("Elegí al menos un rol para este usuario.");
      return;
    }
    if (form.password && form.password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }
    if (form.password !== form.passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      let encrypted = {};
      if (form.password) {
        const encryptionKey = await api("/api/auth/public-key");
        encrypted = {
          keyId: encryptionKey.keyId,
          passwordCiphertext: await encryptAuthSecret(form.password, encryptionKey.publicKey),
        };
      }
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        roles: form.roles,
        permissions: form.permissions,
        active: form.active,
        ...(editing ? encrypted : { ...encrypted }),
      };
      const result = await api(editing ? `/api/admin/users/${user.id}` : "/api/admin/users", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setStatus(editing ? "Cambios guardados." : "Usuario creado.");
      onSaved(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="user-drawer" aria-labelledby="user-form-title">
      <div className="user-drawer-header">
        <div>
          <p className="eyebrow">{editing ? "Editar acceso" : "Nuevo acceso"}</p>
          <h2 id="user-form-title">{editing ? user.username || user.email : "Sumar una persona"}</h2>
        </div>
        <button aria-label="Cerrar panel" className="icon-button" onClick={onCancel} type="button">
          ×
        </button>
      </div>
      <p className="user-drawer-copy">
        {editing
          ? "Actualizá permisos y estado. Los cambios tienen efecto en el próximo pedido de la cuenta."
          : "Creá la cuenta y definí exactamente qué puede hacer dentro de Afterstage."}
      </p>
      <form className="user-form" onSubmit={submit}>
        <label>
          Usuario
          <input
            autoComplete="off"
            pattern="[a-zA-Z0-9._-]+"
            required
            value={form.username}
            onChange={(event) => update("username", event.target.value)}
          />
          <small>Solo letras, números, punto, guion y guion bajo.</small>
        </label>
        <label>
          Email
          <input
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>
        <fieldset>
          <legend>Roles</legend>
          <div className="user-check-grid">
            {roleOptions.map(([value, label]) => (
              <label className="user-check" key={value}>
                <input checked={form.roles.includes(value)} onChange={() => toggle("roles", value)} type="checkbox" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Permisos especiales</legend>
          <div className="user-check-grid">
            {permissionOptions.map(([value, label]) => (
              <label className="user-check" key={value}>
                <input
                  checked={form.permissions.includes(value)}
                  onChange={() => toggle("permissions", value)}
                  type="checkbox"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <small>Los administradores ya tienen acceso a todas las funciones.</small>
        </fieldset>
        <label className="user-status-toggle">
          <span>
            <strong>Cuenta activa</strong>
            <small>Si la desactivás, no podrá iniciar sesión.</small>
          </span>
          <input checked={form.active} onChange={(event) => update("active", event.target.checked)} type="checkbox" />
        </label>
        <fieldset className="user-password-fieldset">
          <legend>{editing ? "Cambiar contraseña" : "Contraseña"}</legend>
          <label>
            <span className="sr-only">{editing ? "Nueva contraseña" : "Contraseña"}</span>
            <input
              autoComplete={editing ? "new-password" : "new-password"}
              minLength="12"
              placeholder={editing ? "Dejar vacío para conservarla" : "Mínimo 12 caracteres"}
              required={!editing}
              type="password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Repetir contraseña</span>
            <input
              autoComplete="new-password"
              minLength="12"
              placeholder="Repetir contraseña"
              required={!editing || Boolean(form.password)}
              type="password"
              value={form.passwordConfirmation}
              onChange={(event) => update("passwordConfirmation", event.target.value)}
            />
          </label>
        </fieldset>
        <ErrorMessage error={error} />
        {status && <p className="success">{status}</p>}
        <div className="user-form-actions">
          <button className="button dark" disabled={saving} type="submit">
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear usuario"}
          </button>
          <button className="button ghost" onClick={onCancel} type="button">
            Cancelar
          </button>
        </div>
      </form>
    </aside>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedUser, setSelectedUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = () => {
    setLoading(true);
    setError("");
    api("/api/admin/users")
      .then(({ users: nextUsers }) => setUsers(nextUsers))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = !normalizedQuery || `${user.username} ${user.email}`.toLowerCase().includes(normalizedQuery);
      const matchesRole = !roleFilter || user.roles.includes(roleFilter);
      const matchesStatus =
        statusFilter === "all" || (statusFilter === "active" ? user.active !== false : user.active === false);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  const totals = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.active !== false).length,
      admins: users.filter((user) => user.active !== false && user.roles.includes("admin")).length,
    }),
    [users],
  );

  const handleSaved = (saved) => {
    setUsers((current) => {
      const exists = current.some((user) => user.id === saved.id);
      return exists ? current.map((user) => (user.id === saved.id ? saved : user)) : [saved, ...current];
    });
    setSelectedUser(null);
    setCreating(false);
  };

  return (
    <Layout>
      <div className="users-page">
        <section className="users-hero">
          <div>
            <Link className="editor-back" to="/admin">
              ← Volver al panel
            </Link>
            <p className="eyebrow">Administración · acceso interno</p>
            <h1>Gestión de usuarios</h1>
            <p className="users-hero-copy">
              Administrá identidades, roles y accesos desde un solo lugar. Los cambios quedan bajo control de
              administración.
            </p>
          </div>
          <div className="users-hero-note">
            <span className="users-hero-mark">◎</span>
            <strong>Solo admins</strong>
            <span>Esta sección no es visible para otros roles.</span>
          </div>
        </section>

        <section className="users-content" aria-labelledby="users-list-title">
          <div className="users-toolbar">
            <div>
              <p className="eyebrow">Directorio de acceso</p>
              <h2 id="users-list-title">Usuarios</h2>
            </div>
            <button className="button dark" onClick={() => setCreating(true)} type="button">
              + Nuevo usuario
            </button>
          </div>
          <div className="users-metrics" aria-label="Resumen de usuarios">
            <div className="users-metric users-metric-accent">
              <strong>{totals.total}</strong>
              <span>Total de cuentas</span>
            </div>
            <div className="users-metric">
              <strong>{totals.active}</strong>
              <span>Activas hoy</span>
            </div>
            <div className="users-metric">
              <strong>{totals.admins}</strong>
              <span>Administradores</span>
            </div>
          </div>
          <div className="users-filters">
            <label className="users-search">
              <span className="sr-only">Buscar usuario</span>
              <span aria-hidden="true">⌕</span>
              <input
                placeholder="Buscar por usuario o email"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por rol</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="">Todos los roles</option>
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="active">Activos</option>
                <option value="inactive">Desactivados</option>
                <option value="all">Todos</option>
              </select>
            </label>
          </div>
          {error ? (
            <div className="users-empty users-empty-error" role="alert">
              <strong>{error}</strong>
              <span>Revisá la conexión e intentá cargar el directorio nuevamente.</span>
              <button className="button ghost" onClick={loadUsers} type="button">
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <div className="users-empty">Cargando usuarios…</div>
          ) : visibleUsers.length ? (
            <div className="users-table-wrap" aria-label="Tabla de usuarios">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Roles</th>
                    <th>Estado</th>
                    <th>Última actualización</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr className={user.active === false ? "is-inactive" : ""} key={user.id}>
                      <td data-label="Persona">
                        <div className="user-identity">
                          <span className="user-avatar">{initials(user)}</span>
                          <span>
                            <strong>{user.username || "Sin usuario"}</strong>
                            <small>{user.email || "Email no informado"}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label="Roles">
                        <RolePills roles={user.roles} />
                      </td>
                      <td data-label="Estado">
                        <span className={`user-status ${user.active === false ? "is-inactive" : ""}`}>
                          <i /> {user.active === false ? "Desactivado" : "Activo"}
                        </span>
                      </td>
                      <td className="user-date" data-label="Última actualización">
                        {formatDate(user.updatedAt || user.createdAt)}
                      </td>
                      <td className="user-actions-cell" data-label="Acciones">
                        <button className="user-edit-button" onClick={() => setSelectedUser(user)} type="button">
                          Gestionar <span aria-hidden="true">↗</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="users-empty">
              <strong>No encontramos usuarios con esos filtros.</strong>
              <span>Probá con otra búsqueda o limpiá los filtros.</span>
            </div>
          )}
          <p className="users-footnote">
            {visibleUsers.length} de {users.length} cuentas visibles · Las bajas son reversibles.
          </p>
        </section>
      </div>
      {(creating || selectedUser) && (
        <div
          className="user-drawer-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && (setCreating(false), setSelectedUser(null))}
        >
          <UserForm
            key={selectedUser?.id || "new"}
            user={selectedUser}
            onCancel={() => {
              setCreating(false);
              setSelectedUser(null);
            }}
            onSaved={handleSaved}
          />
        </div>
      )}
    </Layout>
  );
}

export function UserManagementPage() {
  return (
    <AuthGate allowedRoles={["admin"]}>
      <UserManagement />
    </AuthGate>
  );
}

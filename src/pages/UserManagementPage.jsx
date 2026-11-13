import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, encryptAuthSecret } from "../services/api.js";
import { AuthGate } from "../components/AuthGate.jsx";
import { Layout } from "../components/Layout.jsx";
import { Button } from "../components/ui/Button.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { Drawer } from "../components/ui/Drawer.jsx";
import { FilterBar } from "../components/ui/FilterBar.jsx";
import { IconButton } from "../components/ui/IconButton.jsx";
import { Notice } from "../components/ui/Notice.jsx";
import { StatusBadge } from "../components/ui/StatusBadge.jsx";
import { userManagementEs as text } from "../i18n/es-AR.dictionary.js";

const roleOptions = [
  ["admin", text.roles.admin],
  ["editor", text.roles.editor],
  ["press", text.roles.press],
  ["directory", text.roles.directory],
  ["community", text.roles.community],
  ["auditor", text.roles.auditor],
  ["social", text.roles.social],
];
const permissionOptions = [
  ["instagram:read", text.permissions.instagramRead],
  ["instagram:metrics", text.permissions.instagramMetrics],
  ["instagram:publish", text.permissions.instagramPublish],
];
const roleLabels = Object.fromEntries(roleOptions);

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
  if (!value) return text.noRecord;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? text.noRecord
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
      setError(text.validationRoleRequired);
      return;
    }
    if (form.password && form.password.length < 12) {
      setError(text.validationPasswordLength);
      return;
    }
    if (form.password !== form.passwordConfirmation) {
      setError(text.validationPasswordMismatch);
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
      setStatus(editing ? text.changesSaved : text.userCreated);
      onSaved(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer labelledBy="user-form-title" onClose={onCancel} panelClassName="user-drawer">
      <div className="user-drawer-header">
        <div>
          <p className="eyebrow">{editing ? text.editAccess : text.newAccess}</p>
          <h2 id="user-form-title">{editing ? user.username || user.email : text.addPerson}</h2>
        </div>
        <IconButton label={text.closePanel} onClick={onCancel}>
          ×
        </IconButton>
      </div>
      <p className="user-drawer-copy">{editing ? text.editDescription : text.createDescription}</p>
      <form className="user-form" onSubmit={submit}>
        <label>
          {text.username}
          <input
            autoComplete="off"
            pattern="[a-zA-Z0-9._-]+"
            required
            value={form.username}
            onChange={(event) => update("username", event.target.value)}
          />
          <small>{text.usernameHint}</small>
        </label>
        <label>
          {text.email}
          <input
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>
        <fieldset>
          <legend>{text.rolesLegend}</legend>
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
          <legend>{text.permissionsLegend}</legend>
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
          <small>{text.adminPermissionHint}</small>
        </fieldset>
        <label className="user-status-toggle">
          <span>
            <strong>{text.accountActive}</strong>
            <small>{text.accountInactiveHint}</small>
          </span>
          <input checked={form.active} onChange={(event) => update("active", event.target.checked)} type="checkbox" />
        </label>
        <fieldset className="user-password-fieldset">
          <legend>{editing ? text.changePassword : text.password}</legend>
          <label>
            <span className="sr-only">{editing ? text.newPassword : text.password}</span>
            <input
              autoComplete={editing ? "new-password" : "new-password"}
              minLength="12"
              placeholder={editing ? text.keepPasswordHint : text.minimumPasswordLength}
              required={!editing}
              type="password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">{text.repeatPassword}</span>
            <input
              autoComplete="new-password"
              minLength="12"
              placeholder={text.repeatPassword}
              required={!editing || Boolean(form.password)}
              type="password"
              value={form.passwordConfirmation}
              onChange={(event) => update("passwordConfirmation", event.target.value)}
            />
          </label>
        </fieldset>
        {error && <Notice tone="error">{error}</Notice>}
        {status && <Notice tone="success">{status}</Notice>}
        <div className="user-form-actions">
          <Button disabled={saving} variant="dark" type="submit">
            {saving ? text.saving : editing ? text.saveChanges : text.createUser}
          </Button>
          <Button onClick={onCancel} variant="ghost" type="button">
            {text.cancel}
          </Button>
        </div>
      </form>
    </Drawer>
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
      activeAccounts: users.filter((user) => user.active !== false).length,
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
              {text.backToAdmin}
            </Link>
            <p className="eyebrow">{text.adminEyebrow}</p>
            <h1>{text.pageTitle}</h1>
            <p className="users-hero-copy">{text.pageDescription}</p>
          </div>
          <div className="users-hero-note">
            <span className="users-hero-mark">◎</span>
            <strong>{text.adminsOnly}</strong>
            <span>{text.adminsOnlyDescription}</span>
          </div>
        </section>

        <section className="users-content" aria-labelledby="users-list-title">
          <div className="users-toolbar">
            <div>
              <p className="eyebrow">{text.directoryEyebrow}</p>
              <h2 id="users-list-title">{text.users}</h2>
            </div>
            <Button onClick={() => setCreating(true)} variant="dark" type="button">
              {text.newUser}
            </Button>
          </div>
          <div className="users-metrics" aria-label={text.summaryLabel}>
            <div className="users-metric users-metric-accent">
              <strong>{totals.total}</strong>
              <span>{text.accountTotal}</span>
            </div>
            <div className="users-metric">
              <strong>{totals.activeAccounts}</strong>
              <span>{text.activeAccounts}</span>
            </div>
            <div className="users-metric">
              <strong>{totals.admins}</strong>
              <span>{text.administrators}</span>
            </div>
          </div>
          <FilterBar className="users-filters" label={text.filtersLabel} role="search">
            <label className="users-search">
              <span className="sr-only">{text.searchUser}</span>
              <span aria-hidden="true">⌕</span>
              <input
                placeholder={text.searchPlaceholder}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">{text.filterByRole}</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="">{text.allRoles}</option>
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{text.filterByStatus}</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="active">{text.active}</option>
                <option value="inactive">{text.inactive}</option>
                <option value="all">{text.all}</option>
              </select>
            </label>
          </FilterBar>
          {error ? (
            <div className="users-empty users-empty-error" role="alert">
              <strong>{error}</strong>
              <span>{text.retryConnection}</span>
              <Button onClick={loadUsers} variant="ghost" type="button">
                {text.retry}
              </Button>
            </div>
          ) : loading ? (
            <div className="users-empty">{text.loadingUsers}</div>
          ) : visibleUsers.length ? (
            <DataTable
              aria-label={text.usersTable}
              className="users-table-wrap"
              columns={[
                {
                  key: "person",
                  label: text.person,
                  header: text.person,
                  render: (user) => (
                    <div className="user-identity">
                      <span className="user-avatar">{initials(user)}</span>
                      <span>
                        <strong>{user.username || text.noUsername}</strong>
                        <small>{user.email || text.noEmail}</small>
                      </span>
                    </div>
                  ),
                },
                {
                  key: "roles",
                  label: text.rolesLegend,
                  header: text.rolesLegend,
                  render: (user) => <RolePills roles={user.roles} />,
                },
                {
                  key: "status",
                  label: text.status,
                  header: text.status,
                  render: (user) => (
                    <StatusBadge
                      className={`user-status ${user.active === false ? "is-inactive" : ""}`}
                      tone={user.active === false ? "inactive" : "active"}
                    >
                      <i /> {user.active === false ? text.deactivated : text.activeSingular}
                    </StatusBadge>
                  ),
                },
                {
                  key: "updatedAt",
                  label: text.updatedAt,
                  header: text.updatedAt,
                  render: (user) => <span className="user-date">{formatDate(user.updatedAt || user.createdAt)}</span>,
                },
                {
                  key: "actions",
                  label: text.actions,
                  header: <span className="sr-only">{text.actions}</span>,
                  render: (user) => (
                    <button className="user-edit-button" onClick={() => setSelectedUser(user)} type="button">
                      {text.manage} <span aria-hidden="true">↗</span>
                    </button>
                  ),
                },
              ]}
              empty={null}
              rowClassName={(user) => (user.active === false ? "is-inactive" : "")}
              rowKey={(user) => user.id}
              rows={visibleUsers}
              tableClassName="users-table"
            />
          ) : (
            <div className="users-empty">
              <strong>{text.noUsersMatch}</strong>
              <span>{text.adjustFilters}</span>
            </div>
          )}
          <p className="users-footnote">
            {text.visibleAccounts({ visible: visibleUsers.length, total: users.length })}
          </p>
        </section>
      </div>
      {(creating || selectedUser) && (
        <UserForm
          key={selectedUser?.id || "new"}
          user={selectedUser}
          onCancel={() => {
            setCreating(false);
            setSelectedUser(null);
          }}
          onSaved={handleSaved}
        />
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

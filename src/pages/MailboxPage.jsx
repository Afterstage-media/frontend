import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthGate } from "../components/AuthGate.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { api } from "../services/api.js";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
        date,
      );
};

const messagePreview = (message) => (message.text || message.subject || "").replace(/\s+/g, " ").trim();
const splitDestinations = (value) =>
  String(value || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
const routeKindLabel = (kind) => (kind === "distribution" ? "Difusión" : "Personal");
const emptyRouteForm = { address: "", label: "", destinations: "" };

function MailboxContent({ actor }) {
  const [searchParams] = useSearchParams();
  const requestedThreadId = searchParams.get("thread") || "";
  const [threads, setThreads] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedId, setSelectedId] = useState(requestedThreadId);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [routesOpen, setRoutesOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState("");
  const [routeForm, setRouteForm] = useState(emptyRouteForm);

  const canManageRoutes = actor.roles.some((role) => role === "admin" || role === "editor");

  const loadMailbox = async () => {
    const [threadResult, routeResult] = await Promise.all([api("/api/mail/threads"), api("/api/mail/routes")]);
    const nextThreads = threadResult.threads || [];
    setThreads(nextThreads);
    setRoutes(routeResult.routes || []);
    setSelectedId((current) => (nextThreads.some((item) => item.id === current) ? current : nextThreads[0]?.id || ""));
  };

  useEffect(() => {
    loadMailbox()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setThread(null);
      setLoadingThread(false);
      return undefined;
    }
    let cancelled = false;
    setThread(null);
    setLoadingThread(true);
    api(`/api/mail/threads/${encodeURIComponent(selectedId)}`)
      .then(({ thread: nextThread }) => {
        if (cancelled) return;
        setThread(nextThread);
        setThreads((current) =>
          current.map((item) => (item.id === nextThread.id ? { ...item, unreadCount: 0 } : item)),
        );
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const routeByAddress = useMemo(() => new Map(routes.map((route) => [route.address, route])), [routes]);
  const routeForThread = (item) => routeByAddress.get(item.mailbox) || item;
  const threadKind = (item) => routeForThread(item)?.mailboxType || routeForThread(item)?.kind || "personal";
  const filteredThreads = useMemo(
    () => threads.filter((item) => filter === "all" || threadKind(item) === filter),
    [filter, routes, threads],
  );
  const unread = useMemo(() => threads.reduce((total, item) => total + (item.unreadCount || 0), 0), [threads]);
  const distributionRoutes = routes.filter((route) => route.kind === "distribution");
  const distributionCount = threads.filter((item) => threadKind(item) === "distribution").length;
  const personalCount = threads.filter((item) => threadKind(item) === "personal").length;

  const startRouteEdit = (route) => {
    setEditingRoute(route.address);
    setRouteForm({ address: route.address, label: route.label, destinations: route.destinations.join("\n") });
    setError("");
  };

  const resetRouteForm = () => {
    setEditingRoute("");
    setRouteForm(emptyRouteForm);
  };

  const saveRoute = async (event) => {
    event.preventDefault();
    const destinations = splitDestinations(routeForm.destinations);
    if (!routeForm.label.trim() || (!editingRoute && !routeForm.address.trim()) || !destinations.length) {
      setError("Completá el nombre, la dirección y al menos un destinatario.");
      return;
    }
    setSavingRoute(true);
    setError("");
    setStatus("");
    try {
      const body = { label: routeForm.label.trim(), kind: "distribution", destinations };
      if (editingRoute) {
        await api(`/api/mail/routes/${encodeURIComponent(editingRoute)}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setStatus("Difusión actualizada.");
      } else {
        await api("/api/mail/routes", {
          method: "POST",
          body: JSON.stringify({ address: routeForm.address.trim().toLowerCase(), ...body }),
        });
        setStatus("Difusión creada.");
      }
      resetRouteForm();
      await loadMailbox();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingRoute(false);
    }
  };

  const deleteRoute = async (route) => {
    if (!window.confirm(`¿Eliminar la difusión ${route.address}? Los mails futuros dejarán de usar esta lista.`))
      return;
    setError("");
    setStatus("");
    try {
      await api(`/api/mail/routes/${encodeURIComponent(route.address)}`, { method: "DELETE" });
      if (editingRoute === route.address) resetRouteForm();
      await loadMailbox();
      setStatus("Difusión eliminada.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!thread || !draft.trim()) return;
    setSending(true);
    setError("");
    setStatus("");
    try {
      const result = await api(`/api/mail/threads/${encodeURIComponent(thread.id)}/reply`, {
        method: "POST",
        body: JSON.stringify({ text: draft.trim() }),
      });
      setThread((current) => ({ ...current, messages: [...current.messages, result.message], unreadCount: 0 }));
      setThreads((current) =>
        current.map((item) =>
          item.id === thread.id
            ? {
                ...item,
                lastMessageAt: result.message.receivedAt,
                lastDirection: "outbound",
                preview: result.message.text,
              }
            : item,
        ),
      );
      setDraft("");
      setStatus("Respuesta enviada.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <section className="mailbox-page">
        <header className="mailbox-header">
          <div className="mailbox-heading">
            <div className="mailbox-heading-topline">
              <p className="eyebrow">Redacción / Correo</p>
              <span className="mailbox-live">
                <span aria-hidden="true" /> Bandeja activa
              </span>
            </div>
            <h1>Correo.</h1>
            <p>
              Leé y respondé lo que llega a cualquier dirección <strong>@afterstage.ar</strong>.
            </p>
          </div>
          <div className="mailbox-summary" aria-label={`${unread} mensajes sin leer`}>
            <span className="mailbox-summary-label">Sin leer</span>
            <strong>{unread}</strong>
            <span>{unread === 1 ? "mensaje nuevo" : "mensajes nuevos"}</span>
          </div>
        </header>
        <div className="mailbox-toolbar">
          <div className="mailbox-toolbar-main">
            <span className="mailbox-toolbar-label">Ver</span>
            <div className="mailbox-filters" aria-label="Filtrar conversaciones">
              {[
                ["all", `Todas · ${threads.length}`],
                ["personal", `Personales · ${personalCount}`],
                ["distribution", `Difusiones · ${distributionCount}`],
              ].map(([value, label]) => (
                <button
                  aria-pressed={filter === value}
                  className={`mailbox-filter${filter === value ? " is-active" : ""}`}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mailbox-toolbar-actions">
            <span className="mailbox-toolbar-count">{filteredThreads.length} conversaciones</span>
            {canManageRoutes && (
              <button
                className="button ghost mailbox-routes-toggle"
                onClick={() => setRoutesOpen((open) => !open)}
                type="button"
              >
                {routesOpen ? "Cerrar gestión" : "Gestionar difusiones"}
              </button>
            )}
          </div>
        </div>
        <ErrorMessage error={error} />
        {status && <p className="success">{status}</p>}
        {routesOpen && canManageRoutes && (
          <section className="mailbox-routes-panel" aria-label="Gestionar difusiones">
            <header>
              <div>
                <p className="eyebrow">Configuración de correo</p>
                <h2>Direcciones de difusión.</h2>
                <p>Administrá quién recibe cada alias grupal de Afterstage.</p>
              </div>
              <button className="button dark" onClick={resetRouteForm} type="button">
                Nueva difusión
              </button>
            </header>
            <div className="mailbox-routes-grid">
              <div className="mailbox-route-list">
                {!distributionRoutes.length && <p className="muted">Todavía no hay difusiones configuradas.</p>}
                {distributionRoutes.map((route) => (
                  <article className="mailbox-route-card" key={route.id}>
                    <div>
                      <div className="mailbox-route-card-title">
                        <strong>{route.label}</strong>
                        <span className="mailbox-kind mailbox-kind-distribution">Difusión</span>
                      </div>
                      <p>{route.address}</p>
                      <ul>
                        {route.destinations.map((destination) => (
                          <li key={destination}>{destination}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mailbox-route-actions">
                      <button className="button ghost" onClick={() => startRouteEdit(route)} type="button">
                        Editar
                      </button>
                      <button className="button ghost danger" onClick={() => deleteRoute(route)} type="button">
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <form className="mailbox-route-form" onSubmit={saveRoute}>
                <p className="eyebrow">{editingRoute ? "Editar difusión" : "Nueva difusión"}</p>
                <label>
                  Dirección de Afterstage
                  <input
                    disabled={Boolean(editingRoute)}
                    onChange={(event) => setRouteForm((current) => ({ ...current, address: event.target.value }))}
                    placeholder="equipo@afterstage.ar"
                    required={!editingRoute}
                    type="email"
                    value={routeForm.address}
                  />
                </label>
                <label>
                  Nombre visible
                  <input
                    onChange={(event) => setRouteForm((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Equipo de prensa"
                    required
                    value={routeForm.label}
                  />
                </label>
                <label>
                  Destinatarios
                  <textarea
                    onChange={(event) => setRouteForm((current) => ({ ...current, destinations: event.target.value }))}
                    placeholder="Una dirección por línea"
                    required
                    rows="5"
                    value={routeForm.destinations}
                  />
                </label>
                <div className="mailbox-route-form-actions">
                  {editingRoute && (
                    <button className="button ghost" onClick={resetRouteForm} type="button">
                      Cancelar
                    </button>
                  )}
                  <button className="button dark" disabled={savingRoute} type="submit">
                    {savingRoute ? "Guardando…" : editingRoute ? "Guardar cambios" : "Crear difusión"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
        {loading ? (
          <p className="muted">Cargando bandeja…</p>
        ) : (
          <div className="mailbox-layout">
            <aside className="mailbox-threads" aria-label="Conversaciones">
              <div className="mailbox-section-label">
                <span>Bandeja</span>
                <strong>{filteredThreads.length}</strong>
              </div>
              {!filteredThreads.length && <p className="muted mailbox-empty">No hay conversaciones en este filtro.</p>}
              {filteredThreads.map((item) => (
                <button
                  className={`mailbox-thread${item.id === selectedId ? " is-selected" : ""}`}
                  key={item.id}
                  onClick={() => {
                    setStatus("");
                    setSelectedId(item.id);
                  }}
                  type="button"
                >
                  <span className="mailbox-thread-topline">
                    <strong>{item.subject || "(sin asunto)"}</strong>
                    <time dateTime={item.lastMessageAt}>{formatDate(item.lastMessageAt)}</time>
                  </span>
                  <span className="mailbox-thread-participants">{item.participants?.join(", ")}</span>
                  <span className="mailbox-thread-preview">{item.preview || "Sin contenido"}</span>
                  <span className={`mailbox-kind mailbox-kind-${threadKind(item)}`}>
                    {routeKindLabel(threadKind(item))}
                  </span>
                  {item.unreadCount > 0 && <span className="mailbox-unread">{item.unreadCount}</span>}
                </button>
              ))}
            </aside>
            <section className="mailbox-conversation" aria-label="Conversación seleccionada">
              {!selectedId && <div className="mailbox-placeholder">Elegí una conversación para empezar.</div>}
              {loadingThread && <p className="muted mailbox-conversation-loading">Cargando conversación…</p>}
              {!loadingThread && thread && (
                <>
                  <header className="mailbox-conversation-header">
                    <div className="mailbox-conversation-kicker">
                      <p className="eyebrow">Conversación</p>
                      <span className={`mailbox-kind mailbox-kind-${thread.mailboxType || "personal"}`}>
                        {routeKindLabel(thread.mailboxType)}
                      </span>
                    </div>
                    <div>
                      <div className="mailbox-conversation-title">
                        <h2>{thread.subject || "(sin asunto)"}</h2>
                      </div>
                      <p className="mailbox-conversation-participants">{thread.participants?.join(" · ")}</p>
                      <p className="mailbox-conversation-mailbox">
                        Recibido en {thread.mailboxLabel || thread.mailbox || "una dirección personal"}
                      </p>
                    </div>
                  </header>
                  <div className="mailbox-messages">
                    {thread.messages.map((message) => (
                      <article className={`mailbox-message mailbox-message-${message.direction}`} key={message.id}>
                        <header>
                          <strong>{message.direction === "inbound" ? message.from : "Afterstage"}</strong>
                          <time dateTime={message.receivedAt}>{formatDate(message.receivedAt)}</time>
                        </header>
                        <p className="mailbox-message-to">Para: {message.to?.join(", ")}</p>
                        <div className="mailbox-message-body">{messagePreview(message)}</div>
                      </article>
                    ))}
                  </div>
                  <form className="mailbox-reply" onSubmit={sendReply}>
                    <div className="mailbox-reply-header">
                      <label htmlFor="mailbox-reply-text">Responder</label>
                      <span>
                        Para{" "}
                        {
                          thread.messages
                            .slice()
                            .reverse()
                            .find((item) => item.direction === "inbound")?.from
                        }
                      </span>
                    </div>
                    <textarea
                      id="mailbox-reply-text"
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Escribí una respuesta…"
                      rows="7"
                      value={draft}
                    />
                    <div className="mailbox-reply-actions">
                      <span className="muted">La respuesta saldrá desde Afterstage.</span>
                      <button className="button dark" disabled={sending || !draft.trim()} type="submit">
                        {sending ? "Enviando…" : "Enviar respuesta ↗"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        )}
      </section>
    </Layout>
  );
}

export function MailboxPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "community"]}>
      {(actor) => <MailboxContent actor={actor} />}
    </AuthGate>
  );
}

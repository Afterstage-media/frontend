import { useEffect, useMemo, useState } from "react";
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

function MailboxContent() {
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const loadThreads = async () => {
    const result = await api("/api/mail/threads");
    setThreads(result.threads || []);
    setSelectedId((current) => current || result.threads?.[0]?.id || "");
  };

  useEffect(() => {
    loadThreads()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setThread(null);
      return;
    }
    setLoadingThread(true);
    api(`/api/mail/threads/${encodeURIComponent(selectedId)}`)
      .then(({ thread: nextThread }) => {
        setThread(nextThread);
        setThreads((current) =>
          current.map((item) => (item.id === nextThread.id ? { ...item, unreadCount: 0 } : item)),
        );
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoadingThread(false));
  }, [selectedId]);

  const unread = useMemo(() => threads.reduce((total, item) => total + (item.unreadCount || 0), 0), [threads]);

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
          <div>
            <p className="eyebrow">Redacción / Correo</p>
            <h1>La bandeja de Afterstage.</h1>
            <p>
              Recibí, leé y respondé los mensajes que llegan a cualquier dirección <strong>@afterstage.ar</strong>.
            </p>
          </div>
          <div className="mailbox-count">
            <strong>{unread}</strong>
            <span>sin leer</span>
          </div>
        </header>
        <ErrorMessage error={error} />
        {status && <p className="success">{status}</p>}
        {loading ? (
          <p className="muted">Cargando bandeja…</p>
        ) : (
          <div className="mailbox-layout">
            <aside className="mailbox-threads" aria-label="Conversaciones">
              <div className="mailbox-section-label">Conversaciones · {threads.length}</div>
              {!threads.length && <p className="muted mailbox-empty">Todavía no llegó ningún mensaje.</p>}
              {threads.map((item) => (
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
                  {item.unreadCount > 0 && <span className="mailbox-unread">{item.unreadCount}</span>}
                </button>
              ))}
            </aside>
            <section className="mailbox-conversation" aria-label="Conversación seleccionada">
              {!selectedId && <div className="mailbox-placeholder">Elegí una conversación para empezar.</div>}
              {loadingThread && <p className="muted">Cargando conversación…</p>}
              {!loadingThread && thread && (
                <>
                  <header className="mailbox-conversation-header">
                    <div>
                      <p className="eyebrow">Conversación</p>
                      <h2>{thread.subject || "(sin asunto)"}</h2>
                      <p>{thread.participants?.join(" · ")}</p>
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
                    <label htmlFor="mailbox-reply-text">Responder</label>
                    <textarea
                      id="mailbox-reply-text"
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Escribí una respuesta…"
                      rows="7"
                      value={draft}
                    />
                    <div className="mailbox-reply-actions">
                      <span className="muted">
                        Se enviará a{" "}
                        {
                          thread.messages
                            .slice()
                            .reverse()
                            .find((item) => item.direction === "inbound")?.from
                        }
                      </span>
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
      <MailboxContent />
    </AuthGate>
  );
}

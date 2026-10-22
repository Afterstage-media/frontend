import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { AuthGate } from "../components/AuthGate.jsx";
import { TokenGate } from "./AdminPages.jsx";

const kinds = {
  band: "Banda",
  artist: "Artista",
  manager: "Manager",
  venue: "Sala / bar",
  festival: "Festival",
  label: "Sello",
  agency: "Agencia",
  media: "Medio",
  other: "Otro",
};
const directoryFieldLabels = {
  name: "Nombre",
  aliases: "También conocido como",
  description: "Descripción",
  city: "Ciudad",
  country: "País",
  latitude: "Latitud",
  longitude: "Longitud",
  website: "Sitio web",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  spotify: "Spotify",
  phones: "Teléfonos",
  emails: "Emails",
  contacts: "Contactos",
  tags: "Etiquetas",
  notes: "Notas internas",
  source: "Fuente",
};
const directoryFieldWidths = {
  name: "half",
  aliases: "half",
  description: "wide",
  city: "quarter",
  country: "quarter",
  latitude: "quarter",
  longitude: "quarter",
  website: "half",
  instagram: "third",
  facebook: "third",
  youtube: "third",
  tiktok: "third",
  spotify: "third",
  phones: "half",
  emails: "half",
  contacts: "wide",
  tags: "half",
  notes: "wide",
  source: "wide",
};
const empty = {
  kind: "band",
  name: "",
  aliases: "",
  description: "",
  city: "",
  country: "Argentina",
  latitude: "",
  longitude: "",
  website: "",
  instagram: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  spotify: "",
  phones: "",
  emails: "",
  contacts: "",
  tags: "",
  notes: "",
  source: "",
};
const split = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const toPayload = (data) => ({
  ...data,
  latitude: data.latitude ? Number(data.latitude) : null,
  longitude: data.longitude ? Number(data.longitude) : null,
  aliases: split(data.aliases),
  phones: split(data.phones),
  emails: split(data.emails),
  tags: split(data.tags),
  socials: {
    instagram: data.instagram,
    facebook: data.facebook,
    youtube: data.youtube,
    tiktok: data.tiktok,
    spotify: data.spotify,
    x: data.socials?.x || "",
    other: data.socials?.other || [],
  },
  contacts: String(data.contacts || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, role = "", email = "", phone = ""] = line.split("|").map((value) => value.trim());
      return { name, role, email, phone, socials: {}, notes: "" };
    }),
});
const formFromItem = (item) => ({
  ...empty,
  ...item,
  aliases: (item.aliases || []).join(", "),
  latitude: item.latitude ?? "",
  longitude: item.longitude ?? "",
  instagram: item.socials?.instagram || "",
  facebook: item.socials?.facebook || "",
  youtube: item.socials?.youtube || "",
  tiktok: item.socials?.tiktok || "",
  spotify: item.socials?.spotify || "",
  phones: (item.phones || []).join(", "),
  emails: (item.emails || []).join(", "),
  contacts: (item.contacts || [])
    .map((contact) => [contact.name, contact.role, contact.email, contact.phone].filter(Boolean).join(" | "))
    .join("\n"),
  tags: (item.tags || []).join(", "),
});
const verificationLabels = {
  unverified: "Sin verificar",
  verified: "Verificado",
  stale: "Dato viejo",
  incorrect: "Revisar",
};

function externalHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(www\.|instagram\.com|facebook\.com|youtube\.com|youtu\.be|tiktok\.com|spotify\.com)/i.test(raw)) {
    return `https://${raw}`;
  }
  return "";
}

function voteSummary(item) {
  const reliable = item.reliableVotes ?? 0;
  const unreliable = item.unreliableVotes ?? 0;
  const total = reliable + unreliable;
  if (!total) return "Todavía no hay votos";
  return `${Math.round((reliable / total) * 100)}% la considera confiable · ${total} ${total === 1 ? "voto" : "votos"}`;
}

function DirectoryCard({ item, onOpen, featured = false }) {
  const open = () => onOpen(item);
  return (
    <article
      className={`directory-card${featured ? " directory-card-featured" : ""}`}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex="0"
    >
      <div className="directory-card-topline">
        <span>{kinds[item.kind] || item.kind}</span>
        <span>{item.city || item.country || "Ubicación no informada"}</span>
      </div>
      <div className="directory-card-status">
        <span className={`verification-dot verification-dot-${item.verificationStatus || "unverified"}`} />
        {verificationLabels[item.verificationStatus] || "Sin verificar"}
        <span aria-hidden="true">·</span>
        {item.reliabilityScore ?? 0}% editorial
      </div>
      <h2>{item.name}</h2>
      <p>{item.description || "Esta ficha todavía necesita una descripción."}</p>
      <div className="directory-card-bottom">
        <span className="directory-card-votes">{voteSummary(item)}</span>
        <span className="directory-card-link">
          Ver ficha <span aria-hidden="true">↗</span>
        </span>
      </div>
    </article>
  );
}

function DetailField({ label, children }) {
  return (
    <div className="detail-field">
      <dt>{label}</dt>
      <dd>{children || <span className="muted">No informado</span>}</dd>
    </div>
  );
}

function DirectoryEditForm({ item, isNew = false, onCancel, onSaved }) {
  const [form, setForm] = useState(() => formFromItem(item));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await api(isNew ? "/api/directory" : `/api/directory/${item.id}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(toPayload(form)),
      });
      onSaved(updated);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="directory-edit-form" onSubmit={submit}>
      <div className="detail-panel-heading">
        <div>
          <p className="eyebrow">{isNew ? "Carga editorial" : "Editar ficha"}</p>
          <h2>{isNew ? "Nueva ficha" : "Actualizar datos"}</h2>
        </div>
        <button className="icon-button" onClick={onCancel} type="button" aria-label="Cerrar edición">
          ×
        </button>
      </div>
      <p className="muted">
        {isNew
          ? "Cargá los datos confirmados. Después podés completar o corregir la ficha desde el directorio."
          : "Los cambios se guardan en el directorio interno. Revisá especialmente contactos y enlaces."}
      </p>
      <div className="edit-grid">
        <label>
          Nombre
          <input required value={form.name} onChange={(event) => update("name", event.target.value)} />
        </label>
        <label>
          Tipo
          <select value={form.kind} onChange={(event) => update("kind", event.target.value)}>
            {Object.entries(kinds).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ciudad
          <input value={form.city} onChange={(event) => update("city", event.target.value)} />
        </label>
        <label>
          País
          <input value={form.country} onChange={(event) => update("country", event.target.value)} />
        </label>
      </div>
      <label>
        También conocido como
        <input
          value={form.aliases}
          onChange={(event) => update("aliases", event.target.value)}
          placeholder="Separados por coma"
        />
      </label>
      <label>
        Descripción
        <textarea rows="4" value={form.description} onChange={(event) => update("description", event.target.value)} />
      </label>
      <div className="edit-grid">
        <label>
          Latitud
          <input
            inputMode="decimal"
            value={form.latitude}
            onChange={(event) => update("latitude", event.target.value)}
          />
        </label>
        <label>
          Longitud
          <input
            inputMode="decimal"
            value={form.longitude}
            onChange={(event) => update("longitude", event.target.value)}
          />
        </label>
      </div>
      <label>
        Sitio web
        <input
          type="url"
          value={form.website}
          onChange={(event) => update("website", event.target.value)}
          placeholder="https://"
        />
      </label>
      <div className="edit-grid">
        {[
          ["instagram", "Instagram"],
          ["facebook", "Facebook"],
          ["youtube", "YouTube"],
          ["tiktok", "TikTok"],
          ["spotify", "Spotify"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder="https://" />
          </label>
        ))}
      </div>
      <div className="edit-grid">
        <label>
          Teléfonos
          <input
            value={form.phones}
            onChange={(event) => update("phones", event.target.value)}
            placeholder="Separados por coma"
          />
        </label>
        <label>
          Emails
          <input
            value={form.emails}
            onChange={(event) => update("emails", event.target.value)}
            placeholder="Separados por coma"
          />
        </label>
      </div>
      <label>
        Contactos
        <textarea
          rows="3"
          value={form.contacts}
          onChange={(event) => update("contacts", event.target.value)}
          placeholder="Nombre | rol | email | teléfono (una línea por persona)"
        />
      </label>
      <label>
        Etiquetas
        <input
          value={form.tags}
          onChange={(event) => update("tags", event.target.value)}
          placeholder="Separadas por coma"
        />
      </label>
      <label>
        Notas internas
        <textarea rows="3" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
      </label>
      <label>
        Fuente
        <input value={form.source} onChange={(event) => update("source", event.target.value)} />
      </label>
      <ErrorMessage error={error} />
      <div className="detail-actions">
        <button className="button dark" disabled={saving} type="submit">
          {saving ? "Guardando…" : isNew ? "Crear ficha" : "Guardar cambios"}
        </button>
        <button className="button ghost" onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function DirectoryDetail({ item, canEdit, onClose, onUpdated }) {
  const closeButtonRef = useRef(null);
  const [detail, setDetail] = useState(item);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState("");
  const [myVote, setMyVote] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("afterstage-directory-votes") || "{}")[item.id] || "";
    } catch {
      return "";
    }
  });
  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    let cancelled = false;
    api(`/api/directory/${item.id}`)
      .then((fullItem) => {
        if (!cancelled) setDetail(fullItem);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [item.id, onClose]);
  const saveUpdated = (updated) => {
    setDetail(updated);
    setEditing(false);
    onUpdated(updated);
  };
  const submitVote = async (vote) => {
    if (myVote) return;
    setVoting(true);
    setVoteMessage("");
    try {
      const updated = await api(`/api/directory/${detail.id}/vote`, { method: "POST", body: JSON.stringify({ vote }) });
      const votes = JSON.parse(localStorage.getItem("afterstage-directory-votes") || "{}");
      votes[detail.id] = vote;
      localStorage.setItem("afterstage-directory-votes", JSON.stringify(votes));
      setMyVote(vote);
      setDetail(updated);
      onUpdated(updated);
      setVoteMessage("Gracias. Tu voto ayuda a mantener este mapa actualizado.");
    } catch (requestError) {
      setVoteMessage(requestError.message);
    } finally {
      setVoting(false);
    }
  };
  const socials = Object.entries(detail.socials || {}).filter(([, value]) => value && !Array.isArray(value));
  const totalVotes = (detail.reliableVotes ?? 0) + (detail.unreliableVotes ?? 0);
  return (
    <div className="detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside aria-labelledby="directory-detail-title" aria-modal="true" className="detail-panel" role="dialog">
        {editing ? (
          <DirectoryEditForm item={detail} onCancel={() => setEditing(false)} onSaved={saveUpdated} />
        ) : (
          <>
            <div className="detail-panel-heading">
              <div>
                <p className="eyebrow">Ficha de directorio</p>
                <p className="detail-kind">
                  {kinds[detail.kind] || detail.kind} {detail.city ? `· ${detail.city}` : ""}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                className="icon-button"
                onClick={onClose}
                type="button"
                aria-label="Cerrar ficha"
              >
                ×
              </button>
            </div>
            <h2 id="directory-detail-title" className="detail-title">
              {detail.name}
            </h2>
            {detail.aliases?.length > 0 && (
              <p className="detail-aliases">También conocido como {detail.aliases.join(" · ")}</p>
            )}
            <div className={`detail-verification detail-verification-${detail.verificationStatus || "unverified"}`}>
              <span className="verification-dot" />
              <div>
                <strong>{verificationLabels[detail.verificationStatus] || "Sin verificar"}</strong>
                <span>{detail.reliabilityScore ?? 0}% de confiabilidad editorial</span>
              </div>
            </div>
            {loading ? (
              <p className="muted">Cargando datos completos…</p>
            ) : (
              <>
                <p className="detail-description">
                  {detail.description || "No hay una descripción cargada para esta ficha."}
                </p>
                <dl className="detail-fields">
                  <DetailField label="Ubicación">
                    {[detail.city, detail.country].filter(Boolean).join(", ")}
                  </DetailField>
                  <DetailField label="Coordenadas">
                    {detail.latitude !== null && detail.longitude !== null
                      ? `${detail.latitude}, ${detail.longitude}`
                      : ""}
                  </DetailField>
                  <DetailField label="Teléfonos">{detail.phones?.join(" · ")}</DetailField>
                  <DetailField label="Emails">{detail.emails?.join(" · ")}</DetailField>
                  <DetailField label="Fuente">{detail.source}</DetailField>
                  <DetailField label="Última actualización">
                    {detail.updatedAt ? new Date(detail.updatedAt).toLocaleDateString("es-AR") : ""}
                  </DetailField>
                </dl>
                {detail.website && (
                  <p className="detail-website">
                    <a href={detail.website} target="_blank" rel="noreferrer">
                      Visitar sitio web ↗
                    </a>
                  </p>
                )}
                {detail.contacts?.length > 0 && (
                  <section className="detail-section">
                    <h3>Contactos</h3>
                    <div className="contact-list">
                      {detail.contacts.map((contact, index) => (
                        <div className="contact-row" key={`${contact.name}-${index}`}>
                          <strong>{contact.name}</strong>
                          <span>{[contact.role, contact.email, contact.phone].filter(Boolean).join(" · ")}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {socials.length > 0 && (
                  <section className="detail-section">
                    <h3>Enlaces</h3>
                    <div className="detail-links">
                      {socials.map(([key, value]) =>
                        externalHref(value) ? (
                          <a href={externalHref(value)} key={key} rel="noreferrer" target="_blank">
                            {key} <span>{value}</span>
                          </a>
                        ) : (
                          <div className="detail-link-row" key={key}>
                            <strong>{key}</strong> <span>{value}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                )}
                {detail.tags?.length > 0 && (
                  <div className="tag-list">
                    {detail.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </>
            )}
            <section className="trust-box">
              <div>
                <p className="eyebrow">Señal de la comunidad</p>
                <h3>¿Estos datos siguen siendo confiables?</h3>
                <p>{voteSummary(detail)}</p>
              </div>
              <div
                className="vote-meter"
                aria-label={`${detail.reliableVotes ?? 0} votos confiables y ${detail.unreliableVotes ?? 0} votos para revisar`}
              >
                <span style={{ width: `${totalVotes ? ((detail.reliableVotes ?? 0) / totalVotes) * 100 : 0}%` }} />
              </div>
              <div className="vote-actions">
                <button
                  className={`vote-button ${myVote === "reliable" ? "is-selected" : ""}`}
                  disabled={Boolean(myVote) || voting}
                  onClick={() => submitVote("reliable")}
                  type="button"
                >
                  <span>↑</span> Sí, es confiable
                </button>
                <button
                  className={`vote-button ${myVote === "needs_review" ? "is-selected is-negative" : ""}`}
                  disabled={Boolean(myVote) || voting}
                  onClick={() => submitVote("needs_review")}
                  type="button"
                >
                  <span>↓</span> Necesita revisión
                </button>
              </div>
              {myVote ? <p className="vote-note">Ya registraste tu voto para esta ficha.</p> : null}
              {voteMessage ? <p className="vote-note">{voteMessage}</p> : null}
            </section>
            <div className="detail-actions">
              <button className="button dark" disabled={!canEdit} onClick={() => setEditing(true)} type="button">
                Editar datos
              </button>
              <button className="button ghost" onClick={onClose} type="button">
                Cerrar
              </button>
            </div>
            {!canEdit && (
              <p className="detail-permission-note">Solo los roles de directorio pueden editar esta ficha.</p>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function DirectoryCreatePanel({ onClose, onSaved }) {
  return (
    <div className="detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside aria-label="Nueva ficha de directorio" aria-modal="true" className="detail-panel" role="dialog">
        <DirectoryEditForm item={empty} isNew onCancel={onClose} onSaved={onSaved} />
      </aside>
    </div>
  );
}

function DirectoryBrowser({ user }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [location, setLocation] = useState({ lat: "", lng: "", radiusKm: "50" });
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const closeDetail = useCallback(() => setSelected(null), []);
  const canEdit = (user?.roles || []).some((role) => ["admin", "editor", "press", "directory"].includes(role));
  const load = () => {
    const geo =
      location.lat && location.lng ? `&lat=${location.lat}&lng=${location.lng}&radiusKm=${location.radiusKm}` : "";
    setLoading(true);
    api(`/api/public/directory?q=${encodeURIComponent(query)}${geo}`)
      .then(setItems)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [query]);
  const updateItem = (updated) => {
    setItems((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    setSelected((current) => (current?.id === updated.id ? { ...current, ...updated } : current));
  };
  const createItem = (created) => {
    setItems((current) => [created, ...current]);
    setCreating(false);
    setSelected(created);
  };
  const visibleItems = kind === "all" ? items : items.filter((item) => item.kind === kind);
  const availableKinds = Object.entries(kinds).filter(([value]) => items.some((item) => item.kind === value));
  const verifiedCount = visibleItems.filter((item) => item.verificationStatus === "verified").length;
  const voteCount = visibleItems.reduce(
    (sum, item) => sum + (item.reliableVotes ?? 0) + (item.unreliableVotes ?? 0),
    0,
  );
  return (
    <Layout>
      <section className="directory-intro">
        <div className="directory-intro-copy">
          <p className="eyebrow">Escena · datos colaborativos</p>
          <h1>
            El mapa vivo
            <br />
            <em>de la escena.</em>
          </h1>
          <p>
            Un directorio para encontrar a quienes hacen, producen y sostienen la música independiente. Abrí cada ficha
            para consultar los datos completos, corregirlos o dejar una señal.
          </p>
          {canEdit && (
            <div className="directory-intro-actions">
              <button className="button dark" onClick={() => setCreating(true)} type="button">
                Nuevo ↗
              </button>
            </div>
          )}
        </div>
        <div className="directory-intro-note">
          <span className="intro-note-mark">✦</span>
          <p>La información se revisa desde redacción y también se construye con la mirada de la comunidad.</p>
          <span className="intro-note-caption">Una herramienta de Afterstage</span>
        </div>
      </section>
      <section className="directory-workspace">
        <div className="directory-stats">
          <div>
            <strong>{visibleItems.length}</strong>
            <span>{kind === "all" ? "fichas en esta búsqueda" : `${kinds[kind]} en esta búsqueda`}</span>
          </div>
          <div>
            <strong>{verifiedCount}</strong>
            <span>con revisión editorial</span>
          </div>
          <div>
            <strong>{voteCount}</strong>
            <span>señales de la comunidad</span>
          </div>
        </div>
        <div className="directory-toolbar">
          <label className="directory-search">
            <span>Buscar en el directorio</span>
            <input
              aria-label="Buscar en el directorio"
              placeholder="Nombre, ciudad, tipo o etiqueta"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="directory-type-filter">
            <span className="directory-filter-label">Filtrar por tipo</span>
            <div className="directory-type-options" role="group" aria-label="Filtrar por tipo">
              <button
                aria-pressed={kind === "all"}
                className={`directory-type-button ${kind === "all" ? "is-active" : ""}`}
                onClick={() => setKind("all")}
                type="button"
              >
                Todos <small>{items.length}</small>
              </button>
              {availableKinds.map(([value, label]) => {
                const count = items.filter((item) => item.kind === value).length;
                return (
                  <button
                    aria-pressed={kind === value}
                    className={`directory-type-button ${kind === value ? "is-active" : ""}`}
                    key={value}
                    onClick={() => setKind(value)}
                    type="button"
                  >
                    {label} <small>{count}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <details className="distance-filter">
            <summary>Buscar por distancia</summary>
            <div className="distance-fields">
              <label>
                Latitud
                <input
                  inputMode="decimal"
                  value={location.lat}
                  onChange={(event) => setLocation({ ...location, lat: event.target.value })}
                />
              </label>
              <label>
                Longitud
                <input
                  inputMode="decimal"
                  value={location.lng}
                  onChange={(event) => setLocation({ ...location, lng: event.target.value })}
                />
              </label>
              <label>
                Radio km
                <input
                  type="number"
                  min="1"
                  value={location.radiusKm}
                  onChange={(event) => setLocation({ ...location, radiusKm: event.target.value })}
                />
              </label>
              <button className="button" onClick={load} type="button">
                Aplicar
              </button>
            </div>
          </details>
        </div>
        <ErrorMessage error={error} />
        {loading ? (
          <div className="directory-empty">
            <span className="ui-state-dot" />
            <p>Cargando fichas…</p>
          </div>
        ) : items.length && visibleItems.length ? (
          <div className="directory-grid">
            {visibleItems.map((item, index) => (
              <DirectoryCard featured={index === 0} item={item} key={item.id} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <div className="directory-empty">
            <strong>{items.length ? "No hay fichas de este tipo." : "No encontramos esa ficha."}</strong>
            <p>
              {items.length
                ? "Probá con otro filtro o volvé a ver todos los tipos."
                : "Probá con otro nombre, ciudad o etiqueta."}
            </p>
            {items.length > 0 && visibleItems.length === 0 && (
              <button className="button button-secondary" onClick={() => setKind("all")} type="button">
                Ver todos los tipos
              </button>
            )}
          </div>
        )}
      </section>
      {creating && <DirectoryCreatePanel onClose={() => setCreating(false)} onSaved={createItem} />}
      {selected && <DirectoryDetail canEdit={canEdit} item={selected} onClose={closeDetail} onUpdated={updateItem} />}
    </Layout>
  );
}

export function DirectoryPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "directory", "auditor"]}>
      {(user) => <DirectoryBrowser user={user} />}
    </AuthGate>
  );
}

function AdminCards({ items, onVerify, scores = {}, onScoreChange }) {
  return (
    <div className="directory-admin-cards">
      {items.map((item) => (
        <article className="directory-admin-card" key={item.id}>
          <div className="directory-admin-card-meta">
            {kinds[item.kind] || item.kind} · {item.city || item.country}
          </div>
          <p className={`directory-admin-card-status verification-badge verification-${item.verificationStatus}`}>
            {verificationLabels[item.verificationStatus] || "Sin verificar"} · {item.reliabilityScore ?? 0}% editorial
          </p>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <div className="verification-actions">
            <label>
              Fiabilidad %
              <input
                type="number"
                min="0"
                max="100"
                value={scores[item.id] ?? item.reliabilityScore ?? 0}
                onChange={(event) => onScoreChange(item.id, event.target.value)}
              />
            </label>
            <button type="button" className="button" onClick={() => onVerify(item.id, "verified")}>
              Correcto
            </button>
            <button type="button" className="button ghost" onClick={() => onVerify(item.id, "stale")}>
              Marcar viejo
            </button>
            <button type="button" className="button ghost" onClick={() => onVerify(item.id, "incorrect")}>
              Incorrecto
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminDirectoryEditor() {
  const [authorized, setAuthorized] = useState(Boolean(localStorage.getItem("afterstage-token")));
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [scores, setScores] = useState({});
  const load = () =>
    api(`/api/directory?q=${encodeURIComponent(query)}`)
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (authorized) load();
  }, [query, authorized]);
  if (!authorized)
    return (
      <Layout>
        <TokenGate onReady={() => setAuthorized(true)} />
      </Layout>
    );
  const submit = async (event) => {
    event.preventDefault();
    try {
      await api("/api/directory", { method: "POST", body: JSON.stringify(toPayload(form)) });
      setForm(empty);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const verify = async (id, status) => {
    try {
      const item = items.find((entry) => entry.id === id);
      await api(`/api/directory/${id}/verification`, {
        method: "POST",
        body: JSON.stringify({ status, reliabilityScore: Number(scores[id] ?? item?.reliabilityScore ?? 0) }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Redacción</p>
        <h1>Directorio.</h1>
        <p>Los contactos privados sólo están disponibles para usuarios autorizados.</p>
        <Link to="/admin">← Volver al panel</Link>
        <ErrorMessage error={error} />
      </section>
      <section className="admin-directory-content">
        <form className="admin-directory-form" onSubmit={submit}>
          <div className="admin-directory-form-heading">
            <div>
              <p className="eyebrow">Carga editorial</p>
              <h2>Nueva entrada</h2>
            </div>
            <p>Completá sólo lo que esté confirmado. El resto puede quedar para una próxima revisión.</p>
          </div>
          <div className="admin-directory-fields">
            <label className="admin-directory-field admin-directory-field-half">
              Tipo
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(kinds).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {Object.keys(empty)
              .filter((key) => key !== "kind")
              .map((key) => (
                <label
                  className={`admin-directory-field admin-directory-field-${directoryFieldWidths[key] || "wide"}`}
                  key={key}
                >
                  {directoryFieldLabels[key] || key}
                  {["description", "notes", "contacts"].includes(key) ? (
                    <textarea
                      rows="3"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={key === "contacts" ? "Nombre | rol | email | teléfono (una línea por persona)" : ""}
                    />
                  ) : (
                    <input
                      type={key === "website" ? "url" : "text"}
                      required={key === "name"}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  )}
                </label>
              ))}
          </div>
          <div className="admin-directory-form-actions">
            <p>Los datos quedan disponibles para revisión editorial antes de publicarse.</p>
            <button className="button dark">Guardar entrada</button>
          </div>
        </form>
        <div className="admin-directory-toolbar">
          <label>
            <span>Buscar en el directorio</span>
            <input placeholder="Nombre, ciudad o tipo" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <span>{items.length} entradas cargadas</span>
        </div>
        <AdminCards
          items={items}
          onVerify={verify}
          scores={scores}
          onScoreChange={(id, value) => setScores((current) => ({ ...current, [id]: value }))}
        />
      </section>
    </Layout>
  );
}

export function AdminDirectoryPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "directory"]}>
      <AdminDirectoryEditor />
    </AuthGate>
  );
}

import { useEffect, useState } from "react";
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
    x: "",
    other: [],
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

const verificationLabels = {
  unverified: "Sin verificar",
  verified: "Correcto",
  stale: "Dato viejo",
  incorrect: "Incorrecto",
};

function Cards({ items, onVerify, scores = {}, onScoreChange }) {
  return (
    <div className="cards">
      {items.map((item) => (
        <article className="card" key={item.id}>
          <small>
            {kinds[item.kind] || item.kind} · {item.city || item.country}
            {item.distanceKm !== undefined ? ` · ${item.distanceKm} km` : ""}
          </small>
          <p className={`verification-badge verification-${item.verificationStatus}`}>
            {verificationLabels[item.verificationStatus] || "Sin verificar"} · {item.reliabilityScore ?? 0}% fiable
          </p>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          {item.website && (
            <a href={item.website} target="_blank" rel="noreferrer">
              Sitio ↗
            </a>
          )}
          <div className="muted">
            {Object.entries(item.socials || {})
              .filter(([, value]) => value && !Array.isArray(value))
              .map(([key, value]) => (
                <span key={key}>
                  {" "}
                  · {key}: {value}
                </span>
              ))}
          </div>
          {onVerify && (
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
          )}
        </article>
      ))}
    </div>
  );
}

function DirectoryBrowser() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState({
    lat: "",
    lng: "",
    radiusKm: "50",
  });
  const [error, setError] = useState("");
  const load = () => {
    const geo =
      location.lat && location.lng ? `&lat=${location.lat}&lng=${location.lng}&radiusKm=${location.radiusKm}` : "";
    api(`/api/public/directory?q=${encodeURIComponent(query)}${geo}`)
      .then(setItems)
      .catch((e) => setError(e.message));
  };
  useEffect(() => {
    load();
  }, [query]);
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Escena</p>
        <h1>Directorio.</h1>
        <p>Bandas, artistas, managers, salas, bares, festivales y organizaciones de la escena musical.</p>
        <div className="actions editor-tools">
          <input
            aria-label="Buscar directorio"
            placeholder="Buscar por nombre, ciudad o etiqueta"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            placeholder="Latitud"
            value={location.lat}
            onChange={(e) => setLocation({ ...location, lat: e.target.value })}
          />
          <input
            placeholder="Longitud"
            value={location.lng}
            onChange={(e) => setLocation({ ...location, lng: e.target.value })}
          />
          <input
            type="number"
            min="1"
            placeholder="Radio km"
            value={location.radiusKm}
            onChange={(e) => setLocation({ ...location, radiusKm: e.target.value })}
          />
          <button className="button" onClick={load}>
            Filtrar distancia
          </button>
        </div>
        <ErrorMessage error={error} />
      </section>
      <Cards items={items} />
    </Layout>
  );
}

export function DirectoryPage() {
  return (
    <AuthGate allowedRoles={["admin", "editor", "press", "directory", "auditor"]}>
      <DirectoryBrowser />
    </AuthGate>
  );
}

function AdminDirectoryEditor() {
  const [authorized, setAuthorized] = useState(Boolean(localStorage.getItem("medio-under-token")));
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
      await api("/api/directory", {
        method: "POST",
        body: JSON.stringify(toPayload(form)),
      });
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
        body: JSON.stringify({
          status,
          reliabilityScore: Number(scores[id] ?? item?.reliabilityScore ?? 0),
        }),
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
      <form className="form editor-form" onSubmit={submit}>
        <h2>Nueva entrada</h2>
        <label>
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
            <label key={key}>
              {key}
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
        <button className="button dark">Guardar entrada</button>
      </form>
      <div className="actions editor-tools">
        <input placeholder="Buscar directorio" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <Cards
        items={items}
        onVerify={verify}
        scores={scores}
        onScoreChange={(id, value) => setScores((current) => ({ ...current, [id]: value }))}
      />
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

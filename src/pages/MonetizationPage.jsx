import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";

const initial = {
  productId: "",
  customerName: "",
  customerEmail: "",
  organization: "",
  title: "",
  description: "",
  eventDate: "",
  city: "",
  instagram: "",
  website: "",
  notes: "",
  contactPreference: "email",
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validatePromotionForm = (values) => {
  if (!values.customerName.trim()) return "Ingresá tu nombre y apellido.";
  if (!values.customerEmail.trim()) return "Ingresá un email para poder contactarte.";
  if (!isEmail(values.customerEmail.trim())) return "Ingresá un email válido para poder contactarte.";
  if (!values.title.trim()) return "Ingresá un título para tu propuesta.";
  if (values.description.trim().length < 10) return "La descripción debe tener al menos 10 caracteres.";
  return "";
};

const normalizePromotionForm = (values) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
  );

const invalidFieldMessages = {
  customerName: "Ingresá tu nombre y apellido.",
  customerEmail: "Ingresá un email para poder contactarte.",
  title: "Ingresá un título para tu propuesta.",
  description: "La descripción debe tener al menos 10 caracteres.",
};

const promotionStatusLabels = {
  pending_payment: "Pendiente de pago",
  paid: "Pago recibido",
  in_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  fulfilled: "Entregada",
  cancelled: "Cancelada",
};

const promotionProductLabels = {
  "evento-destacado": "Evento destacado",
  "pack-difusion": "Pack difusión",
  "publicacion-promocionada": "Publicación promocionada",
  "lanzamiento-musical": "Lanzamiento musical",
  "press-kit-express": "Press kit express",
  "aviso-clasificado": "Aviso clasificado",
  "cobertura-foto-video": "Cobertura foto/video",
  "contenido-para-redes": "Contenido para redes",
  "pasarela-entradas": "Pasarela de entradas",
  "promocion-festivales": "Promoción de festivales",
  "organizacion-festivales": "Organización de festivales",
  "publicidad-viajes-conciertos": "Publicidad de viajes",
  "tienda-merch": "Tienda de merch",
};

const humanizeIdentifier = (value, labels = {}) =>
  labels[value] ||
  String(value || "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function MonetizationPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api("/api/public/monetization/products")
      .then((items) => {
        setProducts(items);
        const requestedProductId = searchParams.get("service");
        const requestedProduct = items.find((item) => item.id === requestedProductId);
        setForm((current) => ({
          ...current,
          productId: current.productId || requestedProduct?.id || items[0]?.id || "",
        }));
      })
      .catch((e) => setError(e.message));
  }, []);
  const selected = products.find((product) => product.id === form.productId);
  const change = (event) => {
    setError("");
    setForm({ ...form, [event.target.name]: event.target.value });
  };
  const invalid = (event) => {
    event.preventDefault();
    setError(invalidFieldMessages[event.target.name] || "Completá los campos obligatorios.");
  };
  const submit = async (event) => {
    event.preventDefault();
    const validationError = validatePromotionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/public/promotions", {
        method: "POST",
        body: JSON.stringify(normalizePromotionForm(form)),
      });
      setResult(data);
      if (data.paymentUrl) window.location.assign(data.paymentUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  if (result && !result.paymentUrl)
    return (
      <Layout>
        <section className="page-intro">
          <p className="eyebrow">Solicitud recibida</p>
          <h1>Ya estamos en contacto.</h1>
          <p>Guardamos tu pedido. El equipo de afterstage te va a escribir para coordinar el servicio y el pago.</p>
          <p className="muted">Código: {result.id}</p>
        </section>
      </Layout>
    );
  return (
    <Layout>
      <section className="page-intro service-request-intro">
        <Link className="service-back-link" to="/servicios">
          ← Volver a servicios
        </Link>
        <p className="eyebrow">Abrir una conversación</p>
        <h1>{selected?.name || "Pongamos algo en movimiento."}</h1>
        <p>{selected?.description || "Elegí un servicio y contanos qué necesitás para hacerlo realidad."}</p>
      </section>
      <section className="service-request-layout">
        <aside className="service-request-note">
          <p className="eyebrow">Tu pedido</p>
          <h2>{selected?.name || "Elegí un servicio"}</h2>
          <p>{selected?.delivery || "Te respondemos con el próximo paso."}</p>
          <label>
            Cambiar servicio
            <select name="productId" value={form.productId} onChange={change}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <Link className="text-link" to="/servicios">
            Ver cómo se distribuyen los servicios <span>↗</span>
          </Link>
        </aside>
        <form className="form editor-form" noValidate onInvalid={invalid} onSubmit={submit}>
          <h2>Contanos un poco más.</h2>
          <p className="muted">Completá los datos y te confirmamos el próximo paso.</p>
          {[
            ["customerName", "Nombre y apellido", "text", true],
            ["customerEmail", "Email", "email", true],
            ["organization", "Banda, proyecto u organización", "text"],
            ["title", "Título de tu propuesta", "text", true],
            ["city", "Ciudad", "text"],
            ["eventDate", "Fecha", "date"],
            ["instagram", "Instagram", "text"],
            ["website", "Website", "url"],
          ].map(([name, label, type, required]) => (
            <label key={name}>
              {label}
              <input name={name} type={type} value={form[name]} onChange={change} required={required} />
            </label>
          ))}
          <label>
            Descripción
            <textarea name="description" value={form.description} onChange={change} minLength="10" required />
          </label>
          <label>
            Notas
            <textarea name="notes" value={form.notes} onChange={change} />
          </label>
          <label>
            Preferencia de contacto
            <select name="contactPreference" value={form.contactPreference} onChange={change}>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
          </label>
          <ErrorMessage error={error} />
          <button type="submit" className="button dark" disabled={loading || !selected}>
            {loading ? "Enviando…" : selected?.priceArs ? "Continuar al pago ↗" : "Pedir presupuesto"}
          </button>
        </form>
      </section>
    </Layout>
  );
}

export function AdminMonetizationPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = () =>
    api(`/api/monetization/promotions${status ? `?status=${status}` : ""}`)
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(load, [status]);
  const update = async (id, nextStatus, featuredUntil) => {
    setError("");
    setNotice("");
    try {
      await api(`/api/monetization/promotions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          ...(featuredUntil ? { featuredUntil: new Date(`${featuredUntil}T23:59:59`).toISOString() } : {}),
        }),
      });
      setNotice("Solicitud actualizada.");
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Operación</p>
        <h1>Monetización.</h1>
        <div className="actions">
          <label className="sr-only" htmlFor="promotion-status-filter">
            Filtrar solicitudes por estado
          </label>
          <select id="promotion-status-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(promotionStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>
      <ErrorMessage error={error} />
      {notice && <p className="success content-section">{notice}</p>}
      <div className="admin-list">
        {items.map((item) => (
          <article className="admin-record" key={item.id}>
            <div>
              <small>
                {humanizeIdentifier(item.status, promotionStatusLabels)} ·{" "}
                {humanizeIdentifier(item.productId, promotionProductLabels)} ·{" "}
                {new Date(item.createdAt).toLocaleString("es-AR")}
              </small>
              <h3>{item.title}</h3>
              <p>
                {item.customerName} · {item.customerEmail} · {item.organization}
              </p>
              <p>{item.description}</p>
            </div>
            <div className="actions">
              <label>
                Destacada hasta
                <input
                  aria-label="Fecha de destacado"
                  type="date"
                  defaultValue={item.featuredUntil?.slice(0, 10) || ""}
                  onChange={(e) => update(item.id, item.status, e.target.value)}
                />
              </label>
              <button className="button" onClick={() => update(item.id, "in_review")} type="button">
                Pasar a revisión
              </button>
              <button className="button" onClick={() => update(item.id, "approved")} type="button">
                Aprobar
              </button>
              <button className="button ghost" onClick={() => update(item.id, "rejected")} type="button">
                Rechazar
              </button>
              <button className="button dark" onClick={() => update(item.id, "fulfilled")} type="button">
                Marcar entregada
              </button>
            </div>
          </article>
        ))}
        {!items.length && <p className="muted">No hay solicitudes.</p>}
      </div>
    </Layout>
  );
}

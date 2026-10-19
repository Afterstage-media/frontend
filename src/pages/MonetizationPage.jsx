import { useEffect, useState } from "react";
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

export function MonetizationPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api("/api/public/monetization/products")
      .then((items) => {
        setProducts(items);
        setForm((current) => ({ ...current, productId: current.productId || items[0]?.id || "" }));
      })
      .catch((e) => setError(e.message));
  }, []);
  const selected = products.find((product) => product.id === form.productId);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/public/promotions", { method: "POST", body: JSON.stringify(form) });
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
          <p>Guardamos tu pedido. El equipo de Medio Under te va a escribir para coordinar el servicio y el pago.</p>
          <p className="muted">Código: {result.id}</p>
        </section>
      </Layout>
    );
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Monetizá tu proyecto</p>
        <h1>Hacé que tu próxima fecha se vea.</h1>
        <p>
          Servicios simples para bandas, eventos, salas y productoras. Todo el contenido pago está identificado como
          promocionado.
        </p>
      </section>
      <section className="monetization-layout">
        <div className="product-grid">
          {products.map((product) => (
            <button
              type="button"
              className={`product-card ${form.productId === product.id ? "selected" : ""}`}
              key={product.id}
              onClick={() => setForm({ ...form, productId: product.id })}
            >
              <span className="eyebrow">
                {product.priceArs == null ? "Consultar" : `$${product.priceArs.toLocaleString("es-AR")}`}
              </span>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <small>{product.delivery}</small>
            </button>
          ))}
        </div>
        <form className="form editor-form" onSubmit={submit}>
          <h2>{selected?.name || "Elegí un servicio"}</h2>
          <p className="muted">Completá los datos y te confirmamos el próximo paso.</p>
          {[
            ["customerName", "Nombre y apellido", true],
            ["customerEmail", "Email", true],
            ["organization", "Banda, proyecto u organización"],
            ["title", "Título del evento o lanzamiento", true],
            ["city", "Ciudad"],
            ["eventDate", "Fecha"],
            ["instagram", "Instagram"],
            ["website", "Website"],
          ].map(([name, label, required]) => (
            <label key={name}>
              {label}
              <input name={name} value={form[name]} onChange={change} required={required} />
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
          <button className="button dark" disabled={loading || !selected}>
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
  const load = () =>
    api(`/api/monetization/promotions${status ? `?status=${status}` : ""}`)
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(load, [status]);
  const update = async (id, nextStatus, featuredUntil) => {
    try {
      await api(`/api/monetization/promotions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          ...(featuredUntil ? { featuredUntil: new Date(`${featuredUntil}T23:59:59`).toISOString() } : {}),
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
        <p className="eyebrow">Operación</p>
        <h1>Monetización.</h1>
        <div className="actions">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {["pending_payment", "paid", "in_review", "approved", "rejected", "fulfilled", "cancelled"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </section>
      <ErrorMessage error={error} />
      <div className="admin-list">
        {items.map((item) => (
          <article className="admin-record" key={item.id}>
            <div>
              <small>
                {item.status} · {item.productId} · {new Date(item.createdAt).toLocaleString("es-AR")}
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
              <button className="button" onClick={() => update(item.id, "in_review")}>
                Tomar
              </button>
              <button className="button" onClick={() => update(item.id, "approved")}>
                Aprobar
              </button>
              <button className="button ghost" onClick={() => update(item.id, "rejected")}>
                Rechazar
              </button>
              <button className="button dark" onClick={() => update(item.id, "fulfilled")}>
                Entregada
              </button>
            </div>
          </article>
        ))}
        {!items.length && <p className="muted">No hay solicitudes.</p>}
      </div>
    </Layout>
  );
}

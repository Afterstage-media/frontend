import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import { Button } from "../components/ui/Button.jsx";
import { FormActions } from "../components/ui/FormActions.jsx";
import { FormProgress } from "../components/ui/FormProgress.jsx";
import { SelectField } from "../components/ui/SelectField.jsx";
import { TextAreaField } from "../components/ui/TextAreaField.jsx";
import { TextField } from "../components/ui/TextField.jsx";

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

const focusField = (name) => {
  window.setTimeout(() => document.querySelector(`[name="${name}"]`)?.focus(), 0);
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
  const [formStep, setFormStep] = useState(1);
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
    if (event.target.name) focusField(event.target.name);
  };
  const continueToDetails = (event) => {
    event.preventDefault();
    setError("");
    if (!form.customerName.trim()) {
      setError(invalidFieldMessages.customerName);
      return focusField("customerName");
    }
    if (!form.customerEmail.trim() || !isEmail(form.customerEmail.trim())) {
      setError(invalidFieldMessages.customerEmail);
      return focusField("customerEmail");
    }
    if (!form.title.trim()) {
      setError(invalidFieldMessages.title);
      return focusField("title");
    }
    setFormStep(2);
  };
  const submit = async (event) => {
    event.preventDefault();
    const validationError = validatePromotionForm(form);
    if (validationError) {
      setError(validationError);
      const invalidField = Object.entries(invalidFieldMessages).find(([name]) => {
        if (name === "customerName") return !form.customerName.trim();
        if (name === "customerEmail") return !form.customerEmail.trim() || !isEmail(form.customerEmail.trim());
        if (name === "title") return !form.title.trim();
        return form.description.trim().length < 10;
      });
      if (invalidField) focusField(invalidField[0]);
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
          <SelectField label="Cambiar servicio" name="productId" onChange={change} value={form.productId}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </SelectField>
          <Link className="text-link" to="/servicios">
            Ver cómo se distribuyen los servicios <span>↗</span>
          </Link>
        </aside>
        <form className="form editor-form" noValidate onInvalid={invalid} onSubmit={submit}>
          <h2>Contanos un poco más.</h2>
          <p className="muted">Completá los datos y te confirmamos el próximo paso.</p>
          <FormProgress current={formStep} steps={["Tu propuesta", "Detalles y contacto"]} />
          {formStep === 1 ? (
            <>
              <TextField
                label="Nombre y apellido"
                name="customerName"
                onChange={change}
                required
                value={form.customerName}
              />
              <TextField
                label="Email"
                name="customerEmail"
                onChange={change}
                required
                type="email"
                value={form.customerEmail}
              />
              <TextField label="Título de tu propuesta" name="title" onChange={change} required value={form.title} />
              <p className="form-step-note">Primero necesitamos saber quién sos y qué querés poner en movimiento.</p>
              <ErrorMessage error={error} />
              <Button className="dark" onClick={continueToDetails}>
                Continuar con los detalles →
              </Button>
            </>
          ) : (
            <>
              <TextField
                label="Banda, proyecto u organización"
                name="organization"
                onChange={change}
                value={form.organization}
              />
              <TextField label="Ciudad" name="city" onChange={change} value={form.city} />
              <TextField label="Fecha" name="eventDate" onChange={change} type="date" value={form.eventDate} />
              <TextField label="Instagram" name="instagram" onChange={change} value={form.instagram} />
              <TextField label="Website" name="website" onChange={change} type="url" value={form.website} />
              <TextAreaField
                label="Descripción"
                minLength="10"
                name="description"
                onChange={change}
                required
                value={form.description}
              />
              <TextAreaField label="Notas" name="notes" onChange={change} optional value={form.notes} />
              <SelectField
                label="Preferencia de contacto"
                name="contactPreference"
                onChange={change}
                value={form.contactPreference}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
              </SelectField>
              <ErrorMessage error={error} />
              <FormActions>
                <Button className="ghost" onClick={() => setFormStep(1)}>
                  ← Volver
                </Button>
                <Button className="dark" disabled={loading || !selected} type="submit">
                  {loading ? "Enviando…" : selected?.priceArs ? "Enviar y continuar al pago ↗" : "Pedir presupuesto"}
                </Button>
              </FormActions>
            </>
          )}
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
  useEffect(() => {
    load();
  }, [status]);
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
              <Button onClick={() => update(item.id, "in_review")} type="button">
                Pasar a revisión
              </Button>
              <Button onClick={() => update(item.id, "approved")} type="button">
                Aprobar
              </Button>
              <Button onClick={() => update(item.id, "rejected")} variant="ghost" type="button">
                Rechazar
              </Button>
              <Button onClick={() => update(item.id, "fulfilled")} variant="dark" type="button">
                Marcar entregada
              </Button>
            </div>
          </article>
        ))}
        {!items.length && <p className="muted">No hay solicitudes.</p>}
      </div>
    </Layout>
  );
}

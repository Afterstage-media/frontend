import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ErrorState, LoadingState } from "../components/UiState.jsx";

const lanes = [
  {
    id: "entradas",
    number: "01",
    eyebrow: "Fechas y acceso",
    title: "Que llegar sea parte del show.",
    description: "Ordená la venta, la información y el acceso para que tu público sepa cómo estar ahí.",
    className: "services-lane-entradas",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=88",
    productIds: ["pasarela-entradas", "evento-destacado"],
  },
  {
    id: "festivales",
    number: "02",
    eyebrow: "Festivales",
    title: "Del primer boceto al último bis.",
    description: "Pensá, organizá y comunicá un festival con una mirada completa sobre la escena.",
    className: "services-lane-festivales",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=88",
    productIds: ["promocion-festivales", "organizacion-festivales", "pack-difusion"],
  },
  {
    id: "difusion",
    number: "03",
    eyebrow: "Comunicación",
    title: "Una fecha también se cuenta.",
    description: "Dale forma a tu lanzamiento, tu evento o tu proyecto con piezas y presencia editorial.",
    className: "services-lane-difusion",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=88",
    productIds: ["publicacion-promocionada", "lanzamiento-musical", "press-kit-express", "contenido-para-redes"],
  },
  {
    id: "viajes",
    number: "04",
    eyebrow: "Viajes",
    title: "El viaje empieza antes de salir.",
    description: "Promocioná viajes organizados a conciertos y festivales frente a una audiencia que ya está mirando.",
    className: "services-lane-viajes",
    image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=88",
    productIds: ["publicidad-viajes-conciertos"],
  },
  {
    id: "merch",
    number: "05",
    eyebrow: "Merch",
    title: "Lo que queda después del recital.",
    description: "Explorá una tienda online para vender merch de bandas, fechas y festivales.",
    className: "services-lane-merch",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=88",
    productIds: ["tienda-merch"],
  },
  {
    id: "comunidad",
    number: "06",
    eyebrow: "Red de trabajo",
    title: "La escena se arma entre todes.",
    description: "Encontrá colaboradores, coberturas y recursos para que las ideas puedan suceder.",
    className: "services-lane-comunidad",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=88",
    productIds: ["aviso-clasificado", "cobertura-foto-video"],
  },
];

function ServiceOffering({ product }) {
  if (!product) return null;
  return (
    <article className="service-offering">
      <div>
        <span className="service-offering-price">
          {product.priceArs == null ? "Consultar" : `$${product.priceArs.toLocaleString("es-AR")}`}
        </span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <small>{product.delivery}</small>
      </div>
      <Link className="service-offering-cta" to={`/contratar?service=${encodeURIComponent(product.id)}`}>
        Ver servicio <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

export function ServicesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api("/api/public/monetization/products")
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const byId = new Map(products.map((product) => [product.id, product]));

  return (
    <Layout>
      <section className="services-intro" aria-labelledby="services-title">
        <div className="services-intro-copy">
          <p className="eyebrow">Servicios para la escena</p>
          <h1 id="services-title">
            No todo empieza
            <br /> con un show.
          </h1>
          <p>
            Hay fechas que necesitan entradas, festivales que necesitan equipo, viajes que necesitan público y canciones
            que necesitan una forma de circular.
          </p>
        </div>
        <div className="services-intro-mark" aria-hidden="true">
          <span>AFTER</span>
          <strong>STAGE</strong>
          <i>✳</i>
        </div>
      </section>

      <nav className="services-jump-nav" aria-label="Secciones de servicios">
        {lanes.map((lane) => (
          <a href={`#${lane.id}`} key={lane.id}>
            <span>{lane.number}</span> {lane.eyebrow}
          </a>
        ))}
      </nav>

      {loading ? (
        <LoadingState label="Ordenando los servicios…" />
      ) : error ? (
        <ErrorState message="No pudimos cargar el catálogo de servicios." onRetry={load} />
      ) : (
        <div className="services-lanes">
          {lanes.map((lane) => {
            const laneProducts = lane.productIds.map((id) => byId.get(id)).filter(Boolean);
            return (
              <section className={`services-lane ${lane.className}`} id={lane.id} key={lane.id}>
                <div
                  className="services-lane-image"
                  style={{ backgroundImage: `url(${lane.image})` }}
                  role="img"
                  aria-label={lane.eyebrow}
                >
                  <span>{lane.number}</span>
                </div>
                <div className="services-lane-content">
                  <p className="eyebrow">{lane.eyebrow}</p>
                  <h2>{lane.title}</h2>
                  <p className="services-lane-description">{lane.description}</p>
                  <div className="service-offerings">
                    {laneProducts.map((product) => (
                      <ServiceOffering key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className="services-closer">
        <p className="eyebrow">¿Tenés otra idea?</p>
        <h2>Contanos qué querés poner en movimiento.</h2>
        <Link className="button dark" to="/contratar">
          Abrir una conversación ↗
        </Link>
      </section>
    </Layout>
  );
}

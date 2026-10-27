import { useEffect, useRef, useState } from "react";
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

function ServiceOffering({ product, index }) {
  if (!product) return null;
  return (
    <article className="service-offering" data-reveal style={{ "--reveal-delay": `${index * 70}ms` }}>
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
  const pageRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeLane, setActiveLane] = useState("entradas");
  const [selectedLane, setSelectedLane] = useState("entradas");
  const [showAll, setShowAll] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api("/api/public/monetization/products")
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return undefined;

    page.classList.add("services-page--motion");
    const parallaxNodes = [...page.querySelectorAll("[data-parallax]")];
    const revealNodes = [...page.querySelectorAll("[data-reveal]")];
    const laneNodes = [...page.querySelectorAll(".services-lane")];
    let frame = 0;

    const updateParallax = () => {
      frame = 0;
      const viewportCenter = window.innerHeight / 2;
      parallaxNodes.forEach((node) => {
        const bounds = node.getBoundingClientRect();
        const speed = Number(node.dataset.parallax || 0);
        const offset = Math.max(-38, Math.min(38, -(bounds.top + bounds.height / 2 - viewportCenter) * speed));
        node.style.setProperty("--parallax-y", `${Math.round(offset)}px`);
      });
    };

    const scheduleParallax = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );

    const laneObserver = new IntersectionObserver(
      (entries) => {
        const visibleLane = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (visibleLane) setActiveLane(visibleLane.target.id);
      },
      { rootMargin: "-25% 0px -55%", threshold: [0.15, 0.4, 0.7] },
    );

    revealNodes.forEach((node) => revealObserver.observe(node));
    laneNodes.forEach((node) => laneObserver.observe(node));
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax);
    scheduleParallax();

    return () => {
      window.removeEventListener("scroll", scheduleParallax);
      window.removeEventListener("resize", scheduleParallax);
      if (frame) window.cancelAnimationFrame(frame);
      revealObserver.disconnect();
      laneObserver.disconnect();
    };
  }, [loading]);

  const byId = new Map(products.map((product) => [product.id, product]));

  return (
    <Layout>
      <div className="services-page" ref={pageRef}>
        <section className="services-intro" data-parallax="0.05" aria-labelledby="services-title">
          <div className="services-intro-copy" data-reveal>
            <p className="eyebrow">Servicios para la escena</p>
            <h1 id="services-title">
              No todo empieza
              <br /> con un show.
            </h1>
            <p>
              Hay fechas que necesitan entradas, festivales que necesitan equipo, viajes que necesitan público y
              canciones que necesitan una forma de circular.
            </p>
          </div>
          <div className="services-intro-mark" data-parallax="0.12" data-reveal aria-hidden="true">
            <span>AFTER</span>
            <strong>STAGE</strong>
            <i>✳</i>
          </div>
        </section>

        <section className="services-intent-filter" aria-labelledby="services-intent-title">
          <div>
            <p className="eyebrow">Elegí por dónde empezar</p>
            <h2 id="services-intent-title">¿Qué querés resolver?</h2>
          </div>
          <div className="services-intent-options" role="tablist" aria-label="Objetivo del servicio">
            {lanes.map((lane) => (
              <button
                aria-selected={selectedLane === lane.id && !showAll}
                className={selectedLane === lane.id && !showAll ? "is-active" : ""}
                key={lane.id}
                onClick={() => {
                  setSelectedLane(lane.id);
                  setActiveLane(lane.id);
                  setShowAll(false);
                }}
                role="tab"
                type="button"
              >
                {lane.eyebrow}
              </button>
            ))}
            <button
              aria-selected={showAll}
              className={showAll ? "is-active" : ""}
              onClick={() => setShowAll(true)}
              role="tab"
              type="button"
            >
              Ver todo
            </button>
          </div>
        </section>

        <nav className="services-jump-nav" aria-label="Secciones de servicios">
          {(showAll ? lanes : lanes.filter((lane) => lane.id === selectedLane)).map((lane) => (
            <a aria-current={activeLane === lane.id ? "true" : undefined} href={`#${lane.id}`} key={lane.id}>
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
            {(showAll ? lanes : lanes.filter((lane) => lane.id === selectedLane)).map((lane) => {
              const laneProducts = lane.productIds.map((id) => byId.get(id)).filter(Boolean);
              return (
                <section className={`services-lane ${lane.className}`} data-reveal id={lane.id} key={lane.id}>
                  <div
                    className="services-lane-image"
                    data-parallax="0.04"
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
                    <div className="service-offerings-heading" aria-hidden="true">
                      <span>Propuestas disponibles</span>
                      <span>{String(laneProducts.length).padStart(2, "0")} opciones</span>
                    </div>
                    <div className="service-offerings">
                      {laneProducts.map((product, index) => (
                        <ServiceOffering key={product.id} index={index} product={product} />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="services-closer" data-reveal>
          <p className="eyebrow">¿Tenés otra idea?</p>
          <h2>Contanos qué querés poner en movimiento.</h2>
          <Link className="button dark" to="/contratar">
            Abrir una conversación ↗
          </Link>
        </section>
      </div>
    </Layout>
  );
}

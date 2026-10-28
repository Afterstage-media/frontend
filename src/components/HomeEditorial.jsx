import { Link } from "react-router-dom";
import { ButtonLink } from "./ui/Button.jsx";

const quickLinks = [
  {
    title: "Coberturas",
    detail: "Conciertos · Festivales · Artistas",
    to: "/notas",
    className: "quick-link-coverages",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=88",
  },
  {
    title: "Agenda",
    detail: "Shows · Fechas · En todo el país",
    to: "/agenda",
    className: "quick-link-agenda",
    image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=88",
  },
  {
    title: "Sumate",
    detail: "Colaborá · Contá · Hacé archivo",
    to: "/colaborador",
    className: "quick-link-community",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=88",
  },
  {
    title: "Notas",
    detail: "Historias · Artistas · Contextos",
    to: "/notas",
    className: "quick-link-notes",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=88",
  },
];

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-filmstrip" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="home-hero-copy">
        <h1 id="home-title">
          La escena
          <br /> <span>está viva.</span>
        </h1>
        <p className="home-hero-note">
          DESDE EL ESCENARIO <i /> <b aria-hidden="true">→</b>
        </p>
      </div>
      <div className="home-hero-photo" role="img" aria-label="Fotografía documental de un recital">
        <span className="home-hero-star" aria-hidden="true">
          ✳
        </span>
      </div>
    </section>
  );
}

export function HomeQuickLinks() {
  return (
    <nav className="home-quick-links" aria-label="Explorar afterstage">
      {quickLinks.map((item) => (
        <Link className={`quick-link ${item.className}`} key={item.title} to={item.to}>
          <span className="quick-link-sheet">
            <span className="quick-link-title">{item.title}</span>
            <span className="quick-link-arrow" aria-hidden="true">
              ↗
            </span>
            <span className="quick-link-image" style={{ backgroundImage: `url(${item.image})` }} aria-hidden="true" />
            <small>{item.detail}</small>
          </span>
        </Link>
      ))}
    </nav>
  );
}

export function HomeIntent() {
  const intents = [
    ["Encontrar una fecha", "Agenda de shows y festivales", "/agenda"],
    ["Leer y descubrir", "Notas, artistas y contexto", "/notas"],
    ["Mover un proyecto", "Servicios para la escena", "/servicios"],
    ["Trabajar en red", "Perfiles, coberturas y colaboraciones", "/red"],
  ];
  return (
    <section className="home-intent" aria-labelledby="home-intent-title">
      <div>
        <p className="eyebrow">¿Qué estás buscando?</p>
        <h2 id="home-intent-title">Entrá por tu próximo paso.</h2>
      </div>
      <div className="home-intent-grid">
        {intents.map(([title, detail, to]) => (
          <Link className="home-intent-card" key={to} to={to}>
            <strong>{title}</strong>
            <span>{detail}</span>
            <b aria-hidden="true">↗</b>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeMission() {
  return (
    <section className="home-mission" aria-labelledby="home-mission-title">
      <div className="home-mission-lede">
        <p className="eyebrow">Más que un medio</p>
        <h2 id="home-mission-title">
          La escena se cuenta <em>en red.</em>
        </h2>
      </div>
      <div className="home-mission-copy">
        <p>
          Entradas, festivales, difusión, viajes y merch: herramientas y servicios para que cada proyecto encuentre su
          próxima forma de circular.
        </p>
        <div className="actions">
          <ButtonLink className="ghost" to="/colaborador">
            Sumate a la red
          </ButtonLink>
          <ButtonLink className="dark" to="/servicios">
            Ver servicios ↗
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

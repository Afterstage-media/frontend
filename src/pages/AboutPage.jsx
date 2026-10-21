import { Link } from "react-router-dom";
import { Layout } from "../components/Layout.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";

const pillars = [
  {
    number: "01",
    title: "Contenidos",
    text: "Notas, entrevistas, noticias, reels y coberturas de shows, festivales y artistas.",
  },
  {
    number: "02",
    title: "Producción",
    text: "Fotografía, video, edición y paquetes de comunicación para artistas, espacios y eventos.",
  },
  {
    number: "03",
    title: "Comunidad",
    text: "Una red de personas que comparten oportunidades, trabajo, créditos y visibilidad.",
  },
];

export function AboutPage() {
  return (
    <Layout>
      <SignalTicker items={["Medio", "Producción", "Comunidad", "Escena"]} />
      <section className="about-intro" aria-labelledby="about-title">
        <p className="eyebrow">Cómo funciona / 01</p>
        <h1 id="about-title">
          Un medio, una comunidad <em>y una productora.</em>
        </h1>
        <p className="about-intro-lede">
          Afterstage nace para contar lo que pasa en la escena musical y conectar a quienes la hacen posible.
        </p>
      </section>

      <section className="about-pillars" aria-label="Pilares de Afterstage">
        {pillars.map((pillar) => (
          <article className="about-pillar" key={pillar.number}>
            <span className="about-pillar-number">{pillar.number}</span>
            <h2>{pillar.title}</h2>
            <p>{pillar.text}</p>
          </article>
        ))}
      </section>

      <section className="about-detail">
        <div>
          <p className="eyebrow">Una red que se mueve</p>
          <h2>Más personas, más alcance, mejor archivo.</h2>
        </div>
        <div className="about-detail-copy">
          <p>
            La propuesta no depende de un solo equipo. Fotógrafos, noteros, videógrafos, editores, bandas y espacios
            pueden sumarse según cada cobertura y proyecto.
          </p>
          <p>
            A medida que la red crece, Afterstage puede ofrecer paquetes de cobertura, merchandising y espacios de
            difusión, con roles, créditos y formas de trabajo claras desde el comienzo.
          </p>
          <div className="actions">
            <Link className="button dark" to="/colaborador">
              Sumate a la red ↗
            </Link>
            <Link className="button ghost" to="/monetizar">
              Promocioná tu proyecto
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export { EditorialIntro, PageTitle } from "./ui/PageTitle.jsx";
export { SectionHeading } from "./ui/SectionHeading.jsx";

export function SignalTicker({
  items = ["Coberturas reales", "Agenda de acá", "Historias desde adentro", "Bajo la superficie"],
}) {
  const repeatedItems = [...items, ...items];
  return (
    <div className="scene-ticker" aria-label="Manifiesto de afterstage">
      <div className="scene-ticker-track">
        {repeatedItems.map((item, index) => (
          <span className="scene-ticker-item" key={`${item}-${index}`}>
            {item}
            <i aria-hidden="true">✳</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export function EditorialPoster({ index = "N° 001", top = "COBERTURA", bottom = "REAL" }) {
  return (
    <div className="hero-poster" aria-label="Identidad visual de afterstage">
      <span className="poster-index">{index}</span>
      <span className="poster-word poster-word-top">{top}</span>
      <span className="poster-word poster-word-bottom">{bottom}</span>
      <span className="poster-disc" aria-hidden="true" />
      <span className="poster-caption">
        DESDE EL SHOW
        <br />
        SIN PAUSA
      </span>
      <span className="poster-arrow" aria-hidden="true">
        ↘
      </span>
    </div>
  );
}

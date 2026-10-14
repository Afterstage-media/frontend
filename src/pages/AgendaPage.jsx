import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { EventCard } from "../components/EventCard.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
export function AgendaPage() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    lat: "",
    lng: "",
    radiusKm: "25",
  });
  const [loading, setLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const load = (nextFilters = filters) => {
    setLoading(true);
    const params =
      nextFilters.lat && nextFilters.lng
        ? `?lat=${nextFilters.lat}&lng=${nextFilters.lng}&radiusKm=${nextFilters.radiusKm}`
        : "";
    api(`/api/public/events${params}`)
      .then((items) => {
        const query = nextFilters.query.trim().toLowerCase();
        setEvents(
          query
            ? items.filter((event) =>
                [event.name, event.artist, event.venue, event.address, event.city, event.country]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase()
                  .includes(query),
              )
            : items,
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrollOffset(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite detectar la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextFilters = { ...filters, lat: String(coords.latitude), lng: String(coords.longitude) };
        setFilters(nextFilters);
        load(nextFilters);
      },
      () => setError("No pudimos obtener tu ubicación. También podés buscar por ciudad o lugar."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };
  return (
    <Layout>
      <section className="agenda-hero" style={{ "--agenda-shift": `${Math.min(scrollOffset * 0.16, 90)}px` }}>
        <div className="agenda-hero-mark" aria-hidden="true" />
        <div className="agenda-hero-copy">
          <p className="eyebrow">Agenda abierta / 01</p>
          <h1>Donde la escena se encuentra.</h1>
          <p>Shows, ferias, ciclos y encuentros cerca tuyo. Buscá por nombre, lugar o ciudad.</p>
        </div>
        <div className="agenda-hero-note" aria-hidden="true">
          <span>Próximo pulso</span>
          <strong>{loading ? "…" : String(events.length).padStart(2, "0")}</strong>
          <span>resultados</span>
        </div>
        <div className="agenda-filters" role="search" aria-label="Filtrar agenda">
          <label className="agenda-search">
            <span>Encontrá tu próximo plan</span>
            <input
              aria-label="Buscar evento, lugar o ciudad"
              placeholder="Nombre, lugar o ciudad"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </label>
          <div className="actions">
            <button className="button dark" type="button" onClick={() => load()}>
              Buscar ↗
            </button>
            <button className="button ghost" type="button" onClick={useMyLocation}>
              Cerca mío
            </button>
            {filters.lat && <span className="muted">Radio: {filters.radiusKm} km</span>}
          </div>
        </div>
      </section>
      <ErrorMessage error={error} />
      <section className="events">
        <div className="events-heading">
          <p className="eyebrow">Lo que está pasando</p>
          {!loading && (
            <span className="muted">{events.length ? `${events.length} encuentros` : "Agenda en movimiento"}</span>
          )}
        </div>
        {loading ? (
          <p className="muted">Buscando próximos eventos…</p>
        ) : events.length ? (
          events.map((event, index) => <EventCard event={event} index={index} key={event.id} />)
        ) : (
          <div className="events-empty">
            <strong>No encontramos eventos con esa búsqueda.</strong>
            <p>Probá con una ciudad, un lugar o limpiá el filtro para volver a mirar.</p>
          </div>
        )}
      </section>
    </Layout>
  );
}

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
      <section className="page-intro">
        <p className="eyebrow">Agenda abierta</p>
        <h1>Todos los próximos eventos.</h1>
        <p>Shows, ferias, ciclos y encuentros cerca tuyo. Buscá por nombre, lugar o ciudad.</p>
        <div className="agenda-filters" role="search" aria-label="Filtrar agenda">
          <input
            aria-label="Buscar evento, lugar o ciudad"
            placeholder="Buscar evento, lugar o ciudad"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <div className="actions">
            <button className="button dark" type="button" onClick={() => load()}>
              Buscar
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
        {loading ? (
          <p className="muted">Buscando próximos eventos…</p>
        ) : events.length ? (
          events.map((event) => <EventCard event={event} key={event.id} />)
        ) : (
          <p className="muted">No hay próximos eventos cargados.</p>
        )}
      </section>
    </Layout>
  );
}

import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { EventCard } from "../components/EventCard.jsx";
import { EventMap } from "../components/EventMap.jsx";
import { Layout } from "../components/Layout.jsx";
import { EmptyState, ErrorState } from "../components/UiState.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { eventMatchesDateRange } from "../utils/eventDates.js";
export function AgendaPage() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    dateRange: "all",
    lat: "",
    lng: "",
    radiusKm: "25",
  });
  const [loading, setLoading] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");
  const [scrollOffset, setScrollOffset] = useState(0);
  const load = (nextFilters = filters) => {
    setLoading(true);
    setError("");
    const params =
      nextFilters.lat && nextFilters.lng
        ? `?lat=${nextFilters.lat}&lng=${nextFilters.lng}&radiusKm=${nextFilters.radiusKm}`
        : "";
    api(`/api/public/events${params}`)
      .then((items) => {
        const query = nextFilters.query.trim().toLowerCase();
        const now = new Date();
        setEvents(
          items.filter((event) => {
            const searchable = [event.name, event.artist, event.venue, event.address, event.city, event.country]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            const matchesDate = eventMatchesDateRange(event, nextFilters.dateRange, now);
            return (!query || searchable.includes(query)) && matchesDate;
          }),
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
    setError("");
    if (!navigator.geolocation) {
      setLocationMessage("Tu navegador no permite detectar la ubicación.");
      return;
    }
    setLocationMessage("Detectando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextFilters = { ...filters, lat: String(coords.latitude), lng: String(coords.longitude) };
        setFilters(nextFilters);
        setLocationMessage(`Ubicación detectada · ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        load(nextFilters);
      },
      () => setLocationMessage("No pudimos obtener tu ubicación. Revisá el permiso del navegador."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };
  const clearFilters = () => {
    const nextFilters = { query: "", dateRange: "all", lat: "", lng: "", radiusKm: "25" };
    setFilters(nextFilters);
    setLocationMessage("");
    load(nextFilters);
  };
  return (
    <Layout>
      <SignalTicker items={["Agenda abierta", "Shows", "Ferias", "Ciclos", "Encuentros"]} />
      <section className="agenda-hero" style={{ "--agenda-shift": `${Math.min(scrollOffset * 0.16, 90)}px` }}>
        <div className="agenda-hero-mark" aria-hidden="true" />
        <div className="agenda-hero-copy">
          <p className="eyebrow">Agenda abierta / 01</p>
          <h1>Donde la escena se encuentra.</h1>
          <p>Shows, ferias, ciclos y encuentros cerca tuyo. Buscá por nombre, lugar o ciudad.</p>
        </div>
      </section>
      <div className={`agenda-filter-dock${scrollOffset > 280 ? " is-scrolled" : ""}`}>
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
              {locationMessage === "Detectando tu ubicación…" ? "Detectando…" : "Cerca mío"}
            </button>
            <label className="agenda-radius">
              <span className="agenda-radius-label">
                <span>Radio</span>
                <output htmlFor="agenda-radius">{filters.radiusKm} km</output>
              </span>
              <input
                id="agenda-radius"
                aria-label="Radio de búsqueda"
                type="range"
                min="5"
                max="100"
                step="5"
                value={filters.radiusKm}
                onChange={(e) => {
                  const nextFilters = { ...filters, radiusKm: e.target.value };
                  setFilters(nextFilters);
                  if (nextFilters.lat && nextFilters.lng) load(nextFilters);
                }}
              />
              <span className="agenda-radius-scale" aria-hidden="true">
                <span>5 km</span>
                <span>100 km</span>
              </span>
            </label>
            <select
              aria-label="Filtrar por fecha"
              value={filters.dateRange}
              onChange={(e) => {
                const nextFilters = { ...filters, dateRange: e.target.value };
                setFilters(nextFilters);
                load(nextFilters);
              }}
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Próximos 7 días</option>
              <option value="month">Este mes</option>
            </select>
            {(filters.query || filters.dateRange !== "all" || filters.lat) && (
              <button className="filter-clear" type="button" onClick={clearFilters}>
                Limpiar
              </button>
            )}
          </div>
          {locationMessage && (
            <p className="agenda-location-status" role="status">
              ⌖ {locationMessage}
            </p>
          )}
        </div>
      </div>
      {error && (
        <ErrorState
          message="No pudimos actualizar la agenda. Tus filtros siguen disponibles para intentar otra vez."
          onRetry={() => load()}
        />
      )}
      <div className="agenda-results-layout has-map">
        <section className="event-map-section" aria-label="Mapa de eventos">
          <div className="event-map-heading">
            <div>
              <p className="eyebrow">Mapa de eventos</p>
              <h2>{filters.lat && filters.lng ? "Eventos en tu radio." : "Todos los eventos."}</h2>
            </div>
            <span className="muted">{events.length} encontrados</span>
          </div>
          <EventMap
            events={events}
            latitude={Number(filters.lat) || -34.6037}
            longitude={Number(filters.lng) || -58.3816}
            radiusKm={filters.radiusKm}
            hasLocation={Boolean(filters.lat && filters.lng)}
          />
          <div className="event-map-legend">
            {filters.lat && filters.lng && (
              <span>
                <i className="event-map-legend-user" /> Tu ubicación
              </span>
            )}
            <span>
              <i className="event-map-legend-event" /> Eventos en agenda
            </span>
          </div>
        </section>
        <section className="events">
          <div className="events-heading">
            <p className="eyebrow">Lo que está pasando</p>
            {!loading && (
              <span className="muted">{events.length ? `${events.length} encuentros` : "Agenda en movimiento"}</span>
            )}
          </div>
          {loading ? (
            <p className="muted">Buscando próximos eventos…</p>
          ) : error ? (
            <p className="muted">La agenda no pudo actualizarse. Usá “Intentar de nuevo” para volver a consultar.</p>
          ) : events.length ? (
            events.map((event, index) => <EventCard event={event} index={index} key={event.id} />)
          ) : (
            <EmptyState
              title="No encontramos eventos con esa búsqueda."
              message="Probá con otra ciudad, un lugar distinto o limpiá el filtro para volver a mirar."
              action={
                (filters.query || filters.dateRange !== "all" || filters.lat) && (
                  <button className="button ghost" type="button" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                )
              }
            />
          )}
        </section>
      </div>
    </Layout>
  );
}

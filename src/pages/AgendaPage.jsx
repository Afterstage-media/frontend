import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { EventCard } from "../components/EventCard.jsx";
import { EventMap } from "../components/EventMap.jsx";
import { Layout } from "../components/Layout.jsx";
import { EmptyState, ErrorState } from "../components/UiState.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { eventMatchesDateRange, getEventDates } from "../utils/eventDates.js";
import { normalizeSearchText } from "../utils/search.js";

const eventGroupLabel = (event) => event.artist?.trim() || event.name?.trim() || "Evento";

const eventArtistName = (event) => event.artist?.trim() || event.name?.trim() || "";

const eventMapKey = (event) =>
  event.id ??
  [eventGroupLabel(event), event.venue || "", event.city || "", event.latitude || "", event.longitude || ""]
    .join("|")
    .toLowerCase();

const eventHasCoordinates = (event) => event.latitude != null && event.longitude != null;

const defaultGenreOptions = ["Rock", "Metal", "Indie", "Pop", "Punk", "Electrónica", "Hip hop", "Folklore"];
const defaultTagOptions = ["Under", "Gratis", "Festival", "Ciclo", "Feria"];

const eventValues = (event, key, singularKey) => {
  const value = event[key] ?? event[singularKey];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
};

const filterOptionsFromEvents = (items, key, singularKey, defaults) => [
  ...new Map(
    [...defaults, ...items.flatMap((event) => eventValues(event, key, singularKey))].map((value) => [
      normalizeSearchText(value),
      value.trim(),
    ]),
  ).values(),
];

const eventMatchesAgendaFilters = (event, filters, now) => {
  const query = normalizeSearchText(filters.query);
  const artistName = normalizeSearchText(eventArtistName(event));
  const matchesGenre =
    !filters.genre ||
    eventValues(event, "genres", "genre").some((value) => normalizeSearchText(value) === filters.genre);
  const matchesTag =
    !filters.tag || eventValues(event, "tags", "tag").some((value) => normalizeSearchText(value) === filters.tag);
  return (
    (!query || artistName.includes(query)) &&
    matchesGenre &&
    matchesTag &&
    eventMatchesDateRange(event, filters.dateRange, now)
  );
};

const groupAgendaEvents = (items) => {
  const groups = new Map();
  items.forEach((event) => {
    const key = normalizeSearchText(eventGroupLabel(event));
    const group = groups.get(key) || { ...event, dates: [], endsAt: event.endsAt };
    const dates = new Map(group.dates.map((date) => [date, date]));
    getEventDates(event).forEach((date) => dates.set(date.toISOString(), date.toISOString()));
    group.dates = [...dates.values()].sort();
    if (group.dates.length > 1) group.endsAt = undefined;
    groups.set(key, group);
  });
  return [...groups.values()];
};

export function AgendaPage() {
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q")?.trim() || "";
  const [events, setEvents] = useState([]);
  const [genreOptions, setGenreOptions] = useState(defaultGenreOptions);
  const [tagOptions, setTagOptions] = useState(defaultTagOptions);
  const [mapPickerActive, setMapPickerActive] = useState(false);
  const [visibleEventIds, setVisibleEventIds] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    query: queryFromUrl,
    genre: "",
    tag: "",
    dateRange: "all",
    lat: "",
    lng: "",
    radiusKm: "25",
  });
  const [loading, setLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [eventLimit] = useState(() => (typeof window !== "undefined" && window.innerWidth <= 600 ? 6 : 12));
  const [locationMessage, setLocationMessage] = useState("");
  const [scrollOffset, setScrollOffset] = useState(0);
  const load = (nextFilters = filters) => {
    setLoading(true);
    setError("");
    setVisibleEventIds(null);
    setShowAllEvents(false);
    const params = new URLSearchParams({ limit: "100" });
    if (nextFilters.lat && nextFilters.lng) {
      params.set("lat", nextFilters.lat);
      params.set("lng", nextFilters.lng);
      params.set("radiusKm", nextFilters.radiusKm);
    }
    api(`/api/public/events?${params.toString()}`)
      .then((items) => {
        const now = new Date();
        setGenreOptions(filterOptionsFromEvents(items, "genres", "genre", defaultGenreOptions));
        setTagOptions(filterOptionsFromEvents(items, "tags", "tag", defaultTagOptions));
        setEvents(groupAgendaEvents(items.filter((event) => eventMatchesAgendaFilters(event, nextFilters, now))));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (queryFromUrl === filters.query) return;
    const nextFilters = { ...filters, query: queryFromUrl };
    setFilters(nextFilters);
    load(nextFilters);
  }, [queryFromUrl]);
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
      (locationError) => {
        setLocationMessage(
          locationError.code === 1
            ? "El navegador bloqueó la ubicación. Permitila para usar “Cerca mío”."
            : "No pudimos obtener tu ubicación. Revisá el permiso del navegador.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };
  const clearFilters = () => {
    const nextFilters = { query: "", genre: "", tag: "", dateRange: "all", lat: "", lng: "", radiusKm: "25" };
    setFilters(nextFilters);
    setLocationMessage("");
    setMapPickerActive(false);
    load(nextFilters);
  };
  const selectMapCenter = ({ lat, lng }) => {
    const nextFilters = { ...filters, lat: String(lat), lng: String(lng) };
    setFilters(nextFilters);
    setMapPickerActive(false);
    setLocationMessage(`Ubicación elegida en el mapa · ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    load(nextFilters);
  };
  const handleVisibleEventsChange = useCallback((eventIds) => {
    setVisibleEventIds(new Set(eventIds));
  }, []);
  const visibleEvents = showAllEvents ? events : events.slice(0, eventLimit);
  const mapVisibleEvents =
    visibleEventIds === null
      ? events.filter(eventHasCoordinates)
      : events.filter((event) => eventHasCoordinates(event) && visibleEventIds.has(eventMapKey(event)));
  return (
    <Layout>
      <SignalTicker items={["Agenda abierta", "Shows", "Ferias", "Ciclos", "Encuentros"]} />
      <section className="agenda-hero" style={{ "--agenda-shift": `${Math.min(scrollOffset * 0.16, 90)}px` }}>
        <div className="agenda-hero-mark" aria-hidden="true" />
        <div className="agenda-hero-copy">
          <p className="eyebrow">Agenda abierta / 01</p>
          <h1>Donde la escena se encuentra.</h1>
          <p>Shows, ferias, ciclos y encuentros cerca tuyo. Buscá por nombre de artista.</p>
        </div>
      </section>
      <div className="agenda-results-layout has-map">
        <aside className="agenda-sidebar">
          <div className="agenda-filter-dock">
            <div className="agenda-filters" role="search" aria-label="Filtrar agenda">
              <label className="agenda-search">
                <span className="sr-only">Buscar un artista</span>
                <input
                  aria-label="Buscar por nombre de artista"
                  placeholder="Nombre del artista"
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
                <button
                  className={`button ghost${mapPickerActive ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setMapPickerActive((current) => !current)}
                >
                  {mapPickerActive ? "Cancelar selección" : "Elegir ubicación"}
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
                <label>
                  <span className="agenda-filter-label">Género</span>
                  <select
                    aria-label="Filtrar por género"
                    value={filters.genre}
                    onChange={(e) => {
                      const nextFilters = { ...filters, genre: normalizeSearchText(e.target.value) };
                      setFilters(nextFilters);
                      load(nextFilters);
                    }}
                  >
                    <option value="">Todos</option>
                    {genreOptions.map((option) => (
                      <option key={option} value={normalizeSearchText(option)}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="agenda-filter-label">Tags</span>
                  <select
                    aria-label="Filtrar por tag"
                    value={filters.tag}
                    onChange={(e) => {
                      const nextFilters = { ...filters, tag: normalizeSearchText(e.target.value) };
                      setFilters(nextFilters);
                      load(nextFilters);
                    }}
                  >
                    <option value="">Todos</option>
                    {tagOptions.map((option) => (
                      <option key={option} value={normalizeSearchText(option)}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="agenda-date-actions">
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
                  {(filters.query || filters.genre || filters.tag || filters.dateRange !== "all" || filters.lat) && (
                    <button className="filter-clear" type="button" onClick={clearFilters}>
                      Limpiar
                    </button>
                  )}
                </div>
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
          <section className="event-map-section" aria-label="Mapa de eventos">
            <div className="event-map-heading">
              <h2>Mapa</h2>
              <span className="muted">
                {mapVisibleEvents.length} {mapVisibleEvents.length === 1 ? "evento" : "eventos"} en el mapa
              </span>
            </div>
            <EventMap
              events={events}
              latitude={Number(filters.lat) || -34.6037}
              longitude={Number(filters.lng) || -58.3816}
              radiusKm={filters.radiusKm}
              hasLocation={Boolean(filters.lat && filters.lng)}
              centerPickerActive={mapPickerActive}
              onCenterSelect={selectMapCenter}
              onVisibleEventsChange={handleVisibleEventsChange}
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
        </aside>
        <section className="events">
          <div className="events-heading">
            <div>
              <p className="eyebrow">Lo que está pasando</p>
              <h2>Agenda</h2>
            </div>
            {!loading && (
              <span className="muted">
                {visibleEvents.length ? `${visibleEvents.length} encuentros en la agenda` : "Agenda en movimiento"}
              </span>
            )}
          </div>
          {loading ? (
            <p className="muted">Buscando próximos eventos…</p>
          ) : error ? (
            <p className="muted">La agenda no pudo actualizarse. Usá “Intentar de nuevo” para volver a consultar.</p>
          ) : visibleEvents.length ? (
            <>
              {visibleEvents.map((event, index) => (
                <EventCard event={event} index={index} key={eventMapKey(event)} />
              ))}
              {events.length > visibleEvents.length && (
                <button className="button ghost events-show-more" onClick={() => setShowAllEvents(true)} type="button">
                  Mostrar los {events.length - visibleEvents.length} eventos restantes ↓
                </button>
              )}
              {showAllEvents && events.length > eventLimit && (
                <button className="button ghost events-show-more" onClick={() => setShowAllEvents(false)} type="button">
                  Mostrar menos ↑
                </button>
              )}
            </>
          ) : (
            <EmptyState
              title="No hay eventos con estos filtros."
              message="Probá cambiar la búsqueda o limpiar los filtros para volver a mirar la agenda completa."
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

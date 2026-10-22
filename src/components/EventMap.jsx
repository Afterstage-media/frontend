import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { formatEventDates, getEventDates } from "../utils/eventDates.js";

const markerIcon = (L, className) =>
  L.divIcon({
    className: `event-map-marker ${className}`,
    html: "<span></span>",
    iconAnchor: [10, 10],
    iconSize: [20, 20],
  });

const escapeHtml = (value) =>
  String(value || "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const eventCoordinates = (event) => event.latitude != null && event.longitude != null;

const eventGroupLabel = (event) => event.artist?.trim() || event.name?.trim() || "Evento";

const eventMapKey = (event) =>
  event.id ??
  [eventGroupLabel(event), event.venue || "", event.city || "", event.latitude || "", event.longitude || ""]
    .join("|")
    .toLowerCase();

const eventGroupKey = (event) => [eventGroupLabel(event), event.venue || "", event.city || ""].join("|").toLowerCase();

const mergeEventDates = (group) => {
  const dates = new Map();
  group.events.forEach((event) => {
    getEventDates(event).forEach((date) => dates.set(date.toISOString(), date.toISOString()));
  });
  return [...dates.values()].sort();
};

export function EventMap({
  events,
  latitude,
  longitude,
  radiusKm,
  hasLocation = false,
  centerPickerActive = false,
  onCenterSelect,
  onVisibleEventsChange,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([latitude, longitude], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      leafletRef.current = L;
      mapRef.current = map;
      setMapReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;
    const eventIcon = markerIcon(L, "event-map-marker-event");
    const layers = L.layerGroup().addTo(map);
    const bounds = L.latLngBounds([]);
    if (hasLocation) {
      const circle = L.circle([latitude, longitude], {
        color: "#7437ff",
        fillColor: "#7437ff",
        fillOpacity: 0.12,
        radius: Number(radiusKm) * 1000,
        weight: 2,
      }).addTo(layers);
      bounds.extend(circle.getBounds());
      L.marker([latitude, longitude], { icon: markerIcon(L, "event-map-marker-user") })
        .bindTooltip(
          `<strong>Tu ubicación</strong><br>${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
          { className: "event-map-tooltip", direction: "top", sticky: true },
        )
        .addTo(layers);
    }

    const groupedEvents = new Map();
    events.filter(eventCoordinates).forEach((event) => {
      const key = `${Number(event.latitude).toFixed(4)},${Number(event.longitude).toFixed(4)}`;
      const group = groupedEvents.get(key) || { latitude: event.latitude, longitude: event.longitude, events: [] };
      group.events.push(event);
      groupedEvents.set(key, group);
    });

    groupedEvents.forEach((group) => {
      const location = [group.latitude, group.longitude];
      const eventGroups = new Map();
      group.events.forEach((event) => {
        const key = eventGroupKey(event);
        const eventGroup = eventGroups.get(key) || { event, events: [] };
        eventGroup.events.push(event);
        eventGroups.set(key, eventGroup);
      });
      const tooltip = [...eventGroups.values()]
        .map(
          (eventGroup) =>
            `<div class="event-map-tooltip-item"><strong>${escapeHtml(
              eventGroupLabel(eventGroup.event),
            )}</strong><br><span>${escapeHtml(
              [
                eventGroup.event.venue || eventGroup.event.city || "Evento",
                formatEventDates({ dates: mergeEventDates(eventGroup) }),
              ]
                .filter(Boolean)
                .join(" · "),
            )}</span></div>`,
        )
        .join("");
      L.marker(location, { icon: eventIcon })
        .bindTooltip(tooltip, {
          className: "event-map-tooltip",
          direction: "top",
          sticky: true,
        })
        .addTo(layers);
      bounds.extend(location);
    });

    if (centerPickerActive) {
      map.invalidateSize();
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { maxZoom: hasLocation ? 13 : 12, padding: [18, 18] });
    } else {
      map.setView([latitude, longitude], hasLocation ? 11 : 10);
    }
    map.invalidateSize();
    return () => layers.remove();
  }, [events, latitude, longitude, radiusKm, hasLocation, centerPickerActive, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !onVisibleEventsChange) return undefined;

    const reportVisibleEvents = () => {
      const bounds = map.getBounds();
      onVisibleEventsChange(
        events
          .filter(eventCoordinates)
          .filter((event) => bounds.contains([Number(event.latitude), Number(event.longitude)]))
          .map(eventMapKey),
      );
    };

    map.on("moveend", reportVisibleEvents);
    reportVisibleEvents();
    return () => map.off("moveend", reportVisibleEvents);
  }, [events, mapReady, onVisibleEventsChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerPickerActive || !onCenterSelect) return undefined;

    const selectMapPoint = ({ latlng }) => {
      onCenterSelect({ lat: latlng.lat, lng: latlng.lng });
    };

    map.on("click", selectMapPoint);
    return () => map.off("click", selectMapPoint);
  }, [centerPickerActive, mapReady, onCenterSelect]);

  useEffect(() => {
    if (!mapRef.current) return;
    const frame = requestAnimationFrame(() => mapRef.current?.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [expanded]);

  return (
    <div className={`event-map-shell${expanded ? " is-expanded" : ""}${centerPickerActive ? " is-picking" : ""}`}>
      <button
        type="button"
        className="event-map-expand"
        aria-pressed={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Achicar mapa" : "Agrandar mapa"}
      </button>
      {centerPickerActive && (
        <div className="event-map-picker" role="status">
          <span>Hacé clic en el mapa para elegir el lugar</span>
        </div>
      )}
      <div
        aria-label={hasLocation ? `Mapa de eventos en un radio de ${radiusKm} kilómetros` : "Mapa de todos los eventos"}
        className="event-map"
        ref={containerRef}
      />
    </div>
  );
}

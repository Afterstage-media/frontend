import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { formatEventDates } from "../utils/eventDates.js";

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

export function EventMap({ events, latitude, longitude, radiusKm, hasLocation = false }) {
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
      const tooltip = group.events
        .map(
          (event) =>
            `<div class="event-map-tooltip-item"><strong>${escapeHtml(event.name)}</strong><br><span>${escapeHtml(
              [event.venue || event.city || "Evento", formatEventDates(event)].filter(Boolean).join(" · "),
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

    if (bounds.isValid()) {
      map.fitBounds(bounds, { maxZoom: hasLocation ? 13 : 12, padding: [18, 18] });
    } else {
      map.setView([latitude, longitude], hasLocation ? 11 : 10);
    }
    map.invalidateSize();
    return () => layers.remove();
  }, [events, latitude, longitude, radiusKm, hasLocation, mapReady]);

  useEffect(() => {
    if (!mapRef.current) return;
    const frame = requestAnimationFrame(() => mapRef.current?.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [expanded]);

  return (
    <div className={`event-map-shell${expanded ? " is-expanded" : ""}`}>
      <button
        type="button"
        className="event-map-expand"
        aria-pressed={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Achicar mapa" : "Agrandar mapa"}
      </button>
      <div
        aria-label={hasLocation ? `Mapa de eventos en un radio de ${radiusKm} kilómetros` : "Mapa de todos los eventos"}
        className="event-map"
        ref={containerRef}
      />
    </div>
  );
}

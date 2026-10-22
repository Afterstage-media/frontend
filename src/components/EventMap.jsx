import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

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

export function EventMap({ events, latitude, longitude, radiusKm }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

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
    const userIcon = markerIcon(L, "event-map-marker-user");
    const eventIcon = markerIcon(L, "event-map-marker-event");
    const layers = L.layerGroup().addTo(map);
    const circle = L.circle([latitude, longitude], {
      color: "#7437ff",
      fillColor: "#7437ff",
      fillOpacity: 0.12,
      radius: Number(radiusKm) * 1000,
      weight: 2,
    }).addTo(layers);
    L.marker([latitude, longitude], { icon: userIcon })
      .bindPopup(`<strong>Tu ubicación</strong><br>${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`)
      .addTo(layers);

    events
      .filter((event) => event.latitude != null && event.longitude != null)
      .forEach((event) => {
        const location = [event.latitude, event.longitude];
        L.marker(location, { icon: eventIcon })
          .bindPopup(
            `<strong>${escapeHtml(event.name)}</strong><br>${escapeHtml(event.venue || event.city || "Evento")}`,
          )
          .addTo(layers);
      });

    const bounds = circle.getBounds();
    events
      .filter((event) => event.latitude != null && event.longitude != null)
      .forEach((event) => bounds.extend([event.latitude, event.longitude]));
    map.fitBounds(bounds, { maxZoom: 13, padding: [24, 24] });
    map.invalidateSize();
    return () => layers.remove();
  }, [events, latitude, longitude, radiusKm, mapReady]);

  return (
    <div
      aria-label={`Mapa de eventos en un radio de ${radiusKm} kilómetros`}
      className="event-map"
      ref={containerRef}
    />
  );
}

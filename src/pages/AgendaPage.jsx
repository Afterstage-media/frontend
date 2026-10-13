import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { EventCard } from "../components/EventCard.jsx";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
export function AgendaPage() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [location, setLocation] = useState({
    lat: "",
    lng: "",
    radiusKm: "50",
  });
  const load = () => {
    const params =
      location.lat && location.lng ? `?lat=${location.lat}&lng=${location.lng}&radiusKm=${location.radiusKm}` : "";
    api(`/api/public/events${params}`)
      .then(setEvents)
      .catch((e) => setError(e.message));
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Agenda abierta</p>
        <h1>Todos los próximos eventos.</h1>
        <p>
          Shows, ferias, ciclos y encuentros. La agenda combina eventos del medio con fuentes RSS/Atom configuradas.
        </p>
        <div className="actions editor-tools">
          <input
            placeholder="Latitud"
            value={location.lat}
            onChange={(e) => setLocation({ ...location, lat: e.target.value })}
          />
          <input
            placeholder="Longitud"
            value={location.lng}
            onChange={(e) => setLocation({ ...location, lng: e.target.value })}
          />
          <input
            type="number"
            min="1"
            placeholder="Radio km"
            value={location.radiusKm}
            onChange={(e) => setLocation({ ...location, radiusKm: e.target.value })}
          />
          <button className="button" onClick={load}>
            Filtrar distancia
          </button>
        </div>
      </section>
      <ErrorMessage error={error} />
      <section className="events">
        {events.length ? (
          events.map((event) => <EventCard event={event} key={event.id} />)
        ) : (
          <p className="muted">No hay próximos eventos cargados.</p>
        )}
      </section>
    </Layout>
  );
}

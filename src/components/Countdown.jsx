import { useEffect, useMemo, useState } from "react";

const getRemaining = (target) => Math.max(0, new Date(target).getTime() - Date.now());

export function Countdown({ target, endTarget, label = "Falta" }) {
  const targetDate = useMemo(() => (target ? new Date(target) : null), [target]);
  const endDate = useMemo(() => (endTarget ? new Date(endTarget) : null), [endTarget]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      setNow(Date.now());
      return undefined;
    }
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  const remaining = targetDate && !Number.isNaN(targetDate.getTime()) ? getRemaining(targetDate) : null;
  const isInProgress = remaining === 0 && endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() > now;

  if (remaining === null) return null;
  if (isInProgress) {
    return (
      <div className="countdown countdown-live" role="status" aria-live="polite">
        <span className="countdown-label">En curso</span>
        <strong>Evento de varios días</strong>
      </div>
    );
  }
  if (remaining === 0) {
    return (
      <div className="countdown countdown-live" role="status" aria-live="polite">
        <span className="countdown-label">Ahora</span>
        <strong>El evento ya comenzó</strong>
      </div>
    );
  }

  const totalMinutes = Math.floor(remaining / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const values = [
    [days, "días"],
    [hours, "horas"],
    [minutes, "min"],
  ];

  return (
    <div
      className="countdown"
      role="timer"
      aria-live="off"
      aria-label={`${label}: ${days} días, ${hours} horas y ${minutes} minutos`}
    >
      <span className="countdown-label">{label}</span>
      <div className="countdown-values">
        {values.map(([value, unit]) => (
          <span className="countdown-unit" key={unit}>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>{unit}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

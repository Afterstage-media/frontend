import { useEffect, useMemo, useState } from "react";

const getRemaining = (target) => Math.max(0, new Date(target).getTime() - Date.now());

export function Countdown({ target, label = "Falta" }) {
  const targetDate = useMemo(() => (target ? new Date(target) : null), [target]);
  const [remaining, setRemaining] = useState(() =>
    targetDate && !Number.isNaN(targetDate.getTime()) ? getRemaining(targetDate) : null,
  );

  useEffect(() => {
    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      setRemaining(null);
      return undefined;
    }
    const update = () => setRemaining(getRemaining(targetDate));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  if (remaining === null) return null;
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

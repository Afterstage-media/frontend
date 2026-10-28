import { Button } from "./ui/Button.jsx";

export function LoadingState({ label = "Cargando…" }) {
  return (
    <div className="ui-state ui-state-loading" role="status" aria-live="polite">
      <span className="ui-state-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Algo no salió como esperábamos.", message, onRetry }) {
  return (
    <div className="ui-state ui-state-error" role="alert">
      <span className="ui-state-kicker">Señal interrumpida</span>
      <strong>{title}</strong>
      <p>{message || "Probá de nuevo en unos segundos o seguí explorando el resto del medio."}</p>
      {onRetry && (
        <Button className="ghost" onClick={onRetry}>
          Intentar de nuevo ↗
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="ui-state ui-state-empty">
      <span className="ui-state-kicker">Archivo en movimiento</span>
      <strong>{title}</strong>
      <p>{message}</p>
      {action}
    </div>
  );
}

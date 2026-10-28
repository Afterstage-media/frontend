import { useModalFocus } from "../../utils/useModalFocus.js";

export function Dialog({
  children,
  onClose,
  backdropClassName = "modal-backdrop",
  panelClassName = "modal-panel",
  panelAs: Panel = "div",
  labelledBy,
  label,
  className = "",
  ...panelProps
}) {
  const handleClose = onClose || (() => {});
  const dialogRef = useModalFocus(handleClose);
  return (
    <div
      className={[backdropClassName, className].filter(Boolean).join(" ")}
      onMouseDown={(event) => event.target === event.currentTarget && handleClose()}
      role="presentation"
    >
      <Panel
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={panelClassName}
        ref={dialogRef}
        role="dialog"
        {...panelProps}
      >
        {children}
      </Panel>
    </div>
  );
}

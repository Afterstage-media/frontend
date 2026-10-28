import { Dialog } from "./Dialog.jsx";

export function Drawer({ children, onClose, className = "", panelClassName = "", ...props }) {
  return (
    <Dialog
      backdropClassName="drawer-backdrop"
      className={className}
      onClose={onClose}
      panelClassName={`drawer-panel ${panelClassName}`.trim()}
      {...props}
    >
      {children}
    </Dialog>
  );
}

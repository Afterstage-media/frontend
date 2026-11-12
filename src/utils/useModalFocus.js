import { useEffect, useRef } from "react";

const focusableSelector =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useModalFocus(onClose) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousScrollX = window.scrollX;
    const previousScrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousRootPaddingRight = document.documentElement.style.paddingRight;
    const root = document.documentElement;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const rootPaddingRight = Number.parseFloat(window.getComputedStyle(root).paddingRight) || 0;
    const dialog = dialogRef.current;
    const getFocusable = () =>
      [...(dialog?.querySelectorAll(focusableSelector) || [])].filter((element) => {
        const styles = window.getComputedStyle(element);
        return styles.visibility !== "hidden" && styles.display !== "none";
      });

    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    if (scrollbarWidth > 0) root.style.paddingRight = `${rootPaddingRight + scrollbarWidth}px`;
    getFocusable()[0]?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const elements = getFocusable();
      if (!elements.length) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      root.style.overflow = previousRootOverflow;
      root.style.paddingRight = previousRootPaddingRight;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      window.scrollTo(previousScrollX, previousScrollY);
    };
  }, []);

  return dialogRef;
}

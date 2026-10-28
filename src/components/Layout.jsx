import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { PageShell } from "./shell/PageShell.jsx";
import { SiteFooter } from "./shell/SiteFooter.jsx";
import { SiteHeader } from "./shell/SiteHeader.jsx";
import { WorkspaceSidebar } from "./shell/WorkspaceSidebar.jsx";

const themeStorageKey = "afterstage-theme-v2";
const LayoutContext = createContext(false);

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  let saved;
  try {
    saved = window.localStorage.getItem(themeStorageKey);
  } catch {
    saved = null;
  }
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

export function Layout({ children }) {
  if (useContext(LayoutContext)) return children;
  return <LayoutShell>{children}</LayoutShell>;
}

function LayoutShell({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [roles, setRoles] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState(() =>
    typeof window !== "undefined" && window.location.pathname.startsWith("/agenda") ? "eventos" : "notas",
  );
  const [collapsedSections, setCollapsedSections] = useState({});
  const reflectorRefs = useRef([]);
  const reflectorStageRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const hasStoredSession = typeof window !== "undefined" && Boolean(window.localStorage.getItem("afterstage-token"));
  // A logged-in person keeps the workspace shell while browsing public routes.
  const isWorkspace = roles?.length > 0 || (roles === null && hasStoredSession);
  const isAdminPath = location.pathname.startsWith("/admin") && roles?.length > 0;

  useEffect(() => {
    const refreshRoles = () => {
      const token = localStorage.getItem("afterstage-token");
      if (!token) {
        setRoles([]);
        return;
      }
      api("/api/auth/me")
        .then(({ user }) => {
          if (localStorage.getItem("afterstage-token") === token) setRoles(user.roles || []);
        })
        .catch(() => setRoles([]));
    };
    refreshRoles();
    window.addEventListener("afterstage-auth-changed", refreshRoles);
    return () => window.removeEventListener("afterstage-auth-changed", refreshRoles);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Private browsing may disable localStorage; the theme still works per session.
    }
  }, [theme]);

  useEffect(() => {
    const stage = reflectorStageRef.current;
    if (!stage) return undefined;

    let frame = 0;
    let firingTimeout;
    let palette = 0;
    let pointer = { x: window.innerWidth / 2, y: 120 };

    const render = () => {
      frame = 0;
      const { x, y } = pointer;
      stage.style.setProperty("--pointer-x", `${x}px`);
      stage.style.setProperty("--pointer-y", `${y}px`);
      stage.style.setProperty("--lights-opacity", "1");

      reflectorRefs.current.forEach((reflector) => {
        if (!reflector) return;
        const bounds = reflector.getBoundingClientRect();
        const sourceX = bounds.left + bounds.width / 2;
        const sourceY = bounds.top + bounds.height / 2;
        const angle = (Math.atan2(y - sourceY, x - sourceX) * 180) / Math.PI - 90;
        const distance = Math.max(140, Math.hypot(x - sourceX, y - sourceY));
        reflector.style.setProperty("--beam-angle", `${angle}deg`);
        reflector.style.setProperty("--beam-distance", `${distance}px`);
        reflector.style.setProperty("--source-x", `${sourceX}px`);
        reflector.style.setProperty("--source-y", `${sourceY}px`);
      });
    };

    const onPointerMove = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    const onPointerLeave = () => stage.style.setProperty("--lights-opacity", "0");
    const onPointerOut = (event) => {
      if (!event.relatedTarget) onPointerLeave();
    };
    const onPointerDown = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(render);
      palette = (palette + 1) % 4;
      stage.dataset.palette = String(palette);
      stage.classList.remove("is-firing");
      void stage.offsetWidth;
      stage.classList.add("is-firing");
      window.clearTimeout(firingTimeout);
      firingTimeout = window.setTimeout(() => stage.classList.remove("is-firing"), 520);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    render();
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("pointerdown", onPointerDown);
      window.clearTimeout(firingTimeout);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const can = (...allowedRoles) => roles?.some((role) => allowedRoles.includes(role));
  const logOut = () => {
    localStorage.removeItem("afterstage-token");
    window.dispatchEvent(new Event("afterstage-auth-changed"));
    navigate("/");
  };
  const closeMenu = () => setMenuOpen(false);
  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    const destination = searchScope === "eventos" ? "/agenda" : "/notas";
    navigate(query ? `${destination}?q=${encodeURIComponent(query)}` : destination);
  };

  const header = (
    <SiteHeader
      can={can}
      isAdminPath={isAdminPath}
      isWorkspace={isWorkspace}
      logOut={logOut}
      menuOpen={menuOpen}
      reflectorRefs={reflectorRefs}
      reflectorStageRef={reflectorStageRef}
      roles={roles}
      searchQuery={searchQuery}
      searchScope={searchScope}
      setMenuOpen={setMenuOpen}
      setSearchQuery={setSearchQuery}
      setSearchScope={setSearchScope}
      submitSearch={submitSearch}
    />
  );
  const sidebar = isWorkspace ? (
    <WorkspaceSidebar
      can={can}
      closeMenu={closeMenu}
      collapsedSections={collapsedSections}
      logOut={logOut}
      menuOpen={menuOpen}
      setCollapsedSections={setCollapsedSections}
    />
  ) : null;

  return (
    <LayoutContext.Provider value>
      <PageShell
        footer={<SiteFooter admin={isAdminPath || isWorkspace} />}
        header={header}
        sidebar={sidebar}
        workspace={isWorkspace}
      >
        {children}
      </PageShell>
    </LayoutContext.Provider>
  );
}

export const Loading = () => <p className="muted">Cargando…</p>;
export const ErrorMessage = ({ error }) =>
  error ? (
    <p aria-live="polite" className="error" role="alert">
      {error}
    </p>
  ) : null;

import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  getMobileMenuItems,
  mobileNavigationText as text,
  mobilePrimaryLinks,
} from "../navigation/mobileNavigation.js";

function MobileLink({ item, onNavigate }) {
  return (
    <NavLink aria-label={item.label} end={item.end} onClick={onNavigate} to={item.to}>
      <MobileIcon name={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export function MobileNavigation({ can, isWorkspace, logOut, roles }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const menuItems = getMobileMenuItems({ can, isWorkspace, roles });
  const primaryLinks = isWorkspace
    ? mobilePrimaryLinks.map((item, index) =>
        index === 3 ? { ...item, label: text.network, to: "/red", icon: "network" } : item,
      )
    : mobilePrimaryLinks;

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMoreOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMoreOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMoreOpen]);

  const closeMenu = () => setIsMoreOpen(false);
  const onItemAction = (item) => {
    if (item.action === "logout") logOut();
    closeMenu();
  };

  return (
    <nav aria-label={text.navigation} className={`mobile-bottom-nav${isMoreOpen ? " has-open-menu" : ""}`}>
      {isMoreOpen && (
        <button aria-label={text.closeMoreMenu} className="mobile-menu-backdrop" onClick={closeMenu} type="button" />
      )}
      <section
        aria-label={isWorkspace ? text.moreWorkspaceSections : text.moreSections}
        className="mobile-more-panel"
        hidden={!isMoreOpen}
        id="mobile-more-menu"
      >
        <div className="mobile-more-heading">
          <strong>{text.explore}</strong>
          <button aria-label={text.closeMenu} onClick={closeMenu} type="button">
            ×
          </button>
        </div>
        <div className="mobile-more-links">
          {menuItems.map((item) =>
            item.action ? (
              <button className="mobile-menu-logout" key={item.id} onClick={() => onItemAction(item)} type="button">
                <MobileIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ) : (
              <MobileLink item={item} key={item.id} onNavigate={closeMenu} />
            ),
          )}
        </div>
      </section>
      <div className="mobile-bottom-items">
        {primaryLinks.map((item) => (
          <MobileLink item={item} key={item.id} onNavigate={closeMenu} />
        ))}
        <button
          aria-controls="mobile-more-menu"
          aria-expanded={isMoreOpen}
          className={isMoreOpen ? "is-active" : ""}
          onClick={() => setIsMoreOpen((open) => !open)}
          type="button"
        >
          <MobileIcon name="more" />
          <span>{text.more}</span>
        </button>
      </div>
    </nav>
  );
}

function MobileIcon({ name }) {
  const paths = {
    account: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
      </>
    ),
    calendar: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="5" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h7" />
      </>
    ),
    community: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    directory: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <circle cx="9" cy="10" r="2" />
        <path d="M5.5 16c.4-1.6 1.5-2.5 3.5-2.5s3.1.9 3.5 2.5M15 9h3M15 13h3" />
      </>
    ),
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" />,
    logout: (
      <>
        <path d="M10 17l5-5-5-5m5 5H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
    mail: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    manage: (
      <>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),
    market: (
      <>
        <path d="M4 8h16l-1 12H5L4 8Z" />
        <path d="M8 8a4 4 0 0 1 8 0M9 12v2m6-2v2" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    network: (
      <>
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="m11 7-5 9m7-9 5 9M7 18h10" />
      </>
    ),
    notes: (
      <>
        <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M8 12h8M8 16h8" />
      </>
    ),
    press: (
      <>
        <path d="M4 4h15v16H4zM8 8h7M8 12h7M8 16h4" />
        <path d="M2 7v12a2 2 0 0 0 2 2" />
      </>
    ),
    publish: <path d="M12 16V4m-5 5 5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />,
    services: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
        <circle cx="8" cy="7" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="10" cy="17" r="2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    social: (
      <>
        <rect height="16" rx="4" width="16" x="4" y="4" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    transport: (
      <>
        <path d="M5 17h14l1-7-2-5H6l-2 5 1 7Z" />
        <path d="M4 10h16M7 17v2m10-2v2M7 14h.01M17 14h.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name] || paths.more}
    </svg>
  );
}

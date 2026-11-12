import { mobileNavigationEs as text } from "../i18n/es-AR.dictionary.js";

const sharedLinks = [
  ["home", text.home, "/", "home", true],
  ["notes", text.notes, "/notas", "notes"],
  ["calendar", text.calendar, "/agenda", "calendar"],
  ["services", text.services, "/servicios", "services"],
  ["network", text.networkWork, "/red", "network"],
  ["marketplace", text.marketplace, "/marketplace", "market"],
  ["insurance", text.shield, "/seguros", "shield"],
  ["transport", text.transport, "/traslados", "transport"],
];

const publicLinks = [
  ["community", text.community, "/comunidad", "community"],
  ["contribute", text.workWithAfterstage, "/colaborador", "account"],
  ["how-it-works", text.howItWorks, "/como-funciona", "services"],
  ["policy", text.policy, "/politica-editorial", "notes"],
  ["credits", text.credits, "/codigo-de-creditos", "notes"],
];

export function getMobileMenuItems({ isWorkspace, roles, can }) {
  const items = sharedLinks.map(([id, label, to, icon, end]) => ({ id, label, to, icon, end }));

  if (isWorkspace) {
    if (can("admin", "editor", "press", "directory", "auditor")) {
      items.push({ id: "directory", label: text.directory, to: "/directorio", icon: "directory" });
    }
    if (can("admin", "editor")) {
      items.push(
        { id: "content", label: text.admin, to: "/admin", icon: "publish" },
        { id: "new-post", label: text.newPost, to: "/admin/nueva", icon: "publish" },
        { id: "social", label: text.social, to: "/admin/redes", icon: "social" },
        { id: "social-series", label: text.socialSeries, to: "/admin/redes/series", icon: "social" },
      );
    }
    if (can("admin", "editor", "press")) {
      items.push({ id: "press", label: text.press, to: "/admin/prensa", icon: "press" });
    }
    if (can("admin", "editor", "press", "community")) {
      items.push(
        { id: "mail", label: text.mail, to: "/admin/correo", icon: "mail" },
        { id: "platform", label: text.operations, to: "/admin/plataforma", icon: "manage" },
      );
    }
    if (can("admin", "editor", "community")) {
      items.push({ id: "propose", label: text.propose, to: "/publicar", icon: "publish" });
    }
    if (can("admin", "editor", "press", "community", "social")) {
      items.push({ id: "coverages", label: text.replacements, to: "/reemplazos", icon: "calendar" });
    }
    if (can("admin", "press")) {
      items.push({ id: "manage-coverages", label: text.manageCoverages, to: "/admin/reemplazos", icon: "manage" });
    }
    if (can("admin", "social")) {
      items.push({ id: "instagram", label: text.instagram, to: "/admin/instagram", icon: "social" });
    }
    if (can("admin")) {
      items.push({ id: "users", label: text.users, to: "/admin/usuarios", icon: "manage" });
    }
    if (roles?.length) items.push({ id: "ai-access", label: text.iaAccess, to: "/cuenta/accesos-ia", icon: "account" });
    items.push(
      { id: "profile", label: text.viewProfile, to: "/colaborador", icon: "account" },
      { id: "public-site", label: text.sitePublic, to: "/", icon: "home" },
      { id: "logout", label: text.sessionClose, action: "logout", icon: "logout" },
    );
    return items;
  }

  if (can("admin", "editor", "press", "directory")) {
    items.push({ id: "directory", label: text.directory, to: "/directorio", icon: "directory" });
  }
  if (can("admin", "editor", "community")) {
    items.push({ id: "publish", label: text.publish, to: "/publicar", icon: "publish" });
  }
  if (can("admin", "editor", "press", "community", "social")) {
    items.push({ id: "coverage-application", label: text.applyForCoverage, to: "/reemplazos", icon: "calendar" });
  }
  if (roles?.length) items.push({ id: "ai-access", label: text.iaAccess, to: "/cuenta/accesos-ia", icon: "account" });
  if (can("admin", "editor")) {
    items.push({ id: "admin", label: text.admin, to: "/admin", icon: "manage" });
  }
  return [...items, ...publicLinks.map(([id, label, to, icon]) => ({ id, label, to, icon }))];
}

export const mobilePrimaryLinks = [
  { id: "home", label: text.home, to: "/", icon: "home", end: true },
  { id: "notes", label: text.notes, to: "/notas", icon: "notes" },
  { id: "calendar", label: text.calendar, to: "/agenda", icon: "calendar" },
  { id: "community", label: text.community, to: "/comunidad", icon: "community" },
];

export const mobileNavigationText = text;

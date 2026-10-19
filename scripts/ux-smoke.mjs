import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

const home = await read("src/pages/HomePage.jsx");
const agenda = await read("src/pages/AgendaPage.jsx");
const eventCard = await read("src/components/EventCard.jsx");
const countdown = await read("src/components/Countdown.jsx");
const layout = await read("src/components/Layout.jsx");
const auth = await read("src/components/AuthGate.jsx");
const app = await read("src/app/App.jsx");
const article = await read("src/pages/ArticlePage.jsx");
const admin = await read("src/pages/AdminPages.jsx");
const replacements = await read("src/pages/ReplacementsPage.jsx");
const styles = await read("src/styles/responsive.css");

assert.match(home, /LoadingState/);
assert.match(home, /ErrorState/);
assert.match(home, /EmptyState/);
assert.match(home, /Encontrar un plan/);
assert.match(agenda, /Intentar de nuevo/);
assert.match(agenda, /EmptyState/);
assert.match(eventCard, /Countdown/);
assert.match(countdown, /días/);
assert.match(countdown, /horas/);
assert.match(countdown, /min/);
assert.match(layout, /skip-link/);
assert.match(layout, /aria-label="Navegación principal"/);
assert.match(auth, /auth-form/);
assert.match(app, /<Route path="\*" element={<NotFoundPage \/>} \/>/);
assert.match(app, /<Route path="\/busquedas" element={<ReplacementsPage \/>} \/>/);
assert.match(layout, /<NavLink to="\/busquedas">Búsquedas<\/NavLink>/);
assert.match(layout, /can\("admin", "editor", "press", "community", "social"\)/);
assert.match(article, /Nota no disponible/);
assert.match(admin, /<AuthGate allowedRoles=\{\["admin", "editor"\]\}>/);
assert.match(admin, /<AuthGate allowedRoles=\{\["admin", "editor"\]\}>/);
assert.match(admin, /<AuthGate allowedRoles=\{\["admin", "press"\]\}>/);
assert.match(replacements, /useEffect\(\(\) => \{/);
assert.match(replacements, /Todavía no hay búsquedas abiertas/);
assert.match(styles, /\.auth-form/);

console.log("UX smoke checks passed: resilient states, navigation, auth layout and mobile rules are present.");

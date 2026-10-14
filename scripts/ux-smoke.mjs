import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

const home = await read("src/pages/HomePage.jsx");
const agenda = await read("src/pages/AgendaPage.jsx");
const layout = await read("src/components/Layout.jsx");
const auth = await read("src/components/AuthGate.jsx");
const styles = await read("src/styles/responsive.css");

assert.match(home, /LoadingState/);
assert.match(home, /ErrorState/);
assert.match(home, /EmptyState/);
assert.match(home, /Encontrar un plan/);
assert.match(agenda, /Intentar de nuevo/);
assert.match(agenda, /EmptyState/);
assert.match(layout, /skip-link/);
assert.match(layout, /aria-label="Navegación principal"/);
assert.match(auth, /auth-form/);
assert.match(styles, /\.auth-form/);

console.log("UX smoke checks passed: resilient states, navigation, auth layout and mobile rules are present.");

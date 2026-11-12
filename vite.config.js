import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function offlineAppPlugin(base) {
  return {
    name: "afterstage-offline-app",
    generateBundle(_options, bundle) {
      const cachedAssets = Object.keys(bundle).filter((fileName) => /\.(?:js|css|svg)$/.test(fileName));
      const precachePaths = [
        base,
        `${base}manifest.webmanifest`,
        `${base}favicon.svg`,
        `${base}apple-touch-icon.png`,
        `${base}icon-192.png`,
        `${base}icon-512.png`,
        ...cachedAssets.map((fileName) => `${base}${fileName}`),
      ];
      const buildFingerprint = precachePaths
        .slice()
        .sort()
        .join("|")
        .split("")
        .reduce((hash, character) => ((hash * 33) ^ character.charCodeAt(0)) >>> 0, 5381)
        .toString(36);
      const workerSource = `
const CACHE_NAME = "afterstage-app-${buildFingerprint}";
const APP_SCOPE = self.registration.scope;
const APP_ENTRY = new URL("./", APP_SCOPE).href;
const PRECACHE_URLS = ${JSON.stringify(precachePaths)}.map((path) => new URL(path, self.location.origin).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("afterstage-app-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.includes("/api/") || url.pathname.includes("/media/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(APP_ENTRY, response.clone()));
      return response;
    }).catch(async () => (await caches.match(APP_ENTRY)) || Response.error()));
    return;
  }

  if (!/\\.(?:js|css|svg|png|webp|woff2?)$/.test(url.pathname)) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && response.type === "basic") caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
`;
      this.emitFile({ type: "asset", fileName: "service-worker.js", source: workerSource });
    },
  };
}

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
const defaultBase =
  process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith(".github.io") ? `/${repositoryName}/` : "/";

export default defineConfig({
  plugins: [react(), offlineAppPlugin(process.env.VITE_BASE_PATH || defaultBase)],
  base: process.env.VITE_BASE_PATH || defaultBase,
  server: { port: 5173, proxy: { "/api": "http://localhost:8787", "/media": "http://localhost:8787" } },
  build: { outDir: "dist", emptyOutDir: true },
});

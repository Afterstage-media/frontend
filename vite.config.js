import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
const defaultBase =
  process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith(".github.io")
    ? `/${repositoryName}/`
    : "/";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || defaultBase,
  server: { port: 5173, proxy: { "/api": "http://localhost:8787", "/media": "http://localhost:8787" } },
  build: { outDir: "dist", emptyOutDir: true },
});

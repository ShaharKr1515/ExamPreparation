import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

// Serves the production build (npm run build) plus the /api routes. In development use
// `npm run dev` instead — Vite serves the app and proxies /api to this server.
if (!fs.existsSync(distDir)) {
    console.warn(`[server] No build found in dist/ (${distDir}). Run \`npm run build\`, or use \`npm run dev\`.`);
}

const app = createApp();

// Static assets from the Vite build, then an SPA fallback so client-side routing works.
app.use(express.static(distDir));
app.get("/*splat", (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
    console.log(`[server] Listening on http://localhost:${port}`);
});

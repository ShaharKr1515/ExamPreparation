import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");

// Serves the production build (npm run build). In development use `npm run dev`
// instead — Vite serves the app and proxies /api to this server.
if (!fs.existsSync(distDir)) {
    console.error("No build found in dist/. Run `npm run build` first, or use `npm run dev`.");
}

const app = express();

app.use(express.static(distDir));

// SPA fallback: any non-file route returns index.html so client-side routing works.
// Express 5 requires a named wildcard ("*splat") instead of a bare "*".
app.get("/*splat", (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server listening on port 3000");
});

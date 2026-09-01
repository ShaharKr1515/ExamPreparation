import express from "express";
import * as svc from "./services/examService.js";
import subjectsRouter from "./routes/subjects.routes.js";
import examsRouter from "./routes/exams.routes.js";

export function createApp() {
    const app = express();

    app.use(express.json());

    // Full snapshot used to hydrate the frontend on load.
    app.get("/api/state", (_req, res) => {
        res.json(svc.getFullState());
    });

    // "ניקוי הכול" — wipe every subject, exam and question.
    app.post("/api/clear-all", (_req, res) => {
        svc.clearEverything();
        res.json({ ok: true });
    });

    app.use("/api/subjects", subjectsRouter);
    app.use("/api/exams", examsRouter);

    // Central error handler (JSON body parse errors land here).
    app.use((err, _req, res, _next) => {
        const status = err.status || 500;
        if (status >= 500) console.error(err);
        res.status(status).json({ error: err.message || "Internal server error" });
    });

    return app;
}

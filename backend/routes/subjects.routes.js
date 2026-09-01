import { Router } from "express";
import * as svc from "../services/examService.js";

const router = Router();

// List all subjects (ordered by creation).
router.get("/", (_req, res) => {
    res.json(svc.listSubjects());
});

// Create a subject. Duplicate names are never duplicated — the existing row is returned.
router.post("/", (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "Subject name is required" });
    res.status(201).json(svc.createSubject(name));
});

export default router;

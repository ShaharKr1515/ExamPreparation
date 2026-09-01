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

// Rename a subject (identified by its current display name, like the rest of the API).
router.patch("/:id", (req, res) => {
    const subject = svc.findSubjectByName(String(req.params.id ?? ""));
    if (!subject) return res.status(404).json({ error: `Unknown subject: ${req.params.id}` });
    try {
        svc.renameSubject(Number(subject.id), String(req.body?.name ?? ""));
    } catch (e) {
        return res.status(e.status || 500).json({ error: e.message });
    }
    res.json(svc.findSubjectByName(String(req.body?.name ?? "")));
});

// Delete a subject and everything under it.
router.delete("/:id", (req, res) => {
    const subject = svc.findSubjectByName(String(req.params.id ?? ""));
    if (!subject) return res.status(404).json({ error: `Unknown subject: ${req.params.id}` });
    svc.deleteSubject(Number(subject.id));
    res.json({ ok: true });
});

export default router;

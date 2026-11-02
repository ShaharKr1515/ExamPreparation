import { Router } from "express";
import * as svc from "../services/examService.js";
import * as semester from "../services/semesterService.js";

const router = Router();

// List all subjects (ordered by creation).
router.get("/", (_req, res) => {
    res.json(svc.listSubjects());
});

// Create a subject with its study dates and `examCount` auto-created exams.
// Duplicate names are never duplicated — the existing row (and no new exams) is returned.
router.post("/", (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "Subject name is required" });
    const examCount = Math.max(0, Math.min(50, Number(req.body?.examCount) || 0));
    const studyStartDate = String(req.body?.studyStartDate ?? "");
    const finalExamDate = String(req.body?.finalExamDate ?? "");
    res.status(201).json(svc.createSubject(name, {
        examCount, studyStartDate, finalExamDate,
        mode: req.body?.mode,
        semesterStartDate: req.body?.semesterStartDate,
        semesterEndDate: req.body?.semesterEndDate,
    }));
});

router.use("/:id/semester", (req, res, next) => {
    req.subject = svc.findSubjectByName(req.params.id);
    if (!req.subject) return res.status(404).json({ error: "הקורס לא נמצא." });
    next();
});
router.patch("/:id/semester", (req, res) => res.json(semester.updateSemester(req.subject, req.body || {})));

router.use("/:id/assignments", (req, res, next) => {
    req.subject = svc.findSubjectByName(req.params.id);
    if (!req.subject) return res.status(404).json({ error: "הקורס לא נמצא." });
    next();
});
router.post("/:id/assignments", (req, res) => res.status(201).json(semester.createAssignment(req.subject, req.body || {})));
router.patch("/:id/assignments/:assignmentId", (req, res) => {
    res.json(semester.updateAssignment(req.subject, Number(req.params.assignmentId), req.body || {}));
});
router.delete("/:id/assignments/:assignmentId", (req, res) => {
    semester.deleteAssignment(req.subject, Number(req.params.assignmentId));
    res.json({ ok: true });
});

// Update the subject-level dates (study start / final exam) of a subject.
router.patch("/:id/dates", (req, res) => {
    const subject = svc.findSubjectByName(String(req.params.id ?? ""));
    if (!subject) return res.status(404).json({ error: `Unknown subject: ${req.params.id}` });
    svc.updateSubjectDates(
        Number(subject.id),
        String(req.body?.studyStartDate ?? ""),
        String(req.body?.finalExamDate ?? ""),
    );
    res.json(svc.findSubjectByName(String(req.params.id)));
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

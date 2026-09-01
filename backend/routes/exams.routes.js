import { Router } from "express";
import * as svc from "../services/examService.js";

const router = Router();

// Create an exam under a subject (identified by name, since the UI tracks subjects by name).
router.post("/", (req, res) => {
    const subjectName = String(req.body?.subjectName ?? "").trim();
    const name = String(req.body?.name ?? "");
    if (!subjectName) return res.status(400).json({ error: "subjectName is required" });

    const subject = svc.findSubjectByName(subjectName);
    if (!subject) return res.status(404).json({ error: `Unknown subject: ${subjectName}` });

    // QUESTION_COUNT must stay in sync with the frontend (src/utils/examUtils.js).
    const exam = svc.createExam(Number(subject.id), name, 5);
    res.status(201).json({ ...exam, subject: subject.name });
});

// Rename an exam.
router.patch("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!svc.getExamById(id)) return res.status(404).json({ error: "Exam not found" });
    svc.renameExam(id, String(req.body?.name ?? ""));
    res.json(svc.getExamById(id));
});

// Delete an exam (its questions are removed via FK cascade; the subject is kept).
router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!svc.getExamById(id)) return res.status(404).json({ error: "Exam not found" });
    svc.deleteExam(id);
    res.json({ ok: true });
});

// Update a single question field. Body: { success?, date?, points? } (exactly one expected).
router.patch("/:id/questions/:position", (req, res) => {
    const examId = Number(req.params.id);
    const position = Number(req.params.position);
    if (!svc.getExamById(examId)) return res.status(404).json({ error: "Exam not found" });

    const body = req.body ?? {};
    for (const field of ["success", "date", "points"]) {
        if (field in body) svc.updateQuestion(examId, position, field, String(body[field] ?? ""));
    }
    res.json({ ok: true });
});

export default router;

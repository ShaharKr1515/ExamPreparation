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

    const exam = svc.createExam(Number(subject.id), name);
    res.status(201).json({ ...exam, subject: subject.name });
});

// Adjust the number of exams under a subject to `target` (creates or deletes as needed).
// Body: { target }. Returns the updated list of exams for that subject.
router.patch("/count/:subjectName", (req, res) => {
    const subject = svc.findSubjectByName(String(req.params.subjectName ?? ""));
    if (!subject) return res.status(404).json({ error: `Unknown subject: ${req.params.subjectName}` });

    const target = Math.max(0, Math.min(50, Number(req.body?.target) || 0));
    const exams = svc.adjustExamCount(Number(subject.id), target);
    res.json(exams.map((e) => ({ ...e, subject: subject.name })));
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

// Add an empty sub-question after a given position (or at the end when omitted).
router.post("/:id/questions", (req, res) => {
    const examId = Number(req.params.id);
    if (!svc.getExamById(examId)) return res.status(404).json({ error: "Exam not found" });

    const rawAfter = req.body?.afterPosition;
    const afterPosition = rawAfter == null ? null : Math.max(0, Number(rawAfter));
    const exam = svc.addQuestion(examId, afterPosition);
    res.status(201).json(exam);
});

// Delete a question (e.g. sub-question) at a given position.
router.delete("/:id/questions/:pos", (req, res) => {
    const examId = Number(req.params.id);
    const position = Number(req.params.pos);
    if (!svc.getExamById(examId)) return res.status(404).json({ error: "Exam not found" });
    if (!Number.isInteger(position) || position < 0) return res.status(400).json({ error: "Invalid position" });

    const exam = svc.deleteQuestion(examId, position);
    res.json(exam);
});

export default router;

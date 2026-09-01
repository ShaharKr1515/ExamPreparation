import { db } from "../db/database.js";

/**
 * Data access for subjects, exams and questions.
 * All functions are synchronous (node:sqlite) — Express 5 handles sync handlers fine.
 */

// ---------- Subjects ----------

export function listSubjects() {
    return db.prepare("SELECT id, name FROM subjects ORDER BY id").all();
}

/** Create a subject; if one with the same name already exists it is returned instead (no duplicates). */
export function createSubject(name) {
    const existing = db.prepare("SELECT * FROM subjects WHERE name = ? COLLATE NOCASE").get(name);
    if (existing) return existing;
    const info = db.prepare("INSERT INTO subjects (name) VALUES (?)").run(name);
    return db.prepare("SELECT id, name FROM subjects WHERE id = ?").get(info.lastInsertRowid);
}

/** Look up a subject by its display name (case-insensitive). Returns the row or null. */
export function findSubjectByName(name) {
    return db.prepare("SELECT * FROM subjects WHERE name = ? COLLATE NOCASE").get(name) || null;
}

// ---------- Exams ----------

/** Create an exam under a subject and seed it with `questionCount` empty questions. */
export function createExam(subjectId, name, questionCount) {
    const info = db.prepare("INSERT INTO exams (subject_id, name) VALUES (?, ?)").run(subjectId, name);
    const examId = Number(info.lastInsertRowid);

    const insertQ = db.prepare(
        "INSERT INTO questions (exam_id, position, success, last_date, points) VALUES (?, ?, '', '', '')",
    );
    for (let i = 0; i < questionCount; i++) {
        insertQ.run(examId, i);
    }

    return getExamById(examId);
}

export function renameExam(id, name) {
    db.prepare("UPDATE exams SET name = ? WHERE id = ?").run(name, id);
}

/** Delete an exam and its questions. Returns the owning subject_id (for cascade cleanup). */
export function deleteExam(id) {
    const row = db.prepare("SELECT subject_id FROM exams WHERE id = ?").get(id);
    if (!row) return null;
    db.prepare("DELETE FROM exams WHERE id = ?").run(id);
    return Number(row.subject_id);
}

/** Wipe everything (the "ניקוי הכול" action): all questions, exams and subjects. */
export function clearEverything() {
    db.exec("DELETE FROM questions");
    db.exec("DELETE FROM exams");
    db.exec("DELETE FROM subjects");
}

// ---------- Questions ----------

/** Local date as YYYY-MM-DD (matches the <input type="date"> format). */
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Frontend field name -> DB column. The UI sends `date`; the table stores it as `last_date`.
const FIELD_TO_COLUMN = { success: "success", date: "last_date", points: "points" };

/** Update one field of a single question (by 0-based position). */
export function updateQuestion(examId, position, field, value) {
    const column = FIELD_TO_COLUMN[field];
    if (!column) throw new Error(`Invalid question field: ${field}`);

    // Preserve the original UX: the first touch on success/points stamps today's date.
    if (field === "success" || field === "points") {
        db.prepare(
            "UPDATE questions SET last_date = ? WHERE exam_id = ? AND position = ? AND (last_date IS NULL OR last_date = '')",
        ).run(todayStr(), examId, position);
    }

    db.prepare(`UPDATE questions SET ${column} = ? WHERE exam_id = ? AND position = ?`).run(value, examId, position);
}

// ---------- Read helpers (shared shape) ----------

function rowToExam(row) {
    const qs = db.prepare("SELECT * FROM questions WHERE exam_id = ? ORDER BY position").all(row.id);
    return {
        id: Number(row.id),
        name: row.name,
        subjectId: Number(row.subject_id),
        // Frontend shape: `subject` is the display string; `questions[i] = {success, date, points}`.
        questions: qs.map((q) => ({ success: q.success, date: q.last_date, points: q.points })),
    };
}

export function getExamById(id) {
    const row = db.prepare("SELECT * FROM exams WHERE id = ?").get(id);
    return row ? rowToExam(row) : null;
}

/** Full snapshot for the frontend: subjects (name strings), all exams, and a suggested active subject. */
export function getFullState() {
    const subjects = listSubjects();
    const examRows = db.prepare("SELECT * FROM exams ORDER BY id").all();
    const exams = examRows.map(rowToExam);

    // Attach the owning subject's display name to each exam (frontend filters by this).
    const subjNameById = new Map(subjects.map((s) => [Number(s.id), s.name]));
    for (const e of exams) {
        e.subject = subjNameById.get(e.subjectId) || "";
    }

    // Suggested active tab: the first subject that still has at least one exam, else the first subject.
    const subjectsWithExams = new Set(exams.map((e) => e.subjectId));
    let activeSubject = null;
    for (const s of subjects) {
        if (subjectsWithExams.has(Number(s.id))) {
            activeSubject = s.name;
            break;
        }
    }
    if (!activeSubject && subjects.length > 0) activeSubject = subjects[0].name;

    return {
        subjects: subjects.map((s) => s.name),
        exams,
        activeSubject,
    };
}

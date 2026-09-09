import { db } from "../db/database.js";

/**
 * Data access for subjects, exams and questions.
 * All functions are synchronous (node:sqlite) — Express 5 handles sync handlers fine.
 */

// ---------- Subjects ----------

// Must stay in sync with QUESTION_COUNT in src/utils/examUtils.js.
const QUESTION_COUNT = 5;

export function listSubjects() {
    return db
        .prepare("SELECT id, name, study_start_date, final_exam_date, planned_exam_count FROM subjects ORDER BY id")
        .all();
}

/**
 * Create a subject with its study dates and `examCount` auto-created exams.
 * The original `examCount` is persisted as `planned_exam_count` so the frontend can
 * derive recommended due dates later. If a subject with the same name already exists
 * it is returned instead (no duplicates, no new exams).
 */
export function createSubject(name, { examCount = 0, studyStartDate = "", finalExamDate = "" } = {}) {
    const existing = db.prepare("SELECT * FROM subjects WHERE name = ? COLLATE NOCASE").get(name);
    if (existing) return { subject: existing, exams: [] };

    const info = db.prepare(
        "INSERT INTO subjects (name, study_start_date, final_exam_date, planned_exam_count) VALUES (?, ?, ?, ?)",
    ).run(name, studyStartDate || "", finalExamDate || "", Math.max(0, Math.min(50, Number(examCount) || 0)));
    const subjectId = Number(info.lastInsertRowid);

    const exams = [];
    for (let i = 1; i <= examCount; i++) {
        exams.push(createExam(subjectId, `בחינה ${i}`, QUESTION_COUNT));
    }
    return { subject: db.prepare("SELECT * FROM subjects WHERE id = ?").get(subjectId), exams };
}

/** Update the study start / final exam dates of a subject (subject-level data). */
export function updateSubjectDates(id, studyStartDate, finalExamDate) {
    db.prepare("UPDATE subjects SET study_start_date = ?, final_exam_date = ? WHERE id = ?")
        .run(studyStartDate || "", finalExamDate || "", id);
}

/** Look up a subject by its display name (case-insensitive). Returns the row or null. */
export function findSubjectByName(name) {
    return db.prepare("SELECT * FROM subjects WHERE name = ? COLLATE NOCASE").get(name) || null;
}

/** Rename a subject. Throws when the new name is empty or already taken (case-insensitive). */
export function renameSubject(id, newName) {
    const name = String(newName ?? "").trim();
    if (!name) throw Object.assign(new Error("Subject name is required"), { status: 400 });
    const clash = db.prepare("SELECT id FROM subjects WHERE name = ? COLLATE NOCASE AND id != ?").get(name, id);
    if (clash) throw Object.assign(new Error(`A subject named "${name}" already exists`), { status: 409 });
    db.prepare("UPDATE subjects SET name = ? WHERE id = ?").run(name, id);
}

/** Delete a subject; its exams and questions are removed via FK cascade. */
export function deleteSubject(id) {
    const info = db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
    return Number(info.changes) > 0;
}

// ---------- Exams ----------

/** Create an exam under a subject and seed it with `questionCount` empty questions. */
export function createExam(subjectId, name, questionCount = QUESTION_COUNT) {
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

/**
 * Adjust the number of exams under a subject to `target`:
 * creates missing exams (named by their position) or deletes the most recent
 * ones when reducing. Returns the updated list of exams for that subject.
 */
export function adjustExamCount(subjectId, target) {
    const existing = db.prepare("SELECT id FROM exams WHERE subject_id = ? ORDER BY id").all(subjectId);
    if (target > existing.length) {
        for (let i = existing.length + 1; i <= target; i++) {
            createExam(subjectId, `בחינה ${i}`, QUESTION_COUNT);
        }
    } else if (target < existing.length) {
        const toDelete = existing.slice(target).map((r) => Number(r.id));
        for (const id of toDelete) deleteExam(id);
    }
    return db.prepare("SELECT * FROM exams WHERE subject_id = ? ORDER BY id")
        .all(subjectId)
        .map((row) => getExamById(Number(row.id)));
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

/**
 * Insert a new empty sub-question (סעיף) after `afterPosition`, shifting later
 * positions up by one — or at the end when `afterPosition` is null.
 */
export function addQuestion(examId, afterPosition = null) {
    db.exec("BEGIN");
    try {
        let newPos;
        if (Number.isInteger(afterPosition)) {
            // Shift later positions up by one — highest first, so each row moves into a slot
            // that is already free (a single `position = position + 1` UPDATE would trip the
            // UNIQUE constraint on intermediate states).
            const shifted = db.prepare(
                "SELECT id, position FROM questions WHERE exam_id = ? AND position > ? ORDER BY position DESC",
            ).all(examId, afterPosition);
            for (const row of shifted) {
                db.prepare("UPDATE questions SET position = ? WHERE id = ?").run(row.position + 1, row.id);
            }
            newPos = afterPosition + 1;
        } else {
            const last = db.prepare("SELECT MAX(position) AS m FROM questions WHERE exam_id = ?").get(examId);
            newPos = (last?.m ?? -1) + 1;
        }
        db.prepare(
            "INSERT INTO questions (exam_id, position, success, last_date, points, is_sub) VALUES (?, ?, '', '', '', 1)",
        ).run(examId, newPos);
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
    return getExamById(examId);
}

/**
 * Delete a question (e.g. sub-question) at `position`, shifting later
 * positions down by one.
 */
export function deleteQuestion(examId, position) {
    db.exec("BEGIN");
    try {
        db.prepare("DELETE FROM questions WHERE exam_id = ? AND position = ?").run(examId, position);
        const shifted = db.prepare(
            "SELECT id, position FROM questions WHERE exam_id = ? AND position > ? ORDER BY position ASC",
        ).all(examId, position);
        for (const row of shifted) {
            db.prepare("UPDATE questions SET position = ? WHERE id = ?").run(row.position - 1, row.id);
        }
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
    return getExamById(examId);
}

// ---------- Read helpers (shared shape) ----------

function rowToExam(row) {
    const qs = db.prepare("SELECT * FROM questions WHERE exam_id = ? ORDER BY position").all(row.id);
    return {
        id: Number(row.id),
        name: row.name,
        subjectId: Number(row.subject_id),
        // Frontend shape: `subject` is the display string;
        // `questions[i] = { id, success, date, points, sub }`.
        questions: qs.map((q) => ({
            id: Number(q.id),
            success: q.success,
            date: q.last_date,
            points: q.points,
            sub: !!q.is_sub,
        })),
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

    // Subject-level data keyed by display name (dates + planned exam count, used later
    // to derive recommended due dates on the frontend).
    const subjectMeta = {};
    for (const s of subjects) {
        subjectMeta[s.name] = {
            studyStartDate: s.study_start_date || "",
            finalExamDate: s.final_exam_date || "",
            plannedExamCount: Number(s.planned_exam_count) || 0,
        };
    }

    return {
        subjects: subjects.map((s) => s.name),
        exams,
        activeSubject,
        subjectMeta,
    };
}

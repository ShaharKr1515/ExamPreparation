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
        "INSERT INTO questions (exam_id, position, success, last_date, points, timer_seconds) VALUES (?, ?, '', '', '', 0)",
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

/**
 * Copy the questions layout (main questions, sub-questions, and their respective points)
 * from a source exam to one or more target exams under the same subject.
 *
 * For each target exam:
 * - Its existing questions are replaced with the source exam's question structure.
 * - `is_sub` and `points` values are preserved for every question and sub-question.
 * - Attempt states are reset: `success = ''`, `last_date = ''`, `timer_seconds = 0`.
 *
 * If `targetExamIds` is null or empty, it copies to all other exams belonging to the same subject.
 */
export function copyExamLayout(sourceExamId, targetExamIds = null) {
    db.exec("BEGIN");
    try {
        const sourceExam = db.prepare("SELECT * FROM exams WHERE id = ?").get(sourceExamId);
        if (!sourceExam) {
            throw Object.assign(new Error("Exam not found"), { status: 404 });
        }

        const sourceQuestions = db.prepare(
            "SELECT position, points, is_sub FROM questions WHERE exam_id = ? ORDER BY position ASC",
        ).all(sourceExamId);

        if (sourceQuestions.length === 0) {
            throw Object.assign(new Error("Source exam has no questions to copy"), { status: 400 });
        }

        let targets = targetExamIds;
        if (!Array.isArray(targets) || targets.length === 0) {
            targets = db.prepare(
                "SELECT id FROM exams WHERE subject_id = ? AND id != ? ORDER BY id ASC",
            ).all(sourceExam.subject_id, sourceExamId).map((r) => Number(r.id));
        } else {
            const subjectExamIds = new Set(
                db.prepare("SELECT id FROM exams WHERE subject_id = ? AND id != ?")
                    .all(sourceExam.subject_id, sourceExamId)
                    .map((r) => Number(r.id)),
            );
            targets = targets
                .map(Number)
                .filter((id) => subjectExamIds.has(id));
        }

        const deleteQs = db.prepare("DELETE FROM questions WHERE exam_id = ?");
        const insertQ = db.prepare(
            "INSERT INTO questions (exam_id, position, success, last_date, points, is_sub, timer_seconds) VALUES (?, ?, '', '', ?, ?, 0)",
        );

        for (const targetId of targets) {
            deleteQs.run(targetId);
            for (let i = 0; i < sourceQuestions.length; i++) {
                const sq = sourceQuestions[i];
                insertQ.run(targetId, i, sq.points || "", sq.is_sub || 0);
            }
        }

        db.exec("COMMIT");
        return targets.map((id) => getExamById(id)).filter(Boolean);
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
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
const FIELD_TO_COLUMN = {
    success: "success",
    date: "last_date",
    points: "points",
    timerSeconds: "timer_seconds",
    timer_seconds: "timer_seconds",
};

/** Update one field of a single question (by 0-based position). */
export function updateQuestion(examId, position, field, value) {
    const column = FIELD_TO_COLUMN[field];
    if (!column) throw new Error(`Invalid question field: ${field}`);

    // Preserve the original UX: the first touch on success/points/timer stamps today's date if empty.
    if (field === "success" || field === "points" || field === "timerSeconds" || field === "timer_seconds") {
        db.prepare(
            "UPDATE questions SET last_date = ? WHERE exam_id = ? AND position = ? AND (last_date IS NULL OR last_date = '')",
        ).run(todayStr(), examId, position);
    }

    const val = column === "timer_seconds" ? Math.max(0, Math.round(Number(value) || 0)) : value;
    db.prepare(`UPDATE questions SET ${column} = ? WHERE exam_id = ? AND position = ?`).run(val, examId, position);
}

/**
 * Distribute total points across `count` subquestions such that:
 * - Every subquestion receives a whole integer string (e.g. "13", "12").
 * - The sum of points across all subquestions strictly equals Math.round(Number(totalPoints)).
 * - The remainder is distributed (+1) to the first remainder subquestions.
 */
export function distributePoints(totalPoints, count) {
    if (
        totalPoints == null ||
        totalPoints === "" ||
        (typeof totalPoints === "string" && totalPoints.trim() === "") ||
        isNaN(Number(totalPoints)) ||
        count <= 0
    ) {
        return Array(Math.max(0, count)).fill("");
    }
    const total = Math.max(0, Math.round(Number(totalPoints)));
    const base = Math.floor(total / count);
    const remainder = total % count;
    const result = [];
    for (let i = 0; i < count; i++) {
        const pts = i < remainder ? base + 1 : base;
        result.push(String(pts));
    }
    return result;
}

/**
 * Distribute total timer seconds across `count` subquestions such that:
 * - Every subquestion receives an integer number of seconds.
 * - The sum of seconds across all subquestions strictly equals totalSeconds.
 * - The remainder is distributed (+1s) to the first remainder subquestions.
 */
export function distributeTimer(totalSeconds, count) {
    if (
        totalSeconds == null ||
        totalSeconds === "" ||
        (typeof totalSeconds === "string" && totalSeconds.trim() === "") ||
        isNaN(Number(totalSeconds)) ||
        count <= 0
    ) {
        return Array(Math.max(0, count)).fill(0);
    }
    const total = Math.max(0, Math.round(Number(totalSeconds)));
    if (total === 0) {
        return Array(count).fill(0);
    }
    const base = Math.floor(total / count);
    const remainder = total % count;
    const result = [];
    for (let i = 0; i < count; i++) {
        const secs = i < remainder ? base + 1 : base;
        result.push(secs);
    }
    return result;
}

/**
 * Insert a new sub-question (סעיף) after `afterPosition`, shifting later
 * positions up by one — or at the end when `afterPosition` is null.
 *
 * If the parent main question has points and/or timer filled (or existing
 * subquestions carry points/timer), the total points and timer are distributed
 * equally across all subquestions of that parent, with points strictly remaining
 * whole numbers.
 */
export function addQuestion(examId, afterPosition = null) {
    db.exec("BEGIN");
    try {
        const questions = db.prepare(
            "SELECT id, position, points, timer_seconds, is_sub FROM questions WHERE exam_id = ? ORDER BY position ASC",
        ).all(examId);

        // Find the parent main question (is_sub = 0)
        let parentQuestion = null;
        if (Number.isInteger(afterPosition)) {
            const targetIdx = questions.findIndex((q) => q.position === afterPosition);
            if (targetIdx !== -1) {
                if (questions[targetIdx].is_sub === 0) {
                    parentQuestion = questions[targetIdx];
                } else {
                    for (let i = targetIdx; i >= 0; i--) {
                        if (questions[i].is_sub === 0) {
                            parentQuestion = questions[i];
                            break;
                        }
                    }
                }
            }
        } else {
            // Inserting at the end: locate the last main question
            for (let i = questions.length - 1; i >= 0; i--) {
                if (questions[i].is_sub === 0) {
                    parentQuestion = questions[i];
                    break;
                }
            }
        }

        // Collect existing subquestions belonging to this parent
        let existingSubs = [];
        if (parentQuestion) {
            const parentIdx = questions.findIndex((q) => q.id === parentQuestion.id);
            for (let i = parentIdx + 1; i < questions.length; i++) {
                if (questions[i].is_sub === 1) {
                    existingSubs.push(questions[i]);
                } else {
                    break;
                }
            }
        }

        // Determine total points to distribute
        let existingPointsSum = 0;
        let hasAnySubPoints = false;
        for (const sq of existingSubs) {
            if (sq.points !== "" && sq.points != null && !isNaN(Number(sq.points))) {
                existingPointsSum += Number(sq.points);
                hasAnySubPoints = true;
            }
        }

        let totalPoints = null;
        if (hasAnySubPoints) {
            totalPoints = existingPointsSum;
        } else if (parentQuestion && parentQuestion.points !== "" && parentQuestion.points != null && !isNaN(Number(parentQuestion.points))) {
            totalPoints = Number(parentQuestion.points);
        }

        // Determine total timer to distribute
        let existingTimerSum = 0;
        for (const sq of existingSubs) {
            existingTimerSum += Number(sq.timer_seconds) || 0;
        }

        let totalSeconds = 0;
        if (existingTimerSum > 0) {
            totalSeconds = existingTimerSum;
        } else if (parentQuestion && Number(parentQuestion.timer_seconds) > 0) {
            totalSeconds = Number(parentQuestion.timer_seconds);
        }

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
            "INSERT INTO questions (exam_id, position, success, last_date, points, is_sub, timer_seconds) VALUES (?, ?, '', '', '', 1, 0)",
        ).run(examId, newPos);

        // Distribute points and timer if parentQuestion exists
        if (parentQuestion) {
            const updatedQuestions = db.prepare(
                "SELECT id, position, is_sub FROM questions WHERE exam_id = ? ORDER BY position ASC",
            ).all(examId);
            const pIdx = updatedQuestions.findIndex((q) => q.id === parentQuestion.id);
            const currentSubs = [];
            for (let i = pIdx + 1; i < updatedQuestions.length; i++) {
                if (updatedQuestions[i].is_sub === 1) {
                    currentSubs.push(updatedQuestions[i]);
                } else {
                    break;
                }
            }

            if (totalPoints !== null && currentSubs.length > 0) {
                const pointsDist = distributePoints(totalPoints, currentSubs.length);
                for (let i = 0; i < currentSubs.length; i++) {
                    db.prepare("UPDATE questions SET points = ? WHERE id = ?").run(pointsDist[i], currentSubs[i].id);
                }
                // Retain parent points record
                if (parentQuestion.points === "" || parentQuestion.points == null) {
                    db.prepare("UPDATE questions SET points = ? WHERE id = ?").run(String(Math.round(totalPoints)), parentQuestion.id);
                }
            }

            if (totalSeconds > 0 && currentSubs.length > 0) {
                const timerDist = distributeTimer(totalSeconds, currentSubs.length);
                for (let i = 0; i < currentSubs.length; i++) {
                    db.prepare("UPDATE questions SET timer_seconds = ? WHERE id = ?").run(timerDist[i], currentSubs[i].id);
                }
                // Retain parent timer record
                if (!parentQuestion.timer_seconds) {
                    db.prepare("UPDATE questions SET timer_seconds = ? WHERE id = ?").run(totalSeconds, parentQuestion.id);
                }
            }
        }

        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
    return getExamById(examId);
}

/**
 * Add a new empty main question at the end of the exam (is_sub = 0).
 */
export function addMainQuestion(examId) {
    db.exec("BEGIN");
    try {
        const last = db.prepare("SELECT MAX(position) AS m FROM questions WHERE exam_id = ?").get(examId);
        const newPos = (last?.m ?? -1) + 1;
        db.prepare(
            "INSERT INTO questions (exam_id, position, success, last_date, points, is_sub, timer_seconds) VALUES (?, ?, '', '', '', 0, 0)",
        ).run(examId, newPos);
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
    return getExamById(examId);
}

/**
 * Remove the last main question from an exam, along with any sub-questions attached to it.
 * Enforces minimum 1 main question.
 */
export function removeLastMainQuestion(examId) {
    db.exec("BEGIN");
    try {
        const questions = db.prepare(
            "SELECT id, position, is_sub FROM questions WHERE exam_id = ? ORDER BY position ASC",
        ).all(examId);

        const mainQuestions = questions.filter((q) => !q.is_sub);
        if (mainQuestions.length <= 1) {
            throw Object.assign(new Error("Cannot remove the last question (minimum 1 question)"), { status: 400 });
        }

        const lastMain = mainQuestions[mainQuestions.length - 1];
        // Delete the last main question and any sub-questions after it
        db.prepare("DELETE FROM questions WHERE exam_id = ? AND position >= ?").run(examId, lastMain.position);

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
 *
 * If deleting a sub-question under a parent question that has points/timer,
 * the points and timer are redistributed equally among the remaining sub-questions
 * (points remaining whole numbers). If the last sub-question is deleted, the
 * parent question itself receives the total points and timer.
 */
export function deleteQuestion(examId, position) {
    db.exec("BEGIN");
    try {
        const questions = db.prepare(
            "SELECT id, position, points, timer_seconds, is_sub FROM questions WHERE exam_id = ? ORDER BY position ASC",
        ).all(examId);

        const targetQuestion = questions.find((q) => q.position === position);

        let parentQuestion = null;
        let existingSubs = [];
        let totalPoints = null;
        let totalSeconds = 0;

        if (targetQuestion && targetQuestion.is_sub === 1) {
            const targetIdx = questions.indexOf(targetQuestion);
            for (let i = targetIdx; i >= 0; i--) {
                if (questions[i].is_sub === 0) {
                    parentQuestion = questions[i];
                    break;
                }
            }

            if (parentQuestion) {
                const parentIdx = questions.findIndex((q) => q.id === parentQuestion.id);
                for (let i = parentIdx + 1; i < questions.length; i++) {
                    if (questions[i].is_sub === 1) {
                        existingSubs.push(questions[i]);
                    } else {
                        break;
                    }
                }

                // Determine total points to distribute
                let existingPointsSum = 0;
                let hasAnySubPoints = false;
                for (const sq of existingSubs) {
                    if (sq.points !== "" && sq.points != null && !isNaN(Number(sq.points))) {
                        existingPointsSum += Number(sq.points);
                        hasAnySubPoints = true;
                    }
                }

                if (hasAnySubPoints) {
                    totalPoints = existingPointsSum;
                } else if (parentQuestion.points !== "" && parentQuestion.points != null && !isNaN(Number(parentQuestion.points))) {
                    totalPoints = Number(parentQuestion.points);
                }

                // Determine total timer to distribute
                let existingTimerSum = 0;
                for (const sq of existingSubs) {
                    existingTimerSum += Number(sq.timer_seconds) || 0;
                }

                if (existingTimerSum > 0) {
                    totalSeconds = existingTimerSum;
                } else if (Number(parentQuestion.timer_seconds) > 0) {
                    totalSeconds = Number(parentQuestion.timer_seconds);
                }
            }
        }

        db.prepare("DELETE FROM questions WHERE exam_id = ? AND position = ?").run(examId, position);
        const shifted = db.prepare(
            "SELECT id, position FROM questions WHERE exam_id = ? AND position > ? ORDER BY position ASC",
        ).all(examId, position);
        for (const row of shifted) {
            db.prepare("UPDATE questions SET position = ? WHERE id = ?").run(row.position - 1, row.id);
        }

        // If a subquestion was deleted, redistribute among remaining subquestions or restore parent
        if (parentQuestion) {
            const updatedQuestions = db.prepare(
                "SELECT id, position, is_sub FROM questions WHERE exam_id = ? ORDER BY position ASC",
            ).all(examId);
            const pIdx = updatedQuestions.findIndex((q) => q.id === parentQuestion.id);
            const remainingSubs = [];
            for (let i = pIdx + 1; i < updatedQuestions.length; i++) {
                if (updatedQuestions[i].is_sub === 1) {
                    remainingSubs.push(updatedQuestions[i]);
                } else {
                    break;
                }
            }

            if (remainingSubs.length > 0) {
                if (totalPoints !== null) {
                    const pointsDist = distributePoints(totalPoints, remainingSubs.length);
                    for (let i = 0; i < remainingSubs.length; i++) {
                        db.prepare("UPDATE questions SET points = ? WHERE id = ?").run(pointsDist[i], remainingSubs[i].id);
                    }
                }
                if (totalSeconds > 0) {
                    const timerDist = distributeTimer(totalSeconds, remainingSubs.length);
                    for (let i = 0; i < remainingSubs.length; i++) {
                        db.prepare("UPDATE questions SET timer_seconds = ? WHERE id = ?").run(timerDist[i], remainingSubs[i].id);
                    }
                }
            } else {
                // All subquestions removed: assign total points and time back to the parent question
                if (totalPoints !== null) {
                    db.prepare("UPDATE questions SET points = ? WHERE id = ?").run(String(Math.round(totalPoints)), parentQuestion.id);
                }
                if (totalSeconds > 0) {
                    db.prepare("UPDATE questions SET timer_seconds = ? WHERE id = ?").run(totalSeconds, parentQuestion.id);
                }
            }
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
        // `questions[i] = { id, success, date, points, sub, timerSeconds }`.
        questions: qs.map((q) => ({
            id: Number(q.id),
            success: q.success,
            date: q.last_date,
            points: q.points,
            sub: !!q.is_sub,
            timerSeconds: Number(q.timer_seconds) || 0,
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

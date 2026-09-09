// Pure helpers shared across the app — no DOM, no state.

export const QUESTION_COUNT = 5;

/** Normalize a subject name for comparison (case/whitespace insensitive). */
export function subjectKey(s) {
    return (s || "").trim().toLowerCase();
}

/** Local date as YYYY-MM-DD (matches the <input type="date"> format). */
export function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Whole days elapsed since a YYYY-MM-DD date (negative if in the future),
 * or null when the value is not a valid date string.
 */
export function daysSince(dateStr) {
    const [y, m, d] = String(dateStr || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    const then = new Date(y, m - 1, d);
    const now = new Date();
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today0.getTime() - then.getTime()) / 86400000);
}

// ---------- Recommended exam due dates ----------

/** Parse YYYY-MM-DD into whole UTC days since epoch, or null when invalid. */
function parseUtcDay(dateStr) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    // Reject impossible dates like 2026-02-31 (Date.UTC would roll them over).
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return Math.round(dt.getTime() / 86400000);
}

/** Whole UTC days since epoch as YYYY-MM-DD. */
function dayToUtcStr(dayCount) {
    const dt = new Date(dayCount * 86400000);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Recommended due date (YYYY-MM-DD) for each of `examCount` exams, or null when no
 * date can be assigned. Pure UTC day math — no local-timezone/DST drift:
 *
 *   first exam:  studyStartDate + 3 days
 *   interval:    (finalExamDate - studyStartDate - 2 days) / examCount
 *   next exam:   previous due date + interval
 *   a due date that lands on/after finalExamDate is not assigned.
 *
 * Returns an array of length `examCount` (index = exam order under the subject).
 */
export function calculateExamTargetDates(studyStartDate, finalExamDate, examCount) {
    const count = Math.max(0, Math.floor(Number(examCount) || 0));
    const result = new Array(count).fill(null);
    if (count === 0) return result;

    const startDay = parseUtcDay(studyStartDate);
    const finalDay = parseUtcDay(finalExamDate);
    if (startDay === null || finalDay === null) return result;

    const firstDue = startDay + 3;
    const interval = (finalDay - startDay - 2) / count;

    for (let i = 0; i < count; i++) {
        const dueDay = Math.round(firstDue + i * interval); // exam 1: firstDue, each next: previous + interval
        if (dueDay >= finalDay) continue;                   // would land on/after the final exam → no date
        result[i] = dayToUtcStr(dueDay);
    }
    return result;
}

/** Format YYYY-MM-DD as DD.MM.YYYY for display, or "" when invalid. */
export function formatDisplayDate(dateStr) {
    const [y, m, d] = String(dateStr || "").split("-");
    if (!y || !m || !d) return "";
    return `${d}.${m}.${y}`;
}

/**
 * Whole days between consecutive recommended due dates for a subject, or null
 * when the interval can't be derived (missing/invalid dates, no exams). Same
 * math as calculateExamTargetDates: (final - start - 2) / examCount.
 */
export function examIntervalDays(studyStartDate, finalExamDate, examCount) {
    const count = Math.max(0, Math.floor(Number(examCount) || 0));
    if (count === 0) return null;
    const startDay = parseUtcDay(studyStartDate);
    const finalDay = parseUtcDay(finalExamDate);
    if (startDay === null || finalDay === null) return null;
    return Math.max(1, Math.floor((finalDay - startDay - 2) / count));
}

/** "יום" / "יומיים" / "X ימים" for a whole-day count. */
function daysWord(n) {
    if (n === 1) return "יום";
    if (n === 2) return "יומיים";
    return `${n} ימים`;
}

/** Toolbar hint: how often an exam must be completed, e.g. "כל יומיים". */
export function formatExamIntervalLabel(days) {
    const n = Math.floor(Number(days));
    if (!Number.isFinite(n) || n < 1) return null;
    return `צריך להשלים מבחן כל ${daysWord(n)}`;
}

/**
 * Relative label for a due date: "היום", "מחר", "עוד X ימים" — or the overdue
 * form "איחור של X ימים". Returns null when the value is not a valid date.
 */
export function dueLabel(dateStr) {
    const days = daysSince(dateStr); // whole days since then; negative = in the future
    if (days === null) return null;
    if (days < 0) {
        const n = -days;
        return `עוד ${n === 1 ? "יום" : n === 2 ? "יומיים" : `${n} ימים`}`;
    }
    if (days === 0) return "היום";
    if (days === 1) return "איחור של יום";
    if (days === 2) return "איחור של יומיים";
    return `איחור של ${days} ימים`;
}

/** Format total seconds as MM:SS (e.g. 00:00, 05:23). */
export function formatTimer(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** A fresh (empty) question. */
export function makeQuestion() {
    return { success: "", date: "", points: "", timerSeconds: 0 };
}

export const SUCCESS_LABELS = {
    "": "—",
    yes: "הצלחה",
    half: "הצלחה חלקית",
    no: "כישלון",
};

/**
 * Derive the mastery/success status of a parent question based on its sub-questions:
 *  - "yes": all subquestions are "yes"
 *  - "no": all subquestions are "no", or all answered subquestions are "no" with none successful/half
 *  - "": all subquestions are unset
 *  - "half": any combination of mixed success, partial completion, or any subquestion marked "half"
 */
export function deriveParentSuccess(subQuestions = []) {
    if (!subQuestions || subQuestions.length === 0) return "";

    let yesCount = 0;
    let noCount = 0;
    let halfCount = 0;
    let unsetCount = 0;

    for (const sq of subQuestions) {
        if (sq.success === "yes") yesCount++;
        else if (sq.success === "no") noCount++;
        else if (sq.success === "half") halfCount++;
        else unsetCount++;
    }

    if (unsetCount === subQuestions.length) return "";
    if (yesCount === subQuestions.length) return "yes";
    if (noCount === subQuestions.length) return "no";
    if (noCount > 0 && yesCount === 0 && halfCount === 0) return "no";

    return "half";
}

/**
 * Calculate the total points across sub-questions.
 * Returns formatted string representation (e.g. "25", "12.5", "0").
 */
export function computeSubQuestionsPointsSum(subQuestions = []) {
    if (!subQuestions || subQuestions.length === 0) return "0";
    let sum = 0;
    let hasAnyNumeric = false;
    for (const sq of subQuestions) {
        if (sq.points !== "" && sq.points != null && !isNaN(Number(sq.points))) {
            sum += Number(sq.points);
            hasAnyNumeric = true;
        }
    }
    if (!hasAnyNumeric) return "0";
    return String(Math.round(sum * 100) / 100);
}

/**
 * Calculate total timer seconds across sub-questions.
 */
export function computeSubQuestionsTimerSum(subQuestions = []) {
    if (!subQuestions || subQuestions.length === 0) return 0;
    return subQuestions.reduce((acc, sq) => acc + (Number(sq.timerSeconds) || 0), 0);
}

/**
 * Find the most recent date string (YYYY-MM-DD) among sub-questions.
 */
export function getLatestDate(subQuestions = []) {
    if (!subQuestions || subQuestions.length === 0) return "";
    let latest = "";
    for (const sq of subQuestions) {
        if (sq.date && (!latest || sq.date > latest)) {
            latest = sq.date;
        }
    }
    return latest;
}

/**
 * Row state, in priority order:
 *  - "ok" when success is achieved (always wins)
 *  - "stale" when the last attempt is at least 3 days old (regardless of outcome)
 *  - "bad" when the question was failed within the last 3 days
 *  - "half" when the question was partially successful within the last 3 days
 */
export function questionRowState(q) {
    const ok = q.success === "yes";
    if (ok) return "ok";
    const days = daysSince(q.date);
    const stale = days !== null && days >= 3;
    if (stale) return "stale";
    if (q.success === "no") return "bad";
    if (q.success === "half") return "half";
    return null;
}

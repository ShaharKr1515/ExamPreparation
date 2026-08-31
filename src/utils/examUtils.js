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

/** A fresh (empty) question. */
export function makeQuestion() {
    return { success: "", date: "", points: "" };
}

/**
 * Row state, in priority order:
 *  - "ok" when success is achieved (always wins)
 *  - "stale" when the last attempt is at least 3 days old (regardless of outcome)
 *  - "bad" when the question was failed within the last 3 days
 */
export function questionRowState(q) {
    const ok = q.success === "yes";
    if (ok) return "ok";
    const days = daysSince(q.date);
    const stale = days !== null && days >= 3;
    if (stale) return "stale";
    if (q.success === "no") return "bad";
    return null;
}

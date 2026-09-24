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
    if (startDay === null || finalDay === null || finalDay <= startDay) return result;

    const firstDue = Math.min(startDay + 3, finalDay - 1);
    const interval = (finalDay - startDay - 2) / count;

    for (let i = 0; i < count; i++) {
        let dueDay = Math.round(firstDue + i * interval); // exam 1: firstDue, each next: previous + interval
        if (dueDay >= finalDay) dueDay = finalDay - 1;     // keep before final exam
        if (dueDay < startDay) dueDay = startDay;
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
    if (startDay === null || finalDay === null || finalDay <= startDay) return null;
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
 * Whole days remaining until a YYYY-MM-DD date (negative if in the past, 0 if today),
 * or null when the value is not a valid date string.
 */
export function daysUntil(dateStr, refDate = new Date()) {
    const [y, m, d] = String(dateStr || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    const target = new Date(y, m - 1, d);
    const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    return Math.round((target.getTime() - ref.getTime()) / 86400000);
}

/**
 * Countdown status and Hebrew label for the final exam date:
 * - 1 day: "עוד יום למבחן!"
 * - 2 days: "עוד יומיים למבחן!"
 * - 3+ days: "עוד X ימים למבחן!"
 * - 0 days: "היום המבחן!"
 * - < 0 days: "המבחן עבר!"
 * Returns null when finalExamDate is empty or not a valid date.
 */
export function formatExamCountdown(finalExamDate, refDate = new Date()) {
    const remaining = daysUntil(finalExamDate, refDate);
    if (remaining === null) return null;

    if (remaining > 2) {
        return { label: `עוד ${remaining} ימים למבחן!`, status: "future", days: remaining };
    }
    if (remaining === 2) {
        return { label: "עוד יומיים למבחן!", status: "future", days: 2 };
    }
    if (remaining === 1) {
        return { label: "עוד יום למבחן!", status: "future", days: 1 };
    }
    if (remaining === 0) {
        return { label: "היום המבחן!", status: "today", days: 0 };
    }
    return { label: "המבחן עבר!", status: "past", days: remaining };
}

export function formatExamCountdownLabel(finalExamDate, refDate = new Date()) {
    const info = formatExamCountdown(finalExamDate, refDate);
    return info ? info.label : null;
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
 * Find the earliest (smallest) date string (YYYY-MM-DD) among sub-questions.
 */
export function getEarliestDate(subQuestions = []) {
    if (!subQuestions || subQuestions.length === 0) return "";
    let earliest = "";
    for (const sq of subQuestions) {
        if (sq.date && (!earliest || sq.date < earliest)) {
            earliest = sq.date;
        }
    }
    return earliest;
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

/**
 * Calculate the overall exam score and summary metrics.
 *
 * Rules:
 *  - Each main question and its sub-questions form a logical problem.
 *  - If a main question has sub-questions:
 *      maxPoints = sum of numeric points of its sub-questions (or main question points if sub-questions have none)
 *      earnedPoints = sum of earned points of sub-questions
 *  - If no sub-questions:
 *      maxPoints = Number(q.points) || 0
 *      earnedPoints = 'yes' -> maxPoints, 'half' -> 0.5 * maxPoints, 'no' -> 0, '' -> 0
 *  - Fallback if no questions in the exam have points entered:
 *      Each main question has maxPoints = 100 / mainQuestionsCount.
 *  - Choice Rule:
 *      If totalMaxPoints > 100:
 *        The overall exam score picks the highest-scoring questions answered up to 100 points.
 *        Questions are ranked by performance (score ratio earned/max desc, then earned desc).
 *        The highest scoring questions are accumulated until maxPoints reaches 100.
 *      If totalMaxPoints <= 100:
 *        All questions are counted up to totalMaxPoints.
 */
export function calculateExamScore(exam) {
    if (!exam || !exam.questions || exam.questions.length === 0) {
        return {
            score: 0,
            maxScore: 100,
            displayScore: "—",
            hasAnsweredAny: false,
            isChoiceActive: false,
            totalExamPoints: 0,
            answeredCount: 0,
            totalMainQuestions: 0,
            totalTimerSeconds: 0,
            counts: { yes: 0, half: 0, no: 0, unattempted: 0 },
            questionStatusMap: {},
        };
    }

    // 1. Group main questions and their sub-questions
    const mainList = [];
    for (let i = 0; i < exam.questions.length; i++) {
        const q = exam.questions[i];
        if (!q.sub) {
            const subs = [];
            let j = i + 1;
            while (j < exam.questions.length && exam.questions[j]?.sub) {
                subs.push(exam.questions[j]);
                j++;
            }
            mainList.push({ main: q, subs, mainIndex: mainList.length + 1 });
        }
    }

    if (mainList.length === 0) {
        return {
            score: 0,
            maxScore: 100,
            displayScore: "—",
            hasAnsweredAny: false,
            isChoiceActive: false,
            totalExamPoints: 0,
            answeredCount: 0,
            totalMainQuestions: 0,
            totalTimerSeconds: 0,
            counts: { yes: 0, half: 0, no: 0, unattempted: 0 },
            questionStatusMap: {},
        };
    }

    // 2. Check if any question has explicit points entered
    let hasAnyExplicitPoints = false;
    for (const item of mainList) {
        if (item.subs.length > 0) {
            if (item.subs.some((s) => s.points !== "" && s.points != null && !isNaN(Number(s.points)))) {
                hasAnyExplicitPoints = true;
                break;
            }
        }
        if (item.main.points !== "" && item.main.points != null && !isNaN(Number(item.main.points))) {
            hasAnyExplicitPoints = true;
            break;
        }
    }

    const defaultPointsPerMain = 100 / mainList.length;

    // 3. Process each main question
    let totalTimerSeconds = 0;
    const counts = { yes: 0, half: 0, no: 0, unattempted: 0 };
    let answeredCount = 0;
    let hasAnsweredAny = false;

    const mainQuestionsData = mainList.map((item) => {
        const { main, subs, mainIndex } = item;

        // Timer calculation: sum of subs if exist, else main timer
        if (subs.length > 0) {
            const subTimerSum = subs.reduce((acc, s) => acc + (Number(s.timerSeconds) || 0), 0);
            totalTimerSeconds += subTimerSum;
        } else {
            totalTimerSeconds += Number(main.timerSeconds) || 0;
        }

        // Mastery status
        let effectiveSuccess = "";
        if (subs.length > 0) {
            effectiveSuccess = deriveParentSuccess(subs);
        } else {
            effectiveSuccess = main.success || "";
        }

        if (effectiveSuccess === "yes") {
            counts.yes++;
            answeredCount++;
            hasAnsweredAny = true;
        } else if (effectiveSuccess === "half") {
            counts.half++;
            answeredCount++;
            hasAnsweredAny = true;
        } else if (effectiveSuccess === "no") {
            counts.no++;
            answeredCount++;
            hasAnsweredAny = true;
        } else {
            counts.unattempted++;
        }

        // Points & Earned calculation
        let maxPoints = 0;
        let earnedPoints = 0;

        if (subs.length > 0) {
            const explicitSubsPoints = subs.reduce((sum, s) => {
                const p = Number(s.points);
                return !isNaN(p) && s.points !== "" && s.points != null ? sum + p : sum;
            }, 0);

            if (explicitSubsPoints > 0) {
                maxPoints = explicitSubsPoints;
                for (const s of subs) {
                    const sp = Number(s.points) || 0;
                    if (s.success === "yes") earnedPoints += sp;
                    else if (s.success === "half") earnedPoints += sp * 0.5;
                }
            } else if (!hasAnyExplicitPoints) {
                maxPoints = defaultPointsPerMain;
                const perSub = maxPoints / subs.length;
                for (const s of subs) {
                    if (s.success === "yes") earnedPoints += perSub;
                    else if (s.success === "half") earnedPoints += perSub * 0.5;
                }
            } else {
                const parentPts = Number(main.points) || 0;
                maxPoints = parentPts;
                if (subs.length > 0 && parentPts > 0) {
                    const perSub = parentPts / subs.length;
                    for (const s of subs) {
                        if (s.success === "yes") earnedPoints += perSub;
                        else if (s.success === "half") earnedPoints += perSub * 0.5;
                    }
                }
            }
        } else {
            if (hasAnyExplicitPoints) {
                maxPoints = Number(main.points) || 0;
            } else {
                maxPoints = defaultPointsPerMain;
            }

            if (main.success === "yes") earnedPoints = maxPoints;
            else if (main.success === "half") earnedPoints = maxPoints * 0.5;
            else earnedPoints = 0;
        }

        const ratio = maxPoints > 0 ? earnedPoints / maxPoints : 0;

        return {
            id: main.id,
            mainIndex,
            maxPoints,
            earnedPoints,
            ratio,
            hasAnswered: effectiveSuccess !== "",
            effectiveSuccess,
            subIds: subs.map((s) => s.id),
        };
    });

    const totalExamPoints = Math.round(mainQuestionsData.reduce((acc, q) => acc + q.maxPoints, 0) * 100) / 100;
    const isChoiceActive = totalExamPoints > 100;
    const questionStatusMap = {};

    let finalScore = 0;

    if (!isChoiceActive) {
        // Normal exam: sum all earned points
        finalScore = mainQuestionsData.reduce((acc, q) => acc + q.earnedPoints, 0);
        for (const q of mainQuestionsData) {
            questionStatusMap[q.id] = {
                included: true,
                partial: false,
                countedPoints: q.earnedPoints,
                earnedPoints: q.earnedPoints,
                maxPoints: q.maxPoints,
                isDropped: false,
            };
            for (const subId of q.subIds) {
                questionStatusMap[subId] = {
                    included: true,
                    isDropped: false,
                };
            }
        }
    } else {
        // Choice exam: student answers K questions out of N
        const avgPoints = totalExamPoints / mainQuestionsData.length;
        const K = Math.min(
            mainQuestionsData.length - 1,
            Math.max(1, Math.round(100 / avgPoints)),
        );

        // Sort by best performance:
        // 1. Success ratio (1.0 for yes, 0.5 for half, 0.0 for no/unset)
        // 2. Earned points
        // 3. Max points
        const sorted = [...mainQuestionsData].sort((a, b) => {
            if (Math.abs(b.ratio - a.ratio) > 0.0001) {
                return b.ratio - a.ratio;
            }
            if (Math.abs(b.earnedPoints - a.earnedPoints) > 0.0001) {
                return b.earnedPoints - a.earnedPoints;
            }
            return b.maxPoints - a.maxPoints;
        });

        const chosen = sorted.slice(0, K);
        const dropped = sorted.slice(K);

        finalScore = Math.min(100, chosen.reduce((acc, q) => acc + q.earnedPoints, 0));

        for (const item of chosen) {
            questionStatusMap[item.id] = {
                included: true,
                partial: false,
                countedPoints: item.earnedPoints,
                earnedPoints: item.earnedPoints,
                maxPoints: item.maxPoints,
                isDropped: false,
            };
            for (const subId of item.subIds) {
                questionStatusMap[subId] = {
                    included: true,
                    isDropped: false,
                };
            }
        }

        for (const item of dropped) {
            questionStatusMap[item.id] = {
                included: false,
                partial: false,
                countedPoints: 0,
                earnedPoints: item.earnedPoints,
                maxPoints: item.maxPoints,
                isDropped: true,
            };
            for (const subId of item.subIds) {
                questionStatusMap[subId] = {
                    included: false,
                    isDropped: true,
                };
            }
        }
    }

    // Clean rounding: at most 1 decimal place or whole number (e.g. 87.5, 100, 70)
    const roundedScore = Math.round(finalScore * 10) / 10;
    const maxScore = isChoiceActive ? 100 : Math.min(100, Math.round(totalExamPoints * 10) / 10) || 100;

    const avgPoints = totalExamPoints / (mainQuestionsData.length || 1);
    const chosenCount = isChoiceActive
        ? Math.min(mainQuestionsData.length - 1, Math.max(1, Math.round(100 / avgPoints)))
        : mainQuestionsData.length;

    const droppedItems = isChoiceActive
        ? mainQuestionsData.filter((q) => questionStatusMap[q.id]?.isDropped)
        : [];

    return {
        score: roundedScore,
        maxScore,
        displayScore: hasAnsweredAny ? String(roundedScore) : "—",
        hasAnsweredAny,
        isChoiceActive,
        totalExamPoints,
        answeredCount,
        totalMainQuestions: mainList.length,
        chosenCount,
        droppedCount: droppedItems.length,
        droppedLabels: droppedItems.map((d) => `שאלה ${d.mainIndex}`),
        totalTimerSeconds,
        counts,
        questionStatusMap,
    };
}


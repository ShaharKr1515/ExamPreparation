import { calculateExamTargetDates, calculateExamScore, calculateExamReviewCounts, todayStr } from "./examUtils.js";

function utcDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
        ? date.getTime() / 86400000 : null;
}

/** Milestones have equal reading space; today is interpolated by calendar date between them. */
export function calculateStudyTimeline(exams = [], meta = {}, today = todayStr()) {
    const start = utcDay(meta.studyStartDate);
    const end = utcDay(meta.finalExamDate);
    const current = utcDay(today);
    const state = !meta.studyStartDate || !meta.finalExamDate ? "missing-dates"
        : start === null || end === null || end <= start ? "invalid-dates" : "ready";
    if (state !== "ready") return { state, exams: [], todayPosition: null, todayState: null, paceExamId: null };

    const targets = calculateExamTargetDates(meta.studyStartDate, meta.finalExamDate, exams.length);
    const milestones = exams.map((exam, index) => {
        const { counts, answeredCount, totalMainQuestions } = calculateExamScore(exam);
        const completion = !totalMainQuestions ? 0 : answeredCount === totalMainQuestions ? 100
            : Math.min(99, Math.round(answeredCount / totalMainQuestions * 100));
        const status = totalMainQuestions && counts.yes === totalMainQuestions ? "mastered"
            : totalMainQuestions && answeredCount === totalMainQuestions ? "answered"
            : answeredCount > 0 ? "started" : "unstarted";
        const reviewCounts = calculateExamReviewCounts(exam, today);
        const paceAction = Object.values(reviewCounts).some((count) => count > 0) ? "review"
            : status === "mastered" || status === "answered" ? "complete" : "initial";
        return { id: exam.id, name: exam.name || `בחינה ${index + 1}`, number: index + 1,
            dueDate: targets[index], position: (index + 0.5) / exams.length * 100,
            completion, status, counts, reviewCounts, paceAction, answeredCount, totalMainQuestions };
    });

    const todayState = current === null ? null : current < start ? "before" : current > end ? "after" : "within";
    let todayPosition = current === null ? null : current <= start ? 0 : current >= end ? 100 : null;
    if (current !== null && current > start && current < end) {
        const coincident = milestones.filter((exam) => utcDay(exam.dueDate) === current);
        if (coincident.length) {
            todayPosition = (coincident[0].position + coincident.at(-1).position) / 2;
        } else {
            const anchors = [{ day: start, position: 0 }, ...milestones.map((exam) => ({
                day: utcDay(exam.dueDate), position: exam.position,
            })), { day: end, position: 100 }];
            const next = anchors.findIndex((anchor) => anchor.day > current);
            const before = anchors[next - 1];
            const after = anchors[next];
            todayPosition = before.position + (after.position - before.position)
                * (current - before.day) / (after.day - before.day);
        }
    }
    // The pace target is an exam deadline, so it snaps to that exam rather than
    // drifting between columns. All exams sharing a deadline are due together.
    const nextDeadline = current === null ? null : milestones.find((exam) => utcDay(exam.dueDate) >= current)?.dueDate;
    const paceExam = current === null ? null : nextDeadline
        ? milestones.findLast((exam) => exam.dueDate === nextDeadline) : milestones.at(-1);
    return { state, exams: milestones, todayPosition, todayState, paceExamId: paceExam?.id ?? null };
}

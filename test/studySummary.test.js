import test from "node:test";
import assert from "node:assert/strict";
import * as summaryUtils from "../src/utils/examUtils.js";

function summarize(exams, meta = {}, today = "2026-10-05") {
    assert.equal(typeof summaryUtils.calculateStudySummary, "function", "subject study summary is available");
    return summaryUtils.calculateStudySummary(exams, meta, today);
}

test("study summary separates mastery gaps without double-counting parent and sections", () => {
    const result = summarize([{ id: 1, questions: [
        { success: "yes" },
        { success: "yes" }, { sub: true, success: "yes" }, { sub: true, success: "no" },
        { success: "half" }, { success: "" },
    ] }]);
    assert.deepEqual(result.counts, { yes: 1, half: 2, no: 0, unattempted: 1 });
    assert.equal(result.totalQuestions, 4);
    assert.equal(result.gaps, 3);
});

test("schedule summary excludes mastered exams and preserves creation-order targets", () => {
    const result = summarize([
        { id: 1, questions: [{ success: "yes" }] },
        { id: 2, name: "Second", questions: [{ success: "no" }] },
        { id: 3, questions: [{ success: "" }] },
    ], { studyStartDate: "2026-09-25", finalExamDate: "2026-10-23" }, "2026-10-08");
    assert.equal(result.overdueExams, 1);
    assert.deepEqual(result.nextExam, { id: 2, name: "Second", number: 2, dueDate: "2026-10-07" });
    assert.equal(result.scheduleState, "ready");
});

test("today's exam target is not counted as overdue", () => {
    const result = summarize([{ id: 1, questions: [{ success: "no" }] }],
        { studyStartDate: "2026-10-02", finalExamDate: "2026-10-23" });
    assert.equal(result.nextExam.dueDate, "2026-10-05");
    assert.equal(result.overdueExams, 0);
});

test("review count includes stale unsuccessful sections but excludes mastered sections", () => {
    const result = summarize([{ id: 1, questions: [
        { success: "yes", date: "2026-10-01" },
        { success: "half" }, { sub: true, success: "yes", date: "2026-10-01" },
        { sub: true, success: "no", date: "2026-10-02" },
        { success: "no", date: "2026-10-04" },
    ] }]);
    assert.equal(result.reviewQuestions, 1);
});

test("missing and reversed dates give distinct scheduling guidance", () => {
    const exams = [{ id: 1, questions: [{ success: "" }] }];
    assert.equal(summarize(exams).scheduleState, "missing-dates");
    const invalid = summarize(exams, { studyStartDate: "2026-10-23", finalExamDate: "2026-10-01" });
    assert.equal(invalid.scheduleState, "invalid-dates");
    assert.equal(invalid.nextExam, null);
    assert.equal(invalid.overdueExams, 0);
});

test("empty and fully mastered subjects do not recommend more practice exams", () => {
    assert.equal(summarize([]).scheduleState, "no-exams");
    const result = summarize([{ id: 1, questions: [{ success: "yes" }] }],
        { studyStartDate: "2026-09-25", finalExamDate: "2026-10-23" });
    assert.equal(result.scheduleState, "complete");
    assert.equal(result.nextExam, null);
    assert.equal(result.gaps, 0);
});

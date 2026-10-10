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

const practiceMeta = { studyStartDate: "2026-09-05", finalExamDate: "2026-11-02" };

test("recently attempted exams wait for retry eligibility instead of keeping their old deadline", () => {
    const exams = [{ id: 1, name: "בחינה 1", questions: [
        { success: "half", date: "2026-10-06" },
        { sub: true, success: "no", date: "2026-10-06" },
        { sub: true, success: "half", date: "2026-10-07" },
        { sub: true, success: "yes", date: "2026-10-07" },
        { success: "half", date: "2026-10-05" },
        { success: "yes", date: "2026-10-05" },
        { success: "no", date: "2026-10-05" },
        { success: "yes", date: "2026-10-06" },
    ] }];
    const waiting = summarize(exams, practiceMeta, "2026-10-07");
    assert.equal(waiting.scheduleState, "waiting");
    assert.equal(waiting.nextExam.dueDate, "2026-10-08");
    assert.equal(waiting.nextPracticeType, "review");
    assert.equal(waiting.reviewQuestions, 0);
    assert.equal(waiting.overdueExams, 0);

    const ready = summarize(exams, practiceMeta, "2026-10-08");
    assert.equal(ready.scheduleState, "ready");
    assert.equal(ready.nextPracticeQuestions, 2);
    assert.equal(ready.reviewQuestions, 2);
    assert.equal(ready.overdueExams, 0);
});

test("a later exam with purple questions is recommended ahead of an earlier recent attempt", () => {
    const result = summarize([
        { id: 1, questions: [{ success: "no", date: "2026-10-07" }] },
        { id: 2, questions: [{ success: "half", date: "2026-10-04" }] },
    ], practiceMeta, "2026-10-07");
    assert.equal(result.nextExam.id, 2);
    assert.equal(result.nextExam.dueDate, "2026-10-07");
    assert.equal(result.nextPracticeType, "review");
    assert.equal(result.nextPracticeQuestions, 1);
    assert.equal(result.overdueExams, 0);
});

test("review timing follows unsuccessful sections and ignores stale parents and mastered sections", () => {
    const exams = [{ id: 1, questions: [
        { success: "no", date: "2026-09-01" },
        { sub: true, success: "yes", date: "2026-09-01" },
        { sub: true, success: "no", date: "2026-10-06" },
        { sub: true, success: "half", date: "2026-10-07" },
    ] }];
    const waiting = summarize(exams, practiceMeta, "2026-10-07");
    assert.equal(waiting.scheduleState, "waiting");
    assert.equal(waiting.nextExam.dueDate, "2026-10-09");
    assert.equal(waiting.reviewQuestions, 0);
    const ready = summarize(exams, practiceMeta, "2026-10-09");
    assert.equal(ready.reviewQuestions, 1);
    assert.equal(ready.nextPracticeQuestions, 1);
});

test("due unstarted exams can be practiced while recent attempts wait for review", () => {
    const result = summarize([
        { id: 1, questions: [{ success: "no", date: "2026-10-07" }] },
        { id: 2, questions: [{ success: "" }] },
    ], practiceMeta, "2026-10-07");
    assert.equal(result.nextExam.id, 2);
    assert.equal(result.nextPracticeType, "initial");
    assert.equal(result.scheduleState, "ready");
    assert.equal(result.nextReviewDate, "2026-10-10");
    assert.equal(result.overdueExams, 1);
});

test("the screenshot schedule recommends exam 3 and also lists exam 4 as due", () => {
    const result = summarize([
        { id: 1, questions: [{ success: "half", date: "2026-10-05" }] },
        { id: 2, questions: [{ success: "yes", date: "2026-10-07" }] },
        ...[3, 4, 5, 6].map((id) => ({ id, questions: [{ success: "" }] })),
    ], practiceMeta, "2026-10-07");
    assert.equal(result.scheduleState, "ready");
    assert.deepEqual(result.nextExam, { id: 3, name: "", number: 3, dueDate: "2026-09-27" });
    assert.equal(result.nextPracticeType, "initial");
    assert.deepEqual(result.readyInitialExams.map((exam) => exam.id), [3, 4]);
    assert.equal(result.nextReviewDate, "2026-10-08");
    assert.equal(result.reviewQuestions, 0);
});

test("waiting chooses the earliest future activity across initial practice and retries", () => {
    const result = summarize([
        { id: 1, questions: [{ success: "no", date: "2026-10-06" }] },
        { id: 2, questions: [{ success: "" }] },
    ], { studyStartDate: "2026-10-01", finalExamDate: "2026-10-10" }, "2026-10-07");
    assert.equal(result.scheduleState, "waiting");
    assert.equal(result.nextExam.id, 2);
    assert.equal(result.nextExam.dueDate, "2026-10-08");
    assert.equal(result.nextPracticeType, "initial");
});

test("retries remain scheduled without subject dates and across month boundaries", () => {
    const result = summarize([{ id: 1, questions: [{ success: "no", date: "2026-09-30" }] }],
        {}, "2026-10-01");
    assert.equal(result.scheduleState, "waiting");
    assert.equal(result.nextExam.dueDate, "2026-10-03");
    assert.equal(result.overdueExams, 0);
});

test("purple review shortcuts identify every ready exam and only its eligible question numbers", () => {
    const result = summarize([
        { id: 11, name: "תרגול א", questions: [
            { success: "yes", date: "2026-09-01" },
            { success: "no", date: "2026-10-03" },
            { success: "half", date: "2026-10-06" },
            { success: "half" },
            { sub: true, success: "no", date: "2026-10-04" },
            { sub: true, success: "half", date: "2026-10-04" },
        ] },
        { id: 12, questions: [{ success: "half", date: "2026-10-04" }] },
        { id: 13, questions: [{ success: "no", date: "2026-10-07" }] },
    ], practiceMeta, "2026-10-07");
    assert.deepEqual(result.readyReviewExams, [
        { id: 11, name: "תרגול א", number: 1, dueDate: "2026-10-06", questionCount: 2, questionNumbers: [2, 4] },
        { id: 12, name: "", number: 2, dueDate: "2026-10-07", questionCount: 1, questionNumbers: [1] },
    ]);
    assert.equal(result.reviewQuestions, 3);
    assert.deepEqual(result.upcomingReviewExams, [
        { id: 13, name: "", number: 3, dueDate: "2026-10-10", questionCount: 1, questionNumbers: [1] },
    ]);
});

test("the waiting review shows the exam, count, and question numbers for the next eligible date only", () => {
    const result = summarize([{ id: 1, questions: [
        { success: "half", date: "2026-10-05" },
        { success: "no", date: "2026-10-06" },
        { success: "no", date: "2026-10-05" },
        { success: "yes", date: "2026-09-01" },
    ] }], practiceMeta, "2026-10-07");
    assert.deepEqual(result.readyReviewExams, []);
    assert.deepEqual(result.upcomingReviewExams, [
        { id: 1, name: "", number: 1, dueDate: "2026-10-08", questionCount: 2, questionNumbers: [1, 3] },
    ]);
});

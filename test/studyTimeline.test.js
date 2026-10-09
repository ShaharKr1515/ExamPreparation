import test from "node:test";
import assert from "node:assert/strict";
import { calculateStudyTimeline } from "../src/utils/studyTimeline.js";
import { calculateExamTargetDates } from "../src/utils/examUtils.js";

const meta = { studyStartDate: "2026-09-05", finalExamDate: "2026-10-24" };
const exam = (id, outcomes) => ({ id, questions: outcomes.map((success) => ({ success })) });

test("milestones preserve exam targets and distinguish completion from mastery", () => {
    const exams = [exam(1, ["yes", "half", "no"]), exam(2, ["yes", "yes"]), exam(3, ["half", ""])];
    const result = calculateStudyTimeline(exams, meta, "2026-10-09");
    assert.deepEqual(result.exams.map((item) => item.dueDate), calculateExamTargetDates(meta.studyStartDate, meta.finalExamDate, 3));
    assert.deepEqual(result.exams.map((item) => item.completion), [100, 100, 50]);
    assert.deepEqual(result.exams.map((item) => item.status), ["answered", "mastered", "started"]);
    assert.equal(result.exams[0].counts.no, 1);
});

test("today coincides with its exam and interpolates between neighboring targets", () => {
    const exams = Array.from({ length: 6 }, (_, index) => exam(index, [""]));
    const result = calculateStudyTimeline(exams, meta, "2026-10-09");
    assert.equal(result.todayPosition, result.exams[4].position);
    const between = calculateStudyTimeline(exams, meta, "2026-10-13");
    assert.equal(between.todayPosition, (result.exams[4].position + result.exams[5].position) / 2);
});

test("today clamps to endpoints and explicitly identifies dates outside the plan", () => {
    assert.equal(calculateStudyTimeline([], meta, "2026-09-01").todayState, "before");
    assert.equal(calculateStudyTimeline([], meta, "2026-09-01").todayPosition, 0);
    assert.equal(calculateStudyTimeline([], meta, "2026-10-25").todayState, "after");
    assert.equal(calculateStudyTimeline([], meta, "2026-10-25").todayPosition, 100);
    assert.equal(calculateStudyTimeline([], meta, meta.studyStartDate).todayState, "within");
});

test("missing or invalid dates never produce a misleading timeline", () => {
    assert.equal(calculateStudyTimeline([], {}).state, "missing-dates");
    assert.equal(calculateStudyTimeline([], { ...meta, studyStartDate: "2026-10-24" }).state, "invalid-dates");
    assert.equal(calculateStudyTimeline([], { ...meta, studyStartDate: "2026-02-31" }).todayPosition, null);
});

test("short plans with duplicate dates keep all fifty milestones and a finite today position", () => {
    const result = calculateStudyTimeline(Array.from({ length: 50 }, (_, id) => exam(id, [])),
        { studyStartDate: "2026-10-09", finalExamDate: "2026-10-10" }, "2026-10-09");
    assert.equal(result.exams.length, 50);
    assert.equal(result.exams[49].status, "unstarted");
    assert.equal(result.todayPosition, 0);
    assert.ok(result.exams.every((item, index, items) => index === 0 || item.position > items[index - 1].position));
});

test("one unanswered question never rounds a large exam into full completion", () => {
    const result = calculateStudyTimeline([exam(1, [...Array(199).fill("yes"), ""])], meta, "2026-10-09");
    assert.equal(result.exams[0].completion, 99);
    assert.equal(result.exams[0].status, "started");
});

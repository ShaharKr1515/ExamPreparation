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

test("an answered pace target still requires its purple questions to be reviewed", () => {
    const exams = [1, 2].map((id) => exam(id, ["yes"]));
    exams.push({ id: 3, questions: [
        { success: "half", date: "2026-10-07" },
        { success: "no", date: "2026-10-06" },
        { success: "yes", date: "2026-09-01" },
    ] });
    exams.push(exam(4, [""]), exam(5, [""]));
    const result = calculateStudyTimeline(exams,
        { studyStartDate: "2026-09-05", finalExamDate: "2026-11-27" }, "2026-10-10");
    assert.equal(result.paceExamId, 3);
    assert.equal(result.exams[2].status, "answered");
    assert.equal(result.exams[2].completion, 100);
    assert.equal(result.exams[2].paceAction, "review");
    assert.deepEqual(result.exams[2].reviewCounts, { yes: 0, half: 1, no: 1, unattempted: 0 });
});

test("the pace action changes when an unsuccessful section becomes purple", () => {
    const exams = [{ id: 1, questions: [
        { success: "yes", date: "2026-09-01" },
        { sub: true, success: "yes", date: "2026-09-01" },
        { sub: true, success: "no", date: "2026-10-07" },
    ] }];
    assert.equal(calculateStudyTimeline(exams, meta, "2026-10-09").exams[0].paceAction, "complete");
    const ready = calculateStudyTimeline(exams, meta, "2026-10-10").exams[0];
    assert.equal(ready.paceAction, "review");
    assert.equal(ready.reviewCounts.half, 1);
});

test("mastered and unstarted pace targets keep their completion and initial practice actions", () => {
    const result = calculateStudyTimeline([
        { id: 1, questions: [{ success: "yes", date: "2026-09-01" }] },
        exam(2, [""]),
    ], meta, "2026-10-10");
    assert.deepEqual(result.exams.map((item) => item.paceAction), ["complete", "initial"]);
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

test("the pace target stays on the exam due next and advances only after its deadline", () => {
    const exams = Array.from({ length: 6 }, (_, index) => exam(index + 1, [""]));
    const plan = { studyStartDate: "2026-09-05", finalExamDate: "2026-10-27" };
    for (const [today, expectedId] of [
        ["2026-09-01", 1], ["2026-09-08", 1], ["2026-09-09", 2],
        ["2026-10-09", 5], ["2026-10-11", 5], ["2026-10-12", 6],
        ["2026-10-27", 6], ["2026-10-28", 6],
    ]) {
        assert.equal(calculateStudyTimeline(exams, plan, today).paceExamId, expectedId, today);
    }
});

test("a shared deadline targets the last exam due that day without skipping completed targets", () => {
    const exams = [exam(1, ["yes"]), exam(2, ["yes"]), exam(3, [""])];
    const plan = { studyStartDate: "2026-10-09", finalExamDate: "2026-10-10" };
    assert.equal(calculateStudyTimeline(exams, plan, "2026-10-09").paceExamId, 3);
    assert.equal(calculateStudyTimeline(exams, meta, "2026-09-08").paceExamId, 1);
});

test("empty plans and invalid dates have no pace target", () => {
    assert.equal(calculateStudyTimeline([], meta, "2026-10-09").paceExamId, null);
    assert.equal(calculateStudyTimeline([exam(1, [""])], {}, "2026-10-09").paceExamId, null);
    assert.equal(calculateStudyTimeline([exam(1, [""])], meta, "invalid").paceExamId, null);
});

import test from "node:test";
import assert from "node:assert/strict";
import * as examUtils from "../src/utils/examUtils.js";

test("default points follow equal main-question weights and split across sections", () => {
    const summary = examUtils.calculateExamScore({ questions: [
        { id: 1, points: "", success: "" },
        { id: 2, sub: true, points: "", success: "yes" },
        { id: 3, sub: true, points: "", success: "half" },
        { id: 4, points: "", success: "yes" },
        { id: 5, points: "", success: "no" },
    ] });
    assert.deepEqual(summary.defaultQuestionPoints, {
        1: 100 / 3, 2: 100 / 6, 3: 100 / 6, 4: 100 / 3, 5: 100 / 3,
    });
    assert.equal(summary.score, 58.3);
});

test("any explicit points, including zero, turn off default point hints", () => {
    for (const points of ["0", "20"]) {
        const summary = examUtils.calculateExamScore({ questions: [
            { id: 1, points: "", success: "yes" },
            { id: 2, sub: true, points, success: "yes" },
            { id: 3, points: "", success: "yes" },
        ] });
        assert.deepEqual(summary.defaultQuestionPoints, {});
    }
    assert.deepEqual(examUtils.calculateExamScore({ questions: [] }).defaultQuestionPoints, {});
});

test("deletion protection recognizes every recorded question field", () => {
    assert.equal(examUtils.questionHasRecordedData({ points: "", date: "", success: "", timerSeconds: 0, failCount: 0 }), false);
    assert.equal(examUtils.questionHasRecordedData({}), false);
    for (const recorded of [{ points: "0" }, { points: "15" }, { date: "2026-10-07" },
        { success: "no" }, { success: "half" }, { success: "yes" }, { timerSeconds: 1 }, { failCount: 1 }]) {
        assert.equal(examUtils.questionHasRecordedData(recorded), true);
    }
});

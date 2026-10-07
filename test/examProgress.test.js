import test from "node:test";
import assert from "node:assert/strict";
import * as examUtils from "../src/utils/examUtils.js";

const today = "2026-10-07";
const reviewCounts = (questions) => examUtils.calculateExamReviewCounts({ questions }, today);

test("one of three failed questions is marked for review at the three-day boundary", () => {
    assert.deepEqual(reviewCounts([
        { success: "no", date: "2026-10-04" },
        { success: "no", date: "2026-10-05" },
        { success: "no", date: "2026-10-07" },
        { success: "yes", date: "2026-09-01" },
    ]), { yes: 0, half: 0, no: 1, unattempted: 0 });
});

test("purple sections mark their parent outcome once, without counting mastered sections", () => {
    assert.deepEqual(reviewCounts([
        { success: "no", date: "2026-09-01" },
        { sub: true, success: "yes", date: "2026-09-01" },
        { sub: true, success: "no", date: "2026-10-04" },
        { sub: true, success: "half", date: "2026-10-03" },
        { success: "half", date: "2026-09-01" },
        { sub: true, success: "yes", date: "2026-09-01" },
        { sub: true, success: "yes", date: "2026-09-01" },
    ]), { yes: 0, half: 1, no: 0, unattempted: 0 });
});

test("unanswered dated questions retain their review indicator; missing and future dates do not", () => {
    assert.deepEqual(reviewCounts([
        { success: "", date: "2026-10-04" },
        { success: "no", date: "" },
        { success: "half", date: "2026-10-08" },
    ]), { yes: 0, half: 0, no: 0, unattempted: 1 });
    assert.deepEqual(reviewCounts([]), { yes: 0, half: 0, no: 0, unattempted: 0 });
});

import test from "node:test";
import assert from "node:assert/strict";
import {
    calculateExamTargetDates,
    examIntervalDays,
    formatExamIntervalLabel,
    formatDisplayDate,
} from "../src/utils/examUtils.js";

test("calculateExamTargetDates for single exam", () => {
    const dates = calculateExamTargetDates("2026-09-25", "2026-10-23", 1);
    assert.equal(dates.length, 1);
    assert.equal(dates[0], "2026-09-28");
    assert.equal(formatDisplayDate(dates[0]), "28.09.2026");

    const interval = examIntervalDays("2026-09-25", "2026-10-23", 1);
    assert.equal(interval, 26);
    assert.equal(formatExamIntervalLabel(interval), "צריך להשלים מבחן כל 26 ימים");
});

test("calculateExamTargetDates for 2 exams assigns a date to both exams", () => {
    const dates = calculateExamTargetDates("2026-09-25", "2026-10-23", 2);
    assert.equal(dates.length, 2);
    assert.equal(dates[0], "2026-09-28");
    assert.equal(dates[1], "2026-10-11");
    assert.equal(formatDisplayDate(dates[0]), "28.09.2026");
    assert.equal(formatDisplayDate(dates[1]), "11.10.2026");

    const interval = examIntervalDays("2026-09-25", "2026-10-23", 2);
    assert.equal(interval, 13);
    assert.equal(formatExamIntervalLabel(interval), "צריך להשלים מבחן כל 13 ימים");
});

test("calculateExamTargetDates for 3 and 4 exams assigns dates to all exams", () => {
    const dates3 = calculateExamTargetDates("2026-09-25", "2026-10-23", 3);
    assert.equal(dates3.length, 3);
    assert.equal(dates3.every((d) => d !== null), true);
    assert.equal(dates3[0], "2026-09-28");
    assert.equal(dates3[1], "2026-10-07");
    assert.equal(dates3[2], "2026-10-15");

    const interval3 = examIntervalDays("2026-09-25", "2026-10-23", 3);
    assert.equal(interval3, 8);
    assert.equal(formatExamIntervalLabel(interval3), "צריך להשלים מבחן כל 8 ימים");

    const dates4 = calculateExamTargetDates("2026-09-25", "2026-10-23", 4);
    assert.equal(dates4.length, 4);
    assert.equal(dates4.every((d) => d !== null), true);
});

test("calculateExamTargetDates handles tight windows without dropping dates", () => {
    // 3 days window with 2 exams: final is 2026-09-28
    const dates = calculateExamTargetDates("2026-09-25", "2026-09-28", 2);
    assert.equal(dates.length, 2);
    assert.equal(dates.every((d) => d !== null), true);
    // All dates must be strictly before finalExamDate
    for (const d of dates) {
        assert.ok(d < "2026-09-28", `Date ${d} must be strictly before 2026-09-28`);
    }
});

test("calculateExamTargetDates returns nulls when final date <= start date or invalid", () => {
    assert.deepEqual(calculateExamTargetDates("2026-09-25", "2026-09-20", 2), [null, null]);
    assert.deepEqual(calculateExamTargetDates("2026-09-25", "2026-09-25", 2), [null, null]);
    assert.deepEqual(calculateExamTargetDates("", "2026-09-25", 2), [null, null]);
    assert.deepEqual(calculateExamTargetDates("2026-09-25", "", 2), [null, null]);
    assert.deepEqual(calculateExamTargetDates("invalid", "invalid", 2), [null, null]);
    assert.deepEqual(calculateExamTargetDates("2026-09-25", "2026-10-23", 0), []);
});

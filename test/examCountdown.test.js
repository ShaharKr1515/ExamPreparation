import test from "node:test";
import assert from "node:assert/strict";
import { daysUntil, formatExamCountdown, formatExamCountdownLabel } from "../src/utils/examUtils.js";

test("daysUntil calculates whole days accurately", () => {
    const ref = new Date(2026, 8, 21); // 2026-09-21

    assert.equal(daysUntil("2026-09-21", ref), 0);
    assert.equal(daysUntil("2026-09-22", ref), 1);
    assert.equal(daysUntil("2026-09-23", ref), 2);
    assert.equal(daysUntil("2026-09-25", ref), 4);
    assert.equal(daysUntil("2026-09-20", ref), -1);
    assert.equal(daysUntil("2026-09-10", ref), -11);

    // Invalid/empty inputs
    assert.equal(daysUntil("", ref), null);
    assert.equal(daysUntil(null, ref), null);
    assert.equal(daysUntil(undefined, ref), null);
    assert.equal(daysUntil("not-a-date", ref), null);
});

test("formatExamCountdown and Hebrew grammar rules", () => {
    const ref = new Date(2026, 8, 21); // 2026-09-21

    // 1 day remaining: singular "יום"
    const oneDay = formatExamCountdown("2026-09-22", ref);
    assert.deepEqual(oneDay, { label: "עוד יום למבחן!", status: "future", days: 1 });
    assert.equal(formatExamCountdownLabel("2026-09-22", ref), "עוד יום למבחן!");

    // 2 days remaining: dual "יומיים"
    const twoDays = formatExamCountdown("2026-09-23", ref);
    assert.deepEqual(twoDays, { label: "עוד יומיים למבחן!", status: "future", days: 2 });
    assert.equal(formatExamCountdownLabel("2026-09-23", ref), "עוד יומיים למבחן!");

    // 3 days remaining: "3 ימים"
    const threeDays = formatExamCountdown("2026-09-24", ref);
    assert.deepEqual(threeDays, { label: "עוד 3 ימים למבחן!", status: "future", days: 3 });
    assert.equal(formatExamCountdownLabel("2026-09-24", ref), "עוד 3 ימים למבחן!");

    // 14 days remaining: "14 ימים"
    const fourteenDays = formatExamCountdown("2026-10-05", ref);
    assert.deepEqual(fourteenDays, { label: "עוד 14 ימים למבחן!", status: "future", days: 14 });
    assert.equal(formatExamCountdownLabel("2026-10-05", ref), "עוד 14 ימים למבחן!");

    // 0 days remaining (Today): "היום המבחן!"
    const today = formatExamCountdown("2026-09-21", ref);
    assert.deepEqual(today, { label: "היום המבחן!", status: "today", days: 0 });
    assert.equal(formatExamCountdownLabel("2026-09-21", ref), "היום המבחן!");

    // Past date: "המבחן עבר!"
    const past = formatExamCountdown("2026-09-20", ref);
    assert.deepEqual(past, { label: "המבחן עבר!", status: "past", days: -1 });
    assert.equal(formatExamCountdownLabel("2026-09-20", ref), "המבחן עבר!");

    // Invalid / empty dates return null
    assert.equal(formatExamCountdown("", ref), null);
    assert.equal(formatExamCountdown(null, ref), null);
    assert.equal(formatExamCountdownLabel("", ref), null);
});

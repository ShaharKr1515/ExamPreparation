import test from "node:test";
import assert from "node:assert/strict";
import * as timeline from "../src/utils/semesterTimeline.js";

test("semester progress uses calendar days and clamps before and after semester", () => {
    assert.equal(timeline.getSemesterProgress("2026-10-01", "2026-10-11", "2026-10-06").percent, 50);
    assert.equal(timeline.getSemesterProgress("2026-10-01", "2026-10-11", "2026-09-01").percent, 0);
    assert.equal(timeline.getSemesterProgress("2026-10-01", "2026-10-11", "2026-11-01").percent, 100);
    for (const [start, end] of [["", ""], ["2026-10-11", "2026-10-01"], ["2026-10-01", "2026-10-01"], ["2026-02-30", "2026-03-30"]]) {
        assert.equal(timeline.getSemesterProgress(start, end, "2026-10-06"), null);
    }
    assert.equal(timeline.getSemesterProgress("2026-10-23", "2026-10-27", "2026-10-25").percent, 50);
    assert.equal(timeline.getSemesterProgress("2026-10-01", "2026-10-15", "2026-10-15").week, 2);
});

test("assignment status distinguishes completed, overdue, today and upcoming", () => {
    const today = "2026-11-03";
    assert.equal(timeline.getAssignmentStatus({ dueDate: "2026-11-01", completed: true }, today), "completed");
    assert.equal(timeline.getAssignmentStatus({ dueDate: "2026-11-01", completed: false }, today), "overdue");
    assert.equal(timeline.getAssignmentStatus({ dueDate: today }, today), "today");
    assert.equal(timeline.getAssignmentStatus({ dueDate: "2026-11-04" }, today), "upcoming");
});

test("semester markers number individual assignments in deadline order rather than weekly counts", () => {
    const markers = timeline.getSemesterMarkers([
        { id: 3, title: "שלישית", dueDate: "2026-11-08" },
        { id: 2, title: "שנייה", dueDate: "2026-11-08" },
        { id: 1, title: "ראשונה", dueDate: "2026-11-03", completed: true },
        { id: 4, title: "מחוץ לסמסטר", dueDate: "2027-02-01" },
    ], "2026-11-01", "2027-01-01");
    assert.deepEqual(markers.map(m => [m.id, m.number]), [[1, 1], [2, 2], [3, 3]]);
    assert.equal(markers[0].completed, true);
    assert.ok(markers[0].position > 0 && markers[0].position < markers[1].position);
    assert.equal(markers[1].position, markers[2].position);
    assert.notEqual(markers[1].lane, markers[2].lane);
    assert.deepEqual(timeline.getSemesterMarkers([], "", ""), []);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../backend/app.js";
import * as svc from "../backend/services/examService.js";

test("retryQuestion updates last_date to today and increments fail_count", async () => {
    svc.clearEverything();

    const created = svc.createSubject("אלגברה לינארית", { examCount: 1 });
    const exam = created.exams[0];

    // Initial question state
    assert.equal(exam.questions[0].failCount, 0);

    // Mark as failed 5 days ago (so it is stale / purple)
    svc.updateQuestion(exam.id, 0, "success", "no");
    svc.updateQuestion(exam.id, 0, "date", "2026-09-10");

    let updated = svc.getExamById(exam.id);
    assert.equal(updated.questions[0].date, "2026-09-10");
    assert.equal(updated.questions[0].failCount, 0);

    // Call retryQuestion
    const retried1 = svc.retryQuestion(exam.id, 0);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    assert.equal(retried1.questions[0].date, todayStr);
    assert.equal(retried1.questions[0].failCount, 1);

    // Call retryQuestion second time
    const retried2 = svc.retryQuestion(exam.id, 0);
    assert.equal(retried2.questions[0].date, todayStr);
    assert.equal(retried2.questions[0].failCount, 2);
});

test("retryQuestion on parent question with subquestions updates stale subquestions", async () => {
    svc.clearEverything();

    const created = svc.createSubject("חדוא", { examCount: 1 });
    const exam = created.exams[0];

    // Add 2 subquestions to Q0
    svc.addQuestion(exam.id, 0);
    svc.addQuestion(exam.id, 1);

    // Q0 has 2 subquestions: Q1 and Q2
    // Set Q1 to stale (failed on 2026-09-10)
    svc.updateQuestion(exam.id, 1, "success", "no");
    svc.updateQuestion(exam.id, 1, "date", "2026-09-10");

    // Set Q2 to yes (completed on today)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    svc.updateQuestion(exam.id, 2, "success", "yes");
    svc.updateQuestion(exam.id, 2, "date", todayStr);

    // Retry parent Q0
    const retried = svc.retryQuestion(exam.id, 0);
    assert.equal(retried.questions[0].failCount, 1);
    assert.equal(retried.questions[0].date, todayStr);
    // Subquestion 1 was stale, so it was updated
    assert.equal(retried.questions[1].date, todayStr);
    assert.equal(retried.questions[1].failCount, 1);
    // Subquestion 2 was already "yes", so failCount remains 0
    assert.equal(retried.questions[2].failCount, 0);
});

test("retryQuestion via HTTP API route POST /api/exams/:id/questions/:position/retry", async () => {
    svc.clearEverything();

    const app = createApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
        const created = svc.createSubject("מבני נתונים", { examCount: 1 });
        const exam = created.exams[0];

        svc.updateQuestion(exam.id, 0, "success", "no");
        svc.updateQuestion(exam.id, 0, "date", "2026-09-01");

        const res = await fetch(`http://localhost:${port}/api/exams/${exam.id}/questions/0/retry`, {
            method: "POST",
        });

        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.questions[0].failCount, 1);

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        assert.equal(data.questions[0].date, todayStr);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test("getFullState includes failCount for questions", async () => {
    svc.clearEverything();

    const created = svc.createSubject("הסתברות", { examCount: 1 });
    const exam = created.exams[0];
    svc.updateQuestion(exam.id, 0, "failCount", 3);

    const fullState = svc.getFullState();
    const loadedExam = fullState.exams.find((e) => e.id === exam.id);
    assert.equal(loadedExam.questions[0].failCount, 3);
    assert.equal(loadedExam.questions[1].failCount, 0);
});

test("copyExamLayout resets failCount to 0 on target exams", async () => {
    svc.clearEverything();

    const created = svc.createSubject("פיזיקה 1", { examCount: 2 });
    const [e1, e2] = created.exams;

    // Set points and failCount on e1
    svc.updateQuestion(e1.id, 0, "points", "25");
    svc.updateQuestion(e1.id, 0, "failCount", 4);

    // Copy layout from e1 to e2
    const copied = svc.copyExamLayout(e1.id, [e2.id]);
    assert.equal(copied[0].questions[0].points, "25");
    assert.equal(copied[0].questions[0].failCount, 0);
});

test("retryQuestion on a subquestion directly updates only that subquestion and increments fail_count", async () => {
    svc.clearEverything();

    const created = svc.createSubject("מבנה נתונים 2", { examCount: 1 });
    const exam = created.exams[0];

    // Add subquestion to Q0 -> subquestion is at position 1
    svc.addQuestion(exam.id, 0);

    // Set subquestion (position 1) to stale
    svc.updateQuestion(exam.id, 1, "success", "no");
    svc.updateQuestion(exam.id, 1, "date", "2026-09-05");

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Retry specifically the subquestion (position 1)
    const retried = svc.retryQuestion(exam.id, 1);
    assert.equal(retried.questions[1].failCount, 1);
    assert.equal(retried.questions[1].date, todayStr);
});

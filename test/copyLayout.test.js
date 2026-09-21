import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../backend/app.js";
import * as svc from "../backend/services/examService.js";
import { db } from "../backend/db/database.js";

test("copyExamLayout copies questions layout, subquestions, and points", async (t) => {
    // 1. Setup clean subject and exams
    svc.clearEverything();

    const created = svc.createSubject("מבחן מבנה", {
        examCount: 3,
        studyStartDate: "2026-09-01",
        finalExamDate: "2026-10-01",
    });

    const exams = created.exams;
    assert.equal(exams.length, 3);
    const exam1 = exams[0];
    const exam2 = exams[1];
    const exam3 = exams[2];

    // Verify initial state: 5 questions with empty points and no subquestions
    assert.equal(exam1.questions.length, 5);
    assert.equal(exam2.questions.length, 5);

    // 2. Customize Exam 1's layout:
    // Set points on Q0
    svc.updateQuestion(exam1.id, 0, "points", "20");
    svc.updateQuestion(exam1.id, 0, "success", "yes"); // Should NOT be copied

    // Add subquestion to Q0 (insert after position 0)
    svc.addQuestion(exam1.id, 0); // this adds a sub-question under Q0 and splits points to 10 each
    // Now Q0 is main, Q1 is sub.
    // Let's set Q1 points to "8" and add another subquestion under Q0 (insert after position 1)
    svc.addQuestion(exam1.id, 1);

    // Set points on Q3
    svc.updateQuestion(exam1.id, 3, "points", "40");
    svc.updateQuestion(exam1.id, 3, "timerSeconds", 300); // Should NOT be copied

    const updatedExam1 = svc.getExamById(exam1.id);
    assert.equal(updatedExam1.questions.length, 7); // 5 initial + 2 subquestions
    const q0 = updatedExam1.questions[0];
    const q1 = updatedExam1.questions[1];
    const q2 = updatedExam1.questions[2];
    assert.equal(q0.sub, false);
    assert.equal(q1.sub, true);
    assert.equal(q2.sub, true);

    // Fill some data in Exam 2 to verify it gets replaced and reset
    svc.updateQuestion(exam2.id, 0, "success", "no");
    svc.updateQuestion(exam2.id, 0, "date", "2026-09-15");
    svc.updateQuestion(exam2.id, 0, "timerSeconds", 120);

    // 3. Perform copyExamLayout from Exam 1 to Exam 2 only
    const resultOne = svc.copyExamLayout(exam1.id, [exam2.id]);
    assert.equal(resultOne.length, 1);
    const copiedExam2 = resultOne[0];

    // Check Exam 2 questions
    assert.equal(copiedExam2.questions.length, updatedExam1.questions.length);
    for (let i = 0; i < updatedExam1.questions.length; i++) {
        const srcQ = updatedExam1.questions[i];
        const tgtQ = copiedExam2.questions[i];
        assert.equal(tgtQ.sub, srcQ.sub, `Mismatch in sub status at question index ${i}`);
        assert.equal(tgtQ.points, srcQ.points, `Mismatch in points at question index ${i}`);
        assert.equal(tgtQ.success, "", `Success should be reset to empty at index ${i}`);
        assert.equal(tgtQ.date, "", `Date should be reset to empty at index ${i}`);
        assert.equal(tgtQ.timerSeconds, 0, `Timer should be reset to 0 at index ${i}`);
    }

    // Exam 3 should still have its original 5 questions
    const unchangedExam3 = svc.getExamById(exam3.id);
    assert.equal(unchangedExam3.questions.length, 5);

    // 4. Perform copyExamLayout from Exam 1 with targetExamIds = null (defaults to all other exams in subject)
    const resultAll = svc.copyExamLayout(exam1.id, null);
    assert.equal(resultAll.length, 2); // exam2 and exam3

    const finalExam3 = svc.getExamById(exam3.id);
    assert.equal(finalExam3.questions.length, updatedExam1.questions.length);
    for (let i = 0; i < updatedExam1.questions.length; i++) {
        const srcQ = updatedExam1.questions[i];
        const tgtQ = finalExam3.questions[i];
        assert.equal(tgtQ.sub, srcQ.sub);
        assert.equal(tgtQ.points, srcQ.points);
        assert.equal(tgtQ.success, "");
        assert.equal(tgtQ.date, "");
        assert.equal(tgtQ.timerSeconds, 0);
    }
});

test("copy-layout API route works via HTTP server", async (t) => {
    svc.clearEverything();
    const created = svc.createSubject("פיזיקה", { examCount: 2 });
    const [e1, e2] = created.exams;

    svc.updateQuestion(e1.id, 0, "points", "35");
    svc.addQuestion(e1.id, 0);

    const app = createApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
        const res = await fetch(`http://localhost:${port}/api/exams/${e1.id}/copy-layout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetExamIds: [e2.id] }),
        });

        assert.equal(res.status, 200);
        const updatedExams = await res.json();
        assert.equal(updatedExams.length, 1);
        const updatedE2 = updatedExams[0];
        assert.equal(updatedE2.id, e2.id);

        const source = svc.getExamById(e1.id);
        assert.equal(updatedE2.questions.length, source.questions.length);
        assert.equal(updatedE2.questions[1].sub, true);
    } finally {
        server.close();
    }
});

test("copyExamLayout edge cases: does not affect other subjects and handles error cases", async (t) => {
    svc.clearEverything();
    const s1 = svc.createSubject("נושא 1", { examCount: 2 });
    const s2 = svc.createSubject("נושא 2", { examCount: 2 });

    const s1e1 = s1.exams[0];
    const s1e2 = s1.exams[1];
    const s2e1 = s2.exams[0];
    const s2e2 = s2.exams[1];

    // Modify s1e1
    svc.updateQuestion(s1e1.id, 0, "points", "50");
    svc.addQuestion(s1e1.id, 0); // Adds subquestion

    // Copy s1e1 to all other exams in subject 1
    svc.copyExamLayout(s1e1.id, null);

    // s1e2 should have the layout
    const s1e2Updated = svc.getExamById(s1e2.id);
    assert.equal(s1e2Updated.questions.length, 6);

    // s2e1 and s2e2 should be completely untouched (still 5 default questions)
    const s2e1Check = svc.getExamById(s2e1.id);
    const s2e2Check = svc.getExamById(s2e2.id);
    assert.equal(s2e1Check.questions.length, 5);
    assert.equal(s2e2Check.questions.length, 5);

    // Error test: non-existent exam
    assert.throws(() => {
        svc.copyExamLayout(999999);
    }, /Exam not found/);

    // Target filtering test: passing source exam id as target should ignore itself
    const resSelf = svc.copyExamLayout(s1e1.id, [s1e1.id]);
    assert.equal(resSelf.length, 0);

    // Target filtering test: passing exams from other subjects should be ignored
    const resOtherSubject = svc.copyExamLayout(s1e1.id, [s2e1.id, 99999]);
    assert.equal(resOtherSubject.length, 0);
    assert.equal(svc.getExamById(s2e1.id).questions.length, 5);
});


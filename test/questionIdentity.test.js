import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../backend/app.js";
import * as svc from "../backend/services/examService.js";
import * as api from "../src/services/api.js";

test("queued section edits resolve stable IDs after earlier sections are deleted", async (t) => {
    assert.equal(typeof api.deleteQuestionById, "function");
    assert.equal(typeof api.updateQuestionById, "function");
    svc.clearEverything();
    const exam = svc.createSubject("identity test", { examCount: 1 }).exams[0];
    svc.addQuestion(exam.id, 0);
    const withSections = svc.addQuestion(exam.id, 1);
    const firstId = withSections.questions[1].id;
    const secondId = withSections.questions[2].id;
    const nextMainId = withSections.questions[3].id;
    const server = createApp().listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const fetchHttp = globalThis.fetch;
    t.mock.method(globalThis, "fetch", (path, options) => fetchHttp(`http://127.0.0.1:${server.address().port}${path}`, options));
    await api.deleteQuestionById(exam.id, firstId);
    await api.updateQuestionById(exam.id, secondId, "points", "17");
    assert.equal(svc.getExamById(exam.id).questions.find((q) => q.id === secondId).points, "17");
    await api.deleteQuestionById(exam.id, secondId);
    const remaining = svc.getExamById(exam.id).questions;
    assert.equal(remaining.length, 5);
    assert.equal(remaining[1].id, nextMainId);
    // Repeating the same ID deletion must not delete the next row.
    await api.deleteQuestionById(exam.id, secondId);
    assert.equal(svc.getExamById(exam.id).questions.length, 5);
    await assert.rejects(api.updateQuestionById(exam.id, secondId, "points", "99"), { status: 404 });
});

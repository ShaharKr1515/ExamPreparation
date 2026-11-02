import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../backend/app.js";
import * as svc from "../backend/services/examService.js";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

test("existing courses default to exam mode with independent semester dates", () => {
    svc.clearEverything();
    svc.createSubject("אלגברה", { examCount: 1, studyStartDate: "2026-10-01", finalExamDate: "2027-02-01" });
    const state = svc.getFullState();
    assert.equal(state.subjectMeta["אלגברה"].mode, "exam");
    assert.equal(state.subjectMeta["אלגברה"].semesterStartDate, "");
    assert.deepEqual(state.assignments, []);
});

test("study courses start without practice exams and preserve their mode on duplicate creation", () => {
    svc.clearEverything();
    const created = svc.createSubject("קורס סמסטר", { mode: "study", examCount: 2, semesterStartDate: "2026-10-01", semesterEndDate: "2027-01-31" });
    assert.deepEqual(created.exams, []);
    assert.equal(svc.getFullState().subjectMeta["קורס סמסטר"].plannedExamCount, 0);
    svc.createSubject("קורס סמסטר", { mode: "exam", examCount: 3 });
    assert.equal(svc.getFullState().subjectMeta["קורס סמסטר"].mode, "study");
    assert.equal(svc.getFullState().exams.length, 0);
});

test("legacy database migration is repeatable and preserves recorded practice data", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "exam-semester-migration-"));
    const databasePath = path.join(directory, "legacy.sqlite");
    const legacy = new DatabaseSync(databasePath);
    legacy.exec(`
        CREATE TABLE subjects (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE);
        CREATE TABLE exams (id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, name TEXT NOT NULL DEFAULT '');
        CREATE TABLE questions (id INTEGER PRIMARY KEY, exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            position INTEGER NOT NULL, success TEXT NOT NULL DEFAULT '', last_date TEXT NOT NULL DEFAULT '', points TEXT NOT NULL DEFAULT '');
        INSERT INTO subjects VALUES (1, 'קורס ישן');
        INSERT INTO exams VALUES (1, 1, 'בחינה קיימת');
        INSERT INTO questions VALUES (1, 1, 0, 'yes', '2026-11-01', '20');
    `);
    legacy.close();
    const serviceUrl = new URL("../backend/services/examService.js", import.meta.url).href;
    const script = `const svc = await import(${JSON.stringify(serviceUrl)}); console.log(JSON.stringify(svc.getFullState()));`;
    try {
        for (let boot = 0; boot < 2; boot++) {
            const output = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
                env: { ...process.env, DATABASE_PATH: databasePath }, encoding: "utf8",
            });
            const state = JSON.parse(output.trim().split("\n").at(-1));
            assert.equal(state.subjectMeta["קורס ישן"].mode, "exam");
            assert.equal(state.subjectMeta["קורס ישן"].semesterEndDate, "");
            assert.equal(state.exams[0].questions[0].success, "yes");
            assert.equal(state.exams[0].questions[0].points, "20");
            assert.deepEqual(state.assignments, []);
        }
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

test("semester settings and assignment CRUD persist, validate, and respect course ownership", async () => {
    svc.clearEverything();
    svc.createSubject("קורס א", { examCount: 1, finalExamDate: "2027-02-01" });
    svc.createSubject("קורס ב");
    const server = createApp().listen(0);
    const base = `http://localhost:${server.address().port}/api/subjects`;
    async function call(course, suffix, method, body) {
        const response = await fetch(`${base}/${encodeURIComponent(course)}${suffix}`, {
            method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body),
        });
        return { status: response.status, data: await response.json() };
    }
    try {
        assert.equal((await call("קורס א", "/semester", "PATCH", { mode: "study", semesterStartDate: "2026-10-01", semesterEndDate: "2027-01-31" })).status, 200);
        assert.equal((await call("קורס א", "/semester", "PATCH", { mode: "invalid" })).status, 400);
        for (const body of [{ semesterEndDate: "2026-09-30" }, { semesterStartDate: "2026-02-30" }]) {
            assert.equal((await call("קורס א", "/semester", "PATCH", body)).status, 400);
        }
        const created = await call("קורס א", "/assignments", "POST", { title: "תרגיל 1", dueDate: "2026-11-08" });
        assert.equal(created.status, 201);
        assert.equal(created.data.completed, false);
        const id = created.data.id;
        assert.equal((await call("קורס ב", `/assignments/${id}`, "PATCH", { completed: true })).status, 404);
        assert.equal((await call("קורס ב", `/assignments/${id}`, "DELETE")).status, 404);
        for (const body of [{ title: " ", dueDate: "2026-11-08" }, { title: "תרגיל", dueDate: "2026-02-30" }, { title: "תרגיל", dueDate: "" }]) {
            assert.equal((await call("קורס א", "/assignments", "POST", body)).status, 400);
        }
        assert.equal((await call("קורס א", `/assignments/${id}`, "PATCH", { completed: "false" })).status, 400);
        const edited = await call("קורס א", `/assignments/${id}`, "PATCH", { title: "תרגיל מעודכן", dueDate: "2026-11-09", completed: true });
        assert.equal(edited.data.completed, true);
        assert.equal(edited.data.title, "תרגיל מעודכן");
        await call("קורס א", "/semester", "PATCH", { mode: "exam" });
        let state = svc.getFullState();
        assert.equal(state.exams.length, 1);
        assert.equal(state.subjectMeta["קורס א"].finalExamDate, "2027-02-01");
        assert.equal(state.subjectMeta["קורס א"].semesterStartDate, "2026-10-01");
        assert.equal(state.assignments[0].completed, true);
        await call("קורס א", "", "PATCH", { name: "שם חדש" });
        state = svc.getFullState();
        assert.equal(state.assignments[0].subject, "שם חדש");
        assert.equal((await call("שם חדש", `/assignments/${id}`, "DELETE")).status, 200);
        assert.equal(svc.getFullState().assignments.length, 0);
        await call("שם חדש", "/assignments", "POST", { title: "עוד תרגיל", dueDate: "2026-11-10" });
        await call("שם חדש", "", "DELETE");
        assert.deepEqual(svc.getFullState().assignments, []);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

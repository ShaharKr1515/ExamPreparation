// In-memory data model + CRUD. Nothing is ever written to disk or storage —
// a page refresh wipes everything (by design).

import { subjectKey } from "./utils.js";

export const QUESTION_COUNT = 5;

let nextId = 1;
/** @type {Array<{id:number, name:string, subject:string, questions:Array<{success:string,date:string,points:string}>}>} */
const exams = [];

// Explicit subject list — independent of the exams themselves.
/** @type {string[]} */
const subjects = [];

// Active tab: always one of `subjects` while any exist (no "הכל" anymore).
let activeSubject = null;

function emptyQuestion() {
    return { success: "", date: "", points: "" };
}

export function makeExam(name, subject) {
    return {
        id: nextId++,
        name,
        subject,
        questions: Array.from({ length: QUESTION_COUNT }, emptyQuestion),
    };
}

/** All exams (live array — callers should treat it as read-only). */
export function getExams() {
    return exams;
}

export function findExam(id) {
    return exams.find((e) => e.id === id);
}

export function addExamToState(name, subject) {
    const exam = makeExam(name, subject);
    exams.push(exam);
    return exam;
}

export function removeExamFromState(id) {
    const idx = exams.findIndex((e) => e.id === id);
    if (idx !== -1) exams.splice(idx, 1);
}

/** Wipe everything. */
export function clearAllExams() {
    exams.length = 0;
}

// --- Subjects ------------------------------------------------------------------

/** All subjects (live array — treat as read-only). */
export function getSubjects() {
    return subjects;
}

/** Add a subject if it doesn't exist yet. Returns true when newly added. */
export function addSubjectToState(name) {
    const s = String(name || "").trim();
    if (!s) return false;
    if (subjects.some((x) => subjectKey(x) === subjectKey(s))) return false;
    subjects.push(s);
    return true;
}

/** Wipe all subjects and the active tab. */
export function clearAllSubjects() {
    subjects.length = 0;
    activeSubject = null;
}

// --- Active tab state -----------------------------------------------------------

export function getActiveSubject() {
    return activeSubject;
}

export function setActiveSubject(subject) {
    activeSubject = subject;
}

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default DB location is repo-local (./data/exampreparation.db). Override with the
// DATABASE_PATH env var so Docker/Unraid can mount a persistent volume elsewhere.
function resolveDbPath() {
    const fromEnv = process.env.DATABASE_PATH;
    if (fromEnv && fromEnv.trim()) return path.resolve(fromEnv);
    return path.join(__dirname, "..", "..", "data", "exampreparation.db");
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Create tables if they don't exist (idempotent).
db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        study_start_date TEXT NOT NULL DEFAULT '',
        final_exam_date TEXT NOT NULL DEFAULT '',
        planned_exam_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        success TEXT NOT NULL DEFAULT '',
        last_date TEXT NOT NULL DEFAULT '',
        points TEXT NOT NULL DEFAULT '',
        is_sub INTEGER NOT NULL DEFAULT 0,
        timer_seconds INTEGER NOT NULL DEFAULT 0,
        fail_count INTEGER NOT NULL DEFAULT 0,
        UNIQUE (exam_id, position)
    );

    CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
`);

// Migration: add the subject-level date columns to databases created before they existed.
const subjectCols = db.prepare("PRAGMA table_info(subjects)").all().map((c) => c.name);
if (!subjectCols.includes("study_start_date")) {
    db.exec("ALTER TABLE subjects ADD COLUMN study_start_date TEXT NOT NULL DEFAULT ''");
}
if (!subjectCols.includes("final_exam_date")) {
    db.exec("ALTER TABLE subjects ADD COLUMN final_exam_date TEXT NOT NULL DEFAULT ''");
}
if (!subjectCols.includes("planned_exam_count")) {
    db.exec("ALTER TABLE subjects ADD COLUMN planned_exam_count INTEGER NOT NULL DEFAULT 0");
}
const questionCols = db.prepare("PRAGMA table_info(questions)").all().map((c) => c.name);
if (!questionCols.includes("is_sub")) {
    db.exec("ALTER TABLE questions ADD COLUMN is_sub INTEGER NOT NULL DEFAULT 0");
}
if (!questionCols.includes("timer_seconds")) {
    db.exec("ALTER TABLE questions ADD COLUMN timer_seconds INTEGER NOT NULL DEFAULT 0");
}
if (!questionCols.includes("fail_count")) {
    db.exec("ALTER TABLE questions ADD COLUMN fail_count INTEGER NOT NULL DEFAULT 0");
}

console.log(`[db] SQLite database at ${dbPath}`);

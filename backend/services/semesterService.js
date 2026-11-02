import { db } from "../db/database.js";

function invalid(message) {
    throw Object.assign(new Error(message), { status: 400 });
}

function validateDate(value, allowEmpty = false) {
    if (allowEmpty && value === "") return;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid("יש לבחור תאריך תקין.");
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) invalid("יש לבחור תאריך תקין.");
}

export function updateSemester(subject, changes) {
    const mode = changes.mode ?? subject.mode;
    const start = changes.semesterStartDate ?? subject.semester_start_date;
    const end = changes.semesterEndDate ?? subject.semester_end_date;
    if (!["study", "exam"].includes(mode)) invalid("מצב הקורס אינו תקין.");
    validateDate(start, true);
    validateDate(end, true);
    if (start && end && end <= start) invalid("סיום הסמסטר צריך להיות אחרי תחילתו.");
    db.prepare("UPDATE subjects SET mode = ?, semester_start_date = ?, semester_end_date = ? WHERE id = ?")
        .run(mode, start, end, subject.id);
    return { mode, semesterStartDate: start, semesterEndDate: end };
}

function toAssignment(row) {
    return { id: Number(row.id), subject: row.subject, title: row.title, dueDate: row.due_date, completed: !!row.completed };
}

export function listAssignments() {
    return db.prepare(`SELECT a.*, s.name AS subject FROM assignments a JOIN subjects s ON s.id = a.subject_id
        ORDER BY a.due_date, a.id`).all().map(toAssignment);
}

function findAssignment(subject, id) {
    const row = db.prepare("SELECT * FROM assignments WHERE id = ? AND subject_id = ?").get(id, subject.id);
    if (!row) throw Object.assign(new Error("המטלה לא נמצאה בקורס הזה."), { status: 404 });
    return row;
}

function validateAssignment(values) {
    if (typeof values.title !== "string" || !values.title.trim() || values.title.trim().length > 300) invalid("יש להזין שם מטלה באורך של עד 300 תווים.");
    validateDate(values.dueDate);
    if (typeof values.completed !== "boolean") invalid("מצב ההשלמה אינו תקין.");
}

export function createAssignment(subject, changes) {
    const values = { title: changes.title, dueDate: changes.dueDate, completed: changes.completed ?? false };
    validateAssignment(values);
    const info = db.prepare("INSERT INTO assignments (subject_id, title, due_date, completed) VALUES (?, ?, ?, ?)")
        .run(subject.id, values.title.trim(), values.dueDate, Number(values.completed));
    return toAssignment({ ...findAssignment(subject, Number(info.lastInsertRowid)), subject: subject.name });
}

export function updateAssignment(subject, id, changes) {
    const row = findAssignment(subject, id);
    const values = { title: changes.title ?? row.title, dueDate: changes.dueDate ?? row.due_date, completed: changes.completed ?? !!row.completed };
    validateAssignment(values);
    db.prepare("UPDATE assignments SET title = ?, due_date = ?, completed = ? WHERE id = ? AND subject_id = ?")
        .run(values.title.trim(), values.dueDate, Number(values.completed), id, subject.id);
    return toAssignment({ ...findAssignment(subject, id), subject: subject.name });
}

export function deleteAssignment(subject, id) {
    findAssignment(subject, id);
    db.prepare("DELETE FROM assignments WHERE id = ? AND subject_id = ?").run(id, subject.id);
}

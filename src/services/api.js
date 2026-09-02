// Thin client for the Express + SQLite backend (backend/). All calls go to /api, which Vite
// proxies in development and Express serves directly in production — no CORS needed.

async function request(path, options = {}) {
    const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
            const body = await res.json();
            if (body && body.error) message = body.error;
        } catch {
            /* non-JSON error body — keep the generic message */
        }
        throw new Error(message);
    }
    // DELETE / clear-all return 204 or a JSON body; handle both.
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

const json = (data) => ({ method: "POST", body: JSON.stringify(data) });

export function fetchState() {
    return request("/api/state");
}

// Subjects are identified by name on the frontend, so we send/return names.
// Creates the subject with its study dates and `examCount` auto-created exams.
export function createSubject(name, { examCount = 0, studyStartDate = "", finalExamDate = "" } = {}) {
    return request("/api/subjects", json({ name, examCount, studyStartDate, finalExamDate }));
}

// Update the subject-level dates (study start / final exam).
export function updateSubjectDates(name, { studyStartDate = "", finalExamDate = "" }) {
    return request(`/api/subjects/${encodeURIComponent(name)}/dates`, {
        method: "PATCH",
        body: JSON.stringify({ studyStartDate, finalExamDate }),
    });
}

// Rename a subject (by its current display name).
export function renameSubject(oldName, newName) {
    return request(`/api/subjects/${encodeURIComponent(oldName)}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
    });
}

// Delete a subject and all of its exams.
export function deleteSubject(name) {
    return request(`/api/subjects/${encodeURIComponent(name)}`, { method: "DELETE" });
}

export function addExam(subjectName, name) {
    return request("/api/exams", json({ subjectName, name }));
}

export function renameExam(id, name) {
    return request(`/api/exams/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

// Adjust the number of exams under a subject to `target` (creates/deletes as needed).
// Returns the updated list of exams for that subject.
export function adjustExamCount(subjectName, target) {
    return request(`/api/exams/count/${encodeURIComponent(subjectName)}`, {
        method: "PATCH",
        body: JSON.stringify({ target }),
    });
}

export function removeExam(id) {
    return request(`/api/exams/${id}`, { method: "DELETE" });
}

// field is one of: success | date | points (mapped to the DB column server-side).
export function updateQuestion(examId, position, field, value) {
    return request(`/api/exams/${examId}/questions/${position}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
    });
}

export function clearAll() {
    return request("/api/clear-all", json({}));
}

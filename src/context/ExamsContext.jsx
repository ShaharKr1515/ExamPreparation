import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";
import { subjectKey, todayStr } from "../utils/examUtils.js";

const ExamsContext = createContext(null);

// State shape is unchanged for consumers:
//   exams: [{ id, name, subject (display string), questions: [{ success, date, points }] }]
//   subjects: [name strings]          activeSubject: string | null  (pure UI state)
function emptyState() {
    return { exams: [], subjects: [], activeSubject: null };
}

export function ExamsProvider({ children }) {
    const [state, setState] = useState(emptyState());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hydrate from the backend on mount.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await api.fetchState();
                if (!cancelled) setState(data);
            } catch (e) {
                console.error("Failed to load state", e);
                if (!cancelled) setError(e.message || "Failed to load");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // --- Actions: optimistic local update + API call (errors surfaced via `error`) ---

    async function addExam(name) {
        const subject = state.activeSubject;
        if (!subject) return; // no subjects → the add row can't be open anyway
        try {
            const exam = await api.addExam(subject, name);
            setState((s) => ({ ...s, exams: [...s.exams, exam] }));
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    async function removeExam(id) {
        try {
            await api.removeExam(id);
            setState((s) => ({ ...s, exams: s.exams.filter((e) => e.id !== id) }));
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Wipe every exam AND subject — back to the "create your first subject" screen.
    async function clearAll() {
        if (!confirm("למחוק את כל הבחינות?")) return;
        try {
            await api.clearAll();
            setState(emptyState());
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    async function renameExam(id, name) {
        // Optimistic so the inline input stays responsive while typing.
        setState((s) => ({ ...s, exams: s.exams.map((e) => (e.id === id ? { ...e, name } : e)) }));
        try {
            await api.renameExam(id, name);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    async function updateQuestion(examId, qi, field, value) {
        setState((s) => ({
            ...s,
            exams: s.exams.map((exam) => {
                if (exam.id !== examId || !exam.questions[qi]) return exam;
                const questions = exam.questions.slice();
                const q = { ...questions[qi] };
                // First touch on an empty row stamps today's date automatically.
                if ((field === "success" || field === "points") && !q.date) {
                    q.date = todayStr();
                }
                q[field] = value;
                questions[qi] = q;
                return { ...exam, questions };
            }),
        }));
        try {
            await api.updateQuestion(examId, qi, field, value);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Duplicate names are handled consistently: an existing subject is never duplicated —
    // we just switch to it.
    async function addSubject(name) {
        const trimmed = String(name || "").trim();
        if (!trimmed) return;
        try {
            const subject = await api.createSubject(trimmed);
            setState((s) => {
                const existing = s.subjects.find((x) => x.toLowerCase() === subject.name.toLowerCase());
                if (existing) return { ...s, activeSubject: existing };
                return { ...s, subjects: [...s.subjects, subject.name], activeSubject: subject.name };
            });
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Rename a subject; every reference to the old name is updated in place.
    async function renameSubject(oldName, newName) {
        const trimmed = String(newName || "").trim();
        if (!trimmed || subjectKey(trimmed) === subjectKey(oldName)) return;
        setState((s) => ({
            ...s,
            subjects: s.subjects.map((x) => (subjectKey(x) === subjectKey(oldName) ? trimmed : x)),
            exams: s.exams.map((e) => (subjectKey(e.subject) === subjectKey(oldName) ? { ...e, subject: trimmed } : e)),
            activeSubject:
                s.activeSubject && subjectKey(s.activeSubject) === subjectKey(oldName)
                    ? trimmed
                    : s.activeSubject,
        }));
        try {
            await api.renameSubject(oldName, trimmed);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Delete a subject and every exam under it.
    async function deleteSubject(name) {
        setState((s) => ({
            ...s,
            subjects: s.subjects.filter((x) => subjectKey(x) !== subjectKey(name)),
            exams: s.exams.filter((e) => subjectKey(e.subject) !== subjectKey(name)),
            activeSubject:
                s.activeSubject && subjectKey(s.activeSubject) === subjectKey(name)
                    ? null
                    : s.activeSubject,
        }));
        try {
            await api.deleteSubject(name);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Pure UI state — which tab is selected. Never persisted server-side.
    function setActiveSubject(subject) {
        setState((s) => ({ ...s, activeSubject: subject }));
    }

    const value = useMemo(
        () => ({
            state,
            loading,
            error,
            addExam,
            removeExam,
            clearAll,
            renameExam,
            updateQuestion,
            addSubject,
            renameSubject,
            deleteSubject,
            setActiveSubject,
        }),
        [state, loading, error],
    );

    return <ExamsContext.Provider value={value}>{children}</ExamsContext.Provider>;
}

export function useExams() {
    const ctx = useContext(ExamsContext);
    if (!ctx) throw new Error("useExams must be used inside <ExamsProvider>");
    return ctx;
}

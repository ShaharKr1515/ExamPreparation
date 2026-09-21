import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";
import { subjectKey, todayStr } from "../utils/examUtils.js";

const ExamsContext = createContext(null);

// State shape:
//   exams: [{ id, name, subject (display string), questions: [{ success, date, points }] }]
//   subjects: [name strings]          activeSubject: string | null  (pure UI state)
//   subjectMeta: { [subjectName]: { studyStartDate, finalExamDate, plannedExamCount } }
//     (subject-level data; due dates are derived from these, never stored)
function emptyState() {
    return { exams: [], subjects: [], activeSubject: null, subjectMeta: {} };
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

    async function copyExamLayout(sourceExamId, targetExamIds) {
        try {
            const updated = await api.copyExamLayout(sourceExamId, targetExamIds);
            const updatedMap = new Map((updated || []).map((e) => [e.id, e]));
            setState((s) => ({
                ...s,
                exams: s.exams.map((e) =>
                    updatedMap.has(e.id)
                        ? { ...updatedMap.get(e.id), subject: e.subject }
                        : e
                ),
            }));
            return updated;
        } catch (e) {
            console.error("Failed to copy exam layout:", e);
            setError(e.message);
            throw e;
        }
    }

    // Bring the subject's exam total to `target` (server creates/deletes as needed).
    // Resolves true on success, false on failure.
    async function adjustExamCount(subjectName, target) {
        try {
            const updated = await api.adjustExamCount(subjectName, target);
            setState((s) => ({
                ...s,
                exams: [
                    // Keep every exam of other subjects in place…
                    ...s.exams.filter((e) => subjectKey(e.subject) !== subjectKey(subjectName)),
                    // …and swap in the server's fresh list for this subject.
                    ...updated,
                ],
            }));
            return true;
        } catch (e) {
            console.error(e);
            setError(e.message);
            return false;
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

    // Add an empty sub-question to an exam (after index `afterIndex`, or at the end when null).
    async function addQuestion(examId, afterIndex) {
        try {
            const updated = await api.addQuestion(examId, afterIndex ?? null);
            setState((s) => ({
                ...s,
                exams: s.exams.map((e) => (e.id === examId ? { ...updated, subject: e.subject } : e)),
            }));
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Add a new main question to an exam (at the end).
    async function addMainQuestion(examId) {
        try {
            const updated = await api.addMainQuestion(examId);
            setState((s) => ({
                ...s,
                exams: s.exams.map((e) => (e.id === examId ? { ...updated, subject: e.subject } : e)),
            }));
            return updated;
        } catch (e) {
            console.error(e);
            setError(e.message);
            throw e;
        }
    }

    // Remove the last main question (and its sub-questions) from an exam.
    async function removeLastMainQuestion(examId) {
        try {
            const updated = await api.removeLastMainQuestion(examId);
            setState((s) => ({
                ...s,
                exams: s.exams.map((e) => (e.id === examId ? { ...updated, subject: e.subject } : e)),
            }));
            return updated;
        } catch (e) {
            console.error(e);
            setError(e.message);
            throw e;
        }
    }

    // Delete a question (e.g. sub-question) by question ID.
    async function deleteQuestion(examId, questionId) {
        try {
            // Find the current position from the latest state right before the API call
            const exam = state.exams.find((e) => e.id === examId);
            if (!exam) return;

            const position = exam.questions.findIndex((q) => q.id === questionId);
            if (position === -1) return; // Already deleted

            const updated = await api.deleteQuestion(examId, position);
            setState((s) => ({
                ...s,
                exams: s.exams.map((e) => (e.id === examId ? { ...updated, subject: e.subject } : e)),
            }));
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Duplicate names are handled consistently: an existing subject is never duplicated —
    // we just switch to it. Creates `examCount` exams under the new subject.
    async function addSubject(name, { examCount = 0, studyStartDate = "", finalExamDate = "" } = {}) {
        const trimmed = String(name || "").trim();
        if (!trimmed) return;
        try {
            // The current API returns { subject, exams }; tolerate the legacy
            // bare-subject shape too so a stale backend can't crash the UI.
            const res = await api.createSubject(trimmed, { examCount, studyStartDate, finalExamDate });
            const subject = (res && res.subject) || res;
            const createdExams = Array.isArray(res?.exams)
                ? res.exams.map((e) => ({ ...e, subject: e.subject || subject.name }))
                : [];
            setState((s) => {
                const existing = s.subjects.find((x) => x.toLowerCase() === subject.name.toLowerCase());
                if (existing) return { ...s, activeSubject: existing };
                return {
                    ...s,
                    subjects: [...s.subjects, subject.name],
                    exams: [...s.exams, ...createdExams],
                    activeSubject: subject.name,
                    subjectMeta: {
                        ...s.subjectMeta,
                        [subject.name]: {
                            studyStartDate: subject.study_start_date || "",
                            finalExamDate: subject.final_exam_date || "",
                            plannedExamCount: Number(subject.planned_exam_count) || 0,
                        },
                    },
                };
            });
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Update the study start / final exam dates of a subject (subject-level data).
    async function updateSubjectDates(name, { studyStartDate = "", finalExamDate = "" } = {}) {
        setState((s) => ({
            ...s,
            // Preserve plannedExamCount — only the dates change.
            subjectMeta: {
                ...s.subjectMeta,
                [name]: { ...(s.subjectMeta[name] || {}), studyStartDate, finalExamDate },
            },
        }));
        try {
            await api.updateSubjectDates(name, { studyStartDate, finalExamDate });
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Rename a subject; every reference to the old name is updated in place.
    async function renameSubject(oldName, newName) {
        const trimmed = String(newName || "").trim();
        if (!trimmed || subjectKey(trimmed) === subjectKey(oldName)) return;
        setState((s) => {
            const meta = {};
            for (const [k, v] of Object.entries(s.subjectMeta)) {
                meta[subjectKey(k) === subjectKey(oldName) ? trimmed : k] = v;
            }
            return {
                ...s,
                subjects: s.subjects.map((x) => (subjectKey(x) === subjectKey(oldName) ? trimmed : x)),
                exams: s.exams.map((e) => (subjectKey(e.subject) === subjectKey(oldName) ? { ...e, subject: trimmed } : e)),
                activeSubject:
                    s.activeSubject && subjectKey(s.activeSubject) === subjectKey(oldName)
                        ? trimmed
                        : s.activeSubject,
                subjectMeta: meta,
            };
        });
        try {
            await api.renameSubject(oldName, trimmed);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    }

    // Delete a subject and every exam under it.
    async function deleteSubject(name) {
        setState((s) => {
            const meta = { ...s.subjectMeta };
            for (const k of Object.keys(meta)) {
                if (subjectKey(k) === subjectKey(name)) delete meta[k];
            }
            return {
                ...s,
                subjects: s.subjects.filter((x) => subjectKey(x) !== subjectKey(name)),
                exams: s.exams.filter((e) => subjectKey(e.subject) !== subjectKey(name)),
                activeSubject:
                    s.activeSubject && subjectKey(s.activeSubject) === subjectKey(name)
                        ? null
                        : s.activeSubject,
                subjectMeta: meta,
            };
        });
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
            copyExamLayout,
            adjustExamCount,
            clearAll,
            renameExam,
            updateQuestion,
            addQuestion,
            addMainQuestion,
            removeLastMainQuestion,
            deleteQuestion,
            addSubject,
            updateSubjectDates,
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

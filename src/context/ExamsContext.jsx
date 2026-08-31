import React, { createContext, useContext, useMemo, useReducer } from "react";
import { QUESTION_COUNT, makeQuestion, subjectKey, todayStr } from "../utils/examUtils.js";
import { loadInitialData } from "../utils/storage.js";

const ExamsContext = createContext(null);

// In-memory id counter. When persistence is added later, seed this from the
// highest loaded exam id (see src/utils/storage.js).
let nextId = 1;

function makeExam(name, subject) {
    return {
        id: nextId++,
        name,
        subject,
        questions: Array.from({ length: QUESTION_COUNT }, makeQuestion),
    };
}

function reducer(state, action) {
    switch (action.type) {
        case "add-exam": {
            const subject = state.activeSubject;
            if (!subject) return state; // no subjects → the add row can't be open anyway
            return { ...state, exams: [...state.exams, makeExam(action.name, subject)] };
        }

        case "remove-exam":
            return { ...state, exams: state.exams.filter((e) => e.id !== action.id) };

        // Wipe every exam AND subject — back to the "create your first subject" screen.
        case "clear-all":
            return { exams: [], subjects: [], activeSubject: null };

        case "rename-exam":
            return {
                ...state,
                exams: state.exams.map((e) => (e.id === action.id ? { ...e, name: action.name } : e)),
            };

        case "update-question": {
            const { examId, qi, field, value } = action;
            return {
                ...state,
                exams: state.exams.map((exam) => {
                    if (exam.id !== examId || !exam.questions[qi]) return exam;
                    const questions = exam.questions.slice();
                    const q = { ...questions[qi] };
                    // First touch on an empty row: stamp today's date automatically.
                    if ((field === "success" || field === "points") && !q.date) {
                        q.date = todayStr();
                    }
                    q[field] = value;
                    questions[qi] = q;
                    return { ...exam, questions };
                }),
            };
        }

        // Duplicate names are handled consistently: an existing subject (matched
        // case/whitespace-insensitively) is never duplicated — we just switch to it.
        case "add-subject": {
            const name = String(action.name || "").trim();
            if (!name) return state;
            const existing = state.subjects.find((s) => subjectKey(s) === subjectKey(name));
            if (existing) return { ...state, activeSubject: existing };
            return { ...state, subjects: [...state.subjects, name], activeSubject: name };
        }

        case "set-active-subject":
            return { ...state, activeSubject: action.subject };

        default:
            return state;
    }
}

export function ExamsProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, undefined, loadInitialData);

    const value = useMemo(
        () => ({
            state,
            addExam: (name) => dispatch({ type: "add-exam", name }),
            removeExam: (id) => dispatch({ type: "remove-exam", id }),
            clearAll: () => {
                // Bug fix vs. the old vanilla version: clearing now works even when
                // there are zero exams but subjects still exist.
                if (state.exams.length === 0 && state.subjects.length === 0) return;
                if (!confirm("למחוק את כל הבחינות?")) return;
                dispatch({ type: "clear-all" });
            },
            renameExam: (id, name) => dispatch({ type: "rename-exam", id, name }),
            updateQuestion: (examId, qi, field, value) =>
                dispatch({ type: "update-question", examId, qi, field, value }),
            addSubject: (name) => dispatch({ type: "add-subject", name }),
            setActiveSubject: (subject) => dispatch({ type: "set-active-subject", subject }),
        }),
        [state],
    );

    return <ExamsContext.Provider value={value}>{children}</ExamsContext.Provider>;
}

export function useExams() {
    const ctx = useContext(ExamsContext);
    if (!ctx) throw new Error("useExams must be used inside <ExamsProvider>");
    return ctx;
}

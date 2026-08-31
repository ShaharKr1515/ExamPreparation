import { useMemo } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import { subjectKey } from "../utils/examUtils.js";

/** Exams belonging to the active subject tab (the current filtering behavior). */
export function useVisibleExams() {
    const { state } = useExams();
    return useMemo(() => {
        const active = state.activeSubject;
        if (!active) return [];
        return state.exams.filter((e) => subjectKey(e.subject) === subjectKey(active));
    }, [state]);
}

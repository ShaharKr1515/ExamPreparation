import React, { useEffect, useState } from "react";
import { ExamsProvider, useExams } from "./context/ExamsContext.jsx";
import { examIntervalDays, formatExamIntervalLabel } from "./utils/examUtils.js";
import { useVisibleExams } from "./hooks/useVisibleExams.js";
import AppHeader from "./components/AppHeader.jsx";
import ExamCountControl from "./components/ExamCountControl.jsx";
import SubjectTabs from "./components/SubjectTabs.jsx";
import NewSubjectModal from "./components/NewSubjectModal.jsx";
import NoSubjectsScreen from "./components/NoSubjectsScreen.jsx";
import ListPage from "./pages/ListPage.jsx";

/**
 * App shell: the header, subject tabs and the action toolbar
 * (subject-level study dates, exam count, "ניקוי הכול") above the list of exams.
 */
function AppShell() {
    const { state, loading } = useExams();
    const [subjectFormOpen, setSubjectFormOpen] = useState(false);

    const hasSubjects = state.subjects.length > 0;

    // When the last subject disappears (clear-all), close any open modal.
    useEffect(() => {
        if (!hasSubjects) setSubjectFormOpen(false);
    }, [hasSubjects]);

    // While the backend is hydrating, show a spinner instead of flashing "no subjects".
    // (Must come AFTER all hooks — early returns before hooks break React's rules.)
    if (loading) {
        return <div className="wrap"><p className="empty-msg">טוען…</p></div>;
    }

    return (
        <div className="wrap">
            <AppHeader />

            {hasSubjects ? (
                <>
                    <SubjectTabs newOpen={subjectFormOpen} onNew={() => setSubjectFormOpen(true)} />

                    <Toolbar />

                    {subjectFormOpen && <NewSubjectModal onClose={() => setSubjectFormOpen(false)} />}

                    <ListPage />
                </>
            ) : (
                <NoSubjectsScreen />
            )}
        </div>
    );
}

/** The action toolbar: subject-level study dates, exam count and "ניקוי הכול". */
function Toolbar() {
    const { state, clearAll, updateSubjectDates } = useExams();
    const visible = useVisibleExams();
    const active = state.activeSubject;
    const meta = (state.subjectMeta || {})[active] || {};

    function setDates(studyStartDate, finalExamDate) {
        if (!active) return;
        updateSubjectDates(active, { studyStartDate, finalExamDate });
    }

    return (
        <div className="toolbar">
            <label className="date-control">
                <span>תאריך התחלת לימודים</span>
                <input
                    type="date"
                    value={meta.studyStartDate || ""}
                    onChange={(e) => setDates(e.target.value, meta.finalExamDate || "")}
                    aria-label="תאריך התחלת לימודים"
                />
            </label>
            <label className="date-control">
                <span>תאריך בחינה סופית</span>
                <input
                    type="date"
                    value={meta.finalExamDate || ""}
                    onChange={(e) => setDates(meta.studyStartDate || "", e.target.value)}
                    aria-label="תאריך בחינה סופית"
                />
            </label>
            <ExamCountControl subject={active} currentCount={visible.length} />
            {/* How often an exam must be completed, derived from the same math as the due dates. */}
            {(() => {
                const count = Number(meta.plannedExamCount) || visible.length;
                const intervalDays = examIntervalDays(meta.studyStartDate, meta.finalExamDate, count);
                const label = formatExamIntervalLabel(intervalDays);
                return label ? <span className="interval-hint">{label}</span> : null;
            })()}
            <span className="count">
                {visible.length === 1 ? "בחינה אחת" : `${visible.length} בחינות`}
            </span>
            <button type="button" className="btn danger-ghost" onClick={clearAll}>
                ניקוי הכול
            </button>
        </div>
    );
}

export default function App() {
    return (
        <ExamsProvider>
            <AppShell />
        </ExamsProvider>
    );
}

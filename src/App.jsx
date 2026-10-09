import React, { useEffect, useState } from "react";
import { ExamsProvider, useExams } from "./context/ExamsContext.jsx";
import { formatExamCountdown } from "./utils/examUtils.js";
import AppHeader from "./components/AppHeader.jsx";
import LearningPlan from "./components/LearningPlan.jsx";
import SubjectTabs from "./components/SubjectTabs.jsx";
import NewSubjectModal from "./components/NewSubjectModal.jsx";
import NoSubjectsScreen from "./components/NoSubjectsScreen.jsx";
import ListPage from "./pages/ListPage.jsx";
import SaveFeedback from "./components/SaveFeedback.jsx";
import StudySummary from "./components/StudySummary.jsx";
import Icon from "./components/Icon.jsx";

/**
 * App shell: the header, subject tabs and the action toolbar
 * (subject-level study dates, exam count, "ניקוי הכול") above the list of exams.
 */
function AppShell() {
    const { state, loading, loadError, reloadState } = useExams();
    const [subjectFormOpen, setSubjectFormOpen] = useState(false);

    const hasSubjects = state.subjects.length > 0;

    // When the last subject disappears (clear-all), close any open modal.
    useEffect(() => {
        if (!hasSubjects) setSubjectFormOpen(false);
    }, [hasSubjects]);

    // While the backend is hydrating, show a spinner instead of flashing "no subjects".
    // (Must come AFTER all hooks — early returns before hooks break React's rules.)
    if (loading) {
        return <div className="loading-workspace" role="status"><AppHeader /><p>טוען את נתוני התרגול…</p><div className="loading-line" /><div className="loading-panel" /></div>;
    }

    if (loadError) return (
        <div className="wrap">
            <AppHeader />
            <div className="save-feedback has-error load-error" role="alert">
                <span>לא ניתן לטעון את נתוני התרגול. נסה לטעון אותם שוב.</span>
                <button type="button" className="btn ghost" onClick={reloadState}>טעינה מחדש</button>
            </div>
        </div>
    );

    return (
        <div className="app-shell">
            <a className="skip-link" href="#study-workspace">דלג לתוכן</a>
            <aside className="app-sidebar" aria-label="ניווט מקצועות">
                <AppHeader />
                {hasSubjects && <SubjectTabs newOpen={subjectFormOpen} onNew={() => setSubjectFormOpen(true)} />}
                <div className="sidebar-footer"><Icon name="book" size={20} /><p>כל תרגול הוא צעד קדימה.<br /><span>המשך מהמקום שבו עצרת.</span></p></div>
            </aside>
            <main id="study-workspace" className="workspace" tabIndex={-1}>
                <div className="workspace-topline"><SaveFeedback /></div>
                {hasSubjects ? (
                    <>
                        <SubjectHeading />
                        <LearningPlan />
                        <StudySummary />
                        <ListPage />
                    </>
                ) : <NoSubjectsScreen />}
            </main>
            {subjectFormOpen && <NewSubjectModal onClose={() => setSubjectFormOpen(false)} />}
        </div>
    );
}

function SubjectHeading() {
    const { state } = useExams();
    const meta = state.subjectMeta[state.activeSubject] || {};
    const countdown = formatExamCountdown(meta.finalExamDate);
    return <header className="subject-heading">
        <div><h1>{state.activeSubject}</h1><p>תכנון הלמידה, מעקב התקדמות ותרגול — במקום אחד.</p></div>
        {countdown && <div className={`subject-countdown ${countdown.status}`}><Icon name="calendar" size={20} /><span>{countdown.label}</span></div>}
    </header>;
}

export default function App() {
    return (
        <ExamsProvider>
            <AppShell />
        </ExamsProvider>
    );
}

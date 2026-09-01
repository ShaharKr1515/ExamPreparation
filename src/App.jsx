import React, { useEffect, useState } from "react";
import { ExamsProvider, useExams } from "./context/ExamsContext.jsx";
import { useVisibleExams } from "./hooks/useVisibleExams.js";
import AppHeader from "./components/AppHeader.jsx";
import SubjectTabs from "./components/SubjectTabs.jsx";
import NewSubjectRow from "./components/NewSubjectRow.jsx";
import AddExamForm from "./components/AddExamForm.jsx";
import NoSubjectsScreen from "./components/NoSubjectsScreen.jsx";
import ListPage from "./pages/ListPage.jsx";

/**
 * App shell: the header, subject tabs and the action toolbar
 * ("+ הוספת בחינה", exam count, "ניקוי הכול") above the list of exams.
 */
function AppShell() {
    const { state, loading, clearAll } = useExams();
    const visible = useVisibleExams();
    const [addOpen, setAddOpen] = useState(false);
    const [subjectFormOpen, setSubjectFormOpen] = useState(false);

    const hasSubjects = state.subjects.length > 0;

    // When the last subject disappears (clear-all), close any open inline rows —
    // mirrors closeAddRow()/closeNewSubjectRow() in the old clearAll().
    useEffect(() => {
        if (!hasSubjects) {
            setAddOpen(false);
            setSubjectFormOpen(false);
        }
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

                    <div className="toolbar">
                        <button
                            type="button"
                            className={"btn add-exam-standalone" + (addOpen ? " active" : "")}
                            onClick={() => setAddOpen(true)}
                        >
                            + הוספת בחינה
                        </button>
                        <span className="count">
                            {visible.length === 1 ? "בחינה אחת" : `${visible.length} בחינות`}
                        </span>
                        <button type="button" className="btn danger-ghost" onClick={clearAll}>
                            ניקוי הכול
                        </button>
                    </div>

                    {subjectFormOpen && <NewSubjectRow onClose={() => setSubjectFormOpen(false)} />}
                    {addOpen && <AddExamForm onClose={() => setAddOpen(false)} />}

                    <ListPage />
                </>
            ) : (
                <NoSubjectsScreen />
            )}
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

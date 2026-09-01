import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ExamsProvider, useExams } from "./context/ExamsContext.jsx";
import AppHeader from "./components/AppHeader.jsx";
import SubjectTabs from "./components/SubjectTabs.jsx";
import NewSubjectRow from "./components/NewSubjectRow.jsx";
import NoSubjectsScreen from "./components/NoSubjectsScreen.jsx";
import ListPage from "./pages/ListPage.jsx";
import ExamDetailPage from "./pages/ExamDetailPage.jsx";

/**
 * Shared shell: the header, notice, subject tabs and the standalone
 * "+ הוספת בחינה" button stay visible on BOTH the list page and the detail
 * page (same as the original syncViews() behavior).
 */
function AppShell() {
    const { state, loading } = useExams();
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

                    <button
                        type="button"
                        className={"btn add-exam-standalone" + (addOpen ? " active" : "")}
                        onClick={() => setAddOpen(true)}
                    >
                        + הוספת בחינה
                    </button>

                    {subjectFormOpen && <NewSubjectRow onClose={() => setSubjectFormOpen(false)} />}

                    <Routes>
                        <Route path="/" element={<ListPage addOpen={addOpen} onCloseAdd={() => setAddOpen(false)} />} />
                        <Route path="/exam/:id" element={<ExamDetailPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
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
            <BrowserRouter>
                <AppShell />
            </BrowserRouter>
        </ExamsProvider>
    );
}

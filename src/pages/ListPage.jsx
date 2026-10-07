import { useState, useRef, useEffect } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import { useVisibleExams } from "../hooks/useVisibleExams.js";
import ExamCard from "../components/ExamCard.jsx";
import AddExamCard from "../components/AddExamCard.jsx";

/** The list view: the grid of exams for the active subject + an "add exam" card. */
export default function ListPage() {
    const visible = useVisibleExams();
    const { state } = useExams();
    const prevExamsRef = useRef(visible);
    const prevSubjectRef = useRef(state.activeSubject);
    const [enteringExamIds, setEnteringExamIds] = useState(() => new Set());
    const [highlightedExamId, setHighlightedExamId] = useState(() => window.location.hash.slice(1));

    useEffect(() => {
        const highlightExamTarget = () => setHighlightedExamId(window.location.hash.slice(1));
        const dismissExamTarget = (event) => {
            const hash = window.location.hash;
            if (!hash.startsWith("#exam-")) return;
            const exam = document.getElementById(hash.slice(1));
            if (!exam) return;
            if (event.type === "keydown" && event.key !== "Escape") return;
            if (event.type === "pointerdown" && exam.contains(event.target)) return;
            // Explicit state clears the highlight even when the browser retains :target.
            setHighlightedExamId(null);
            window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
            if (document.activeElement === exam) exam.blur();
        };
        document.addEventListener("pointerdown", dismissExamTarget);
        document.addEventListener("keydown", dismissExamTarget);
        window.addEventListener("hashchange", highlightExamTarget);
        return () => {
            document.removeEventListener("pointerdown", dismissExamTarget);
            document.removeEventListener("keydown", dismissExamTarget);
            window.removeEventListener("hashchange", highlightExamTarget);
        };
    }, []);

    useEffect(() => {
        // If the active subject switched, don't animate existing exams
        if (prevSubjectRef.current !== state.activeSubject) {
            prevSubjectRef.current = state.activeSubject;
            prevExamsRef.current = visible;
            setEnteringExamIds(new Set());
            return;
        }

        const prevIds = new Set(prevExamsRef.current.map((e) => e.id));
        const newIds = visible.filter((e) => !prevIds.has(e.id)).map((e) => e.id);
        prevExamsRef.current = visible;

        if (newIds.length > 0) {
            setEnteringExamIds((prev) => new Set([...prev, ...newIds]));
            const timer = setTimeout(() => {
                setEnteringExamIds((prev) => {
                    const next = new Set(prev);
                    newIds.forEach((id) => next.delete(id));
                    return next;
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [visible, state.activeSubject]);

    return (
        <section className="exam-list-section" aria-labelledby="exam-list-title">
            <div className="exam-list-heading">
                <div><h2 id="exam-list-title">בחינות התרגול <span className="exam-list-count">{visible.length}</span></h2><p>עדכן את התוצאות בכל שאלה ועקוב אחר ההתקדמות שלך.</p></div>
                <AddExamCard />
            </div>
            <div className="table-card">
                <div key={state.activeSubject} className="exam-grid exam-grid-enter">
                    {visible.map((exam) => (
                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            isEntering={enteringExamIds.has(exam.id)}
                            isHighlighted={highlightedExamId === `exam-${exam.id}`}
                        />
                    ))}
                    {visible.length === 0 && (
                        <div className="exam-list-empty"><h3>התרגול הראשון מתחיל כאן</h3><p>הוסף בחינה, חלק אותה לשאלות והתחל לעקוב אחר התוצאות.</p></div>
                    )}
                </div>
            </div>
        </section>
    );
}

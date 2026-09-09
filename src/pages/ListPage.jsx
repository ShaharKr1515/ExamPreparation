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
        <section>
            <div className="table-card">
                <div className="exam-grid">
                    {visible.map((exam) => (
                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            isEntering={enteringExamIds.has(exam.id)}
                        />
                    ))}
                    <AddExamCard />
                    {visible.length === 0 && (
                        <div className="empty-msg">אין עדיין בחינות תחת המקצוע הזה — לחץ על כרטיס ה"+" להוספה.</div>
                    )}
                </div>
            </div>
        </section>
    );
}

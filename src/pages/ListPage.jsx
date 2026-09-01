import { useVisibleExams } from "../hooks/useVisibleExams.js";
import ExamCard from "../components/ExamCard.jsx";

/** The list view: the grid of exams for the active subject. */
export default function ListPage() {
    const visible = useVisibleExams();

    return (
        <section>
            <div className="table-card">
                <div className="exam-grid">
                    {visible.map((exam) => (
                        <ExamCard key={exam.id} exam={exam} />
                    ))}
                    {visible.length === 0 && (
                        <div className="empty-msg">אין עדיין בחינות תחת המקצוע הזה — לחץ על "+ הוספת בחינה".</div>
                    )}
                </div>
            </div>
        </section>
    );
}

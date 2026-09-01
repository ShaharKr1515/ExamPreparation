import { useVisibleExams } from "../hooks/useVisibleExams.js";
import ExamCard from "../components/ExamCard.jsx";
import AddExamCard from "../components/AddExamCard.jsx";

/** The list view: the grid of exams for the active subject + an "add exam" card. */
export default function ListPage() {
    const visible = useVisibleExams();

    return (
        <section>
            <div className="table-card">
                <div className="exam-grid">
                    {visible.map((exam) => (
                        <ExamCard key={exam.id} exam={exam} />
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

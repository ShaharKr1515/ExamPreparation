import { useExams } from "../context/ExamsContext.jsx";
import { useVisibleExams } from "../hooks/useVisibleExams.js";
import AddExamForm from "../components/AddExamForm.jsx";
import ExamCard from "../components/ExamCard.jsx";

/** The list view: add-exam row, toolbar (count + clear-all) and the exam grid. */
export default function ListPage({ addOpen, onCloseAdd }) {
    const { clearAll } = useExams();
    const visible = useVisibleExams();

    return (
        <section>
            {addOpen && <AddExamForm onClose={onCloseAdd} />}

            <div className="toolbar">
                <span className="count">{visible.length === 1 ? "בחינה אחת" : `${visible.length} בחינות`}</span>
                <button className="btn danger-ghost" type="button" onClick={clearAll}>
                    ניקוי הכול
                </button>
            </div>

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

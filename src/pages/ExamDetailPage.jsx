import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useExams } from "../context/ExamsContext.jsx";
import QuestionTable from "../components/QuestionTable.jsx";

/** The dedicated page for a single exam (route /exam/:id). */
export default function ExamDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, removeExam } = useExams();

    const exam = state.exams.find((e) => e.id === Number(id));
    if (!exam) return <Navigate to="/" replace />; // unknown id → back to the list

    function onDelete() {
        if (confirm(`למחוק את הבחינה "${exam.name || "ללא שם"}"?`)) {
            removeExam(exam.id);
            navigate("/");
        }
    }

    return (
        <section>
            <button type="button" className="back-link" onClick={() => navigate("/")}>
                ← חזרה לרשימת הבחינות
            </button>

            <div className="detail-title-card table-card">
                <h2>{exam.name || "ללא שם"}</h2>
                {exam.subject && exam.subject.trim() && <span className="subject-badge inline">{exam.subject}</span>}
                <button type="button" className="btn danger-ghost small" onClick={onDelete}>
                    מחיקת בחינה
                </button>
            </div>

            <div className="table-card detail-table-wrap">
                <QuestionTable exam={exam} detail />
            </div>
        </section>
    );
}

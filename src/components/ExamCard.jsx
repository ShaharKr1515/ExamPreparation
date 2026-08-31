import { useNavigate } from "react-router-dom";
import { useExams } from "../context/ExamsContext.jsx";
import QuestionTable from "./QuestionTable.jsx";

/** A list-view card: clickable name header + subject badge + question table. */
export default function ExamCard({ exam }) {
    const navigate = useNavigate();
    const { renameExam, removeExam } = useExams();

    // Clicking the card (outside of editable fields and the delete button)
    // opens this exam's dedicated page — same guards as the original.
    function onCardClick(e) {
        if (e.target.closest(".delete-btn")) return;
        if (e.target.closest("input, select")) return; // keep inline editing usable
        navigate(`/exam/${exam.id}`);
    }

    return (
        <div className="exam-card" onClick={onCardClick}>
            {/* Header: editable exam name + delete button. */}
            <div className="card-head">
                <input
                    type="text"
                    className="cell exam-name"
                    placeholder="ללא שם"
                    title="לחץ לפתיחת עמוד הבחינה"
                    value={exam.name}
                    onChange={(e) => renameExam(exam.id, e.target.value)}
                />
                <button
                    type="button"
                    className="delete-btn"
                    title="מחיקת בחינה"
                    aria-label="מחיקת בחינה"
                    onClick={() => removeExam(exam.id)}
                >
                    ✕
                </button>
            </div>

            {/* Subject badge (the מקצוע this exam is filtered by) */}
            {exam.subject && exam.subject.trim() && <div className="subject-badge">{exam.subject}</div>}

            <QuestionTable exam={exam} />
        </div>
    );
}

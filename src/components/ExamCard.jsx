import { useExams } from "../context/ExamsContext.jsx";
import QuestionTable from "./QuestionTable.jsx";

/** A list-view card: editable name header + question table. */
export default function ExamCard({ exam }) {
    const { renameExam, removeExam } = useExams();

    return (
        <div className="exam-card">
            {/* Header: editable exam name + delete button. */}
            <div className="card-head">
                <input
                    type="text"
                    className="cell exam-name"
                    placeholder="ללא שם"
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

            <QuestionTable exam={exam} />
        </div>
    );
}

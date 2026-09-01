import { useExams } from "../context/ExamsContext.jsx";

/**
 * An empty, exam-styled card with a centered "+" icon. Clicking it creates a new
 * (initially unnamed) exam under the active subject — rename it via its card header.
 */
export default function AddExamCard() {
    const { addExam } = useExams();

    return (
        <button type="button" className="exam-card add-exam-card" onClick={() => addExam("")}>
            <span className="add-icon">+</span>
            <span className="add-label">הוספת בחינה</span>
        </button>
    );
}

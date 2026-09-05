import { useExams } from "../context/ExamsContext.jsx";
import QuestionTable from "./QuestionTable.jsx";
import { calculateExamTargetDates, dueLabel, formatDisplayDate, subjectKey } from "../utils/examUtils.js";

/** A list-view card: editable name header + recommended due date + question table. */
export default function ExamCard({ exam }) {
    const { state, renameExam, removeExam } = useExams();

    // Recommended due date for this exam's position under its subject (derived, not stored).
    const metaKey = Object.keys(state.subjectMeta || {}).find(
        (k) => subjectKey(k) === subjectKey(exam.subject),
    );
    const meta = metaKey ? state.subjectMeta[metaKey] : {};
    // Exam order under the subject = creation order (exams are stored/returned by id).
    const siblings = state.exams.filter((e) => subjectKey(e.subject) === subjectKey(exam.subject));
    // Subjects created before planned_exam_count existed have no stored count — fall back
    // to how many exams actually exist under the subject.
    const examCount = Number(meta.plannedExamCount) || siblings.length;
    const targetDates = calculateExamTargetDates(
        meta.studyStartDate,
        meta.finalExamDate,
        examCount,
    );
    const index = siblings.findIndex((e) => e.id === exam.id);
    const dueDate = index >= 0 ? targetDates[index] : null;
    // Relative label for the due date: "עוד יומיים", "היום", "איחול של X ימים"…
    const relLabel = dueDate ? dueLabel(dueDate) : null;

    return (
        <div className="exam-card">
            {/* Header: name + recommended due date (stacked) | delete button. */}
            <div className="card-head">
                <div className="exam-name-col">
                    <input
                        type="text"
                        className="cell exam-name"
                        placeholder="ללא שם"
                        value={exam.name}
                        onChange={(e) => renameExam(exam.id, e.target.value)}
                    />
                    {dueDate && (
                        <div className="recommended-due">
                            יעד מומלץ: {formatDisplayDate(dueDate)}
                            {relLabel ? ` (${relLabel})` : ""}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="delete-btn"
                    title="מחיקת בחינה"
                    aria-label="מחיקת בחינה"
                    onClick={() => removeExam(exam.id)}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                </button>
            </div>

            <QuestionTable exam={exam} />
        </div>
    );
}

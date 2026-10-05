import { useState, useMemo } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import QuestionTable from "./QuestionTable.jsx";
import ExamSummaryRow from "./ExamSummaryRow.jsx";
import CopyLayoutModal from "./CopyLayoutModal.jsx";
import { calculateExamScore, calculateExamTargetDates, daysSince, dueLabel, formatDisplayDate, subjectKey } from "../utils/examUtils.js";

/** A list-view card: editable name header + recommended due date + question table. */
export default function ExamCard({ exam, isEntering }) {
    const { state, renameExam, removeExam } = useExams();
    const [isExiting, setIsExiting] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    const handleDelete = () => {
        if (isExiting) return;
        const examTitle = exam.name?.trim() ? `"${exam.name}"` : "זו";
        if (!window.confirm(`האם למחוק את בחינה ${examTitle}? כל השאלות והנתונים שלה יימחקו.`)) {
            return;
        }
        setIsExiting(true);
        setTimeout(() => {
            removeExam(exam.id);
        }, 220);
    };

    const handleCopyLayout = () => {
        if (siblings.length <= 1) {
            alert("אין בחינות נוספות במקצוע זה להעתקת המבנה.\nכדי להעתיק את המבנה, יש להוסיף תחילה בחינות נוספות למקצוע.");
            return;
        }
        setIsCopyModalOpen(true);
    };

    // Recommended due date for this exam's position under its subject (derived, not stored).
    const metaKey = Object.keys(state.subjectMeta || {}).find(
        (k) => subjectKey(k) === subjectKey(exam.subject),
    );
    const meta = metaKey ? state.subjectMeta[metaKey] : {};
    // Exam order under the subject = creation order (exams are stored/returned by id).
    const siblings = state.exams.filter((e) => subjectKey(e.subject) === subjectKey(exam.subject));
    // Use the actual number of exams under this subject so every exam gets a recommended date.
    const examCount = siblings.length || Number(meta.plannedExamCount) || 1;
    const targetDates = calculateExamTargetDates(
        meta.studyStartDate,
        meta.finalExamDate,
        examCount,
    );
    const index = siblings.findIndex((e) => e.id === exam.id);
    const examNumber = index >= 0 ? index + 1 : null;
    const dueDate = index >= 0 ? targetDates[index] : null;
    // Relative label for the due date: "עוד יומיים", "היום", "איחור של X ימים"…
    const relLabel = dueDate ? dueLabel(dueDate) : null;
    const days = dueDate ? daysSince(dueDate) : null;
    const dueTone = days === null ? "" : days > 0 ? "overdue" : days === 0 ? "today" : "upcoming";

    // Overall exam score and summary metrics (derived from current questions state).
    const summary = useMemo(() => calculateExamScore(exam), [exam]);

    const cardClass = [
        "exam-card",
        isEntering ? "exam-card-enter" : "",
        isExiting ? "exam-card-exit" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div id={`exam-${exam.id}`} className={cardClass}>
            {/* Header: Top bar (index badge + name input + delete button) & full-width due date strip */}
            <div className="card-head">
                <div className="card-head-top">
                    <div className="card-head-start">
                        {examNumber && (
                            <span
                                className="exam-index-badge"
                                title={`בחינה מספר ${examNumber} מתוך ${siblings.length}`}
                                aria-label={`בחינה ${examNumber}`}
                            >
                                מבחן {examNumber}
                            </span>
                        )}
                    </div>

                    <div className="exam-name-col">
                        <input
                            type="text"
                            className="cell exam-name"
                            placeholder="שם הבחינה (למשל: 2024 מועד א')"
                            value={exam.name}
                            aria-label={`שם בחינה ${examNumber || ""}`}
                            onChange={(e) => renameExam(exam.id, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                }
                            }}
                        />
                    </div>

                    <div className="card-head-end">
                        <button
                            type="button"
                            className="copy-layout-btn"
                            title="העתקת מבנה שאלות"
                            aria-label={`העתקת מבנה שאלות מבחינה ${exam.name || (examNumber ? `מספר ${examNumber}` : "")}`}
                            onClick={handleCopyLayout}
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="delete-btn"
                            title="מחיקת בחינה"
                            aria-label={`מחיקת בחינה ${exam.name || (examNumber ? `מספר ${examNumber}` : "")}`}
                            onClick={handleDelete}
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                            </svg>
                        </button>
                    </div>
                </div>

                {dueDate && (
                    <div
                        className={`recommended-due ${dueTone}`}
                        role="status"
                        aria-label={`יעד מומלץ: ${formatDisplayDate(dueDate)}${relLabel ? ` (${relLabel})` : ""}`}
                    >
                        <span className="due-icon" aria-hidden="true">
                            {dueTone === "overdue" ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            ) : dueTone === "today" ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            )}
                        </span>
                        <span className="due-main">יעד מומלץ: <strong>{formatDisplayDate(dueDate)}</strong></span>
                        {relLabel && <span className="due-rel">({relLabel})</span>}
                    </div>
                )}
            </div>

            {/* Summary Row under the header */}
            <ExamSummaryRow exam={exam} summary={summary} />

            <QuestionTable
                exam={exam}
                questionStatusMap={summary.questionStatusMap}
                isChoiceActive={summary.isChoiceActive}
            />

            {isCopyModalOpen && (
                <CopyLayoutModal
                    exam={exam}
                    examNumber={examNumber}
                    siblings={siblings}
                    onClose={() => setIsCopyModalOpen(false)}
                />
            )}
        </div>
    );
}

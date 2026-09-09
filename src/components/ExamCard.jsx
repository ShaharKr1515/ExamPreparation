import { useState, useRef, useLayoutEffect } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import QuestionTable from "./QuestionTable.jsx";
import { calculateExamTargetDates, daysSince, dueLabel, formatDisplayDate, subjectKey } from "../utils/examUtils.js";

/** A list-view card: editable name header + recommended due date + question table. */
export default function ExamCard({ exam, isEntering }) {
    const { state, renameExam, removeExam } = useExams();
    const [isExiting, setIsExiting] = useState(false);

    const cardRef = useRef(null);
    const prevHeightRef = useRef(null);
    const prevExamIdRef = useRef(exam.id);
    const activeAnimRef = useRef(null);

    // Smoothly animate the card shrinking in sync with an exiting sub-question row
    const handleRowExit = (rowHeight = 40) => {
        const el = cardRef.current;
        if (!el) return;
        const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        const currentH = el.offsetHeight;
        const targetH = Math.max(0, currentH - rowHeight);

        if (activeAnimRef.current) {
            activeAnimRef.current.cancel();
        }

        activeAnimRef.current = el.animate(
            [
                { height: `${currentH}px` },
                { height: `${targetH}px` }
            ],
            {
                duration: 300,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            }
        );

        // Pre-record target height so the subsequent post-deletion render does not trigger a duplicate animation
        prevHeightRef.current = targetH;
    };

    // Smoothly animate the card expanding when a sub-question row is added
    useLayoutEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        if (prevExamIdRef.current !== exam.id) {
            prevExamIdRef.current = exam.id;
            prevHeightRef.current = el.offsetHeight;
            return;
        }

        const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const newHeight = el.offsetHeight;

        if (prevHeightRef.current !== null && prevHeightRef.current !== newHeight && !prefersReducedMotion) {
            const oldHeight = prevHeightRef.current;
            if (activeAnimRef.current) {
                activeAnimRef.current.cancel();
            }
            activeAnimRef.current = el.animate(
                [
                    { height: `${oldHeight}px` },
                    { height: `${newHeight}px` }
                ],
                {
                    duration: 340,
                    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                }
            );
        }

        prevHeightRef.current = newHeight;
    });

    const handleDelete = () => {
        if (isExiting) return;
        setIsExiting(true);
        setTimeout(() => {
            removeExam(exam.id);
        }, 280);
    };

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
    // Relative label for the due date: "עוד יומיים", "היום", "איחור של X ימים"…
    const relLabel = dueDate ? dueLabel(dueDate) : null;
    const days = dueDate ? daysSince(dueDate) : null;
    const dueTone = days === null ? "" : days > 0 ? "overdue" : days === 0 ? "today" : "upcoming";

    const cardClass = [
        "exam-card",
        isEntering ? "exam-card-enter" : "",
        isExiting ? "exam-card-exit" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div ref={cardRef} className={cardClass}>
            {/* Header: name + recommended due date (stacked) | delete button separated by lines. */}
            <div className="card-head">
                <div className="exam-name-col">
                    <input
                        type="text"
                        className="cell exam-name"
                        placeholder="ללא שם"
                        value={exam.name}
                        aria-label="שם בחינה"
                        onChange={(e) => renameExam(exam.id, e.target.value)}
                    />
                    {dueDate && (
                        <div className={`recommended-due ${dueTone}`}>
                            <span className="due-main">יעד מומלץ: {formatDisplayDate(dueDate)}</span>
                            {relLabel && <span className="due-rel">({relLabel})</span>}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="delete-btn"
                    title="מחיקת בחינה"
                    aria-label="מחיקת בחינה"
                    onClick={handleDelete}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                </button>
            </div>

            <QuestionTable exam={exam} onRowExit={handleRowExit} />
        </div>
    );
}

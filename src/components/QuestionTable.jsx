import { useState, useRef, useEffect } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import { questionRowState } from "../utils/examUtils.js";

const QUESTION_HEADERS = ["שאלה", "הצלחה", "תאריך אחרון", "נקודות"];

const HEBREW_SUB_LETTERS = [
    "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'",
    "י\"א", "י\"ב", "י\"ג", "י\"ד", "ט\"ו", "ט\"ז",
];

/** Precompute display labels and ARIA descriptions for main questions and sub-questions. */
function getQuestionLabels(questions = []) {
    let mainCount = 0;
    let subCount = 0;
    return questions.map((q) => {
        if (q.sub) {
            subCount++;
            const letter = HEBREW_SUB_LETTERS[subCount - 1] || `${subCount}`;
            return {
                isSub: true,
                mainIndex: mainCount,
                subLabel: letter,
                display: letter,
                aria: `שאלה ${mainCount} סעיף ${letter}`,
            };
        }
        mainCount++;
        subCount = 0;
        return {
            isSub: false,
            mainIndex: mainCount,
            subLabel: null,
            display: String(mainCount),
            aria: `שאלה ${mainCount}`,
        };
    });
}

/** Button that adds a sub-question (סעיף) after its row. */
function AddSubButton({ examId, afterIndex }) {
    const { addQuestion } = useExams();
    return (
        <button
            type="button"
            className="add-sub-btn"
            title="להוסיף סעיף"
            aria-label={`הוספת סעיף אחרי שאלה ${afterIndex + 1}`}
            onClick={() => addQuestion(examId, afterIndex)}
        >
            {/* Animated label: expands on hover / keyboard focus */}
            <span className="add-sub-label" aria-hidden="true"><span>להוסיף סעיף</span></span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
            </svg>
        </button>
    );
}

/** Button that deletes a sub-question (סעיף). */
function DeleteSubButton({ label, onDelete, isExiting }) {
    return (
        <button
            type="button"
            className="add-sub-btn delete-sub-btn"
            title={`למחוק ${label || "סעיף"}`}
            aria-label={`למחוק ${label || "סעיף"}`}
            disabled={isExiting}
            onClick={onDelete}
        >
            {/* Animated label: expands on hover / keyboard focus */}
            <span className="add-sub-label" aria-hidden="true"><span>למחוק סעיף</span></span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
            </svg>
        </button>
    );
}

/** One editable row (success select, date input, points input) for question qi. */
function QuestionRow({ exam, q, qi, labelInfo, isEntering, onDelete }) {
    const { updateQuestion } = useExams();
    const stateClass = questionRowState(q); // "ok" | "stale" | "bad" | null
    const [isExiting, setIsExiting] = useState(false);

    const handleDelete = () => {
        if (isExiting) return;
        setIsExiting(true);
        setTimeout(() => {
            if (onDelete) {
                onDelete(q.id, qi);
            }
        }, 300);
    };

    const rowClass = [
        stateClass ? `row-${stateClass}` : "",
        q.sub ? "row-sub" : "",
        isEntering ? "row-sub-enter" : "",
        isExiting ? "row-sub-exit" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <tr className={rowClass}>
            <td className={`q-num ${q.sub ? "q-num-sub" : ""}`}>
                <div className="q-cell-inner">
                    {q.sub ? (
                        <span className="sub-q-indicator" title={labelInfo.aria}>
                            <svg
                                className="sub-tree-icon"
                                width="10"
                                height="10"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M10 2v5H3m0 0l2.5-2.5M3 7l2.5 2.5" />
                            </svg>
                            <span className="sub-q-letter">{labelInfo.subLabel}</span>
                        </span>
                    ) : (
                        labelInfo.display
                    )}
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    <select
                        className={"cell" + (q.success === "yes" ? " ok" : q.success === "no" ? " bad" : "")}
                        value={q.success}
                        aria-label={`סטטוס ${labelInfo.aria}`}
                        onChange={(e) => updateQuestion(exam.id, qi, "success", e.target.value)}
                    >
                        <option value="">—</option>
                        <option value="yes">הצלחה</option>
                        <option value="no">כישלון</option>
                    </select>
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    <input
                        type="date"
                        className="cell date"
                        value={q.date}
                        aria-label={`תאריך אחרון ל${labelInfo.aria}`}
                        onChange={(e) => updateQuestion(exam.id, qi, "date", e.target.value)}
                    />
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    <div className="points-cell">
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            className="cell points"
                            placeholder="נק'"
                            value={q.points}
                            aria-label={`נקודות ל${labelInfo.aria}`}
                            onChange={(e) => updateQuestion(exam.id, qi, "points", e.target.value)}
                        />
                        {q.sub ? (
                            <DeleteSubButton label={labelInfo.aria} onDelete={handleDelete} isExiting={isExiting} />
                        ) : (
                            <AddSubButton examId={exam.id} afterIndex={qi} />
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}

/** The question table shown inside each exam card. */
export default function QuestionTable({ exam }) {
    const { deleteQuestion } = useExams();
    const labels = getQuestionLabels(exam.questions);

    const prevExamIdRef = useRef(exam.id);
    const prevQuestionsRef = useRef(exam.questions);
    const [enteringIds, setEnteringIds] = useState(() => new Set());

    useEffect(() => {
        if (prevExamIdRef.current !== exam.id) {
            prevExamIdRef.current = exam.id;
            prevQuestionsRef.current = exam.questions;
            setEnteringIds(new Set());
            return;
        }

        const prevIds = new Set(prevQuestionsRef.current.map((q) => q.id));
        const newSubIds = exam.questions
            .filter((q) => q.sub && q.id && !prevIds.has(q.id))
            .map((q) => q.id);

        prevQuestionsRef.current = exam.questions;

        if (newSubIds.length > 0) {
            setEnteringIds((prev) => new Set([...prev, ...newSubIds]));
            const timer = setTimeout(() => {
                setEnteringIds((prev) => {
                    const next = new Set(prev);
                    newSubIds.forEach((id) => next.delete(id));
                    return next;
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [exam.id, exam.questions]);

    const handleDeleteQuestion = (qId, qi) => {
        const currentIdx = exam.questions.findIndex((q) => q.id === qId);
        deleteQuestion(exam.id, currentIdx !== -1 ? currentIdx : qi);
    };

    return (
        <table className="q-table">
            <thead>
                <tr>
                    {QUESTION_HEADERS.map((label) => (
                        <th key={label}>{label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {exam.questions.map((q, qi) => (
                    <QuestionRow
                        key={q.id ?? qi}
                        exam={exam}
                        q={q}
                        qi={qi}
                        labelInfo={labels[qi] || { display: String(qi + 1), aria: `שאלה ${qi + 1}` }}
                        isEntering={enteringIds.has(q.id)}
                        onDelete={handleDeleteQuestion}
                    />
                ))}
            </tbody>
        </table>
    );
}

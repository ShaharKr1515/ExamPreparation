import { useState, useEffect } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import {
    questionRowState,
    todayStr,
    formatTimer,
    deriveParentSuccess,
    computeSubQuestionsPointsSum,
    computeSubQuestionsTimerSum,
    getLatestDate,
    SUCCESS_LABELS,
} from "../utils/examUtils.js";
import QuestionTimer from "./QuestionTimer.jsx";

const QUESTION_HEADERS = ["שאלה", "הצלחה", "תאריך אחרון", "טיימר", "נקודות"];

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
function AddSubButton({ examId, afterIndex, mainLabel }) {
    const { addQuestion } = useExams();
    return (
        <button
            type="button"
            className="add-sub-btn"
            title="להוסיף סעיף"
            aria-label={`הוספת סעיף לשאלה ${mainLabel || afterIndex + 1}`}
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
function QuestionRow({
    exam,
    q,
    qi,
    subQuestions = [],
    insertAfterIndex,
    labelInfo,
    isEntering,
    onDelete,
}) {
    const { updateQuestion } = useExams();
    const [isExiting, setIsExiting] = useState(false);

    const hasSubQuestions = !q.sub && subQuestions.length > 0;
    const derivedSuccess = hasSubQuestions ? deriveParentSuccess(subQuestions) : "";
    const derivedPoints = hasSubQuestions ? computeSubQuestionsPointsSum(subQuestions) : "";
    const derivedTimerSeconds = hasSubQuestions ? computeSubQuestionsTimerSum(subQuestions) : 0;
    const effectiveDate = hasSubQuestions ? (q.date || getLatestDate(subQuestions)) : q.date;
    const effectiveSuccess = hasSubQuestions ? derivedSuccess : q.success;

    const stateClass = questionRowState({
        success: effectiveSuccess,
        date: effectiveDate,
    }); // "ok" | "stale" | "bad" | "half" | null

    const handleDelete = () => {
        if (isExiting) return;
        setIsExiting(true);
        setTimeout(() => {
            if (onDelete) {
                onDelete(q.id, qi);
            }
        }, 280);
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
                    {hasSubQuestions ? (
                        <div
                            className={`status-sum-badge ${
                                effectiveSuccess === "yes"
                                    ? "ok"
                                    : effectiveSuccess === "no"
                                    ? "bad"
                                    : effectiveSuccess === "half"
                                    ? "half"
                                    : ""
                            }`}
                            title={`סטטוס מחושב לפי הסעיפים: ${SUCCESS_LABELS[effectiveSuccess] || "—"}`}
                            aria-label={`סטטוס מחושב לפי הסעיפים: ${SUCCESS_LABELS[effectiveSuccess] || "—"}`}
                        >
                            <span className="sum-symbol-small" aria-hidden="true">Σ</span>
                            <span>{SUCCESS_LABELS[effectiveSuccess] || "—"}</span>
                        </div>
                    ) : (
                        <select
                            className={
                                "cell" +
                                (q.success === "yes"
                                    ? " ok"
                                    : q.success === "no"
                                    ? " bad"
                                    : q.success === "half"
                                    ? " half"
                                    : "")
                            }
                            value={q.success}
                            aria-label={`סטטוס ${labelInfo.aria}`}
                            onChange={(e) => updateQuestion(exam.id, qi, "success", e.target.value)}
                        >
                            <option value="">—</option>
                            <option value="yes">הצלחה</option>
                            <option value="half">הצלחה חלקית</option>
                            <option value="no">כישלון</option>
                        </select>
                    )}
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    <input
                        type="date"
                        className="cell date"
                        value={q.date || (hasSubQuestions ? effectiveDate : "")}
                        aria-label={`תאריך אחרון ל${labelInfo.aria}`}
                        onChange={(e) => updateQuestion(exam.id, qi, "date", e.target.value)}
                    />
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    {hasSubQuestions ? (
                        <div
                            className={`timer-sum-badge ${derivedTimerSeconds > 0 ? "has-time" : ""}`}
                            title={`סכום זמני הסעיפים: ${formatTimer(derivedTimerSeconds)}`}
                            aria-label={`סכום זמני הסעיפים: ${formatTimer(derivedTimerSeconds)}`}
                        >
                            <span className="sum-symbol-small" aria-hidden="true">Σ</span>
                            <span className="timer-sum-digits">{formatTimer(derivedTimerSeconds)}</span>
                            <span className="timer-sum-label">סה״כ</span>
                        </div>
                    ) : (
                        <QuestionTimer
                            initialSeconds={q.timerSeconds || 0}
                            onSave={(secs) => updateQuestion(exam.id, qi, "timerSeconds", secs)}
                            onStart={() => {
                                const today = todayStr();
                                if (q.date !== today) {
                                    updateQuestion(exam.id, qi, "date", today);
                                }
                            }}
                            questionLabel={labelInfo.aria}
                        />
                    )}
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    <div className="points-cell">
                        {hasSubQuestions ? (
                            <div
                                className="cell points points-sum-badge"
                                title={`סכום נקודות הסעיפים: ${derivedPoints}`}
                                aria-label={`סכום נקודות הסעיפים: ${derivedPoints}`}
                            >
                                <span className="sum-symbol-small" aria-hidden="true">Σ</span>
                                <span className="points-sum-value">{derivedPoints}</span>
                                <span className="points-sum-unit">נק'</span>
                            </div>
                        ) : (
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
                        )}
                        {q.sub ? (
                            <DeleteSubButton label={labelInfo.aria} onDelete={handleDelete} isExiting={isExiting} />
                        ) : (
                            <AddSubButton examId={exam.id} afterIndex={insertAfterIndex ?? qi} mainLabel={labelInfo.display} />
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

    const [prevExamId, setPrevExamId] = useState(exam.id);
    const [prevQuestions, setPrevQuestions] = useState(exam.questions);
    const [enteringIds, setEnteringIds] = useState(() => new Set());

    // Synchronous state adjustment during render (React standard pattern):
    // Ensures newly added sub-question rows render with `isEntering = true` on frame 0,
    // guaranteeing the accordion expansion animation begins smoothly without any 1-frame pop-in.
    if (prevExamId !== exam.id) {
        setPrevExamId(exam.id);
        setPrevQuestions(exam.questions);
        setEnteringIds(new Set());
    } else if (prevQuestions !== exam.questions) {
        const prevIds = new Set(prevQuestions.map((q) => q.id));
        const newSubIds = exam.questions
            .filter((q) => q.sub && q.id && !prevIds.has(q.id))
            .map((q) => q.id);

        setPrevQuestions(exam.questions);
        if (newSubIds.length > 0) {
            setEnteringIds((prev) => new Set([...prev, ...newSubIds]));
        }
    }

    // Clean up enteringIds after animation finishes
    useEffect(() => {
        if (enteringIds.size === 0) return;
        const timer = setTimeout(() => {
            setEnteringIds(new Set());
        }, 400);
        return () => clearTimeout(timer);
    }, [enteringIds]);

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
                {exam.questions.map((q, qi) => {
                    let insertAfterIndex = qi;
                    const subQuestions = [];
                    if (!q.sub) {
                        while (
                            insertAfterIndex + 1 < exam.questions.length &&
                            exam.questions[insertAfterIndex + 1]?.sub
                        ) {
                            insertAfterIndex++;
                            subQuestions.push(exam.questions[insertAfterIndex]);
                        }
                    }

                    return (
                        <QuestionRow
                            key={q.id ?? qi}
                            exam={exam}
                            q={q}
                            qi={qi}
                            subQuestions={subQuestions}
                            insertAfterIndex={insertAfterIndex}
                            labelInfo={labels[qi] || { display: String(qi + 1), aria: `שאלה ${qi + 1}` }}
                            isEntering={enteringIds.has(q.id)}
                            onDelete={handleDeleteQuestion}
                        />
                    );
                })}
            </tbody>
        </table>
    );
}

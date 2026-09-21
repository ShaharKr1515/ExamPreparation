import { useState, useEffect, useRef } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import {
    questionRowState,
    todayStr,
    formatTimer,
    deriveParentSuccess,
    computeSubQuestionsPointsSum,
    computeSubQuestionsTimerSum,
    distributePoints,
    distributeTimer,
    getEarliestDate,
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

/** Helper for fail count tooltip description in Hebrew */
function formatFailCountTooltip(count, isSub = false) {
    const item = isSub ? "סעיף זה" : "שאלה זו";
    if (count === 1) return `לא הצלחת את ${item} פעם אחת (נרשם ניסיון חוזר)`;
    if (count === 2) return `לא הצלחת את ${item} פעמיים (נרשמו 2 ניסיונות חוזרים)`;
    return `לא הצלחת את ${item} ${count} פעמים (נרשמו ${count} ניסיונות חוזרים)`;
}

/** Button shown near the question number when purple (stale attempt). */
function RetryQuestionButton({ onRetry, label = "שאלה" }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div
            className="retry-btn-wrap"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                type="button"
                className="retry-btn"
                aria-label={`איפוס תאריך וספירת ניסיון חוזר שלא צלח עבור ${label}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            >
                {/* Rotating arrow retry icon */}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>
            </button>

            <div
                className={`retry-tooltip ${isHovered || isFocused ? "is-visible" : ""}`}
                role="tooltip"
                aria-hidden={!isHovered && !isFocused}
            >
                <div className="retry-tooltip-title">
                    <span className="retry-tooltip-icon">🔄</span>
                    <strong>לא הצלחת שוב?</strong>
                </div>
                <div className="retry-tooltip-desc">
                    לחיצה כאן תעדכן את התאריך להיום כדי לאפס את הצבע הסגול, ותספור ניסיון נוסף שלא צלח.
                </div>
            </div>
        </div>
    );
}

/** Badge showing number of unsuccessful attempts with animated explanation tooltip on hover. */
function FailCountBadge({ count, isSub = false }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const tooltipText = formatFailCountTooltip(count, isSub);

    return (
        <div
            className={`q-fail-badge-wrap ${isSub ? "q-fail-badge-wrap-sub" : ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span
                className="q-fail-count-badge"
                tabIndex={0}
                role="status"
                aria-label={tooltipText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            >
                {count}
            </span>
            <div
                className={`q-fail-tooltip ${isHovered || isFocused ? "is-visible" : ""}`}
                role="tooltip"
                aria-hidden={!isHovered && !isFocused}
            >
                {tooltipText}
            </div>
        </div>
    );
}

/** One editable row (success select, date input, points input) for question qi. */
function QuestionRow({
    exam,
    q,
    qi,
    subQuestions = [],
    activeSubQuestions = subQuestions,
    insertAfterIndex,
    labelInfo,
    isEntering,
    isExiting,
    isLastSub = false,
    isLastInGroup = false,
    isDropped = false,
    onDelete,
}) {
    const { updateQuestion, retryQuestion } = useExams();

    const hadSubQuestions = !q.sub && subQuestions.length > 0;
    const hasSubQuestions = !q.sub && activeSubQuestions.length > 0;
    const isLastSubExiting = hadSubQuestions && !hasSubQuestions;
    const hasExitingSub = hadSubQuestions && subQuestions.length > activeSubQuestions.length;

    const baseSubQuestions = hasExitingSub ? subQuestions : activeSubQuestions;
    const derivedSuccess = hasSubQuestions ? deriveParentSuccess(activeSubQuestions) : "";
    const derivedPoints = hasSubQuestions ? computeSubQuestionsPointsSum(baseSubQuestions) : "";
    const derivedTimerSeconds = hasSubQuestions ? computeSubQuestionsTimerSum(baseSubQuestions) : 0;
    const derivedDate = hasSubQuestions ? getEarliestDate(activeSubQuestions) : "";
    const effectiveDate = hasSubQuestions ? (derivedDate || q.date) : q.date;
    const effectiveSuccess = hasSubQuestions ? derivedSuccess : q.success;

    const prevHadSubRef = useRef(hasSubQuestions);
    const [isRestoringInputs, setIsRestoringInputs] = useState(false);

    useEffect(() => {
        if (prevHadSubRef.current && !hasSubQuestions) {
            setIsRestoringInputs(true);
            const t = setTimeout(() => setIsRestoringInputs(false), 450);
            return () => clearTimeout(t);
        }
        prevHadSubRef.current = hasSubQuestions;
    }, [hasSubQuestions]);

    const shouldAnimateRestore = isLastSubExiting || isRestoringInputs;

    const restoredPoints = hadSubQuestions ? computeSubQuestionsPointsSum(subQuestions) : "";
    const restoredTimer = hadSubQuestions ? computeSubQuestionsTimerSum(subQuestions) : 0;
    const effectivePointsValue = (shouldAnimateRestore && (q.points === "" || q.points == null) && restoredPoints)
        ? restoredPoints
        : (q.points ?? "");
    const effectiveTimerValue = (shouldAnimateRestore && !q.timerSeconds && restoredTimer)
        ? restoredTimer
        : (q.timerSeconds || 0);

    const stateClass = questionRowState({
        success: effectiveSuccess,
        date: effectiveDate,
    }); // "ok" | "stale" | "bad" | "half" | null

    const [pointsPulse, setPointsPulse] = useState(false);
    const [timerPulse, setTimerPulse] = useState(false);
    const [statusPulse, setStatusPulse] = useState(false);

    const prevPointsRef = useRef(derivedPoints);
    const prevTimerRef = useRef(derivedTimerSeconds);
    const prevSuccessRef = useRef(effectiveSuccess);
    const isFirstRender = useRef(true);

    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    useEffect(() => {
        if (isFirstRender.current) return;
        if (hasSubQuestions && prevPointsRef.current !== derivedPoints) {
            prevPointsRef.current = derivedPoints;
            setPointsPulse(true);
            const t = setTimeout(() => setPointsPulse(false), 400);
            return () => clearTimeout(t);
        }
        prevPointsRef.current = derivedPoints;
    }, [derivedPoints, hasSubQuestions]);

    useEffect(() => {
        if (isFirstRender.current) return;
        if (hasSubQuestions && prevTimerRef.current !== derivedTimerSeconds) {
            prevTimerRef.current = derivedTimerSeconds;
            setTimerPulse(true);
            const t = setTimeout(() => setTimerPulse(false), 400);
            return () => clearTimeout(t);
        }
        prevTimerRef.current = derivedTimerSeconds;
    }, [derivedTimerSeconds, hasSubQuestions]);

    useEffect(() => {
        if (isFirstRender.current) return;
        if (hasSubQuestions && prevSuccessRef.current !== effectiveSuccess) {
            prevSuccessRef.current = effectiveSuccess;
            setStatusPulse(true);
            const t = setTimeout(() => setStatusPulse(false), 400);
            return () => clearTimeout(t);
        }
        prevSuccessRef.current = effectiveSuccess;
    }, [effectiveSuccess, hasSubQuestions]);

    const isPurple = stateClass === "stale";
    const failCount = hasSubQuestions
        ? (subQuestions.reduce((acc, sq) => acc + (sq.failCount || 0), 0) || q.failCount || 0)
        : (q.failCount || 0);

    const rowClass = [
        stateClass ? `row-${stateClass}` : "",
        q.sub ? "row-sub" : "row-main",
        !q.sub ? "q-group-start" : "",
        isLastInGroup ? "q-group-end" : "",
        q.sub && isLastSub ? "row-sub-last" : "",
        isEntering ? (q.sub ? "row-sub-enter" : "row-main-enter") : "",
        isExiting ? (q.sub ? "row-sub-exit" : "row-main-exit") : "",
        shouldAnimateRestore ? "row-restoring" : "",
        isDropped ? "row-choice-dropped" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <tr className={rowClass}>
            <td className={`q-num ${q.sub ? "q-num-sub" : ""} ${q.sub && isLastSub ? "q-num-sub-last" : ""}`}>
                <div className="q-cell-inner">
                    {q.sub ? (
                        <div className="sub-q-num-wrap">
                            <div className="sub-q-indicator-wrap">
                                <span className="sub-q-indicator" title={labelInfo.aria}>
                                    <span className="sub-q-letter">{labelInfo.subLabel}</span>
                                    {failCount > 0 && (
                                        <FailCountBadge
                                            count={failCount}
                                            isSub={true}
                                        />
                                    )}
                                </span>
                                {isPurple && (
                                    <RetryQuestionButton
                                        onRetry={() => retryQuestion(exam.id, qi)}
                                        label={labelInfo.aria}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="q-num-wrap">
                            <span
                                className={`q-num-val ${isDropped ? "q-num-dropped" : ""}`}
                                title={isDropped ? "שאלה זו לא נכללת בשקלול הציון (בחירה: חושבו השאלות עם הניקוד הגבוה ביותר)" : undefined}
                            >
                                {labelInfo.display}
                                {failCount > 0 && (
                                    <FailCountBadge
                                        count={failCount}
                                        isSub={false}
                                    />
                                )}
                            </span>
                            {isPurple && (
                                <RetryQuestionButton
                                    onRetry={() => retryQuestion(exam.id, qi)}
                                    label={labelInfo.aria}
                                />
                            )}
                        </div>
                    )}
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    {hasSubQuestions ? (
                        <div
                            className={`status-sum-badge ${effectiveSuccess === "yes"
                                    ? "ok"
                                    : effectiveSuccess === "no"
                                        ? "bad"
                                        : effectiveSuccess === "half"
                                            ? "half"
                                            : ""
                                } ${statusPulse ? "sum-value-updated" : ""}`}
                            title={`סטטוס מחושב לפי הסעיפים: ${SUCCESS_LABELS[effectiveSuccess] || "—"}`}
                            aria-label={`סטטוס מחושב לפי הסעיפים: ${SUCCESS_LABELS[effectiveSuccess] || "—"}`}
                        >
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
                                            : "") +
                                (shouldAnimateRestore ? " cell-restore-enter" : "")
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
                        value={hasSubQuestions ? (effectiveDate || "") : (q.date || "")}
                        aria-label={`תאריך אחרון ל${labelInfo.aria}`}
                        onChange={(e) => updateQuestion(exam.id, qi, "date", e.target.value)}
                    />
                </div>
            </td>

            <td>
                <div className="q-cell-inner">
                    {hasSubQuestions ? (
                        <div
                            className={`timer-sum-badge ${derivedTimerSeconds > 0 ? "has-time" : ""} ${timerPulse ? "sum-value-updated" : ""}`}
                            title={`סכום זמני הסעיפים: ${formatTimer(derivedTimerSeconds)}`}
                            aria-label={`סכום זמני הסעיפים: ${formatTimer(derivedTimerSeconds)}`}
                        >
                            <span className="timer-sum-digits">{formatTimer(derivedTimerSeconds)}</span>
                            <span className="timer-sum-label">סה״כ</span>
                        </div>
                    ) : (
                        <QuestionTimer
                            className={shouldAnimateRestore ? "cell-restore-enter" : ""}
                            initialSeconds={effectiveTimerValue}
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
                                className={`cell points points-sum-badge ${pointsPulse ? "sum-value-updated" : ""}`}
                                title={`סכום נקודות הסעיפים: ${derivedPoints}`}
                                aria-label={`סכום נקודות הסעיפים: ${derivedPoints}`}
                            >
                                <span className="points-sum-label">סה״כ</span>
                                <span className="points-sum-value">{derivedPoints}</span>
                                <span className="points-sum-unit">נק'</span>
                            </div>
                        ) : (
                            <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                className={`cell points ${shouldAnimateRestore ? "cell-restore-enter" : ""}`}
                                placeholder="נק'"
                                value={effectivePointsValue}
                                title={isDropped ? "שאלה זו לא נכללת בשקלול הציון (בחירה: חושבו השאלות עם הניקוד הגבוה ביותר)" : undefined}
                                aria-label={`נקודות ל${labelInfo.aria}`}
                                onChange={(e) => updateQuestion(exam.id, qi, "points", e.target.value)}
                            />
                        )}
                        {isDropped && !q.sub && (
                            <span
                                className="dropped-status-tag"
                                title="שאלה זו לא נכללת בשקלול הציון (בחירה: חושבו השאלות עם הניקוד הגבוה ביותר)"
                                aria-label="שאלה זו לא נכללת בציון"
                            >
                                לא שוקלל
                            </span>
                        )}
                        {q.sub ? (
                            <DeleteSubButton
                                label={labelInfo.aria}
                                onDelete={() => onDelete(q.id, qi)}
                                isExiting={isExiting}
                            />
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
export default function QuestionTable({ exam, questionStatusMap = {}, isChoiceActive = false }) {
    const { deleteQuestion, addMainQuestion, removeLastMainQuestion } = useExams();
    const labels = getQuestionLabels(exam.questions);

    const mainQuestions = exam.questions.filter((q) => !q.sub);
    const canRemove = mainQuestions.length > 1;
    const [isModifyingCount, setIsModifyingCount] = useState(false);

    const [prevExamId, setPrevExamId] = useState(exam.id);
    const [prevQuestions, setPrevQuestions] = useState(exam.questions);
    const [enteringIds, setEnteringIds] = useState(() => new Set());
    const [exitingIds, setExitingIds] = useState(() => new Set());

    // Synchronous state adjustment during render (React standard pattern):
    // Ensures newly added question rows render with `isEntering = true` on frame 0,
    // guaranteeing the expansion animation begins smoothly without any 1-frame pop-in.
    if (prevExamId !== exam.id) {
        setPrevExamId(exam.id);
        setPrevQuestions(exam.questions);
        setEnteringIds(new Set());
        setExitingIds(new Set());
    } else if (prevQuestions !== exam.questions) {
        const prevIds = new Set(prevQuestions.map((q) => q.id));
        const newIds = exam.questions
            .filter((q) => q.id && !prevIds.has(q.id))
            .map((q) => q.id);

        setPrevQuestions(exam.questions);
        if (newIds.length > 0) {
            setEnteringIds((prev) => new Set([...prev, ...newIds]));
        }
    }

    // Clean up enteringIds after animation finishes
    useEffect(() => {
        if (enteringIds.size === 0) return;
        const timer = setTimeout(() => {
            setEnteringIds(new Set());
        }, 320);
        return () => clearTimeout(timer);
    }, [enteringIds]);

    const handleDeleteQuestion = async (qId, qi) => {
        if (exitingIds.has(qId)) return;
        setExitingIds((prev) => new Set([...prev, qId]));

        // Wait for exit animation
        await new Promise((resolve) => setTimeout(resolve, 280));

        try {
            // Find the position in the CURRENT exam state right before calling the API
            // This ensures we use the latest position after any previous deletes have completed
            await deleteQuestion(exam.id, qId);
        } finally {
            setExitingIds((prev) => {
                const next = new Set(prev);
                next.delete(qId);
                return next;
            });
        }
    };

    const handleAddQuestion = async () => {
        if (isModifyingCount) return;
        setIsModifyingCount(true);
        try {
            await addMainQuestion(exam.id);
        } catch (err) {
            console.error("Failed to add question:", err);
            alert("שגיאה בהוספת שאלה. אם השרת פועל בטרמינל נפרד, יש להפעיל אותו מחדש כדי שיטען את הנתיבים החדשים.\n\n" + (err?.message || ""));
        } finally {
            setIsModifyingCount(false);
        }
    };

    const handleRemoveLastQuestion = async () => {
        if (isModifyingCount || !canRemove) return;

        const lastMain = mainQuestions[mainQuestions.length - 1];
        if (!lastMain) return;

        const lastMainIndex = exam.questions.findIndex((q) => q.id === lastMain.id);
        if (lastMainIndex === -1) return;
        const affectedQuestions = exam.questions.slice(lastMainIndex);

        const hasSubQuestions = affectedQuestions.length > 1;
        const hasData = affectedQuestions.some((q) => {
            const hasSuccess = q.success !== "" && q.success != null;
            const hasDate = q.date !== "" && q.date != null;
            const hasPoints = q.points !== "" && q.points != null;
            const hasTimer = Number(q.timerSeconds) > 0;
            return hasSuccess || hasDate || hasPoints || hasTimer;
        });

        if (hasSubQuestions || hasData) {
            const questionNumber = mainQuestions.length;
            const confirmMsg = `למחוק את שאלה ${questionNumber}? כל הנתונים והסעיפים שלה יימחקו.`;
            if (!window.confirm(confirmMsg)) {
                return;
            }
        }

        setIsModifyingCount(true);
        const affectedIds = affectedQuestions.map((q) => q.id);

        setExitingIds((prev) => new Set([...prev, ...affectedIds]));
        await new Promise((resolve) => setTimeout(resolve, 260));

        try {
            await removeLastMainQuestion(exam.id);
        } catch (err) {
            console.error("Failed to remove question:", err);
            alert("שגיאה בהסרת שאלה. אם השרת פועל בטרמינל נפרד, יש להפעיל אותו מחדש כדי שיטען את הנתיבים החדשים.\n\n" + (err?.message || ""));
        } finally {
            setExitingIds((prev) => {
                const next = new Set(prev);
                affectedIds.forEach((id) => next.delete(id));
                return next;
            });
            setIsModifyingCount(false);
        }
    };

    // Group questions by parent main question so each question (and all its subquestions)
    // is rendered inside its own square with rounded edges.
    const questionGroups = [];
    let currentGroup = null;

    exam.questions.forEach((q, qi) => {
        if (!q.sub || !currentGroup) {
            currentGroup = {
                mainQ: q,
                mainQi: qi,
                subQuestions: [],
                insertAfterIndex: qi,
            };
            questionGroups.push(currentGroup);
        } else {
            currentGroup.subQuestions.push({ q, qi });
            currentGroup.insertAfterIndex = qi;
        }
    });

    return (
        <div className="q-table-wrap">
            <div className="q-table-header-wrap">
                <table className="q-table q-table-header">
                    <thead>
                        <tr>
                            {QUESTION_HEADERS.map((label) => (
                                <th key={label}>{label}</th>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>

            <div className="q-group-list">
                {questionGroups.map((group) => {
                    const subQuestions = group.subQuestions.map((item) => item.q);
                    const activeSubQuestions = subQuestions.filter((sq) => !exitingIds.has(sq.id));
                    const hasSubQuestions = activeSubQuestions.length > 0;
                    const hasExitingSub = subQuestions.some((sq) => exitingIds.has(sq.id));

                    const totalGroupPoints = computeSubQuestionsPointsSum(subQuestions) !== "0"
                        ? computeSubQuestionsPointsSum(subQuestions)
                        : (group.mainQ.points || "");
                    const totalGroupTimer = computeSubQuestionsTimerSum(subQuestions) > 0
                        ? computeSubQuestionsTimerSum(subQuestions)
                        : (group.mainQ.timerSeconds || 0);

                    const optPointsDist = (hasExitingSub && activeSubQuestions.length > 0 && totalGroupPoints)
                        ? distributePoints(totalGroupPoints, activeSubQuestions.length)
                        : null;
                    const optTimerDist = (hasExitingSub && activeSubQuestions.length > 0 && totalGroupTimer > 0)
                        ? distributeTimer(totalGroupTimer, activeSubQuestions.length)
                        : null;

                    const effectiveSuccess = hasSubQuestions ? deriveParentSuccess(activeSubQuestions) : group.mainQ.success;
                    const effectiveDate = hasSubQuestions
                        ? (getEarliestDate(activeSubQuestions) || group.mainQ.date)
                        : group.mainQ.date;
                    const groupStateClass = questionRowState({
                        success: effectiveSuccess,
                        date: effectiveDate,
                    });
                    const isDropped = isChoiceActive && Boolean(questionStatusMap?.[group.mainQ.id]?.isDropped);
                    const isEntering = enteringIds.has(group.mainQ.id);
                    const isExiting = exitingIds.has(group.mainQ.id);

                    const groupBoxClass = [
                        "q-group-box",
                        groupStateClass ? `group-${groupStateClass}` : "",
                        isDropped ? "group-dropped" : "",
                        isEntering ? "q-group-enter" : "",
                        isExiting ? "q-group-exit" : "",
                    ]
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <div key={group.mainQ.id ?? group.mainQi} className={groupBoxClass}>
                            <table className="q-table">
                                <tbody>
                                    <QuestionRow
                                        key={group.mainQ.id ?? group.mainQi}
                                        exam={exam}
                                        q={group.mainQ}
                                        qi={group.mainQi}
                                        subQuestions={subQuestions}
                                        activeSubQuestions={activeSubQuestions}
                                        insertAfterIndex={group.insertAfterIndex}
                                        labelInfo={labels[group.mainQi] || { display: String(group.mainQi + 1), aria: `שאלה ${group.mainQi + 1}` }}
                                        isEntering={false}
                                        isExiting={isExiting}
                                        isLastSub={false}
                                        isLastInGroup={group.subQuestions.length === 0}
                                        isDropped={isDropped}
                                        onDelete={handleDeleteQuestion}
                                    />
                                    {group.subQuestions.map(({ q: subQ, qi: subQi }, subIdx) => {
                                        const isLastSub = subIdx === group.subQuestions.length - 1;
                                        const isSubExiting = exitingIds.has(subQ.id);
                                        let effectiveSubQ = subQ;
                                        if (hasExitingSub && !isSubExiting) {
                                            const activeIdx = activeSubQuestions.findIndex((sq) => sq.id === subQ.id);
                                            if (activeIdx !== -1) {
                                                effectiveSubQ = {
                                                    ...subQ,
                                                    points: optPointsDist ? optPointsDist[activeIdx] : subQ.points,
                                                    timerSeconds: optTimerDist ? optTimerDist[activeIdx] : subQ.timerSeconds,
                                                };
                                            }
                                        }

                                        return (
                                            <QuestionRow
                                                key={subQ.id ?? subQi}
                                                exam={exam}
                                                q={effectiveSubQ}
                                                qi={subQi}
                                                subQuestions={[]}
                                                activeSubQuestions={[]}
                                                insertAfterIndex={group.insertAfterIndex}
                                                labelInfo={labels[subQi] || { display: String(subQi + 1), aria: `סעיף` }}
                                                isEntering={enteringIds.has(subQ.id)}
                                                isExiting={isSubExiting}
                                                isLastSub={isLastSub}
                                                isLastInGroup={isLastSub}
                                                isDropped={false}
                                                onDelete={handleDeleteQuestion}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            <div className="card-question-actions">
                <button
                    type="button"
                    className="question-count-btn add-question-btn"
                    onClick={handleAddQuestion}
                    disabled={isModifyingCount}
                    title="הוספת שאלה לסוף הבחינה"
                    aria-label="הוספת שאלה"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>הוסף שאלה</span>
                </button>
                <button
                    type="button"
                    className="question-count-btn remove-question-btn"
                    onClick={handleRemoveLastQuestion}
                    disabled={!canRemove || isModifyingCount}
                    title={!canRemove ? "לא ניתן להסיר (מינימום שאלה אחת)" : "הסרת השאלה האחרונה"}
                    aria-label={!canRemove ? "לא ניתן להסיר (מינימום שאלה אחת)" : "הסרת שאלה אחרונה"}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M5 12h14" />
                    </svg>
                    <span>הסר שאלה</span>
                </button>
            </div>
        </div>
    );
}

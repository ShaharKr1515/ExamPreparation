import { useMemo } from "react";
import { calculateExamScore, calculateExamReviewCounts, formatTimer } from "../utils/examUtils.js";
import Icon from "./Icon.jsx";
import Tooltip from "./Tooltip.jsx";
import QuestionProgress, { QUESTION_OUTCOMES } from "./QuestionProgress.jsx";

/**
 * Summary row displayed at the top of an exam card (under the header).
 * Displays:
 *  - Overall calculated exam score (with choice calculation if total points > 100)
 *  - Choice mode badge (if total points > 100)
 *  - Answered questions progress
 *  - Total study timer
 */
export default function ExamSummaryRow({ exam, summary: propSummary }) {
    const calculated = useMemo(() => calculateExamScore(exam), [exam]);
    const summary = propSummary || calculated;
    const reviewCounts = calculateExamReviewCounts(exam);
    const reviewTotal = Object.values(reviewCounts).reduce((total, count) => total + count, 0);

    const {
        score,
        maxScore,
        displayScore,
        hasAnsweredAny,
        isChoiceActive,
        totalExamPoints,
        answeredCount,
        totalMainQuestions,
        chosenCount,
        droppedLabels = [],
        totalTimerSeconds,
        counts,
    } = summary;

    // Determine color tone for the score badge
    let scoreTone = "neutral";
    if (hasAnsweredAny) {
        if (score >= 85) scoreTone = "high";
        else if (score >= 60) scoreTone = "medium";
        else scoreTone = "low";
    }

    const breakdownTooltip = hasAnsweredAny
        ? `${counts.yes} בהצלחה · ${counts.half} חלקית · ${counts.no} כישלון`
        : "טרם נענו שאלות";

    const choiceTooltip = isChoiceActive
        ? `חושבו ${chosenCount || (totalMainQuestions - 1)} השאלות הטובות ביותר מתוך ${totalMainQuestions}${droppedLabels.length > 0 ? ` (${droppedLabels.join(", ")} לא שוקללה)` : ""}.`
        : "";

    return (
        <div className="exam-summary-row" role="region" aria-label="סיכום בחינה">
            {/* Start (Right in RTL): Overall Score */}
            <div className="summary-section summary-score-section">
                <span className="summary-label">ציון</span>
                <div
                    className={`summary-score-badge tone-${scoreTone}`}
                    title={
                        hasAnsweredAny
                            ? `ציון משוקלל: ${score} מתוך ${maxScore}${isChoiceActive ? ` (מתוך סך של ${totalExamPoints} נק' בבחינה)` : ""}`
                            : "טרם נענו שאלות בבחינה זו"
                    }
                >
                    <span className="score-val">{displayScore}</span>
                    <span className="score-max">/{maxScore}</span>
                </div>

                {isChoiceActive && (
                    <div
                        className="choice-pill"
                        title={choiceTooltip}
                        aria-label={choiceTooltip}
                    >
                        <svg
                            className="choice-icon"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <span>בחירה ({chosenCount} מתוך {totalMainQuestions})</span>
                    </div>
                )}
            </div>

            {/* End (Left in RTL): Progress and Total Time */}
            <div className="summary-section summary-meta-section">
                {/* Answered questions count */}
                <div
                    className="summary-stat-item"
                    title={breakdownTooltip}
                    aria-label={`שאלות שנענו: ${answeredCount} מתוך ${totalMainQuestions}. ${breakdownTooltip}`}
                >
                    <span className="stat-label">מענה:</span>
                    <span className="stat-value">
                        {answeredCount}/{totalMainQuestions}
                    </span>
                </div>

                {/* Total time spent across questions */}
                <div
                    className={`summary-stat-item ${totalTimerSeconds > 0 ? "has-time" : ""}`}
                    title={`זמן כולל שהושקע בבחינה: ${formatTimer(totalTimerSeconds)}`}
                    aria-label={`זמן כולל: ${formatTimer(totalTimerSeconds)}`}
                >
                    <span className="stat-label">זמן תרגול</span>
                    <span className="summary-time-value">
                        <svg
                            className="stat-timer-icon"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="stat-value stat-timer">{formatTimer(totalTimerSeconds)}</span>
                    </span>
                </div>
            </div>
            {totalMainQuestions > 0 && (
                <div className="summary-progress">
                    <QuestionProgress counts={counts} reviewCounts={reviewCounts} />
                    <div className="summary-outcomes">
                        {QUESTION_OUTCOMES.filter(({ key }) => counts[key] > 0).map(({ key, tone, label }) => (
                            <span key={key} className={`summary-outcome outcome-${tone}`}>{counts[key]} {label}</span>
                        ))}
                        {reviewTotal > 0 && <Tooltip className="summary-review-count"
                            text="הפס הסגול מציין שאלות שלא צלחו ומוכנות לחזרה">
                            <Icon name="repeat" size={12} />{reviewTotal} לחזרה
                        </Tooltip>}
                    </div>
                </div>
            )}
        </div>
    );
}

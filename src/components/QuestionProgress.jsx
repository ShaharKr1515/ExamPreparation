import Tooltip from "./Tooltip.jsx";

export const QUESTION_OUTCOMES = [
    { key: "yes", tone: "ok", label: "בהצלחה" },
    { key: "half", tone: "half", label: "חלקית" },
    { key: "no", tone: "bad", label: "כישלון" },
    { key: "unattempted", tone: "unattempted", label: "טרם נענו" },
];

const outcomeText = (key, count) => {
    const subject = count === 1 ? "שאלה אחת" : `${count} שאלות`;
    const solved = count === 1 ? "נפתרה" : "נפתרו";
    if (key === "yes") return `${subject} ${solved} בהצלחה`;
    if (key === "half") return `${subject} ${solved} חלקית`;
    if (key === "no") return `${subject} לא ${solved} בהצלחה`;
    return `${subject} טרם ${count === 1 ? "נענתה" : "נענו"}`;
};

/** Shared outcome segments and purple review overlay for exam and subject totals. */
export default function QuestionProgress({ counts, reviewCounts = {}, className = "" }) {
    const segments = QUESTION_OUTCOMES.filter(({ key }) => counts[key] > 0);
    const text = ({ key }) => {
        const outcome = outcomeText(key, counts[key]);
        const review = reviewCounts[key] || 0;
        if (!review) return outcome;
        const ready = counts[key] === 1 ? "מוכנה" : review === counts[key] ? "כולן מוכנות"
            : review === 1 ? "אחת מהן מוכנה" : `${review} מהן מוכנות`;
        return `${outcome}, ${ready} לחזרה`;
    };

    return <div className={`exam-progress-track ${className}`.trim()} role="group"
        aria-label={segments.map(text).join(" · ")}>
        {segments.map((segment) => <Tooltip key={segment.key}
            className={`exam-progress-segment segment-${segment.tone}`}
            style={{ flex: counts[segment.key] }} text={text(segment)}>
            {reviewCounts[segment.key] > 0 && <span className={`exam-progress-review${reviewCounts[segment.key] === counts[segment.key] ? " is-full" : ""}`}
                style={{ width: `${reviewCounts[segment.key] / counts[segment.key] * 100}%` }} />}
        </Tooltip>)}
    </div>;
}

import { useExams } from "../context/ExamsContext.jsx";
import { useVisibleExams } from "../hooks/useVisibleExams.js";
import { calculateStudySummary, dueLabel, formatDisplayDate } from "../utils/examUtils.js";

export default function StudySummary() {
    const { state } = useExams();
    const exams = useVisibleExams();
    const meta = state.subjectMeta[state.activeSubject] || {};
    const summary = calculateStudySummary(exams, meta);
    const next = summary.nextExam;
    const guidance = {
        "missing-dates": "הגדר תאריך התחלת לימודים ותאריך בחינה סופית כדי לחשב יעדי תרגול.",
        "invalid-dates": "תאריך הבחינה הסופית צריך להיות אחרי תאריך התחלת הלימודים.",
        "no-exams": "הוסף בחינה כדי להתחיל לתכנן את התרגול.",
        complete: "כל שאלות התרגול הושלמו בהצלחה.",
    };
    return (
        <section className="study-summary" aria-label="סיכום התקדמות ותכנון">
            <div className="study-summary-part">
                <h2>יעדי תרגול</h2>
                {summary.scheduleState === "ready" && next ? (
                    <>
                        <p className="study-summary-main">
                            <a href={`#exam-${next.id}`}>{next.name || `בחינה ${next.number}`}</a>
                            <span><time dateTime={next.dueDate}>{formatDisplayDate(next.dueDate)}</time> · {dueLabel(next.dueDate)}</span>
                        </p>
                        <p className={summary.overdueExams ? "study-summary-warning" : "study-summary-detail"}>
                            {summary.overdueExams === 1 ? "בחינה אחת שטרם הושלמה עברה את היעד המומלץ"
                                : summary.overdueExams ? `${summary.overdueExams} בחינות שטרם הושלמו עברו את היעד המומלץ` : "אין בחינות שלא הושלמו באיחור"}
                        </p>
                    </>
                ) : <p className="study-summary-detail">{guidance[summary.scheduleState]}</p>}
                {meta.finalExamDate && <p className="study-summary-detail">בחינה סופית: <time dateTime={meta.finalExamDate}>{formatDisplayDate(meta.finalExamDate)}</time></p>}
            </div>
            <div className="study-summary-part">
                <h2>שליטה בחומר</h2>
                <p className="study-summary-main">{summary.gaps === 1 ? "שאלה אחת עדיין דורשת עבודה" : summary.gaps ? `${summary.gaps} שאלות עדיין דורשות עבודה` : summary.totalQuestions ? "כל השאלות נפתרו בהצלחה" : "אין עדיין שאלות לתרגול"}</p>
                <p className="study-summary-detail">
                    {summary.counts.no + summary.counts.half} לתרגול נוסף · {summary.counts.unattempted} טרם נענו · {summary.counts.yes} בהצלחה
                </p>
                <p className="study-summary-detail">{summary.reviewQuestions === 1 ? "שאלה אחת דורשת חזרה" : `${summary.reviewQuestions} שאלות דורשות חזרה`}: ניסיון ללא הצלחה מלאה מלפני 3 ימים לפחות</p>
            </div>
        </section>
    );
}

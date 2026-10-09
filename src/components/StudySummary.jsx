import { useExams } from "../context/ExamsContext.jsx";
import { useVisibleExams } from "../hooks/useVisibleExams.js";
import { calculateStudySummary, calculateExamScore, daysUntil, formatDisplayDate } from "../utils/examUtils.js";
import Icon from "./Icon.jsx";

const examName = (exam) => exam.name || `בחינה ${exam.number}`;
const questionCount = (count) => count === 1 ? "שאלה אחת" : `${count} שאלות`;

function ReviewLink({ exam, waiting = false }) {
    return (
        <a className={`practice-link review-link${waiting ? " is-waiting" : ""}`} href={`#exam-${exam.id}`}
            aria-label={`${examName(exam)}: ${questionCount(exam.questionCount)} ${waiting ? "לחזרה בהמשך" : "סגולות לחזרה"}, שאלות ${exam.questionNumbers.join(", ")}`}>
            <Icon name={waiting ? "clock" : "repeat"} size={18} />
            <span className="practice-link-copy">
                <strong>{examName(exam)}</strong>
                <small>{exam.questionNumbers.length === 1 ? "שאלה" : "שאלות"} {exam.questionNumbers.join(", ")}</small>
            </span>
            <span className="practice-link-count">{questionCount(exam.questionCount)}</span>
        </a>
    );
}

export default function StudySummary() {
    const { state } = useExams();
    const exams = useVisibleExams();
    const meta = state.subjectMeta[state.activeSubject] || {};
    const summary = calculateStudySummary(exams, meta);
    const completionByExam = new Map(exams.map((exam) => {
        const { answeredCount, totalMainQuestions } = calculateExamScore(exam);
        return [exam.id, totalMainQuestions ? Math.round(answeredCount / totalMainQuestions * 100) : 0];
    }));
    const upcoming = summary.upcomingReviewExams.filter((exam) => exam.dueDate === summary.nextReviewDate);
    const remainingDays = daysUntil(summary.nextReviewDate);
    const readyCount = summary.readyInitialExams.length;
    const guidance = {
        "missing-dates": "הגדר תאריכי לימודים ובחינה לתכנון התרגול.",
        "invalid-dates": "תאריך הבחינה צריך להיות אחרי תחילת הלימודים.",
        "no-exams": "הוסף בחינה כדי להתחיל.",
        complete: "כל הבחינות הושלמו.",
    };

    return (
        <section className="practice-plan" aria-label="סיכום התקדמות ותכנון">
            <div className="practice-plan-actions">
                <div className="practice-lane initial-lane">
                    <div className="practice-lane-heading">
                        <span className="practice-lane-icon"><Icon name="book" size={20} /></span>
                        <h2>בחינות לתרגול</h2>
                        <span className="practice-lane-status">{readyCount ? `${readyCount} להיום` : "אין להיום"}</span>
                    </div>
                    {readyCount ? <div className="practice-links">
                        {summary.readyInitialExams.map((exam, index) => (
                            <a key={exam.id} href={`#exam-${exam.id}`} className={`practice-link initial-link${index === 0 ? " is-primary" : ""}`}
                                aria-label={`${examName(exam)}: ${completionByExam.get(exam.id)}% מהשאלות נענו`}>
                                <Icon name="play" size={18} />
                                <span className="practice-link-copy">
                                    <strong>{examName(exam)}</strong>
                                </span>
                                <span className="practice-link-count"><bdi>{completionByExam.get(exam.id)}%</bdi></span>
                            </a>
                        ))}
                    </div> : <div className="practice-empty">
                        <Icon name={summary.scheduleState === "complete" ? "check" : "calendar"} size={18} />
                        {guidance[summary.scheduleState] || (summary.nextPracticeType === "initial"
                            ? <>הבחינה הבאה ב־<time dateTime={summary.nextExam.dueDate}>{formatDisplayDate(summary.nextExam.dueDate)}</time></>
                            : "אין בחינות חדשות להיום")}
                    </div>}
                </div>

                <div className="practice-lane review-lane">
                    <div className="practice-lane-heading">
                        <span className="practice-lane-icon"><Icon name="repeat" size={20} /></span>
                        <h2>חזרה על שאלות שלא צלחו</h2>
                        <span className="practice-lane-status">{summary.reviewQuestions === 1 ? "1 מוכנה" : `${summary.reviewQuestions} מוכנות`}</span>
                    </div>
                    {summary.readyReviewExams.length ? <>
                        <div className="practice-links">
                            {summary.readyReviewExams.map((exam) => <ReviewLink key={exam.id} exam={exam} />)}
                        </div>
                        <p className="practice-lane-note">רק השאלות והסעיפים הסגולים</p>
                    </> : upcoming.length ? <>
                        <div className="practice-wait-label"><Icon name="clock" size={14} />
                            <span>{remainingDays === 1 ? "נפתחות מחר" : "נפתחות ב־"} <time dateTime={summary.nextReviewDate}>{formatDisplayDate(summary.nextReviewDate).slice(0, 5)}</time></span>
                        </div>
                        <div className="practice-links">
                            {upcoming.map((exam) => <ReviewLink key={exam.id} exam={exam} waiting />)}
                        </div>
                    </> : <div className="practice-empty"><Icon name="check" size={18} />אין שאלות שממתינות לחזרה</div>}
                </div>
            </div>
        </section>
    );
}

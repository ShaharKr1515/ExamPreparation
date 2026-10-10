import { useEffect, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import { useVisibleExams } from "../hooks/useVisibleExams.js";
import { calculateStudySummary, examIntervalDays, formatExamIntervalLabel, formatDisplayDate, todayStr } from "../utils/examUtils.js";
import { calculateStudyTimeline } from "../utils/studyTimeline.js";
import ExamCountControl from "./ExamCountControl.jsx";
import QuestionProgress, { QUESTION_OUTCOMES } from "./QuestionProgress.jsx";
import Icon from "./Icon.jsx";
import StudySummary from "./StudySummary.jsx";

function PlanDate({ label, value, onChange }) {
    return <label className="date-control plan-date">
        <input type="date" aria-label={label} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>;
}

export default function LearningPlan() {
    const { state, updateSubjectDates } = useExams();
    const exams = useVisibleExams();
    const active = state.activeSubject;
    const meta = state.subjectMeta[active] || {};
    const [today, setToday] = useState(todayStr);
    useEffect(() => {
        const refresh = () => setToday(todayStr());
        const interval = window.setInterval(refresh, 60000);
        window.addEventListener("focus", refresh);
        return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
    }, []);
    const timeline = calculateStudyTimeline(exams, meta, today);
    const summary = calculateStudySummary(exams, meta, today);
    const intervalLabel = formatExamIntervalLabel(examIntervalDays(meta.studyStartDate, meta.finalExamDate, exams.length));
    const completed = timeline.exams.filter((exam) => exam.status === "answered" || exam.status === "mastered").length;
    const updateDates = (field, value) => updateSubjectDates(active, {
        studyStartDate: meta.studyStartDate || "", finalExamDate: meta.finalExamDate || "", [field]: value,
    });

    return <><div className="learning-plan">
        <div className="plan-toolbar">
            <h2 id="planning-title"><Icon name="calendar" size={18} />תוכנית הלמידה</h2>
            <div className="plan-controls">
                <div className="plan-date-range" role="group" aria-label="תקופת הלמידה">
                    <PlanDate label="תאריך התחלת לימודים" value={meta.studyStartDate} onChange={(value) => updateDates("studyStartDate", value)} />
                    <Icon name="arrow" size={18} className="plan-date-arrow" />
                    <PlanDate label="תאריך בחינה סופית" value={meta.finalExamDate} onChange={(value) => updateDates("finalExamDate", value)} />
                </div>
                <ExamCountControl subject={active} currentCount={exams.length} />
            </div>
            {intervalLabel && <div className="plan-cadence"><Icon name="clock" size={18} /><span>{intervalLabel}</span></div>}
        </div>
        <div className="plan-journey">
            <div className="plan-timeline-scroll" role="region" aria-label="ציר זמן של בחינות התרגול" tabIndex={0}>
                {timeline.state === "ready" ? <div className="plan-timeline" style={{ minWidth: `${Math.max(320, exams.length * 120)}px` }}>
                    <ol className="plan-milestones" aria-label="בחינות לפי סדר התרגול">
                        {timeline.exams.map((exam) => <li key={exam.id} className={`plan-milestone is-${exam.status}`}>
                            {exam.id === timeline.paceExamId && <span className="plan-pace-marker"
                                aria-label={exam.paceAction === "review" ? `${exam.name}: יש לחזור על השאלות והסעיפים הסגולים כדי לשמור על הקצב`
                                    : exam.paceAction === "complete" ? `${exam.name}: היעד הושלם`
                                    : `${exam.name}: יעד להשלמה עד ${formatDisplayDate(exam.dueDate)} כדי לשמור על הקצב`}>
                                <strong>{exam.paceAction === "review" ? "חזרה על טעויות" : exam.paceAction === "complete" ? "היעד הושלם" : "להשלמה"}</strong>
                                <span>לשמירה על הקצב</span>
                            </span>}
                            <QuestionProgress counts={exam.counts} reviewCounts={exam.reviewCounts} className="plan-exam-progress" />
                            <a className="plan-exam-link" href={`#exam-${exam.id}`}
                                aria-label={`${exam.name}, יעד ${formatDisplayDate(exam.dueDate)}, ${exam.completion}% מהשאלות נענו`}>
                                <strong className="plan-exam-name" title={exam.name}>{exam.name}</strong>
                                <time className="plan-exam-date" dateTime={exam.dueDate}>{formatDisplayDate(exam.dueDate).slice(0, 5)}</time>
                            </a>
                            <span className="plan-exam-state">{exam.status === "mastered" ? "הושלמה בהצלחה" : exam.status === "answered" ? "המענה הושלם"
                                : exam.status === "unstarted" ? "טרם התחילה" : <><bdi>{exam.completion}%</bdi> נענו</>}</span>
                        </li>)}
                    </ol>
                    {!exams.length && <><div className="plan-empty-bar" aria-hidden="true" /><p className="plan-no-exams">הוסף בחינות כדי לבנות את ציר התרגול</p></>}
                </div> : <div className="plan-timeline-empty"><Icon name="calendar" size={22} /><p>{timeline.state === "missing-dates"
                    ? "בחר תאריך התחלה ותאריך בחינה להצגת ציר התרגול"
                    : "תאריך הבחינה צריך להיות אחרי תחילת הלימודים"}</p></div>}
            </div>
        </div>
    </div>
    <StudySummary />
    <div className="plan-footer">
            {timeline.state === "ready" && exams.length > 0 && <span className="plan-completion"><Icon name="check" size={14} /><bdi>{completed} / {exams.length}</bdi> בחינות עם מענה מלא</span>}
            <div className="plan-legend" role="group" aria-label="סיכום שאלות ומקרא התקדמות">
                {QUESTION_OUTCOMES.map(({ key, tone, label }) => <span className={`plan-legend-item outcome-${tone}`} key={key}><Icon name={key === "yes" ? "check" : key === "unattempted" ? "book" : "repeat"} size={14} /><strong>{summary.counts[key]}</strong>{label}</span>)}
                <span className="plan-legend-item outcome-review"><Icon name="repeat" size={14} /><strong>{summary.reviewQuestions}</strong>מוכנות לחזרה</span>
            </div>
        </div>
    </>;
}

import { useEffect, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import { useVisibleExams } from "../hooks/useVisibleExams.js";
import { calculateExamReviewCounts, examIntervalDays, formatExamIntervalLabel, formatDisplayDate, todayStr } from "../utils/examUtils.js";
import { calculateStudyTimeline } from "../utils/studyTimeline.js";
import ExamCountControl from "./ExamCountControl.jsx";
import QuestionProgress, { QUESTION_OUTCOMES } from "./QuestionProgress.jsx";
import Icon from "./Icon.jsx";

function PlanDate({ label, value, onChange, final = false }) {
    return <label className={`date-control plan-date${final ? " plan-date-final" : ""}`}>
        <span className="plan-date-label"><Icon name={final ? "calendar" : "book"} size={16} />{label}</span>
        <input type="date" aria-label={label} value={value || ""} onChange={(event) => onChange(event.target.value)} />
        <span className="plan-date-caption">{final ? "היעד שלך" : "יוצאים לדרך"}</span>
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
    const intervalLabel = formatExamIntervalLabel(examIntervalDays(meta.studyStartDate, meta.finalExamDate, exams.length));
    const completed = timeline.exams.filter((exam) => exam.status === "answered" || exam.status === "mastered").length;
    const todayLabel = timeline.todayState === "before" ? "היום · לפני תחילת הלימודים"
        : timeline.todayState === "after" ? "היום · אחרי הבחינה" : "היום";
    const updateDates = (field, value) => updateSubjectDates(active, {
        studyStartDate: meta.studyStartDate || "", finalExamDate: meta.finalExamDate || "", [field]: value,
    });

    return <section className="planning-panel learning-plan" aria-labelledby="planning-title">
        <div className="planning-heading">
            <h2 id="planning-title"><Icon name="calendar" size={18} />תוכנית הלמידה</h2>
            <div className="plan-heading-controls">
                {intervalLabel && <span className="plan-cadence"><Icon name="clock" size={14} />{intervalLabel}</span>}
                <ExamCountControl subject={active} currentCount={exams.length} />
            </div>
        </div>
        <div className="plan-journey">
            <PlanDate label="תאריך התחלת לימודים" value={meta.studyStartDate} onChange={(value) => updateDates("studyStartDate", value)} />
            <div className="plan-timeline-scroll" role="region" aria-label="ציר זמן של בחינות התרגול" tabIndex={0}>
                {timeline.state === "ready" ? <div className="plan-timeline" style={{ minWidth: `${Math.max(320, exams.length * 88)}px` }}>
                    <div className="plan-rail" aria-hidden="true">
                        {timeline.todayPosition !== null && <span className="plan-rail-elapsed" style={{ width: `${timeline.todayPosition}%` }} />}
                    </div>
                    {timeline.todayPosition !== null && <div className={`plan-today${timeline.todayPosition < 12 ? " at-start" : timeline.todayPosition > 88 ? " at-end" : ""}`}
                        style={{ insetInlineStart: `${timeline.todayPosition}%` }} aria-current="date">
                        <span className="plan-today-label">{todayLabel}<time dateTime={today}>{formatDisplayDate(today).slice(0, 5)}</time></span>
                        <span className="plan-today-line" aria-hidden="true" />
                    </div>}
                    <ol className="plan-milestones" aria-label="בחינות לפי סדר התרגול">
                        {timeline.exams.map((exam, index) => <li key={exam.id} className={`plan-milestone is-${exam.status}`}
                            style={{ insetInlineStart: `${exam.position}%` }}>
                            <a className="plan-exam-link" href={`#exam-${exam.id}`}
                                aria-label={`${exam.name}, יעד ${formatDisplayDate(exam.dueDate)}, ${exam.completion}% מהשאלות נענו`}>
                                <span className="plan-exam-node">{exam.status === "mastered" ? <Icon name="check" size={14} /> : exam.number}</span>
                                <strong className="plan-exam-name" title={exam.name}>{exam.name}</strong>
                                <time className="plan-exam-date" dateTime={exam.dueDate}>{formatDisplayDate(exam.dueDate).slice(0, 5)}</time>
                            </a>
                            <QuestionProgress counts={exam.counts} reviewCounts={calculateExamReviewCounts(exams[index], today)} className="plan-exam-progress" />
                            <span className="plan-exam-state">{exam.status === "mastered" ? "הושלמה בהצלחה" : exam.status === "answered" ? "המענה הושלם"
                                : exam.status === "unstarted" ? "טרם התחילה" : <><bdi>{exam.completion}%</bdi> נענו</>}</span>
                        </li>)}
                    </ol>
                    {!exams.length && <p className="plan-no-exams">הוסף בחינות כדי לבנות את ציר התרגול</p>}
                </div> : <div className="plan-timeline-empty"><Icon name="calendar" size={22} /><p>{timeline.state === "missing-dates"
                    ? "בחר תאריך התחלה ותאריך בחינה להצגת ציר התרגול"
                    : "תאריך הבחינה צריך להיות אחרי תחילת הלימודים"}</p></div>}
            </div>
            <PlanDate label="תאריך בחינה סופית" value={meta.finalExamDate} onChange={(value) => updateDates("finalExamDate", value)} final />
        </div>
        <div className="plan-footer">
            <div className="plan-legend" aria-label="מקרא התקדמות">
                {QUESTION_OUTCOMES.map(({ key, tone, label }) => <span className={`plan-legend-item outcome-${tone}`} key={key}><i className={`segment-${tone}`} aria-hidden="true" />{label}</span>)}
                <span className="plan-legend-item"><i className="plan-legend-review" aria-hidden="true" />מוכנות לחזרה</span>
            </div>
            {timeline.state === "ready" && exams.length > 0 && <span className="plan-completion"><Icon name="check" size={14} /><bdi>{completed} / {exams.length}</bdi> בחינות עם מענה מלא</span>}
        </div>
    </section>;
}

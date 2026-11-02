import { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import { subjectKey, todayStr } from "../utils/examUtils.js";
import { getSemesterProgress, getAssignmentStatus, getSemesterMarkers, formatSemesterDate } from "../utils/semesterTimeline.js";
import AssignmentForm from "./AssignmentForm.jsx";
import Icon from "./Icon.jsx";
import Tooltip from "./Tooltip.jsx";

const statusLabels = { completed: "הושלמה", overdue: "באיחור", today: "להגשה היום", upcoming: "להשלמה" };

export default function SemesterWorkspace() {
    const { state } = useExams();
    const subject = state.activeSubject;
    const meta = state.subjectMeta[subject] || {};
    const [today, setToday] = useState(todayStr);
    const [adding, setAdding] = useState(false);
    const addButton = useRef(null);
    useEffect(() => {
        const timer = setInterval(() => setToday(todayStr()), 60000);
        return () => clearInterval(timer);
    }, []);
    const assignments = (state.assignments || []).filter(a => subjectKey(a.subject) === subjectKey(subject))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);
    const completed = assignments.filter(a => a.completed).length;
    const overdue = assignments.filter(a => getAssignmentStatus(a, today) === "overdue").length;
    const progress = getSemesterProgress(meta.semesterStartDate, meta.semesterEndDate, today);
    const groups = new Map();
    for (const assignment of assignments) {
        if (!groups.has(assignment.dueDate)) groups.set(assignment.dueDate, []);
        groups.get(assignment.dueDate).push(assignment);
    }
    // Today remains visible even when no assignment is due today.
    if (!groups.has(today)) groups.set(today, []);
    const dates = [...groups.keys()].sort();
    function closeAdd() { setAdding(false); addButton.current?.focus(); }

    return <div className="semester-workspace">
        <section className="planning-panel semester-panel" aria-labelledby="semester-title">
            <div className="semester-heading">
                <div><h2 id="semester-title"><Icon name="calendar" size={20} />הסמסטר שלי</h2>{progress && <p>{progress.before ? "הסמסטר עוד לא התחיל" : progress.after ? "הסמסטר הסתיים" : `שבוע ${progress.week} מתוך ${Math.ceil(progress.totalDays / 7)} בסמסטר`}</p>}</div>
                <SemesterDates key={`${subject}-${meta.semesterStartDate}-${meta.semesterEndDate}`} subject={subject} meta={meta} />
                {progress && <span className="semester-elapsed"><strong>{progress.percent}%</strong><span>מהסמסטר חלפו</span></span>}
            </div>
            {progress ? <SemesterRail start={meta.semesterStartDate} end={meta.semesterEndDate} today={today} progress={progress} assignments={assignments} /> :
                <div className="plan-timeline-empty semester-date-prompt">
                    <Icon name="calendar" size={24} />
                    <h3>ציר הזמן מחכה לתאריכי הסמסטר</h3>
                    <p>{!meta.semesterStartDate || !meta.semesterEndDate ? "יש להזין תאריך התחלה ותאריך סיום כדי להציג את ציר הזמן." : "תאריך סיום הסמסטר צריך להיות אחרי תאריך ההתחלה."}</p>
                    <button type="button" className="btn ghost" onClick={() => {
                        const form = document.querySelector(".semester-dates");
                        (form?.querySelector("input:invalid") || form?.querySelector("input"))?.focus();
                    }}>הזנת תאריכי הסמסטר</button>
                </div>}
        </section>

        <section className="semester-assignments" aria-labelledby="assignments-title">
            <div className="assignments-heading">
                <div><h2 id="assignments-title">המטלות שלי <span className="exam-list-count">{assignments.length}</span></h2>
                    <p>{completed} מתוך {assignments.length} מטלות הושלמו{overdue > 0 && <span className="assignment-overdue-count"> · {overdue} באיחור</span>}</p>
                </div>
                <button ref={addButton} type="button" className="btn primary" disabled={adding} onClick={() => setAdding(true)}><Icon name="plus" size={16} />הוספת מטלה</button>
            </div>
            {assignments.length > 0 && <progress className="assignment-completion" max={assignments.length} value={completed} aria-label="מטלות שהושלמו" />}
            <div className="assignment-scroll" role="region" aria-labelledby="assignments-title" tabIndex={0}>
            {adding && <AssignmentForm subject={subject} onClose={closeAdd} />}
            {assignments.length === 0 ? <div className="semester-empty"><Icon name="calendar" size={30} /><h3>כל הסמסטר לפניך</h3><p>הוסף את המטלה הראשונה עם מועד הגשה.<br />כאן יופיעו המטלות שלך, לפי התאריך שלהן.</p></div> :
                <ol className="assignment-timeline" aria-label="ציר הזמן של המטלות">
                    {dates.map(date => <li key={date} className={`assignment-date-group${date === today ? " is-today" : ""}`}>
                        <div className="assignment-date"><time dateTime={date}>{formatSemesterDate(date)}</time><span>{date === today ? "היום" : new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(new Date(`${date}T12:00:00`))}</span></div>
                        <div className="assignment-date-items">{date === today && groups.get(date).length === 0 && <p className="timeline-today-label">היום · אין מטלות להגשה</p>}
                            {groups.get(date).map(assignment => <AssignmentRow key={assignment.id} assignment={assignment} today={today} subject={subject} outside={progress && (date < meta.semesterStartDate || date > meta.semesterEndDate)} />)}
                        </div>
                    </li>)}
                </ol>}
            </div>
        </section>
    </div>;
}

function SemesterDates({ subject, meta }) {
    const { updateSemester } = useExams();
    const [start, setStart] = useState(meta.semesterStartDate || "");
    const [end, setEnd] = useState(meta.semesterEndDate || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const dirty = start !== (meta.semesterStartDate || "") || end !== (meta.semesterEndDate || "");
    async function save(event) {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try { await updateSemester(subject, { semesterStartDate: start, semesterEndDate: end }); }
        catch (e) { setError(e.message); setBusy(false); }
    }
    return <form className="semester-dates" onSubmit={save}>
        <label>תחילת סמסטר<input type="date" required value={start} onChange={e => setStart(e.target.value)} disabled={busy} /></label>
        <Icon name="arrow" size={18} />
        <label>סיום סמסטר<input type="date" required min={start || undefined} value={end} onChange={e => setEnd(e.target.value)} disabled={busy} /></label>
        {dirty && <button className="btn ghost" disabled={busy}>{busy ? "שומר…" : "שמירת תאריכים"}</button>}
        {error && <p className="semester-error" role="alert">{error}</p>}
    </form>;
}

function SemesterRail({ start, end, today, progress, assignments }) {
    // Geometry stays precise; only the displayed percentage is rounded.
    const elapsedPosition = progress.elapsedDays / progress.totalDays * 100;
    const marks = getSemesterMarkers(assignments, start, end);
    const markerSpace = Math.max(0, ...marks.map(a => a.lane)) * 32;
    function goToAssignment(id) {
        const row = document.getElementById(`assignment-${id}`);
        if (!row) return;
        // Transfer keyboard focus without letting its automatic jump cancel the scroll.
        row.focus({ preventScroll: true });
        row.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            block: "center",
            inline: "nearest",
        });
    }
    return <>
        <div className="semester-rail-scroll" role="region" aria-label="ציר הזמן של הסמסטר" tabIndex={0}>
        <div className="semester-rail" style={{ minWidth: `${Math.max(360, Math.ceil(progress.totalDays / 7) * 38)}px` }}>
            <div className="semester-track" role="progressbar" aria-label="הזמן שחלף בסמסטר" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
                <div className="semester-track-elapsed" style={{ width: `${elapsedPosition}%` }} />
            </div>
            {!progress.before && !progress.after && <div className={`semester-today${elapsedPosition < 12 ? " at-start" : elapsedPosition > 88 ? " at-end" : ""}`} style={{ insetInlineStart: `${elapsedPosition}%` }}><span>היום · {formatSemesterDate(today)}</span></div>}
            {/* Connectors share a layer below every pin, including earlier pins on the same date. */}
            {marks.filter(assignment => assignment.lane > 0).map(assignment => <span key={`stem-${assignment.id}`} className="semester-pin-stem" aria-hidden="true"
                style={{ insetInlineStart: `${assignment.position}%`, height: `${assignment.lane * 32}px` }} />)}
            {marks.map(assignment => {
                const status = getAssignmentStatus(assignment, today);
                return <Tooltip key={assignment.id} as="a" className={`semester-pin ${status}`} style={{ insetInlineStart: `${assignment.position}%`, top: `${42 + assignment.lane * 32}px` }}
                    href={`#assignment-${assignment.id}`} text={`מטלה ${assignment.number}: ${assignment.title}\n${formatSemesterDate(assignment.dueDate)} · ${statusLabels[status]}`}
                    onActivate={() => goToAssignment(assignment.id)}>
                    {assignment.number}
                </Tooltip>;
            })}
            <div className="semester-range" style={{ marginTop: `${18 + markerSpace}px` }}><span><time dateTime={start}>{formatSemesterDate(start)}</time><small>תחילת הסמסטר</small></span><span><time dateTime={end}>{formatSemesterDate(end)}</time><small>סיום הסמסטר</small></span></div>
        </div>
        </div>
        <div className="semester-rail-footer">
            <p className="semester-rail-caption">המטלות ממוספרות לפי מועד ההגשה. רחף מעל סימון להצגת שם המטלה, או בחר בו כדי לעבור אליה.</p>
            {marks.length > 0 && <ul className="semester-legend" aria-label="מקרא סטטוס מטלות">
                <li className="upcoming">להשלמה</li><li className="overdue">באיחור</li><li className="completed">הושלמה</li>
            </ul>}
        </div>
    </>;
}

function AssignmentRow({ assignment, today, subject, outside }) {
    const { saveAssignment, removeAssignment } = useExams();
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const editButton = useRef(null);
    const status = getAssignmentStatus(assignment, today);
    async function change(action) {
        if (busy) return;
        setBusy(true);
        setError("");
        try { await action(); }
        catch (e) { setError(e.message); }
        finally { setBusy(false); }
    }
    return <article id={`assignment-${assignment.id}`} tabIndex={-1} className={`assignment-row ${status}`} aria-label={assignment.title}>
        {editing ? <AssignmentForm assignment={assignment} subject={subject} onClose={() => { setEditing(false); requestAnimationFrame(() => editButton.current?.focus()); }} /> : <>
            <input type="checkbox" className="assignment-checkbox" checked={assignment.completed} disabled={busy} aria-label={`השלמת ${assignment.title}`} onChange={event => { const completed = event.target.checked; change(() => saveAssignment(subject, assignment.id, { completed })); }} />
            <div className="assignment-copy"><h3>{assignment.title}</h3><div><span className={`assignment-status ${status}`}>{statusLabels[status]}</span>{outside && <span className="assignment-outside">מחוץ לתאריכי הסמסטר</span>}</div></div>
            <div className="assignment-actions">
                <button ref={editButton} type="button" className="btn ghost" disabled={busy} onClick={() => setEditing(true)} aria-label={`עריכת ${assignment.title}`}>עריכה</button>
                <button type="button" className="assignment-delete" disabled={busy} aria-label={`מחיקת ${assignment.title}`} onClick={() => { if (confirm(`למחוק את המטלה ״${assignment.title}״?`)) change(() => removeAssignment(subject, assignment.id)); }}><Icon name="trash" size={16} /></button>
            </div>
        </>}
        {error && <p className="semester-error" role="alert">{error}</p>}
    </article>;
}

import { useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

export default function AssignmentForm({ assignment, subject, onClose }) {
    const { saveAssignment } = useExams();
    const [title, setTitle] = useState(assignment?.title || "");
    const [dueDate, setDueDate] = useState(assignment?.dueDate || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function submit(event) {
        event.preventDefault();
        if (busy || !title.trim()) return;
        setBusy(true);
        setError("");
        try {
            await saveAssignment(subject, assignment?.id, { title: title.trim(), dueDate });
            onClose();
        } catch (e) {
            setError(e.message || "לא ניתן לשמור את המטלה. נסה שוב.");
            setBusy(false);
        }
    }

    return <form className="assignment-form" aria-label={assignment ? "עריכת מטלה" : "הוספת מטלה"} onSubmit={submit}>
        <label>שם המטלה<input autoFocus required maxLength={300} value={title} onChange={e => setTitle(e.target.value)} placeholder="למשל: תרגיל בית 1" disabled={busy} /></label>
        <label>מועד הגשה<input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={busy} /></label>
        <div className="assignment-form-actions">
            <button className="btn primary" disabled={busy || !title.trim()}>{busy ? "שומר…" : "שמירת מטלה"}</button>
            <button type="button" className="btn ghost" disabled={busy} onClick={onClose}>ביטול</button>
        </div>
        {error && <p className="semester-error" role="alert">{error}</p>}
    </form>;
}

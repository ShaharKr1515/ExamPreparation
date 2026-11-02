import { useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

export default function CourseModeSwitch() {
    const { state, updateSemester } = useExams();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const subject = state.activeSubject;
    const mode = state.subjectMeta[subject]?.mode || "exam";

    async function changeMode(next) {
        if (next === mode || saving) return;
        setSaving(true);
        setError("");
        try { await updateSemester(subject, { mode: next }); }
        catch { setError("לא ניתן לשנות מצב. נסה שוב."); }
        finally { setSaving(false); }
    }

    return <div className="course-mode-row">
        <div className="course-mode-switch" role="group" aria-label="מצב הקורס" aria-busy={saving}>
            {[ ["study", "לימוד"], ["exam", "הכנה למבחן"] ].map(([value, label]) =>
                <button key={value} type="button" aria-pressed={mode === value} disabled={saving} onClick={() => changeMode(value)}>{label}</button>)}
        </div>
        <span className="course-mode-description">{mode === "study" ? "המטלות וההתקדמות שלך לאורך הסמסטר" : "תרגול בחינות ומעקב אחר השליטה בחומר"}</span>
        {error && <span className="semester-error" role="alert">{error}</span>}
    </div>;
}

import { useExams } from "../context/ExamsContext.jsx";

export default function SaveFeedback() {
    const { saveStatus, retrySave, error, reloadState } = useExams();
    if (saveStatus.status === "idle" && !error) return null;
    const failed = saveStatus.status === "failed";
    return (
        <div className={`save-feedback ${failed || error ? "has-error" : ""}`}>
            <span role={failed || error ? "alert" : "status"} aria-live={failed || error ? "assertive" : "polite"}>
                {failed ? "השינויים עדיין לא נשמרו. השאר את החלון פתוח ונסה שוב."
                    : error ? "הפעולה לא אושרה. טען את הנתונים מחדש כדי לבדוק מה נשמר לפני ניסיון נוסף."
                    : saveStatus.status === "saving" ? "שומר שינויים…" : "כל השינויים נשמרו"}
            </span>
            {failed && <button type="button" className="btn ghost" onClick={retrySave}>ניסיון שמירה נוסף</button>}
            {error && !failed && <button type="button" className="btn ghost" onClick={reloadState}>טעינת נתונים מחדש</button>}
        </div>
    );
}

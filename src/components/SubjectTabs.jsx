import { useExams } from "../context/ExamsContext.jsx";
import { subjectKey } from "../utils/examUtils.js";

/** The tab bar: one tab per subject + the "+ מקצוע חדש" button. */
export default function SubjectTabs({ newOpen, onNew }) {
    const { state, setActiveSubject } = useExams();

    return (
        <div className="subject-bar" aria-label="סינון לפי מקצוע">
            {state.subjects.map((s) => (
                <button
                    key={s}
                    type="button"
                    className={"subject-btn" + (subjectKey(s) === subjectKey(state.activeSubject) ? " active" : "")}
                    onClick={() => {
                        if (subjectKey(s) !== subjectKey(state.activeSubject)) setActiveSubject(s);
                    }}
                >
                    {s}
                </button>
            ))}

            <button type="button" className={"subject-btn add-tab" + (newOpen ? " active" : "")} onClick={onNew}>
                + מקצוע חדש
            </button>
        </div>
    );
}

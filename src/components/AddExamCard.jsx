import { useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/**
 * An empty, exam-styled card with a centered "+" icon. Clicking it creates a new
 * (initially unnamed) exam under the active subject — rename it via its card header.
 */
export default function AddExamCard() {
    const { addExam } = useExams();
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        setIsPressed(true);
        addExam("");
        setTimeout(() => setIsPressed(false), 300);
    };

    return (
        <button
            type="button"
            className={`exam-card add-exam-card ${isPressed ? "is-pressed" : ""}`}
            onClick={handleClick}
            aria-label="הוספת בחינה חדשה"
        >
            <span className="add-icon-circle">
                <svg
                    className="add-icon-svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                >
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </span>
            <span className="add-label">הוספת בחינה</span>
        </button>
    );
}

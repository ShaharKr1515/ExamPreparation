import { useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import Icon from "./Icon.jsx";

/** Add an exam from the list heading without taking up a whole exam slot. */
export default function AddExamCard() {
    const { addExam } = useExams();
    const [isAdding, setIsAdding] = useState(false);

    async function handleClick() {
        if (isAdding) return;
        setIsAdding(true);
        try { await addExam(""); }
        finally { setIsAdding(false); }
    }

    return <button type="button" className="btn primary add-exam-action" onClick={handleClick} disabled={isAdding} aria-label="הוספת בחינה חדשה">
        <Icon name="plus" size={17} /><span>{isAdding ? "מוסיף בחינה…" : "הוספת בחינה"}</span>
    </button>;
}

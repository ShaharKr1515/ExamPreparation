import React, { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/** Inline add-exam row. The exam is always tagged with the active subject tab. */
export default function AddExamForm({ onClose }) {
    const { state, addExam } = useExams();
    const [name, setName] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <form
            className="add-row"
            autoComplete="off"
            onSubmit={(e) => {
                e.preventDefault();
                if (!state.activeSubject) return; // no subjects → the row can't be open anyway
                addExam(name.trim());
                setName("");
                onClose();
            }}
        >
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם הבחינה (למשל: בחינת מתמטיקה 5 יח'…)"
                aria-label="שם הבחינה"
            />
            <span className="add-hint">
                {state.activeSubject ? `תיוג אוטומטי: ${state.activeSubject}` : "בחר מקצוע בלשוניות למעלה"}
            </span>
            <button type="submit" className="btn primary">+ הוספת בחינה</button>
            <button type="button" className="btn ghost" onClick={onClose}>ביטול</button>
        </form>
    );
}

import React, { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/** Inline row under the tab bar for creating a subject (opened by "+ מקצוע חדש"). */
export default function NewSubjectRow({ onClose }) {
    const { addSubject } = useExams();
    const [name, setName] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <form
            className="add-row new-subject-row"
            autoComplete="off"
            onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                addSubject(name); // existing name → just switches to that tab, no duplicate
                onClose();
            }}
        >
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם המקצוע החדש (למשל: מתמטיקה, אנגלית…)"
                aria-label="שם מקצוע חדש"
            />
            <button type="submit" className="btn primary small">+ יצירת מקצוע</button>
            <button type="button" className="btn ghost small" onClick={onClose}>ביטול</button>
        </form>
    );
}

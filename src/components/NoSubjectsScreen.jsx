import React, { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/** Shown while there are no subjects at all: the "create your first subject" card. */
export default function NoSubjectsScreen() {
    const { addSubject } = useExams();
    const [name, setName] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <section>
            <div className="table-card empty-state">
                <h2>📚 אין עדיין מקצועות</h2>
                <p>
                    כדי להתחיל, צור מקצוע ראשון (למשל: מתמטיקה, אנגלית, פיזיקה…).<br />
                    לאחר מכן תוכל להוסיף בחינות תחתיו — כל בחינה תקבל את המקצוע אוטומטית.
                </p>
                <form
                    className="subject-create-form"
                    autoComplete="off"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!name.trim()) return;
                        addSubject(name);
                        setName("");
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="שם המקצוע (למשל: מתמטיקה)"
                        aria-label="שם מקצוע חדש"
                    />
                    <button type="submit" className="btn primary">+ יצירת מקצוע</button>
                </form>
            </div>
        </section>
    );
}

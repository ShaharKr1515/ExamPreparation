import React, { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/** Shown while there are no subjects at all: the "create your first subject" card. */
export default function NoSubjectsScreen() {
    const { addSubject } = useExams();
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
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
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!name.trim() || isSubmitting) return;
                        setIsSubmitting(true);
                        if (await addSubject(name)) setName("");
                        setIsSubmitting(false);
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="שם המקצוע (למשל: מתמטיקה)"
                        aria-label="שם מקצוע חדש"
                        disabled={isSubmitting}
                    />
                    <button type="submit" className="btn primary" disabled={isSubmitting}>{isSubmitting ? "יוצר מקצוע…" : "+ יצירת מקצוע"}</button>
                </form>
            </div>
        </section>
    );
}

import React, { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import Icon from "./Icon.jsx";

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
                <Icon name="book" size={40} />
                <h1>מתחילים ללמוד, עם תוכנית.</h1>
                <p>
                    צור את המקצוע הראשון שלך. לאחר מכן תוכל לתכנן את הלמידה,
                    להוסיף בחינות ולעקוב אחר ההתקדמות בכל שאלה.
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
                    <button type="submit" className="btn primary" disabled={isSubmitting || !name.trim()}><Icon name="plus" size={17} />{isSubmitting ? "יוצר מקצוע…" : "יצירת מקצוע"}</button>
                </form>
            </div>
        </section>
    );
}

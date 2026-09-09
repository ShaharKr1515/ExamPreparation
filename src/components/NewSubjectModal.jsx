import React, { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/** Modal for creating a subject: name, number of exams to create, and the study dates. */
export default function NewSubjectModal({ onClose }) {
    const { addSubject } = useExams();
    const [name, setName] = useState("");
    const [examCount, setExamCount] = useState(1);
    const [studyStartDate, setStudyStartDate] = useState("");
    const [finalExamDate, setFinalExamDate] = useState("");
    const [isClosing, setIsClosing] = useState(false);
    const nameRef = useRef(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 180);
    };

    // Close on Escape.
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") handleClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isClosing]);

    function submit(e) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        addSubject(trimmed, { examCount, studyStartDate, finalExamDate });
        handleClose();
    }

    return (
        <div
            className={`modal-backdrop ${isClosing ? "is-closing" : "is-entering"}`}
            onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
        >
            <form
                className={`subject-modal ${isClosing ? "is-closing" : "is-entering"}`}
                onSubmit={submit}
                aria-label="יצירת מקצוע חדש"
            >
                <h2>מקצוע חדש</h2>

                <label className="field">
                    <span>שם המקצוע</span>
                    <input
                        ref={nameRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="למשל: מתמטיקה, אנגלית…"
                        aria-label="שם המקצוע"
                    />
                </label>

                <label className="field">
                    <span>כמה בחינות ליצור</span>
                    <input
                        type="number"
                        min={0}
                        max={50}
                        value={examCount}
                        onChange={(e) => setExamCount(Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
                        aria-label="מספר בחינות ליצירה"
                    />
                </label>

                <div className="field-row">
                    <label className="field">
                        <span>תאריך התחלת לימודים</span>
                        <input
                            type="date"
                            value={studyStartDate}
                            onChange={(e) => setStudyStartDate(e.target.value)}
                            aria-label="תאריך התחלת לימודים"
                        />
                    </label>

                    <label className="field">
                        <span>תאריך בחינה סופית</span>
                        <input
                            type="date"
                            value={finalExamDate}
                            onChange={(e) => setFinalExamDate(e.target.value)}
                            aria-label="תאריך בחינה סופית"
                        />
                    </label>
                </div>

                <div className="modal-actions">
                    <button type="submit" className="btn primary">+ יצירת מקצוע</button>
                    <button type="button" className="btn ghost" onClick={handleClose}>ביטול</button>
                </div>
            </form>
        </div>
    );
}

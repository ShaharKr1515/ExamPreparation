import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExams } from "../context/ExamsContext.jsx";
import SaveFeedback from "./SaveFeedback.jsx";

/** Modal for creating a subject: name, number of exams to create, and the study dates. */
export default function NewSubjectModal({ onClose }) {
    const { addSubject } = useExams();
    const [name, setName] = useState("");
    const [examCount, setExamCount] = useState(1);
    const [studyStartDate, setStudyStartDate] = useState("");
    const [finalExamDate, setFinalExamDate] = useState("");
    const [isClosing, setIsClosing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creationError, setCreationError] = useState(false);
    const nameRef = useRef(null);
    const dialogRef = useRef(null);
    const closeTimer = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const launcher = document.activeElement;
        const dialog = dialogRef.current;
        dialog.showModal();
        nameRef.current?.focus();
        return () => {
            clearTimeout(closeTimer.current);
            dialog.close();
            if (launcher?.isConnected) launcher.focus();
        };
    }, []);

    const handleClose = () => {
        if (isClosing || isSubmitting) return;
        setIsClosing(true);
        closeTimer.current = setTimeout(() => {
            onClose();
        }, 180);
    };

    async function submit(e) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || isSubmitting) return;
        setIsSubmitting(true);
        setCreationError(false);
        const created = await addSubject(trimmed, { examCount, studyStartDate, finalExamDate });
        setIsSubmitting(false);
        if (created) onClose();
        else setCreationError(true);
    }

    return createPortal(
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            className={`modal-backdrop ${isClosing ? "is-closing" : "is-entering"}`}
            onCancel={(e) => { e.preventDefault(); handleClose(); }}
            onKeyDown={(e) => {
                if (e.key !== "Tab") return;
                const controls = [...e.currentTarget.querySelectorAll("input:not(:disabled), button:not(:disabled)")];
                const first = controls[0];
                const last = controls[controls.length - 1];
                if ((!e.shiftKey && document.activeElement === last) || (e.shiftKey && document.activeElement === first)) {
                    e.preventDefault();
                    (e.shiftKey ? last : first)?.focus();
                }
            }}
            onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
        >
            <form
                className={`subject-modal ${isClosing ? "is-closing" : "is-entering"}`}
                onSubmit={submit}
                aria-label="יצירת מקצוע חדש"
            >
                <h2 id={titleId}>מקצוע חדש</h2>

                <label className="field">
                    <span>שם המקצוע</span>
                    <input
                        ref={nameRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="למשל: מתמטיקה, אנגלית…"
                        aria-label="שם המקצוע"
                        required
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                            disabled={isSubmitting}
                        />
                    </label>

                    <label className="field">
                        <span>תאריך בחינה סופית</span>
                        <input
                            type="date"
                            value={finalExamDate}
                            onChange={(e) => setFinalExamDate(e.target.value)}
                            aria-label="תאריך בחינה סופית"
                            min={studyStartDate || undefined}
                            disabled={isSubmitting}
                        />
                    </label>
                </div>

                {isSubmitting && <SaveFeedback />}
                {creationError && <p role="alert">לא ניתן ליצור את המקצוע. בדוק את השם והתאריכים ונסה שוב.</p>}
                <div className="modal-actions">
                    <button type="submit" className="btn primary" disabled={isSubmitting}>{isSubmitting ? "יוצר מקצוע…" : "+ יצירת מקצוע"}</button>
                    <button type="button" className="btn ghost" onClick={handleClose} disabled={isSubmitting}>ביטול</button>
                </div>
            </form>
        </dialog>, document.body
    );
}

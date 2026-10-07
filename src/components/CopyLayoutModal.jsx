import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useExams } from "../context/ExamsContext.jsx";
import { computeSubQuestionsPointsSum } from "../utils/examUtils.js";

/**
 * Modal to copy an exam's questions layout (main questions, sub-questions, and points)
 * to one or more other exams in the same subject.
 */
export default function CopyLayoutModal({ exam, examNumber, siblings = [], onClose }) {
    const { copyExamLayout } = useExams();
    const [isClosing, setIsClosing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dialogRef = useRef(null);
    const closeTimer = useRef(null);

    // Candidates are all other exams in this subject
    const candidates = useMemo(() => {
        return siblings
            .map((s, idx) => ({ exam: s, number: idx + 1 }))
            .filter(({ exam: s }) => s.id !== exam.id);
    }, [siblings, exam.id]);

    // All candidates selected by default
    const [selectedIds, setSelectedIds] = useState(() => new Set(candidates.map((c) => c.exam.id)));

    // Calculate layout statistics
    const stats = useMemo(() => {
        const questions = exam.questions || [];
        const mainCount = questions.filter((q) => !q.sub).length;
        const subCount = questions.filter((q) => q.sub).length;

        // Calculate total points across groups
        let totalPts = 0;
        let groupSubs = [];
        const groups = [];
        for (const q of questions) {
            if (!q.sub) {
                groupSubs = [];
                groups.push({ main: q, subs: groupSubs });
            } else {
                groupSubs.push(q);
            }
        }
        for (const g of groups) {
            if (g.subs.length > 0) {
                const subSum = computeSubQuestionsPointsSum(g.subs);
                totalPts += Number(subSum) || 0;
            } else if (g.main.points && !isNaN(Number(g.main.points))) {
                totalPts += Number(g.main.points);
            }
        }

        return {
            mainCount,
            subCount,
            totalPoints: Math.round(totalPts * 100) / 100,
        };
    }, [exam.questions]);

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        closeTimer.current = setTimeout(() => {
            onClose();
        }, 180);
    };

    // Native modal behavior makes the workspace inert; return to the launcher on close.
    useEffect(() => {
        const launcher = document.activeElement;
        const dialog = dialogRef.current;
        dialog.showModal();
        dialog.querySelector("input, button")?.focus();
        return () => {
            clearTimeout(closeTimer.current);
            dialog.close();
            if (launcher?.isConnected) launcher.focus();
        };
    }, []);

    const toggleCandidate = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        setSelectedIds(new Set(candidates.map((c) => c.exam.id)));
    };

    const clearAll = () => {
        setSelectedIds(new Set());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedIds.size === 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await copyExamLayout(exam.id, Array.from(selectedIds));
            handleClose();
        } catch (err) {
            console.error("Failed to copy layout:", err);
            alert("שגיאה בהעתקת מבנה השאלות: " + (err?.message || ""));
            setIsSubmitting(false);
        }
    };

    const customExamName = exam.name?.trim();
    const hasCustomName = Boolean(customExamName);
    const examDisplayName = hasCustomName
        ? `"${customExamName}" (${examNumber ? `מבחן ${examNumber}` : ""})`
        : (examNumber ? `מבחן ${examNumber}` : "בחינה זו");

    const anySelectedHasData = candidates.some(
        ({ exam: c }) =>
            selectedIds.has(c.id) &&
            c.questions?.some(
                (q) =>
                    (q.success !== "" && q.success != null) ||
                    (q.date !== "" && q.date != null) ||
                    (q.points !== "" && q.points != null) ||
                    Number(q.timerSeconds) > 0,
            ),
    );

    const modalContent = (
        <dialog
            ref={dialogRef}
            className={`modal-backdrop ${isClosing ? "is-closing" : "is-entering"}`}
            onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && handleClose()}
            aria-labelledby="copy-modal-title"
            onCancel={(e) => { e.preventDefault(); if (!isSubmitting) handleClose(); }}
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
        >
            <form
                className={`copy-layout-modal ${isClosing ? "is-closing" : "is-entering"}`}
                onSubmit={handleSubmit}
            >
                <div className="copy-modal-header">
                    <h2 id="copy-modal-title">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        <span>העתקת מבנה שאלות</span>
                        {hasCustomName && <span className="copy-modal-exam-name">"{customExamName}"</span>}
                    </h2>
                    <p className="copy-modal-subtitle">
                        העתקת מבנה השאלות, הסעיפים והניקוד מתוך <strong>{examDisplayName}</strong>
                    </p>
                </div>

                {/* Source Exam Banner if custom name exists */}
                {hasCustomName && (
                    <div className="copy-source-exam-banner">
                        <span className="copy-source-label">בחינת מקור:</span>
                        {examNumber && <span className="copy-target-badge">מבחן {examNumber}</span>}
                        <span className="copy-source-name">{customExamName}</span>
                    </div>
                )}

                {/* Layout preview summary */}
                <div className="copy-layout-preview" aria-label="פרטי מבנה השאלות להעתקה">
                    <div className="copy-preview-stat">
                        <span className="copy-preview-label">שאלות ראשיות</span>
                        <span className="copy-preview-value">{stats.mainCount}</span>
                    </div>
                    <div className="copy-preview-stat">
                        <span className="copy-preview-label">סעיפים</span>
                        <span className="copy-preview-value">{stats.subCount}</span>
                    </div>
                    <div className="copy-preview-stat">
                        <span className="copy-preview-label">ניקוד כולל</span>
                        <span className="copy-preview-value">{stats.totalPoints} נק'</span>
                    </div>
                </div>

                {/* Target exams selection */}
                <div className="copy-targets-header">
                    <span className="copy-targets-title">בחר בחינות יעד להעתקה:</span>
                    <button
                        type="button"
                        className="copy-toggle-all-btn"
                        onClick={selectedIds.size === candidates.length ? clearAll : selectAll}
                    >
                        {selectedIds.size === candidates.length ? "נקה הכל" : "בחר הכל"}
                    </button>
                </div>

                <div className="copy-targets-list" role="group" aria-label="רשימת בחינות יעד">
                    {candidates.map(({ exam: c, number: cNum }) => {
                        const isSelected = selectedIds.has(c.id);
                        const hasData = c.questions?.some(
                            (q) =>
                                (q.success !== "" && q.success != null) ||
                                (q.date !== "" && q.date != null) ||
                                (q.points !== "" && q.points != null) ||
                                Number(q.timerSeconds) > 0,
                        );

                        return (
                            <label
                                key={c.id}
                                className={`copy-target-item ${isSelected ? "selected" : ""}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleCandidate(c.id)}
                                    aria-label={`העתקה לבחינה ${c.name || `מספר ${cNum}`}`}
                                />
                                <span className="copy-target-badge">מבחן {cNum}</span>
                                <span className="copy-target-name">{c.name || `בחינה ${cNum}`}</span>
                                {hasData && (
                                    <span
                                        className="copy-target-warning-tag"
                                        title="בבחינה זו כבר הוזנו נתונים או מענה לשאלות שיאופסו בהעתקה"
                                    >
                                        יש נתונים קיימים
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </div>

                {anySelectedHasData && (
                    <div className="copy-modal-warning" role="alert">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>
                            שים לב: העתקת המבנה תדרוס את השאלות הקיימות בבחינות שנבחרו (הצלחה, תאריכים וטיימר יאופסו).
                        </span>
                    </div>
                )}

                <div className="modal-actions">
                    <button
                        type="button"
                        className="btn ghost"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        ביטול
                    </button>
                    <button
                        type="submit"
                        className="btn primary"
                        disabled={selectedIds.size === 0 || isSubmitting}
                    >
                        {isSubmitting
                            ? "מעתיק מבנה…"
                            : selectedIds.size === candidates.length
                                ? "העתק לכל הבחינות"
                                : `העתק ל-${selectedIds.size} בחינות`}
                    </button>
                </div>
            </form>
        </dialog>
    );

    return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}

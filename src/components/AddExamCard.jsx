import { useState, useRef, useLayoutEffect } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/**
 * An empty, exam-styled card with a centered "+" icon. Clicking it creates a new
 * (initially unnamed) exam under the active subject — rename it via its card header.
 */
export default function AddExamCard({ hasCardOnRight = false, examsCount = 0 }) {
    const { addExam } = useExams();
    const [isPressed, setIsPressed] = useState(false);
    const cardRef = useRef(null);
    const prevRectRef = useRef(null);
    const prevCountRef = useRef(examsCount);
    const animCleanupTimerRef = useRef(null);

    const handleClick = async () => {
        if (isPressed) return;
        setIsPressed(true);
        try {
            await addExam("");
        } finally {
            setTimeout(() => setIsPressed(false), 200);
        }
    };

    useLayoutEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        const currentRect = el.getBoundingClientRect();
        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Animate position and size changes when exams are added or deleted
        if (!prefersReducedMotion && prevRectRef.current && prevCountRef.current !== examsCount) {
            const dx = prevRectRef.current.left - currentRect.left;
            const dy = prevRectRef.current.top - currentRect.top;
            const prevHeight = prevRectRef.current.height;
            const currentHeight = currentRect.height;
            const dh = prevHeight - currentHeight;

            const moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
            const heightChanged = Math.abs(dh) > 4;

            if (moved || heightChanged) {
                if (animCleanupTimerRef.current) {
                    clearTimeout(animCleanupTimerRef.current);
                }

                // Invert position
                if (moved) {
                    el.style.transform = `translate(${dx}px, ${dy}px)`;
                }

                // Invert height
                if (heightChanged) {
                    el.style.height = `${prevHeight}px`;
                }

                el.style.transition = "none";

                // Force layout reflow
                void el.offsetHeight;

                // Play smooth transition
                requestAnimationFrame(() => {
                    el.style.transition =
                        "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), height 0.32s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease";
                    if (moved) el.style.transform = "";
                    if (heightChanged) el.style.height = `${currentHeight}px`;
                });

                // Clear inline overrides once transition settles
                animCleanupTimerRef.current = setTimeout(() => {
                    if (cardRef.current) {
                        cardRef.current.style.transform = "";
                        cardRef.current.style.height = "";
                        cardRef.current.style.transition = "";
                    }
                }, 350);
            }
        }

        prevRectRef.current = currentRect;
        prevCountRef.current = examsCount;
    }, [examsCount, hasCardOnRight]);

    return (
        <button
            ref={cardRef}
            type="button"
            className={`exam-card add-exam-card ${hasCardOnRight ? "has-card-on-right" : ""} ${isPressed ? "is-pressed" : ""}`}
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

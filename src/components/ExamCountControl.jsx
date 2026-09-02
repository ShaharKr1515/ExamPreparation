import { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";

/**
 * Toolbar control: the total number of exams for the active subject.
 * Typing a higher number creates the missing exams; typing a lower one asks
 * for confirmation first (the newest exams would be deleted).
 */
export default function ExamCountControl({ subject, currentCount }) {
    const { adjustExamCount } = useExams();
    const [value, setValue] = useState(String(currentCount));
    // The in-flight request ({subject, target}) — dedupes Enter+blur double commits.
    const pendingRef = useRef(null);

    // Keep the field in sync when switching subjects or after external changes,
    // but don't clobber the typed value while our own request is still settling.
    useEffect(() => {
        const p = pendingRef.current;
        if (p && p.subject === subject) {
            if (p.target === currentCount) {
                pendingRef.current = null; // settled ✓ — show the final total
                setValue(String(currentCount));
            }
            return; // in flight for this subject — leave the field alone
        }
        setValue(String(currentCount));
    }, [subject, currentCount]);

    async function commit() {
        if (!subject) return;
        const target = Math.max(0, Math.min(50, Number(value) || 0));
        if (target === currentCount) {
            setValue(String(target));
            return;
        }
        // Same adjustment already in flight — ignore duplicate commits.
        const p = pendingRef.current;
        if (p && p.subject === subject && p.target === target) return;
        // Reducing the total deletes exams — confirm before doing it.
        if (target < currentCount && !confirm(`למחוק ${currentCount - target} בחינות ולהשאיר ${target}?`)) {
            setValue(String(currentCount));
            return;
        }
        pendingRef.current = { subject, target };
        const ok = await adjustExamCount(subject, target);
        if (!ok) pendingRef.current = null; // allow retry on failure
    }

    function onKeyDown(e) {
        if (e.key === "Enter") commit();
    }

    return (
        <label className="date-control">
            <span>מספר בחינות</span>
            <input
                type="number"
                min={0}
                max={50}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
                aria-label="מספר בחינות"
            />
        </label>
    );
}

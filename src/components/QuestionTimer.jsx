import { useState, useEffect, useRef, useCallback } from "react";
import { formatTimer } from "../utils/examUtils.js";

/**
 * QuestionTimer: displays xx:xx timer, icon-only start/pause button, and icon-only reset button.
 * Hover text appears above the buttons via custom CSS tooltips.
 * Persists elapsed time to database on pause, reset, and periodically while running.
 */
export default function QuestionTimer({ initialSeconds = 0, onSave, onStart, questionLabel = "שאלה" }) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);

    // Track active start timestamp to prevent tab-throttling drift
    const runStartRef = useRef(null);
    const baseSecondsRef = useRef(initialSeconds);
    const lastSavedRef = useRef(initialSeconds);
    const isRunningRef = useRef(false);
    isRunningRef.current = isRunning;
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;
    const onStartRef = useRef(onStart);
    onStartRef.current = onStart;

    // Sync from parent if initialSeconds changes externally while not running
    useEffect(() => {
        if (!isRunning) {
            setSeconds(initialSeconds);
            baseSecondsRef.current = initialSeconds;
            lastSavedRef.current = initialSeconds;
        }
    }, [initialSeconds, isRunning]);

    // Save current elapsed seconds to parent/DB
    const persistTime = useCallback((secsToSave) => {
        const rounded = Math.max(0, Math.round(secsToSave));
        if (rounded !== lastSavedRef.current) {
            lastSavedRef.current = rounded;
            if (onSaveRef.current) {
                onSaveRef.current(rounded);
            }
        }
    }, []);

    // Timer tick loop
    useEffect(() => {
        if (!isRunning) return;

        runStartRef.current = Date.now();
        const base = baseSecondsRef.current;

        const interval = setInterval(() => {
            if (!runStartRef.current) return;
            const elapsed = Math.floor((Date.now() - runStartRef.current) / 1000);
            const currentTotal = base + elapsed;
            setSeconds(currentTotal);

            // Periodic auto-save every 10 seconds while running so time is never lost
            if (elapsed > 0 && elapsed % 10 === 0) {
                persistTime(currentTotal);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [isRunning, persistTime]);

    // Save only on unmount or tab hide if running
    useEffect(() => {
        const handleVisibilityOrUnload = () => {
            if (isRunningRef.current && runStartRef.current) {
                const elapsed = Math.floor((Date.now() - runStartRef.current) / 1000);
                const currentTotal = baseSecondsRef.current + elapsed;
                persistTime(currentTotal);
            }
        };

        window.addEventListener("beforeunload", handleVisibilityOrUnload);
        document.addEventListener("visibilitychange", handleVisibilityOrUnload);

        return () => {
            window.removeEventListener("beforeunload", handleVisibilityOrUnload);
            document.removeEventListener("visibilitychange", handleVisibilityOrUnload);
            handleVisibilityOrUnload();
        };
    }, [persistTime]);

    const handleToggleStartPause = (e) => {
        if (e?.currentTarget) e.currentTarget.blur();
        if (isRunning) {
            // Pausing: compute exact elapsed, stop running, persist
            const elapsed = runStartRef.current ? Math.floor((Date.now() - runStartRef.current) / 1000) : 0;
            const currentTotal = baseSecondsRef.current + elapsed;
            baseSecondsRef.current = currentTotal;
            runStartRef.current = null;
            isRunningRef.current = false;
            setSeconds(currentTotal);
            setIsRunning(false);
            persistTime(currentTotal);
        } else {
            // Starting / Resuming
            baseSecondsRef.current = seconds;
            runStartRef.current = Date.now();
            isRunningRef.current = true;
            setIsRunning(true);
            if (onStartRef.current) {
                onStartRef.current();
            }
        }
    };

    const handleReset = (e) => {
        if (e?.currentTarget) e.currentTarget.blur();
        // Fully halt running state and reset timestamp before any effects or saves
        runStartRef.current = null;
        isRunningRef.current = false;
        baseSecondsRef.current = 0;
        setIsRunning(false);
        setSeconds(0);
        lastSavedRef.current = 0;
        if (onSaveRef.current) {
            onSaveRef.current(0);
        }
    };

    const playPauseTooltip = isRunning ? "השהה" : seconds > 0 ? "המשך" : "התחל";
    const playPauseAria = isRunning ? `השהה טיימר ${questionLabel}` : `התחל טיימר ${questionLabel}`;

    return (
        <div className="timer-cell">
            <span
                className={`timer-digits ${isRunning ? "is-running" : ""} ${seconds > 0 ? "has-time" : ""}`}
                aria-label={`זמן שנמדד: ${formatTimer(seconds)}`}
            >
                {formatTimer(seconds)}
            </span>

            {/* Start / Pause Button (icon only; hover tooltip above) */}
            <div className="timer-btn-wrap">
                <button
                    type="button"
                    className={`timer-btn ${isRunning ? "timer-btn-pause is-active" : "timer-btn-start"}`}
                    aria-label={playPauseAria}
                    onClick={handleToggleStartPause}
                >
                    {isRunning ? (
                        /* Pause Icon */
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        /* Play Icon */
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M5 3l14 9-14 9V3z" />
                        </svg>
                    )}
                </button>
                <span className="timer-tooltip" role="tooltip">
                    {playPauseTooltip}
                </span>
            </div>

            {/* Reset Button (icon only; hover tooltip above) */}
            <div className="timer-btn-wrap">
                <button
                    type="button"
                    className="timer-btn timer-btn-reset"
                    aria-label={`איפוס טיימר ${questionLabel}`}
                    disabled={seconds === 0 && !isRunning}
                    onClick={handleReset}
                >
                    {/* Reset / Rotate counter-clockwise Icon */}
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
                <span className="timer-tooltip" role="tooltip">
                    איפוס
                </span>
            </div>
        </div>
    );
}

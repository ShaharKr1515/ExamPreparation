import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** The existing dark tooltip, positioned outside clipped cards and bar tracks. */
export default function Tooltip({ text, children, className, style }) {
    const id = useId();
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [position, setPosition] = useState(null);
    const visible = !dismissed && (hovered || focused);
    const dismissOnClick = (event) => {
        event.preventDefault();
        event.currentTarget.blur();
        setFocused(false);
        setDismissed(true);
    };

    useLayoutEffect(() => {
        if (!visible) {
            const timeout = window.setTimeout(() => setPosition(null), 220);
            return () => window.clearTimeout(timeout);
        }
        const reposition = () => {
            const anchor = triggerRef.current.getBoundingClientRect();
            // Measure the full box, independent of its animated scale.
            const tooltip = { width: tooltipRef.current.offsetWidth, height: tooltipRef.current.offsetHeight };
            const center = anchor.left + anchor.width / 2;
            const left = Math.max(12, Math.min(center - tooltip.width / 2, window.innerWidth - tooltip.width - 12));
            const below = anchor.top - tooltip.height - 8 < 12;
            setPosition({
                left,
                top: below ? anchor.bottom + 8 : anchor.top - tooltip.height - 8,
                below,
                arrow: Math.max(10, Math.min(center - left, tooltip.width - 10)),
            });
        };
        const dismiss = (event) => {
            if (event.key === "Escape" || event.type === "pointerdown") setDismissed(true);
        };
        reposition();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        window.addEventListener("keydown", dismiss);
        window.addEventListener("pointerdown", dismiss);
        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
            window.removeEventListener("keydown", dismiss);
            window.removeEventListener("pointerdown", dismiss);
        };
    }, [visible, text]);

    return <>
        <span ref={triggerRef} className={className} style={style} tabIndex={0}
            aria-label={text} aria-describedby={visible ? id : undefined}
            onMouseEnter={() => { setDismissed(false); setHovered(true); }}
            onMouseLeave={() => setHovered(false)}
            onPointerDown={dismissOnClick}
            onClick={dismissOnClick}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") dismissOnClick(event);
            }}
            onFocus={() => { if (!dismissed) setFocused(true); }}
            onBlur={() => setFocused(false)}>
            {children}
        </span>
        {(visible || position) && createPortal(<span ref={tooltipRef} id={id} role="tooltip"
            className={`q-fail-tooltip exam-progress-tooltip${visible && position ? " is-visible" : ""}${position?.below ? " is-below" : ""}`}
            style={{ left: position?.left ?? 0, top: position?.top ?? 0, "--tooltip-arrow": `${position?.arrow ?? 10}px` }}>
            {text}
        </span>, document.body)}
    </>;
}

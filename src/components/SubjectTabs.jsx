import { useEffect, useRef, useState } from "react";
import { useExams } from "../context/ExamsContext.jsx";
import { subjectKey } from "../utils/examUtils.js";

/** The tab bar: one tab per subject + the "+ מקצוע חדש" button. */
export default function SubjectTabs({ newOpen, onNew }) {
    const { state, setActiveSubject, renameSubject, deleteSubject } = useExams();
    // Which subject's popup menu is open (null = closed).
    const [menuFor, setMenuFor] = useState(null);
    // Viewport anchor of the open menu (fixed positioning — the bar scrolls,
    // so an in-flow dropdown would get clipped by its overflow).
    const [anchor, setAnchor] = useState(null);

    function toggleMenu(e, subject) {
        if (menuFor === subject) {
            setMenuFor(null);
            return;
        }
        // First click on an inactive tab only switches to it — the menu opens
        // on a second click of the already-active tab.
        if (subjectKey(subject) !== subjectKey(state.activeSubject)) {
            setActiveSubject(subject);
            setMenuFor(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        // Flip above the tab when there isn't room below.
        const top = window.innerHeight - rect.bottom > 170 ? rect.bottom + 6 : Math.max(8, rect.top - 6);
        setAnchor({ right: window.innerWidth - rect.right, top });
        setMenuFor(subject);
    }

    // Close the menu on outside click / Escape.
    useEffect(() => {
        if (!menuFor) return;
        function onClick(e) {
            const inOpenMenu = e.target.closest(".subject-menu");
            if (inOpenMenu) return; // interacting with the menu itself
            const otherTab = e.target.closest(".subject-btn:not(.add-tab)");
            if (otherTab && otherTab.dataset.subject !== menuFor) return; // its click switches menus
            setMenuFor(null);
        }
        function onKey(e) {
            if (e.key === "Escape") {
                const subject = menuFor;
                setMenuFor(null);
                document.querySelector(`.subject-btn[data-subject="${CSS.escape(subject)}"]`)?.focus();
            }
        }
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuFor]);

    return (
        <div className="subject-bar" aria-label="סינון לפי מקצוע">
            {state.subjects.map((s) => (
                <button
                    key={s}
                    type="button"
                    data-subject={s}
                    aria-haspopup="menu"
                    aria-expanded={menuFor === s}
                    className={"subject-btn" + (subjectKey(s) === subjectKey(state.activeSubject) ? " active" : "")}
                    onClick={(e) => toggleMenu(e, s)}
                >
                    {s}
                </button>
            ))}

            <button type="button" className={"subject-btn add-tab" + (newOpen ? " active" : "")} onClick={onNew}>
                + מקצוע חדש
            </button>

            {menuFor && anchor && (
                <div
                    className="subject-menu"
                    role="menu"
                    style={{ position: "fixed", top: anchor.top, right: anchor.right }}
                    onKeyDown={(e) => {
                        // Arrow keys move between the menu's items.
                        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                        const items = [...e.currentTarget.querySelectorAll(".rename-input, button.danger")];
                        const i = items.indexOf(document.activeElement);
                        const next = items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
                        e.preventDefault();
                        next.focus();
                    }}
                >
                    <span className="menu-label">שם המקצוע</span>
                    <RenameMenuItem subject={menuFor} onDone={() => setMenuFor(null)} />
                    <button
                        type="button"
                        role="menuitem"
                        className="danger"
                        onClick={() => {
                            if (confirm(`למחוק את המקצוע "${menuFor}" וכל הבחינות תחתיו?`)) deleteSubject(menuFor);
                            setMenuFor(null);
                        }}
                    >
                        מחיקת מקצוע
                    </button>
                </div>
            )}
        </div>
    );
}

/** Inline rename row inside the subject menu: Enter saves, Escape cancels. */
function RenameMenuItem({ subject, onDone }) {
    const { renameSubject } = useExams();
    const [name, setName] = useState(subject);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    function save() {
        if (subjectKey(name) !== subjectKey(subject)) renameSubject(subject, name.trim());
        onDone();
    }

    return (
        <input
            ref={inputRef}
            type="text"
            className="rename-input"
            value={name}
            aria-label={`שם חדש עבור ${subject}`}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") save();
                else if (e.key === "Escape") onDone();
            }}
        />
    );
}

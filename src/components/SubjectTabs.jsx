import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExams } from "../context/ExamsContext.jsx";
import { subjectKey } from "../utils/examUtils.js";
import Icon from "./Icon.jsx";

/** The tab bar: one tab per subject + the "+ מקצוע חדש" button. */
export default function SubjectTabs({ newOpen, onNew }) {
    const { state, setActiveSubject, deleteSubject, clearAll } = useExams();
    // Which subject's popup menu is open (null = closed).
    const [menuFor, setMenuFor] = useState(null);
    const [isMenuClosing, setIsMenuClosing] = useState(false);
    // Viewport anchor of the open menu (fixed positioning — the bar scrolls,
    // so an in-flow dropdown would get clipped by its overflow).
    const [anchor, setAnchor] = useState(null);

    function closeMenu() {
        if (!menuFor || isMenuClosing) return;
        setIsMenuClosing(true);
        setTimeout(() => {
            setMenuFor(null);
            setIsMenuClosing(false);
        }, 140);
    }

    function toggleMenu(e, subject) {
        if (menuFor === subject) {
            closeMenu();
            return;
        }
        setIsMenuClosing(false);
        const rect = e.currentTarget.getBoundingClientRect();
        // Flip above the tab when there isn't room below.
        const top = window.innerHeight - rect.bottom > 170 ? rect.bottom + 6 : Math.max(8, rect.top - 170);
        setAnchor({ right: Math.max(8, Math.min(window.innerWidth - 264, window.innerWidth - rect.right)), top });
        setMenuFor(subject);
    }

    // Close the menu on outside click / Escape.
    useEffect(() => {
        if (!menuFor || isMenuClosing) return;
        function onClick(e) {
            const inOpenMenu = e.target.closest(".subject-menu");
            if (inOpenMenu) return; // interacting with the menu itself
            if (e.target.closest(".subject-more")) return;
            closeMenu();
        }
        function onKey(e) {
            if (e.key === "Escape") {
                const subject = menuFor;
                closeMenu();
                document.querySelector(`.subject-more[data-subject="${CSS.escape(subject)}"]`)?.focus();
            }
        }
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuFor, isMenuClosing]);

    return (
        <nav className="subjects-navigation" aria-label="סינון לפי מקצוע">
            <h2 className="subjects-label">המקצועות שלי <span>{state.subjects.length}</span></h2>
            <div className="subject-bar">
            {state.subjects.map((s) => {
                const isActive = subjectKey(s) === subjectKey(state.activeSubject);
                const count = state.exams.filter(e => subjectKey(e.subject) === subjectKey(s)).length;
                return <div key={s} className={`subject-item${isActive ? " active" : ""}`}>
                <button
                    type="button"
                    data-subject={s}
                    aria-current={isActive ? "page" : undefined}
                    className="subject-btn"
                    onClick={() => { setActiveSubject(s); closeMenu(); }}
                >
                    <Icon name="book" size={17} />
                    <span className="subject-copy">
                        <span className="subject-name">{s}</span>
                        <span className="subject-exam-count">{count} בחינות</span>
                    </span>
                </button>
                <button type="button" className="subject-more" data-subject={s} title={`אפשרויות עבור ${s}`} aria-label={`אפשרויות עבור ${s}`} aria-haspopup="menu" aria-expanded={menuFor === s} onClick={(e) => toggleMenu(e, s)}><Icon name="settings" size={17} /></button>
                </div>;
            })}
            </div>

            <button type="button" className={"subject-btn add-tab" + (newOpen ? " active" : "")} onClick={onNew}>
                <Icon name="plus" size={17} />מקצוע חדש
            </button>
            <button type="button" className="sidebar-clear" onClick={clearAll}><Icon name="trash" size={15} />ניקוי הכול</button>

            {menuFor && anchor && createPortal(
                <div
                    className={`subject-menu ${isMenuClosing ? "is-closing" : ""}`}
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
                    <RenameMenuItem key={menuFor} subject={menuFor} onDone={closeMenu} />
                    <button
                        type="button"
                        role="menuitem"
                        className="danger"
                        onClick={() => {
                            if (confirm(`למחוק את המקצוע "${menuFor}" וכל הבחינות תחתיו?`)) deleteSubject(menuFor);
                            closeMenu();
                        }}
                    >
                        מחיקת מקצוע
                    </button>
                </div>, document.body
            )}
        </nav>
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
                else if (e.key === "Escape") {
                    e.stopPropagation();
                    onDone();
                    document.querySelector(`.subject-more[data-subject="${CSS.escape(subject)}"]`)?.focus();
                }
            }}
        />
    );
}

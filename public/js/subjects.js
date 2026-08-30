// Subject tab bar (tab selector — no "הכל") + inline add-exam / new-subject rows.

import { dom } from "./dom.js";
import { getSubjects, findExam, getActiveSubject, setActiveSubject, addSubjectToState } from "./state.js";
import { subjectKey } from "./utils.js";
import { applyFilter, updateEmpty } from "./cards.js";

// Are the inline rows open?
let addOpen = false;
let newSubjectOpen = false;

/** Create a subject (or switch to it if it already exists) and make it active. */
export function createSubject(rawName) {
    const name = String(rawName || "").trim();
    if (!name) return false;
    addSubjectToState(name); // no-op when the subject already exists
    setActiveSubject(name);  // jump to that tab (new or existing)
    refreshSubjects();
    return true;
}

/** Rebuild the tab bar: one tab per subject + "+ הוספת בחינה" + "+ מקצוע חדש". */
export function renderSubjectBar() {
    const subjects = getSubjects();
    // If the active subject no longer exists, fall back to the first one.
    if (!subjects.some((s) => subjectKey(s) === subjectKey(getActiveSubject()))) {
        setActiveSubject(subjects[0] || null);
    }

    dom.subjectBar.innerHTML = "";
    subjects.forEach((s) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "subject-btn" + (subjectKey(s) === subjectKey(getActiveSubject()) ? " active" : "");
        btn.textContent = s;
        btn.addEventListener("click", () => {
            if (subjectKey(s) === subjectKey(getActiveSubject())) return;
            setActiveSubject(s);
            refreshSubjects();
        });
        dom.subjectBar.appendChild(btn);
    });

    // "Add exam" tab — opens the inline add row (exam is tagged with the active tab).
    const addTab = document.createElement("button");
    addTab.type = "button";
    addTab.className = "subject-btn add-tab" + (addOpen ? " active" : "");
    addTab.textContent = "+ הוספת בחינה";
    addTab.addEventListener("click", () => {
        if (!addOpen) openAddRow();
    });
    dom.subjectBar.appendChild(addTab);

    // "New subject" button at the end of the bar.
    const newBtn = document.createElement("button");
    newBtn.type = "button";
    newBtn.className = "subject-btn add-tab" + (newSubjectOpen ? " active" : "");
    newBtn.textContent = "+ מקצוע חדש";
    newBtn.addEventListener("click", () => {
        if (!newSubjectOpen) openNewSubjectRow();
    });
    dom.subjectBar.appendChild(newBtn);
}

/** Open the inline add row; the exam will be tagged with the active tab. */
export function openAddRow() {
    addOpen = true;
    renderSubjectBar();
    dom.addHint.textContent = getActiveSubject() ? `תיוג אוטומטי: ${getActiveSubject()}` : "בחר מקצוע בלשוניות למעלה";
    dom.addForm.hidden = false;
    dom.nameInput.focus();
}

export function closeAddRow() {
    if (!addOpen) return;
    addOpen = false;
    dom.addForm.hidden = true;
    renderSubjectBar();
}

/** Open the inline "new subject" row under the tab bar. */
export function openNewSubjectRow() {
    newSubjectOpen = true;
    renderSubjectBar();
    dom.newSubjectInput.value = "";
    dom.newSubjectForm.hidden = false;
    dom.newSubjectInput.focus();
}

export function closeNewSubjectRow() {
    if (!newSubjectOpen) return;
    newSubjectOpen = false;
    dom.newSubjectForm.hidden = true;
    renderSubjectBar();
}

/** Refresh the tab bar, re-apply the filter, counter and view visibility. */
export function refreshSubjects() {
    renderSubjectBar();
    applyFilter();
    updateEmpty();
    syncViews();
}

/** Central visibility switch: "no subjects" screen vs main menu (list/detail). */
export function syncViews() {
    const m = String(location.hash || "").match(/^#\/exam\/(\d+)$/);
    const onDetail = !!m && !!findExam(Number(m[1]));
    const hasSubjects = getSubjects().length > 0;

    dom.detailView.hidden = !onDetail;
    dom.listView.hidden = onDetail || !hasSubjects;
    dom.emptyView.hidden = hasSubjects || onDetail;
    dom.subjectBar.hidden = !hasSubjects;
}

/** One-time wiring: cancel buttons for the inline rows. */
export function wireSubjectEvents() {
    dom.addCancel.addEventListener("click", closeAddRow);
    dom.newSubjectCancel.addEventListener("click", closeNewSubjectRow);
}

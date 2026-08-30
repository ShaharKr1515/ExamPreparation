// User-facing actions: each one updates state AND keeps the UI in sync.

import { dom } from "./dom.js";
import { getExams, addExamToState, removeExamFromState, clearAllExams, clearAllSubjects } from "./state.js";
import { buildCard, renderGrid, updateEmpty } from "./cards.js";
import { refreshSubjects, closeAddRow, closeNewSubjectRow } from "./subjects.js";

/** Create an exam (tagged with the given subject) and append its card. */
export function addExam(name, subject) {
    const exam = addExamToState(name, subject);

    dom.grid.querySelector(".empty-msg")?.remove();
    dom.grid.appendChild(buildCard(exam));
    refreshSubjects(); // re-render tabs + filter (active tab unchanged → visible)
    updateEmpty();

    // Reset the add form for the next exam.
    dom.nameInput.value = "";
    closeAddRow();
}

/** Delete an exam from state and (if visible) remove its card. */
export function removeExam(id) {
    removeExamFromState(id);
    dom.grid.querySelector(`.exam-card[data-id="${id}"]`)?.remove();
    refreshSubjects();
    updateEmpty();
}

/** Wipe every exam AND subject — back to the "create your first subject" screen. */
export function clearAll() {
    if (getExams().length === 0) return;
    if (!confirm("למחוק את כל הבחינות?")) return;
    clearAllExams();
    clearAllSubjects();
    closeAddRow();
    closeNewSubjectRow();
    renderGrid();      // rebuilds the (now empty) grid
    refreshSubjects(); // re-render tabs + switch to the "no subjects" screen
}

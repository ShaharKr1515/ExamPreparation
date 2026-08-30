// Entry point: wire up events and start routing. Loaded as an ES module from
// index.html (<script type="module" src="js/main.js">).

import { dom } from "./dom.js";
import { getActiveSubject } from "./state.js";
import { route } from "./router.js";
import { wireEditingEvents } from "./cards.js";
import { refreshSubjects, wireSubjectEvents, createSubject, closeNewSubjectRow } from "./subjects.js";
import { wireDetailEvents } from "./detail.js";
import { addExam, removeExam, clearAll } from "./actions.js";

// --- List view events ---------------------------------------------------------

// Add exam: the subject is always the active tab — no separate field.
dom.addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = dom.nameInput.value.trim();
    const subject = getActiveSubject();
    if (!subject) return; // no subjects → the add row can't be open anyway
    addExam(name, subject);
});

dom.clearBtn.addEventListener("click", clearAll);

// Delegated editing (name / success / date / points) on the grid.
wireEditingEvents(dom.grid);

// Delete buttons live inside cards; delegate through the grid.
dom.grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;
    removeExam(Number(btn.closest(".exam-card").dataset.id));
});

// --- Create subject -----------------------------------------------------------

// First-subject form on the "no subjects" screen.
dom.firstSubjectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (createSubject(dom.firstSubjectInput.value)) dom.firstSubjectInput.value = "";
});

// Inline new-subject row under the tab bar.
dom.newSubjectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (createSubject(dom.newSubjectInput.value)) closeNewSubjectRow();
});

// --- Detail view events -------------------------------------------------------

wireDetailEvents();

// --- Bootstrap ------------------------------------------------------------------

wireSubjectEvents(); // cancel buttons for the inline rows
refreshSubjects();   // initial render of the tab bar + view visibility
route();             // show the right view for the current hash

window.addEventListener("hashchange", route);

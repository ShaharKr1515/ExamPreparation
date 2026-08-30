// Hash-based routing: "#/" (or empty) → list view, "#/exam/<id>" → detail view.

import { findExam } from "./state.js";
import { renderGrid } from "./cards.js";
import { buildDetail } from "./detail.js";
import { syncViews } from "./subjects.js";

/** Show the right view for the current hash and (re)build its content. */
export function route() {
    const m = String(location.hash || "").match(/^#\/exam\/(\d+)$/);
    if (m) {
        const exam = findExam(Number(m[1]));
        if (!exam) { location.hash = "#/"; return; }
        buildDetail(exam);
    } else {
        renderGrid(); // refresh cards in case the exam was edited on its page
    }
    syncViews(); // central visibility update (list / detail / no-subjects screen)
}

export function openExamPage(id) {
    location.hash = `#/exam/${id}`;
}

// The exam detail page (#/exam/<id>): back link, title card, full-width table.

import { dom } from "./dom.js";
import { buildQuestionTable, wireEditingEvents } from "./cards.js";
import { removeExamFromState } from "./state.js";

/** Build the whole detail view for one exam (replaces its content). */
export function buildDetail(exam) {
    const view = dom.detailView;
    view.innerHTML = "";

    // Back link
    const back = document.createElement("button");
    back.type = "button";
    back.className = "back-link";
    back.textContent = "← חזרה לרשימת הבחינות";
    back.addEventListener("click", () => { location.hash = "#/"; });
    view.appendChild(back);

    // Title card: name + subject badge + delete
    const titleCard = document.createElement("div");
    titleCard.className = "detail-title-card table-card";
    const h2 = document.createElement("h2");
    h2.textContent = exam.name || "ללא שם";
    titleCard.appendChild(h2);

    if (exam.subject && exam.subject.trim()) {
        const badge = document.createElement("span");
        badge.className = "subject-badge inline";
        badge.textContent = exam.subject;
        titleCard.appendChild(badge);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn danger-ghost small";
    del.textContent = "מחיקת בחינה";
    del.addEventListener("click", () => {
        if (confirm(`למחוק את הבחינה "${exam.name || "ללא שם"}"?`)) {
            removeExamFromState(exam.id);
            location.hash = "#/";
        }
    });
    titleCard.appendChild(del);
    view.appendChild(titleCard);

    // The questions table (same structure as the card, but full width).
    // data-exam-id lets syncField() resolve which exam is being edited.
    const wrap = document.createElement("div");
    wrap.className = "table-card detail-table-wrap";
    wrap.dataset.examId = String(exam.id);
    const table = buildQuestionTable(exam);
    table.classList.add("detail-table");
    wrap.appendChild(table);
    view.appendChild(wrap);
}

/** One-time wiring for the detail view (same handlers as the grid). */
export function wireDetailEvents() {
    wireEditingEvents(dom.detailView);
}

// Building and syncing exam question tables / list-view cards.

import { dom } from "./dom.js";
import { getExams, findExam, getActiveSubject } from "./state.js";
import { todayStr, daysSince, subjectKey } from "./utils.js";

const QUESTION_HEADERS = ["שאלה", "הצלחה", "תאריך אחרון", "נקודות"];

/** Color the success <select> green/red to match its value. */
export function paintSuccess(sel) {
    sel.classList.toggle("ok", sel.value === "yes");
    sel.classList.toggle("bad", sel.value === "no");
}

// Row states, in priority order:
//  - green when success is achieved (always wins)
//  - purple when the last attempt is at least 3 days old (regardless of outcome)
//  - red when the question was failed within the last 3 days
export function refreshRow(tr, q) {
    if (!tr) return;
    const days = daysSince(q.date);
    const ok = q.success === "yes";
    const stale = !ok && days !== null && days >= 3;
    const failed = !ok && !stale && q.success === "no";
    tr.classList.toggle("row-ok", ok);
    tr.classList.toggle("row-bad", failed);
    tr.classList.toggle("row-stale", stale);
}

/** One editable row (success select, date input, points input) for question qi. */
function buildQuestionRow(exam, q, qi) {
    const tr = document.createElement("tr");

    const numTd = document.createElement("td");
    numTd.className = "q-num";
    numTd.textContent = String(qi + 1);
    tr.appendChild(numTd);

    // Success
    const sTd = document.createElement("td");
    const sel = document.createElement("select");
    sel.className = "cell";
    sel.dataset.q = qi;
    sel.dataset.field = "success";
    sel.append(
        new Option("—", ""),
        new Option("הצלחה", "yes"),
        new Option("כישלון", "no"),
    );
    sel.value = q.success;
    paintSuccess(sel);
    sTd.appendChild(sel);
    tr.appendChild(sTd);

    // Last date
    const dTd = document.createElement("td");
    const dIn = document.createElement("input");
    dIn.type = "date";
    dIn.className = "cell date";
    dIn.dataset.q = qi;
    dIn.dataset.field = "date";
    dIn.value = q.date;
    dTd.appendChild(dIn);
    tr.appendChild(dTd);

    // Points
    const pTd = document.createElement("td");
    const pIn = document.createElement("input");
    pIn.type = "number";
    pIn.min = "0";
    pIn.inputMode = "numeric";
    pIn.className = "cell points";
    pIn.dataset.q = qi;
    pIn.dataset.field = "points";
    pIn.value = q.points;
    pTd.appendChild(pIn);
    tr.appendChild(pTd);

    refreshRow(tr, q);
    return tr;
}

/** The 5-question table shared by list cards and the detail page. */
export function buildQuestionTable(exam) {
    const table = document.createElement("table");
    table.className = "q-table";
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    QUESTION_HEADERS.forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    exam.questions.forEach((q, qi) => tbody.appendChild(buildQuestionRow(exam, q, qi)));
    table.appendChild(tbody);
    return table;
}

/** A list-view card: clickable name header + subject badge + question table. */
export function buildCard(exam) {
    const card = document.createElement("div");
    card.className = "exam-card";
    card.dataset.id = exam.id;

    // Header: editable exam name + delete button.
    const head = document.createElement("div");
    head.className = "card-head";
    const nameField = document.createElement("input");
    nameField.type = "text";
    nameField.className = "cell exam-name";
    nameField.placeholder = "ללא שם";
    nameField.value = exam.name;
    nameField.title = "לחץ לפתיחת עמוד הבחינה";
    head.appendChild(nameField);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.title = "מחיקת בחינה";
    del.setAttribute("aria-label", "מחיקת בחינה");
    del.textContent = "✕";
    head.appendChild(del);
    card.appendChild(head);

    // Subject badge (the מקצוע this exam is filtered by)
    if (exam.subject && exam.subject.trim()) {
        const badge = document.createElement("div");
        badge.className = "subject-badge";
        badge.textContent = exam.subject;
        card.appendChild(badge);
    }

    // Clicking on the card (outside of editable fields and the delete button)
    // opens this exam's dedicated page.
    card.addEventListener("click", (e) => {
        if (e.target.closest(".delete-btn")) return;
        if (e.target.closest("input, select")) return; // keep inline editing usable
        location.hash = `#/exam/${exam.id}`;
    });

    card.appendChild(buildQuestionTable(exam));
    return card;
}

/** Rebuild every card from state so the list always reflects edits made on a
 *  detail page (the two views share one `exams` array, but separate DOM trees). */
export function renderGrid() {
    dom.grid.innerHTML = "";
    getExams().forEach((exam) => dom.grid.appendChild(buildCard(exam)));
    applyFilter();
    updateEmpty();
}

/** Show/hide the "no exams yet" message and keep the counter in sync.
 *  Counts only the exams visible under the active subject tab. */
export function updateEmpty() {
    const grid = dom.grid;
    const active = getActiveSubject();
    const visibleCount = getExams().filter(
        (e) => !active || subjectKey(e.subject) === subjectKey(active),
    ).length;

    if (visibleCount === 0) {
        let empty = grid.querySelector(".empty-msg");
        if (!empty) {
            empty = document.createElement("div");
            empty.className = "empty-msg";
            grid.appendChild(empty);
        }
        empty.textContent = 'אין עדיין בחינות תחת המקצוע הזה — לחץ על "+ הוספת בחינה".';
    } else {
        grid.querySelector(".empty-msg")?.remove();
    }

    dom.countEl.textContent = visibleCount === 1 ? "בחינה אחת" : `${visibleCount} בחינות`;
}

/** Hide cards that don't belong to the active subject tab. */
export function applyFilter() {
    const grid = dom.grid;
    const active = getActiveSubject();
    grid.querySelectorAll(".exam-card").forEach((card) => {
        const exam = findExam(Number(card.dataset.id));
        if (!exam) return;
        const match = !!active && subjectKey(exam.subject) === subjectKey(active);
        card.style.display = match ? "" : "none";
    });
}

// --- Field editing (shared by list view and detail view) ---------------------

/** Copy an edited input/select back into state, stamping today's date on the
 *  first touch of an empty row. */
export function syncField(target) {
    // The exam id lives on the card (list view) or on [data-exam-id] (detail view).
    const host = target.closest(".exam-card") || target.closest("[data-exam-id]");
    if (!host) return;
    const examId = Number(host.dataset.id || host.dataset.examId);
    const exam = findExam(examId);
    if (!exam) return;

    if (target.classList.contains("exam-name")) {
        exam.name = target.value;
        return;
    }

    const field = target.dataset.field;
    const qi = Number(target.dataset.q);
    if (!field || Number.isNaN(qi) || !exam.questions[qi]) return;

    const q = exam.questions[qi];
    const tr = target.closest("tr");

    // First touch on an empty row: stamp today's date automatically.
    if ((field === "success" || field === "points") && !q.date) {
        q.date = todayStr();
        const dIn = tr?.querySelector('input[data-field="date"]');
        if (dIn) dIn.value = q.date;
    }

    q[field] = target.value;
    if (field === "success") paintSuccess(target);
    refreshRow(tr, q);
}

/** Wire the delegated input/change handlers on a container (grid or detail view). */
export function wireEditingEvents(container) {
    container.addEventListener("input", (e) => {
        if (e.target.matches("input, select")) syncField(e.target);
    });
    container.addEventListener("change", (e) => {
        if (e.target.matches("select")) syncField(e.target);
    });
}

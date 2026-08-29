const QUESTION_COUNT = 5;

let nextId = 1;
// State lives only in memory — nothing is ever written to disk or storage.
const exams = []; // { id, name, questions: [{ success, date, points }] }

const grid = document.getElementById("exam-grid");
const addForm = document.getElementById("add-form");
const nameInput = document.getElementById("exam-name");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-all");

function emptyQuestion() {
    return { success: "", date: "", points: "" };
}

function makeExam(name) {
    return {
        id: nextId++,
        name,
        questions: Array.from({ length: QUESTION_COUNT }, emptyQuestion),
    };
}

function paintSuccess(sel) {
    sel.classList.toggle("ok", sel.value === "yes");
    sel.classList.toggle("bad", sel.value === "no");
}

function buildCard(exam) {
    const card = document.createElement("div");
    card.className = "exam-card";
    card.dataset.id = exam.id;

    // Header: exam name + delete button
    const head = document.createElement("div");
    head.className = "card-head";
    const nameField = document.createElement("input");
    nameField.type = "text";
    nameField.className = "cell exam-name";
    nameField.placeholder = "ללא שם";
    nameField.value = exam.name;
    head.appendChild(nameField);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.title = "מחיקת בחינה";
    del.setAttribute("aria-label", "מחיקת בחינה");
    del.textContent = "✕";
    head.appendChild(del);
    card.appendChild(head);

    // Questions stacked vertically: one row per question
    const table = document.createElement("table");
    table.className = "q-table";
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    ["שאלה", "הצלחה", "תאריך אחרון", "נקודות"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    exam.questions.forEach((q, qi) => {
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

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);

    return card;
}

function updateEmpty() {
    const empty = grid.querySelector(".empty-msg");
    if (exams.length === 0) {
        if (!empty) {
            const div = document.createElement("div");
            div.className = "empty-msg";
            div.textContent = "עדיין אין בחינות — הוסף בחינה ראשונה באמצעות השורה למעלה.";
            grid.appendChild(div);
        }
    } else if (empty) {
        empty.remove();
    }

    countEl.textContent =
        exams.length === 1 ? "בחיה אחת" : `${exams.length} בחינות`;
}

function addExam(name) {
    const exam = makeExam(name);
    exams.push(exam);
    const empty = grid.querySelector(".empty-msg");
    if (empty) empty.remove();
    grid.appendChild(buildCard(exam));
    updateEmpty();
    nameInput.value = "";
    nameInput.focus();
}

function removeExam(id) {
    const idx = exams.findIndex((e) => e.id === id);
    if (idx === -1) return;
    exams.splice(idx, 1);
    grid.querySelector(`.exam-card[data-id="${id}"]`)?.remove();
    updateEmpty();
}

addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addExam(nameInput.value.trim());
});

clearBtn.addEventListener("click", () => {
    if (exams.length === 0) return;
    if (confirm("למחוק את כל הבחינות?")) {
        exams.length = 0;
        grid.innerHTML = "";
        updateEmpty();
    }
});

function syncField(target) {
    const card = target.closest(".exam-card");
    const exam = exams.find((x) => x.id === Number(card?.dataset.id));
    if (!exam) return;

    if (target.classList.contains("exam-name")) {
        exam.name = target.value;
        return;
    }

    const field = target.dataset.field;
    const qi = Number(target.dataset.q);
    if (field && !Number.isNaN(qi) && exam.questions[qi]) {
        exam.questions[qi][field] = target.value;
        if (field === "success") paintSuccess(target);
    }
}

grid.addEventListener("input", (e) => {
    if (e.target.matches("input, select")) syncField(e.target);
});
grid.addEventListener("change", (e) => {
    if (e.target.matches("select")) syncField(e.target);
});

grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;
    removeExam(Number(btn.closest(".exam-card").dataset.id));
});

updateEmpty();

const QUESTION_COUNT = 5;

let nextId = 1;
// State lives only in memory — nothing is ever written to disk or storage.
const exams = []; // { id, name, questions: [{ success, date, points }] }

const tbody = document.getElementById("exam-body");
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

function buildRow(exam) {
    const tr = document.createElement("tr");
    tr.dataset.id = exam.id;

    // Exam name (first column)
    const nameTd = document.createElement("td");
    nameTd.className = "sticky";
    const nameField = document.createElement("input");
    nameField.type = "text";
    nameField.className = "cell exam-name";
    nameField.placeholder = "ללא שם";
    nameField.value = exam.name;
    nameTd.appendChild(nameField);
    tr.appendChild(nameTd);

    // 5 questions x (success, last date, points)
    exam.questions.forEach((q, qi) => {
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
    });

    // Delete button
    const actTd = document.createElement("td");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.title = "מחיקת בחינה";
    del.setAttribute("aria-label", "מחיקת בחינה");
    del.textContent = "✕";
    actTd.appendChild(del);
    tr.appendChild(actTd);

    return tr;
}

function updateEmpty() {
    const empty = tbody.querySelector("tr.empty");
    if (exams.length === 0) {
        if (!empty) {
            const tr = document.createElement("tr");
            tr.className = "empty";
            const td = document.createElement("td");
            td.colSpan = 2 + QUESTION_COUNT * 3;
            td.textContent = "עדיין אין בחינות בטבלה — הוסף בחינה ראשונה באמצעות השורה למעלה.";
            tr.appendChild(td);
            tbody.prepend(tr);
        }
    } else if (empty) {
        empty.remove();
    }

    countEl.textContent =
        exams.length === 1 ? "בחיה אחת בטבלה" : `${exams.length} בחינות בטבלה`;
}

function addExam(name) {
    const exam = makeExam(name);
    exams.push(exam);
    const empty = tbody.querySelector("tr.empty");
    if (empty) empty.remove();
    tbody.appendChild(buildRow(exam));
    updateEmpty();
    nameInput.value = "";
    nameInput.focus();
}

function removeExam(id) {
    const idx = exams.findIndex((e) => e.id === id);
    if (idx === -1) return;
    exams.splice(idx, 1);
    tbody.querySelector(`tr[data-id="${id}"]`)?.remove();
    updateEmpty();
}

addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addExam(nameInput.value.trim());
});

clearBtn.addEventListener("click", () => {
    if (exams.length === 0) return;
    if (confirm("למחוק את כל הבחינות מהטבלה?")) {
        exams.length = 0;
        tbody.innerHTML = "";
        updateEmpty();
    }
});

function syncField(target) {
    const tr = target.closest("tr");
    const exam = exams.find((x) => x.id === Number(tr?.dataset.id));
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

tbody.addEventListener("input", (e) => {
    if (e.target.matches("input, select")) syncField(e.target);
});
tbody.addEventListener("change", (e) => {
    if (e.target.matches("select")) syncField(e.target);
});

tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;
    removeExam(Number(btn.closest("tr").dataset.id));
});

updateEmpty();

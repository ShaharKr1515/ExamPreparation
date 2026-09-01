import { useExams } from "../context/ExamsContext.jsx";
import { questionRowState } from "../utils/examUtils.js";

const QUESTION_HEADERS = ["שאלה", "הצלחה", "תאריך אחרון", "נקודות"];

/** One editable row (success select, date input, points input) for question qi. */
function QuestionRow({ exam, q, qi }) {
    const { updateQuestion } = useExams();
    const stateClass = questionRowState(q); // "ok" | "stale" | "bad" | null

    return (
        <tr className={stateClass ? `row-${stateClass}` : undefined}>
            <td className="q-num">{qi + 1}</td>

            <td>
                <select
                    className={"cell" + (q.success === "yes" ? " ok" : q.success === "no" ? " bad" : "")}
                    value={q.success}
                    onChange={(e) => updateQuestion(exam.id, qi, "success", e.target.value)}
                >
                    <option value="">—</option>
                    <option value="yes">הצלחה</option>
                    <option value="no">כישלון</option>
                </select>
            </td>

            <td>
                <input
                    type="date"
                    className="cell date"
                    value={q.date}
                    onChange={(e) => updateQuestion(exam.id, qi, "date", e.target.value)}
                />
            </td>

            <td>
                <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="cell points"
                    value={q.points}
                    onChange={(e) => updateQuestion(exam.id, qi, "points", e.target.value)}
                />
            </td>
        </tr>
    );
}

/** The 5-question table shown inside each exam card. */
export default function QuestionTable({ exam }) {
    return (
        <table className="q-table">
            <thead>
                <tr>
                    {QUESTION_HEADERS.map((label) => (
                        <th key={label}>{label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {exam.questions.map((q, qi) => (
                    <QuestionRow key={qi} exam={exam} q={q} qi={qi} />
                ))}
            </tbody>
        </table>
    );
}

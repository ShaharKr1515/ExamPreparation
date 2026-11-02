# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Any individual student managing semester assignments and preparing for upcoming exams. The app is built for one student per installation — a single person tracking their own subjects (courses), assignments, and exams, not a shared or multi-tenant deployment. (Confirmed.)

## Product Purpose

A personal study and exam-preparation tracker. A student organizes work into **subjects (courses)**, each remembering its own **לימוד** (`study`) or **הכנה למבחן** (`exam`) mode. Study mode manages dated semester assignments; exam mode holds practice exams with questions that are drilled until they pass. Within exam preparation, two jobs are co-equal by design:

1. **Mastery tracking** — record, per question, whether it was solved (success / failure), when it was last attempted, and its point value, so the student can see exactly which questions still need work.
2. **Scheduling toward exam day** — pace study so each planned exam gets done before a recommended due date that leads up to the subject's final exam date.

Success means the student can look at one screen per subject and know what should be worked on next: upcoming or overdue assignments in study mode, and mastery gaps alongside recommended practice deadlines in exam mode. (Both exam-preparation jobs confirmed as co-equal.)

## Positioning

Exam preparation couples **per-question mastery state** with **automatically derived exam due-dates**. Each subject carries a study-start date, a final-exam date, and a planned exam count; the app spreads those exams evenly across that window to produce recommended "do this by" dates — and never stores them. Study mode extends the same course workspace with separate semester dates, elapsed-time context, and a chronological assignment timeline. Assignment deadlines are entered by the student and stored; they are distinct from derived practice-exam due-dates.

## Operating Context

- Desktop use is the intended workflow. Mobile adaptation is deferred.
- The subject summary gives recommended deadlines and mastery gaps equal prominence.
- Single local deployment. The student runs one instance against their own data; there are no accounts, logins, or sync.
- Data lives in a local SQLite file (`data/exampreparation.db` by default). No cloud dependency.
- Workflow: create a subject and choose its mode → in study mode, set semester dates and add dated assignments, then complete or revise them from the selected course's timeline → in exam mode, set study-start and final-exam dates and planned exam count, then drill questions and use recommended deadlines and mastery status to decide what to work on next.
- The interface is entirely in Hebrew; layout direction follows Hebrew (RTL).

## Capabilities and Constraints

Confirmed functionality:
- Each course persists its own `study` / `exam` mode in SQLite, including across reloads. Existing courses default to exam preparation. New courses can start in either mode; study-mode creation does not create practice exams. Switching mode preserves both sets of data.
- Study mode stores semester start/end dates separately from exam-preparation dates. A valid end date must follow the start date. Elapsed percentage and current-week context are derived from these bounds and today's date.
- Assignments belong to one course and support creation, title/deadline editing, deletion, and reversible completion. Each requires a nonempty title (up to 300 characters) and a valid date.
- The study workspace shows only the selected course's assignments, ordered by due date and then ID, grouped into dated timeline rows. Explicit statuses distinguish upcoming, due today, overdue, and completed work; counts distinguish assignment completion from elapsed semester time.
- The semester rail shows one marker per in-range assignment, numbered in deadline order. Nearby deadlines stack into separate lanes; hovering or focusing a marker shows its name in the shared exam-preparation tooltip, and selecting it focuses that assignment. Missing dates show an explicit prompt with an action to focus the date fields. Assignments outside the semester remain in the timeline with a label. With assignments present, today's timeline position remains visible even when nothing is due today.
- Subjects contain exams; newly created exams start with 5 questions by default, and students can add or remove questions per exam (minimum 1 question) using the action buttons below each question table.
- Each question tracks three fields: success (`yes` / `no` / unset), last-attempt date, and points.
- Each subject stores a study-start date, a final-exam date, and a planned exam count.
- Recommended exam due-dates are **derived, never stored**: computed from (study-start, final-exam, exam-count) on the frontend; any computed date that falls on/after the final-exam date is skipped.

Confirmed constraints:
- **Hebrew-only UI.** All copy is Hebrew; no i18n / multi-language support is required.
- **Single-user, local data only.** No authentication, accounts, or remote sync. Data persists in a local SQLite file.
- **Recommended practice dates must stay derived.** They are always recomputed from the three subject-level exam inputs and never persisted as independent state. Student-entered assignment deadlines and semester bounds are persisted source inputs.

## Brand Commitments

Working name: **ExamPreparation** (package `exam-preparation`). No logo, tagline, voice guidelines, or other identity assets were established or made binding. Do not invent brand assets.

## Evidence on Hand

- The running application itself is the primary evidence: React components under `src/` and the Express + SQLite backend under `backend/`.
- Data model (SQLite): `subjects` includes mode and separate semester/exam date fields; `assignments(subject_id, title, due_date, completed)` sits alongside `exams(subject_id)` and `questions(exam_id, position, success, last_date, points)`. Subjects are addressed by name over the API.

Absences future work must **not** fabricate: no testimonials, customer names, usage statistics, benchmarks, pricing, licensing claims, or deployment/marketing assets exist. Do not add them.

## Product Principles

1. **Mastery and pacing are co-equal.** Never optimize one at the expense of the other; a change that helps scheduling but obscures what is unmastered (or vice versa) is a regression.
2. **Local, private, single-student.** Keep data on-device for one student. Do not introduce accounts, sync, or multi-user features as a side effect of other work.
3. **Derive, don't store, what can be computed.** Anything recomputable from the source inputs (e.g., recommended due-dates) is derived at render time and never persisted as separate state.
4. **The interface speaks Hebrew.** All copy and layout direction serve a Hebrew-speaking student; RTL is expected.

## Accessibility & Inclusion

- The UI is Hebrew-only, which implies right-to-left layout direction throughout. New surfaces must respect RTL.
- No other product-specific accessibility standard was established beyond the language/layout requirement above.

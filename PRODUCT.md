# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Any individual student preparing for upcoming exams. The app is built for one student per installation — a single person tracking their own subjects and exams, not a shared or multi-tenant deployment. (Confirmed.)

## Product Purpose

A personal exam-preparation tracker. A student organizes work into **subjects**, each holding a set of **exams**; each exam breaks down into questions that are drilled until they pass. Two jobs are co-equal by design:

1. **Mastery tracking** — record, per question, whether it was solved (success / failure), when it was last attempted, and its point value, so the student can see exactly which questions still need work.
2. **Scheduling toward exam day** — pace study so each planned exam gets done before a recommended due date that leads up to the subject's final exam date.

Success means the student can look at one screen per subject and know both *what is not yet mastered* and *what should be worked on next*. (Both jobs confirmed as co-equal.)

## Positioning

The distinguishing mechanism is coupling **per-question mastery state** with **automatically derived exam due-dates**. Each subject carries a study-start date, a final-exam date, and a planned exam count; the app spreads those exams evenly across that window to produce recommended "do this by" dates — and never stores them. A neighboring generic checklist or calendar tool could not truthfully copy this: it is the specific combination of (a) fixed per-question success/date/points tracking inside each exam, and (b) due-dates recomputed from those three subject-level inputs on every render.

## Operating Context

- Single local deployment. The student runs one instance against their own data; there are no accounts, logins, or sync.
- Data lives in a local SQLite file (`data/exampreparation.db` by default). No cloud dependency.
- Workflow: create subjects → set each subject's study-start and final-exam dates and planned exam count → add exams under a subject → drill the questions of each exam, marking success/failure, last-attempt date, and points → watch recommended due dates and per-question status to decide what to work on next.
- The interface is entirely in Hebrew; layout direction follows Hebrew (RTL).

## Capabilities and Constraints

Confirmed functionality:
- Subjects contain exams; newly created exams start with 5 questions by default, and students can add or remove questions per exam (minimum 1 question) using the action buttons below each question table.
- Each question tracks three fields: success (`yes` / `no` / unset), last-attempt date, and points.
- Each subject stores a study-start date, a final-exam date, and a planned exam count.
- Recommended exam due-dates are **derived, never stored**: computed from (study-start, final-exam, exam-count) on the frontend; any computed date that falls on/after the final-exam date is skipped.

Confirmed constraints:
- **Hebrew-only UI.** All copy is Hebrew; no i18n / multi-language support is required.
- **Single-user, local data only.** No authentication, accounts, or remote sync. Data persists in a local SQLite file.
- **Recommended dates must stay derived.** They are always recomputed from the three subject-level inputs and never persisted as independent state.

## Brand Commitments

Working name: **ExamPreparation** (package `exam-preparation`). No logo, tagline, voice guidelines, or other identity assets were established or made binding. Do not invent brand assets.

## Evidence on Hand

- The running application itself is the primary evidence: React components under `src/` and the Express + SQLite backend under `backend/`.
- Data model (SQLite): `subjects`, `exams(subject_id)`, `questions(exam_id, position, success, last_date, points)`; subjects are addressed by name over the API.

Absences future work must **not** fabricate: no testimonials, customer names, usage statistics, benchmarks, pricing, licensing claims, or deployment/marketing assets exist. Do not add them.

## Product Principles

1. **Mastery and pacing are co-equal.** Never optimize one at the expense of the other; a change that helps scheduling but obscures what is unmastered (or vice versa) is a regression.
2. **Local, private, single-student.** Keep data on-device for one student. Do not introduce accounts, sync, or multi-user features as a side effect of other work.
3. **Derive, don't store, what can be computed.** Anything recomputable from the source inputs (e.g., recommended due-dates) is derived at render time and never persisted as separate state.
4. **The interface speaks Hebrew.** All copy and layout direction serve a Hebrew-speaking student; RTL is expected.

## Accessibility & Inclusion

- The UI is Hebrew-only, which implies right-to-left layout direction throughout. New surfaces must respect RTL.
- No other product-specific accessibility standard was established beyond the language/layout requirement above.

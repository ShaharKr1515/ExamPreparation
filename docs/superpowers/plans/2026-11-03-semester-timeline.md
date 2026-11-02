# Course modes and semester timeline implementation plan

> Execute inline using superpowers:executing-plans. User approved the first version in chat.

**Goal:** Each course remembers לימוד or הכנה למבחן; לימוד shows that course's semester timeline and dated assignments.

**Architecture:** Extend SQLite subjects with independent semester dates and a mode defaulting to exam preparation. Store assignments under subjects with cascading deletion. Keep timeline positions and progress derived from dates and completion flags. Reuse React context, the save queue, Hebrew RTL, and existing design tokens.

**Approved scope:** Editable semester start/end dates; add, edit, delete, and complete dated assignments; a today marker; semester elapsed and assignment completion indicators. Existing exam tools and data remain available when switching modes. Only the selected course appears.

**Global constraints:** Local single-user data, Hebrew-only interface, Node >=24, no new runtime dependencies. Reuse the current checkout per desktop instructions. No commit, deployment, or publication required.

**Review focus:** Existing databases default correctly; assignment identities survive course renaming; assignments cannot be edited through another course; invalid dates are rejected; dense/same-day timelines remain readable and usable by keyboard.

### Task 1: Persistence and API

- [x] Write failing integration tests for defaults, mode/date updates, assignment CRUD, validation, course isolation, rename and deletion.
- [x] Run `node --import ./test/setup.js --test test/semester.test.js`; confirm missing-feature failures.
- [x] Add idempotent subject migrations in `backend/db/database.js`, subject settings and assignment services in `backend/services/semesterService.js`, routes in `backend/routes/subjects.routes.js`, and hydrate the new fields in `backend/services/examService.js`.
- [x] Run the integration tests; expect pass.

Interfaces: metadata `{ mode: 'study'|'exam', semesterStartDate, semesterEndDate }`; assignments `{ id, subject, title, dueDate, completed }`; `PATCH /api/subjects/:name/semester`; `POST /api/subjects/:name/assignments`; `PATCH|DELETE /api/subjects/:name/assignments/:id`.

### Task 2: Derived semester model

- [x] Write failing tests for `getSemesterProgress(start, end, today)` and `getAssignmentStatus(assignment, today)` in `test/semesterTimeline.test.js`.
- [x] Implement date-only UTC arithmetic in `src/utils/semesterTimeline.js`; handle missing/invalid/reversed dates, before/after semester, and overdue/today/completed assignments.
- [x] Run both new test files; expect pass.

### Task 3: Course workspace

- [x] Extend API client and context with queued semester/assignment operations, including rename/delete cleanup.
- [x] Add `CourseModeSwitch.jsx`, `SemesterWorkspace.jsx`, `AssignmentForm.jsx`, and `semester.css` using incumbent blue/graphite/Heebo tokens.
- [x] Render a date-proportional RTL semester rail, today marker, and linked dated assignment markers. Number individual markers chronologically, stack nearby markers, and provide a chronological assignment list with completion and edit/delete controls. Assignments outside the semester remain visible.
- [x] Add mode selection to new course creation; show semester date fields for study mode and create no exams there. Preserve exam defaults.
- [x] Run `npm test`, `npm run build`, and `git diff --check`.
- [x] Verify actual browser flows with isolated temporary data: create, complete, edit, reload, switch modes/courses; inspect desktop and narrow layout. Obtain a fresh review and update product/surface documentation.

## Progress

Complete. Full suite: 61 tests passed. Production build and git diff checks passed. Browser verification covered desktop (1280×720), narrow layout (390×844), assignment creation/editing/completion/reload, new study-course creation, and study→study and study→exam mode switches. A fresh reviewer returned ship with no material findings. Existing local API was confirmed to expose modes and assignments. Documentation updated; preexisting design-sidecar drift remains outside scope. Screenshots use a separate temporary sample database.


## Requested timeline refinements

- Added a visible missing-date prompt and an action focusing the required date inputs.
- Reused the existing exam-preparation Tooltip for assignment names, dates, and status on hover or keyboard focus.
- Replaced weekly counts with individual markers numbered in deadline order, keeping completed assignment numbers and separating nearby deadlines into lanes.
- Full suite: 62 tests pass; production build and diff checks pass. Desktop and mobile browser verification covered prompt focus, sequential numbers, tooltip text/containment, and Enter navigation.

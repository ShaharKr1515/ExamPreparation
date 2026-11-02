# Exam Preparation Tracker

A small, single-user study tracker for semester assignments, practice-exam planning, and question-level progress. It is designed for local use or simple self-hosting: there are no accounts, authentication flows, or multi-user features.

## Highlights

- React 18 interface with a Vite development and production build
- Express 5 REST API backed by Node's built-in SQLite module
- Per-course persisted לימוד (`study`) and הכנה למבחן (`exam`) modes; existing courses default to exam preparation
- Separate semester dates, dated assignment creation/editing/deletion/completion, and a chronological timeline for the selected course
- Derived practice-exam scheduling based on study dates and planned exam counts
- Question and sub-question tracking, including outcomes, points, attempt dates, and retry counts
- Per-question timers that persist with the rest of the study data
- Node test suite for scheduling, countdowns, layout copying, and retry behavior
- Multi-stage Docker image with persistent SQLite storage
- GitHub Actions publishing to the GitHub Container Registry (GHCR) after tests and a production build pass

The interface is in Hebrew and uses a right-to-left layout.

## Architecture

The React frontend calls an Express REST API. During development, Vite serves the frontend on port 5173 and proxies `/api` requests to Express on port 3000. In production, Express serves the compiled `dist/` assets and the API from one process.

SQLite data is stored in `data/exampreparation.db` by default, including course modes, semester dates, and assignment deadlines/completion. Semester dates are separate from exam-preparation dates. Recommended practice-exam dates are derived from each subject's study start date, final exam date, and planned exam count rather than stored as duplicate state.

This is intentionally a single-user application. Run it on your computer or behind the access controls of a trusted self-hosted environment; it does not implement application-level authentication or user isolation.

Select a course, then choose לימוד to set semester dates and manage its assignments. A prompt explains that dates are needed to display the semester rail. The rail shows elapsed time and individual assignment markers numbered in deadline order; hover or focus a marker to see its name. The dated timeline shows completion and overdue status, including assignments outside the semester bounds. Choose הכנה למבחן for the practice-exam workflow. Each course remembers its mode across reloads, and switching preserves its exam and assignment data. New study-mode courses start without practice exams.

## Requirements

- Node.js 24 or newer
- npm

Node 24 is required because the backend uses `node:sqlite`.

## Development

Install dependencies:

```bash
npm ci
```

Run the Express API with file watching in one terminal:

```bash
npm run server:dev
```

Run Vite in a second terminal:

```bash
npm run dev
```

Open `http://localhost:5173`. Vite provides frontend hot module replacement and proxies API calls to `http://localhost:3000`.

## Tests and production build

```bash
npm test
npm run build
```

`npm test` always uses an isolated in-memory SQLite database; integration tests never use the application's stored study data.

## Production

Install exactly the locked dependencies, build the frontend, and start Express:

```bash
npm ci
npm run build
npm start
```

Open `http://localhost:3000` unless `PORT` is set to a different value.

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port used by the production Express server |
| `DATABASE_PATH` | `./data/exampreparation.db` | SQLite database file; `:memory:` is also supported for temporary runs and tests |

The directory containing `DATABASE_PATH` is created automatically.

## Docker

Build the image:

```bash
docker build -t exam-preparation .
```

Run it with `/data` persisted in a named volume:

```bash
docker volume create exam-preparation-data
docker run --rm \
  -p 3000:3000 \
  -v exam-preparation-data:/data \
  exam-preparation
```

The container sets `DATABASE_PATH=/data/exampreparation.db`. Mounting `/data` keeps the SQLite database when the container is replaced.

Pushes to `main` run the test suite and production build before publishing `ghcr.io/shaharkr1515/exampreparation:latest` to GHCR.

## Project structure

```text
backend/             Express app, routes, services, and SQLite access
public/              Static assets copied by Vite
src/                 React components, state, API client, and styles
test/                Node test suite
data/                Local SQLite storage (ignored by Git and Docker)
Dockerfile           Multi-stage production image
vite.config.js       Vite configuration and development API proxy
```

## Main API routes

- `GET /api/state` returns the complete application state.
- `/api/subjects` provides subject create, update, and delete operations.
- `PATCH /api/subjects/:name/semester` updates `mode`, `semesterStartDate`, and/or `semesterEndDate`.
- `POST /api/subjects/:name/assignments` creates an assignment with `title` and `dueDate`; `completed` defaults to `false`.
- `PATCH /api/subjects/:name/assignments/:assignmentId` updates its title, deadline, and/or completion; `DELETE` on the same path removes it. Assignment reads are included in `GET /api/state`.
- `/api/exams` provides exam and question operations, including layout copying and timer updates.
- `POST /api/clear-all` clears all stored study data.

`:name` is the URL-encoded course name. Semester and assignment dates use `YYYY-MM-DD`.

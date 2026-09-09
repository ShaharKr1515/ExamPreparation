# Exam Preparation Tracker

A personal exam preparation management application that helps students organize their study schedule and track mastery progress across multiple subjects.

## Overview

This web application combines **mastery tracking** with **intelligent scheduling** to help students prepare for exams efficiently. It tracks per-question progress while automatically calculating recommended due dates for practice exams based on your final exam schedule.

## Key Features

- **Subject Organization**: Group your exams by subject, each with its own study timeline
- **Intelligent Scheduling**: Automatically calculates recommended due dates by evenly distributing practice exams between your study start date and final exam date
- **Question-Level Tracking**: Mark each question as successful/failed, record last attempt dates, and assign point values
- **Visual Progress Monitoring**: See at a glance which questions need work and which exams are coming up
- **Clean Interface**: Hebrew RTL interface designed for focused study sessions

## Technology Stack

### Frontend
- **React 18** - Modern component-based UI
- **Vite** - Fast build tool and dev server
- **Context API** - State management

### Backend
- **Node.js** with Express 5
- **SQLite** - Local database for persistent storage
- **RESTful API** - Clean separation between frontend and backend

## Architecture Highlights

- **Derived State Pattern**: Exam due dates are computed on-the-fly from subject parameters (study start date, final exam date, exam count) rather than stored, ensuring consistency
- **Single-User Design**: Local-first architecture with no authentication overhead
- **Component-Based Structure**: Modular React components with clear separation of concerns
- **Error Boundaries**: Robust error handling at the component level

## Project Structure

```
├── backend/
│   ├── app.js              # Express application setup
│   ├── server.js           # Server entry point
│   ├── db/
│   │   └── database.js     # SQLite connection and queries
│   ├── routes/             # API route handlers
│   └── services/           # Business logic layer
├── src/
│   ├── components/         # Reusable UI components
│   ├── context/            # React Context for state management
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page-level components
│   ├── services/           # API client
│   ├── styles/             # Modular CSS files
│   └── utils/              # Helper functions
└── data/                   # SQLite database storage
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ExamPreparation
```

2. Install dependencies
```bash
npm install
```

3. Start the development servers

For development with hot reload:
```bash
npm run dev
```

For production mode:
```bash
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Usage Workflow

1. **Create Subjects**: Add subjects for your courses (e.g., Mathematics, Algorithms)
2. **Set Timeline**: For each subject, define:
   - Study start date
   - Final exam date
   - Number of practice exams you plan to complete
3. **Add Exams**: Create practice exams under each subject
4. **Track Progress**: For each question in an exam, record:
   - Success status (yes/no)
   - Last attempt date
   - Point value
5. **Follow Schedule**: Use the automatically calculated due dates to pace your study

## API Endpoints

### Subjects
- `GET /api/subjects` - Fetch all subjects
- `POST /api/subjects` - Create a new subject
- `PUT /api/subjects/:id` - Update subject details
- `DELETE /api/subjects/:id` - Delete a subject

### Exams
- `GET /api/exams` - Fetch all exams
- `POST /api/exams` - Create a new exam
- `PUT /api/exams/:id` - Update exam details
- `DELETE /api/exams/:id` - Delete an exam

## Docker Support

The project includes a Dockerfile for containerized deployment:

```bash
docker build -t exam-preparation .
docker run -p 3000:3000 exam-preparation
```

## Design Philosophy

This application prioritizes:
- **Clarity**: Students should instantly understand what needs attention
- **Efficiency**: Minimal clicks to record progress and move forward
- **Accuracy**: Derived calculations ensure dates stay consistent with study plans
- **Simplicity**: Local-first, no-account design removes unnecessary friction

## Future Enhancement Possibilities

- Statistics and progress analytics
- Export/import functionality for backup
- Customizable questions per exam
- Study streak tracking
- Mobile responsive improvements

## License

MIT License - Free to use, modify, and distribute

---

**Built with React, Node.js, and SQLite** | Single-page application with RESTful backend

# SRMS - School Result & Management System

A full-stack School Result Management System built for managing student records, teacher accounts, courses, exams, results, notices, attendance, and feedback in a school environment.

This repository contains both the backend API and the frontend web app:

- `backend/` - Express.js + MongoDB REST API
- `frontend/` - HTML, CSS, and JavaScript dashboards for admin, teacher, and student roles

## Project Overview

The system supports three main user roles:

- Admin: manage students, teachers, courses, exams, results, notices, feedback, and system settings
- Teacher: record results, manage attendance, view student records, and post notices
- Student: view courses, results, attendance, exams, notices, and submit feedback

The app uses HTTP-only cookies for authentication and stores session-related data securely on the backend.

## Features

- Role-based login for admin, teacher, and student
- Student and teacher management
- Course and exam management
- Result publishing and viewing
- Notice board for teachers and students
- School attendance tracking
- QR-based attendance support for classes 1-10
- Feedback submission and review
- Profile updates for students
- MongoDB-backed backend with secure secret-based auth
- Frontend dashboards built with plain HTML, CSS, and JavaScript

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Cookie-parser
- CORS
- dotenv

### Frontend
- HTML5
- CSS3
- JavaScript
- Static dashboard pages

## Repository Structure

```text
sms.project-
├── backend/
│   ├── config/
│   ├── controller/
│   ├── middleware/
│   ├── model/
│   ├── routers/
│   ├── .env.example
│   ├── app.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── css/
│   ├── js/
│   ├── admin-dashboard.html
│   ├── admin-login.html
│   ├── index.html
│   ├── student-dashboard.html
│   ├── student-login.html
│   ├── teacher-dashboard.html
│   ├── teacher-login.html
│   ├── README.md
│   └── vercel.json
├── README.md
└── .gitignore
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Muhammad-Faizan79/sms.project-.git
cd sms.project-
```

### 2. Setup the backend

```bash
cd backend
npm install
cp .env.example .env
```

Update the environment file with your own values:

```env
PORT=5000
mongodbURI=mongodb://127.0.0.1:27017/srms
adminSgret=replace-with-a-long-random-admin-secret
studentsgret=replace-with-a-long-random-student-secret
teacherSgret=replace-with-a-long-random-teacher-secret
QR_ATTENDANCE_SECRET=replace-with-a-different-long-random-qr-secret
FRONTEND_ORIGIN=http://localhost:5500
NODE_ENV=development
```

Run the backend:

```bash
npm run dev
```

### 3. Setup the frontend

Open the `frontend` folder and serve it locally using a static server such as VS Code Live Server or a simple local HTTP server.

Example:

```bash
cd frontend
python -m http.server 5500
```

Then open:

```text
http://localhost:5500/index.html
```

## Default Behavior

- Backend runs on `http://localhost:5000`
- API health route: `GET /api/health`
- Frontend is expected to run on `http://localhost:5500`
- Authentication uses cookies, so the backend and frontend origin must match the configured CORS settings

## Role Functionality

- Admin: manages users, courses, exams, results, notices, feedback, and system-related actions
- Teacher: manages course results, attendance, student information, and notices
- Student: views academic progress, notices, attendance, and submits feedback

## Notes

- The frontend is built using plain HTML, CSS, and JavaScript instead of a framework.
- QR attendance works best with HTTPS in production or `localhost` in development.
- The project is designed as a school management system suitable for academic administration workflows.

## License

This project is currently without an explicit license file. If you are publishing it publicly, it is recommended to add an appropriate open-source license.

## Suggested Repository Description

School management system with admin, teacher, and student dashboards for results, attendance, notices, courses, and academic records.


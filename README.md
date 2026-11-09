# SRMS - School Result Management System

A modern school management system designed to streamline academic administration for schools, colleges, and educational institutions. The platform provides role-based access for administrators, teachers, and students to manage records, results, attendance, notices, and communication more efficiently.

## Overview

This project is built as a full-stack web application with a Node.js backend and a frontend interface developed using HTML, CSS, and JavaScript. It focuses on day-to-day school operations and simplifies the management of academic information across multiple user roles.

## Key Features

- Secure role-based authentication for admin, teacher, and student users
- Student record management
- Teacher management
- Course and class administration
- Exam and result management
- Attendance tracking
- QR-based attendance support for classes 1–10
- Notice board and communication tools
- Student feedback submission and review
- Profile management for students
- Cookie-based secure session handling

## User Roles

### Admin
- Manage students, teachers, and courses
- Create and update exam records
- Publish academic results
- Review student feedback
- Manage notices and school-level data

### Teacher
- Manage assigned courses and results
- Record daily attendance
- View student information
- Post notices and updates
- Monitor academic performance

### Student
- View academic results
- Check attendance and notices
- Access course information
- Update personal profile
- Submit feedback

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- Cookie Parser
- CORS
- dotenv

### Frontend
- HTML5
- CSS3
- JavaScript
- Static dashboard screens

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

### 1. Clone the Repository

```bash
git clone https://github.com/Muhammad-Faizan79/sms.project-.git
cd sms.project-
```

### 2. Configure the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Then update the values in `.env`:

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

### 3. Run the Frontend

The frontend is a static application and can be served locally using any simple HTTP server.

Example:

```bash
cd frontend
python -m http.server 5500
```

Then open the app in the browser:

```text
http://localhost:5500/index.html
```

## Application Behavior

- Backend API runs on `http://localhost:5000`
- Health check endpoint: `GET /api/health`
- Frontend requests use cookie-based authentication
- CORS is configured for the frontend origin

## Notes

- The frontend is implemented with plain HTML, CSS, and JavaScript.
- QR attendance support works best with HTTPS in production or `localhost` during local development.
- The repository is designed as a practical school management solution for managing academic workflows.

## Project Summary

SRMS is a school result and management platform that brings academic administration into a single digital system. It helps institutions manage student performance, attendance, teacher activities, notices, and department-level operations in a simple and organized manner.

## License

This project does not currently include a dedicated license file. If this repository is intended for public distribution, consider adding an appropriate open-source license.


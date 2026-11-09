![GitHub repo size](https://img.shields.io/github/repo-size/Muhammad-Faizan79/sms.project-)  
![GitHub language count](https://img.shields.io/github/languages/count/Muhammad-Faizan79/sms.project-)  
![GitHub top language](https://img.shields.io/github/languages/top/Muhammad-Faizan79/sms.project-)  
![GitHub last commit](https://img.shields.io/github/last-commit/Muhammad-Faizan79/sms.project-)  

# SRMS - School Result Management System

A professional full-stack school management solution designed to simplify academic administration and improve operational efficiency in educational institutions. The system provides a central platform for managing student records, attendance, results, notices, and communication across multiple user roles.

## Overview

SRMS is a web-based management system tailored for schools and academic institutions. It enables administrators, teachers, and students to interact with a unified system for managing education-related data, improving transparency, and reducing manual administrative workload.

This project combines:

- A secure backend API built with Node.js and Express.js
- A MongoDB database for structured academic data storage
- A frontend built using HTML, CSS, and JavaScript
- Role-based access control for different user groups

## Why This Project?

Educational institutions often manage critical data across several disconnected tools and manual processes. SRMS brings these workflows into one place, helping schools handle:

- student and teacher management
- academic performance tracking
- class attendance monitoring
- notices and announcements
- institutional reporting

## Core Features

### Admin Features
- Manage teachers and students
- Create and update academic records
- Manage courses and classes
- Publish examination results
- Review feedback
- Manage notices and system-level data

### Teacher Features
- Manage results for assigned courses
- Record daily attendance
- View student information
- Post academic notices
- Monitor student performance

### Student Features
- View course details
- Check academic results
- Track attendance
- Access notices and announcements
- Update profile information
- Submit feedback

### Additional Capabilities
- Secure authentication using JWT and cookies
- Role-based dashboard access
- Attendance QR support for classes 1–10
- CORS-enabled API access
- MongoDB-backed persistence

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cookie Parser
- dotenv
- CORS

### Frontend
- HTML5
- CSS3
- JavaScript
- Static dashboard interface

## Project Architecture

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
├── .gitignore
└── LICENSE (if added later)
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Muhammad-Faizan79/sms.project-.git
cd sms.project-
```

### 2. Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Update the environment variables in `.env`:

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

Start the backend:

```bash
npm run dev
```

### 3. Run the Frontend

Serve the frontend using any local static server:

```bash
cd frontend
python -m http.server 5500
```

Open the application in your browser:

```text
http://localhost:5500/index.html
```

## Application Workflow

1. Open the login page and sign in as admin, teacher, or student.
2. Use the dashboard to manage or review the relevant academic data.
3. Administrators can create users, classes, results, and notices.
4. Teachers can update marks and attendance records.
5. Students can access their academic profile and feedback system.

## API Health Check

The backend exposes a health check route:

```text
GET /api/health
```

## Notes

- The frontend uses plain HTML, CSS, and JavaScript.
- QR-based attendance works best with HTTPS in production or `localhost` during local development.
- Authentication uses HTTP-only cookies for secure session management.
- CORS is configured for the frontend origin in the backend.

## Project Summary

SRMS is a practical academic management system built to support the daily operational needs of educational institutions. It unifies administrative tasks, student records, teacher workflows, and result management into one easy-to-use digital platform.

## License

This project currently does not include a dedicated license file. If you plan to release it publicly or share it professionally, it is recommended to add an appropriate open-source license.

## Contact

Developed by Muhammad Faizan  
GitHub: https://github.com/Muhammad-Faizan79

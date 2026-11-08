# SRMS

The frontend is plain HTML, CSS, and JavaScript. Role dashboards use the MongoDB API; only the light/dark theme preference is stored in the browser.

## Start the backend

1. In `backend`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set a reachable MongoDB URI plus long, private signing secrets.
3. Run `npm run dev`. The API listens on port `5000` by default.

## Start the frontend

Serve the `frontend` folder at `http://localhost:5500` (for example, with VS Code Live Server) and open `index.html`. The API URL can be overridden by setting `window.SRMS_API_URL` before the page scripts load.

## First use

Open Admin Login and use **First-time admin setup** to create the first admin account. Setup is disabled automatically after an admin exists. Sign in, then create teacher accounts, students, courses, results, exams, and notices from the admin dashboard. Teachers use the created Teacher ID/email to sign in; students use their roll number/email.

## Role operations

- Admin: manage students, teachers, courses, results, exams, and notices; review feedback; change password; download a JSON backup.
- Teacher: manage results for assigned courses, scan student QR codes or manually record daily school attendance for Classes 1-10, mark subject attendance, view students, post/delete own notices, and update profile.
- Student: view courses, results, monthly school attendance, a downloadable attendance QR code, exams, and notices; update profile; submit and view feedback.

## QR school attendance

Set `QR_ATTENDANCE_SECRET` in the backend `.env` to a long, private secret different from the login signing secrets. When an admin creates a student in Classes 1-10, the signed attendance QR is generated and can be downloaded from the admin screen; the student can also view/download it in their portal. A logged-in teacher selects the class and date, loads the roster, and scans each student's QR code using a phone or computer camera. Save the roster to record students who were absent or late. Attendance is recorded once per student per date and counted by month in the student portal.

Camera scanning requires HTTPS on deployed sites (or `localhost` during development) and permission to use the device camera. The QR generation/scanner libraries are loaded from public CDNs, so the browser needs internet access to load them.

The API health check is `GET /api/health`. Authentication uses HTTP-only cookies, so frontend requests include credentials and must use the configured frontend origin.

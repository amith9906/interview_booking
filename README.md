# Interview Booking App

Full-stack interview scheduling suite with four user roles (student/interviewer/HR/admin), Stripe payments/subscriptions, Cloudinary resume uploads, and analytics dashboards. Frontend is React + MUI + Redux Toolkit; backend is Node/Express + Sequelize + PostgreSQL.

## Repo layout

- `backend/`: Express API, Sequelize models/migrations/seeders, Stripe webhooks, Multer+Cloudinary, JWT auth, nodemailer/notification stub.
- `frontend/`: Vite + React 18, MUI components matching the hand-drawn flows, Redux slices calling `/api`, Stripe Elements helpers, and analytics/HR/admin dashboards.
- `docker-compose.yml`: spins up Postgres, backend, and frontend services for local development.

## Getting started

1. Copy environment files:
   - `backend/.env.example` → `backend/.env`
   - `frontend/.env.example` → `frontend/.env`
2. Fill in secrets:
   - Backend: `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `EMAIL_*`, `CLOUDINARY_URL`.
   - Frontend: `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`.
3. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
4. Run Postgres locally or via Docker (see below).

### Runtime guards
- Set `FRONTEND_URL` (comma separated if you have previews) so the API can enforce a whitelist when running in production. Missing this value now throws at start.
- `SKIP_MIGRATIONS=true` will opt out of the automatic `npx sequelize-cli db:migrate` step that happens each time the API boots, but the default is to keep your schema up to date before accepting traffic.
- Background jobs only run when `RUN_BACKGROUND_JOBS=true` or in `NODE_ENV=development`. Production app servers should keep that flag `false` and use `npm run start:jobs` (or a dedicated worker) to run the admin reminder and quiz automation tasks. Flip `DISABLE_QUIZ_AUTOMATION=true` whenever you want to pause the quiz scheduler without touching the other jobs.

## Analytics per role

- `/api/student/analytics` returns booking counts, paid/completed ratio, average rating, and top skills for the logged-in student.
- `/api/interviewer/analytics` exposes upcoming/completed booking counts, average ratings, and total volume for interviewers.
- `/api/hr/analytics` surfaces subscription points, active flag, expiry, and total resume downloads.
- Admin dashboards already pull analytics from `/api/admin/analytics` and provide CSV exports.
- `/admin/analytics/role?role={interviewer|student|hr}&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` provides rich role-specific dashboards (summaries, top/bottom ranking, repeat student counts, consultancies, etc.) plus `/admin/analytics/role/export` which returns the same data as a downloadable CSV for reporting and compliance.

## Email & file storage

- Update `backend/.env` with SMTP values (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`) so booking/feedback emails are delivered. The service silently logs the intent if SMTP credentials are missing.
- Provide Cloudinary credentials via `CLOUDINARY_URL` or (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) before uploading resumes.

## Database setup

```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Seeds create 2 companies, 3 interviewers, 5 students, 5 resumes, and starter HR skill/course data.

## Running locally

- Backend: `npm run dev` (uses nodemon, runs on port 5000 by default).
- Frontend: `npm run dev` (Vite on port 5173). The `App` component provides navigation between Student/Interviewer/HR/Admin dashboards.

## Stripe integrations

- **Booking payments**: `POST /api/student/bookings` creates a Stripe Checkout session; webhook `/webhooks/stripe` updates booking status once the session completes.
- **HR subscriptions**: `POST /api/hr/subscribe` launches Checkout; `stripe_webhook` flips `subscription_active` and `plan_expiry` when `checkout.session.completed` or `invoice.payment_succeeded` events arrive.
- Always configure `STRIPE_WEBHOOK_SECRET` and forward `/webhooks/stripe`.

## HR/Resume marketplace

- `GET /api/hr/resumes` returns candidate previews (name/skills/ratings).
- `POST /api/hr/resumes/:id/download` enforces the point/subscription model and deducts 10 points per download.
- `/api/student/bookings` charges in INR via Stripe (cards + UPI) so Indian students pay with rupees.

## Admin capabilities

- `POST /api/admin/users` creates any user role (student, interviewer, HR).
- CRUD endpoints: `POST /api/admin/skills`, `/api/admin/companies`, `PUT /api/admin/interviewers/:id`, `POST /api/admin/bookings`.
- Analytics: `GET /api/admin/analytics` returns booking counts, revenue, avg rating, and interviewed companies.
- Ops documentation: see `docs/admin-operations.md` for export flows, profile verification toggles, consultancy credit management, and payment audit trails.

## Docker (optional)

```bash
docker compose up --build
```

Services:
1. `db` → Postgres 15 with data volume.
2. `backend` → Node app on port 5000 (`npm run dev`).
3. `frontend` → Built with Vite and served via nginx.

## Frontend notes

- Redux slices under `frontend/src/store/` manage auth (`authSlice`), booking/interviewer flows (`bookingSlice`), and HR/resume state (`resumeSlice`).
- `frontend/src/utils/api.js` exports an Axios instance with `setAuthToken` so JWTs automatically travel to the backend.
- Components under `frontend/src/components/` align with the five hand-drawn screens: student registration/search/booking, interviewer scheduling/feedback, HR resume marketplace, and admin management/analytics.

## Next steps

- Confirm Stripe webhooks (`/webhooks/stripe`) with the Stripe CLI or ngrok so bookings and HR subscriptions stay in sync with event data.
- Run `stripe listen --forward-to localhost:5000/webhooks/stripe` (or the ngrok equivalent) whenever you develop payments so the webhook secret (`STRIPE_WEBHOOK_SECRET`) stays current after each restart.
- Double-check Cloudinary (`CLOUDINARY_URL`/`CLOUDINARY_*`) and SMTP (`EMAIL_*`) credentials before going live; failed uploads or notification emails will log clear warnings if the env vars are missing.
- The backend now schedules a daily admin ops reminder (9:00 AM IST on weekdays) to prompt exports, reconciliation, and credit reviews. Disable it during testing with `DISABLE_ADMIN_REMINDERS=true` or in staging if you prefer manual control.
- Add `npm run verify-infra` (from the `backend/` folder) to your CI workflow so Stripe, Cloudinary, and SMTP secrets are validated before deploys. Failing this script now blocks the build until the missing credentials are provided.

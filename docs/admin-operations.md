# Admin Operations Runbook

## 1. Health checks & verification scripts

- **`npm run verify-infra`** (`backend/scripts/verifyInfra.js`) verifies that `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Cloudinary credentials (`CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`), and SMTP host/auth variables are populated. Run this locally or as a CI pre-flight step whenever you change secrets.
- **`npm run verify-health`** (`backend/scripts/checkInfraHealth.js`) exercises `monitoringService.checkInfraHealth()`, printing a summary and exiting non-zero if the Stripe webhook secret is missing or Cloudinary isn’t configured. This is ideal for nightly checks or a pre-release workflow.
- **`npm run check:ops`** (`backend/scripts/check-ops.js`) ensures the same Stripe/Cloudinary/SMTP vars exist and that `CLOUDINARY_URL` follows the required `cloudinary://` format; include it in your deployment pipeline so CI fails fast when credentials are incomplete.
- **`stripe listen --forward-to http://localhost:5000/webhooks/stripe`** validates that your local webhook endpoint receives Stripe events and matches `STRIPE_WEBHOOK_SECRET`. After rotating keys, update the env values, restart the backend, and rerun this command plus `stripe logs tail` to ensure events are still signed correctly.
- **Cloudinary smoke test**: upload a lightweight resume via the Admin UI (`Resume actions` modal) or hit `POST /api/uploads`; a successful upload proves the configured credentials can store files.
- **SMTP verification**: send a booking or reminder email through `sendEmail` (for example `POST /api/notifications/test`), and inspect the backend logs for SMTP responses. These results should accompany any troubleshooting of missing notifications.

## 2. Automated reminders & reconciliations

- The **`adminOpsReminders`** job (`backend/src/jobs/adminOpsReminders.js`) runs weekdays at 9 AM IST. It measures the day’s new bookings, payment failures, HR downloads, and credits, then persists an `ops-reminder` notification and emails every admin (`persistNotification` + `sendEmail`). Tail `logs/operations.log` for `[OpsReminder]` or `reminder:error` entries if the cron fails.
- Manually trigger the same job with `node -e "require('./src/jobs/adminOpsReminders').sendAdminOpsReminder()"` when you want an ad-hoc reconciliation run.
- Use these export endpoints to reconcile the data the reminder job mentions:
  - `GET /api/admin/export-feedback` (verification status + feedback history).
  - `GET /api/admin/consultancies/analytics/export` (HR credits per consultancy download).
  - `GET /api/hr/analytics?startDate=...&endDate=...` (aggregated course/interview/credit KPIs).
  Pull these reports daily (or let the cron remind you to do so) and verify the `credits_change` sums match your `hr_transactions` table; a mismatch should surface as an `ops-reminder` notification so ops can take action.

## 3. Logging, observability & alerting

- **Audit logs** (`backend/logs/audit.log`) capture downloads, rating/feedback edits, credit changes, and resource actions. Forward this log to your observability stack and alert on keywords such as `download_resume`, `edit_interview_feedback`, or any spike in `credits_change`.
- **Operations logs** (`backend/logs/operations.log`) record cron failures, reminder errors, and other `adminOpsReminders`/`quizAutomation` messages. Investigate entries that contain `error` or `reminder:error`.
- **Monitoring warnings** show up with `[Monitoring]` or `[Monitoring][ALERT]` prefixes whenever Stripe/Cloudinary checks fail; use those cues to rerun `npm run verify-health`.
- **Proxy & rate-limit warning**: the app sets `trust proxy` to `loopback` before enabling `express-rate-limit` (see `backend/src/index.js`). If you deploy behind a load balancer, keep the trusted proxy tight (e.g., `app.set('trust proxy', ['127.0.0.1', '::1', '10.0.0.0/8'])`) before re-enabling the admin limiter, because `express-rate-limit` will refuse to start when `trust proxy` is too permissive (`ERR_ERL_PERMISSIVE_TRUST_PROXY`).

## 4. Security & RBAC

- **Route protection**: every `/api/admin` endpoint defined in `backend/src/routes/admin.js` runs through `authenticate` + `authorize('admin')`. When you add new analytics or export routes, wrap them with `logAudit` (see `backend/src/controllers/adminController.js`) so you can trace who's viewing/downloading sensitive data.
- **Rate limiting**: the general `express-rate-limit` block in `backend/src/index.js` throttles the entire API, while `adminLimiter` is prepared for admin-specific paths (uncomment `router.use(adminLimiter);` once your proxy setup is verified).
- **Ops secrets rotation**: after rotating Stripe, Cloudinary, or SMTP keys, restart the backend, rerun `npm run verify-infra`/`npm run verify-health`, rerun `stripe listen`, and update your ops channel with the new values so teammates can sync their `.env`.

## 5. Deployment & verification checklist

1. Run `npm run verify-infra`, `npm run verify-health`, and `npm run check:ops` locally whenever you change env vars or before cutting a release.  
2. Include `npm run check:ops` in CI so deployments fail when Stripe/Cloudinary/SMTP vars are missing or malformed.  
3. Validate Stripe webhooks with `stripe logs tail` and `curl`/`httpie` against `/api/webhooks/stripe` after every deployment.  
4. Trigger the reminder job manually (`node -e "require('./src/jobs/adminOpsReminders').sendAdminOpsReminder()"`) and confirm `ops-reminder` notifications, emails, and exports report the same numbers.  
5. Download feedback & consultancy exports (`/api/admin/export-feedback` and `/api/admin/consultancies/analytics/export`) and verify their totals against the `hr_transactions` table before closing the day.  
6. Rotate secrets? rerun steps 1–5, reissue `stripe listen`, and create an ops note that flags the new values so others can pick them up.  
7. Monitor `logs/audit.log` for `download_resume`, `logAudit` entries (e.g., `edit_interview_feedback`), and `credits_change` spikes that might hint at abuse.

## 6. Next steps

Once these scripts and reminder jobs are stable, keep hardening observability by shipping `logs/audit.log` weekly, reviewing `authorize` mappings, and expanding rate-limit alerts so the expanded admin analytics/credit flows remain production-ready.

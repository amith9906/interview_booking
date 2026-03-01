<!-- Operational runbook for Stripe + Cloudinary + notifications -->
# Payments & infrastructure runbook

## 1. Stripe setup (payments + webhooks)

1. **Secrets/environment**
   - Backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
   - Frontend: `VITE_STRIPE_PUBLISHABLE_KEY`.
   - Set them in `backend/.env` and `frontend/.env` (or as platform secrets).
2. **Local testing**
   - Run `stripe listen --forward-to http://localhost:5000/webhooks/stripe` (Stripe CLI) or use ngrok.
   - Copy the generated webhook secret into `STRIPE_WEBHOOK_SECRET`.
   - Start backend (`npm run dev`) and frontend (`npm run dev`), confirm Stripe events arrive (booking creation logs “Webhook handled”).
3. **Trace a booking**
   - Create booking from the student dashboard with either card or UPI.
   - In Stripe Dashboard, verify the Checkout session, amount in INR, and the success payment intent.
   - Backend logs should show `PaymentAudit` entry `status=success` with `session_id`.
4. **Inspect failures**
   - Cancel a test payment via Stripe Dashboard to force `failure`.
   - Admin Payments tab should show log entry with `status=failure`, message describing why and the same session id.
   - Use Stripe webhook logs (Dashboard > Developers > Webhooks) to ensure events delivered cleanly.

## 2. Logs and monitoring

- **Backend logging**: payments use `PaymentAudit` table (status/amount/session id/meta); HR downloads tracked via `HrTransaction`.
- Query `GET /admin/payments/audit` within the payments tab to get filtered logs by date/status; use exports to keep CSV copies.
- Admin reminder job runs weekdays at 09:00 IST; it summarizes payments, bookings, downloads, and credit adjustments. Check that `DISABLE_ADMIN_REMINDERS` isn’t set in production.
- Run `npm run verify-infra` before deployments so Stripe, Cloudinary, and SMTP secrets exist (see infra runbook). Failing this script blocks the release and prints missing variables.

## 3. Cloudinary & SMTP

1. **Cloudinary**: set `CLOUDINARY_URL` or the triple `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   - Upload resumes via `/api/resumes/upload`; Cloudinary errors appear when credentials are invalid and the verify script (`npm run verify-infra`) catches missing vars.
2. **SMTP**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`.
   - Backend notification service skips sending if any credential is absent (logs a notice).
   - Run `npm run verify-infra` to ensure these are present.

## 4. Rotating Stripe secrets

1. **Generate new keys** from Stripe Dashboard (API keys section).
2. Update `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` (if publishable key changes) in environment files or platform secrets.
3. Restart backend/frontend to pickup new keys.
4. Re-run Stripe CLI `stripe listen` to capture new `STRIPE_WEBHOOK_SECRET` and update the backend env.
5. Re-run `npm run verify-infra` to ensure no missing secrets.
6. Trigger a booking to confirm the new credentials operate (payments should log success/failure as before).

## 5. Operational checklist

1. Run `npm run verify-infra`.
2. Ensure Stripe CLI is listening and webhook secret matches `STRIPE_WEBHOOK_SECRET`.
3. Run a sample booking (card or UPI) and verify Admin Payments log & Stripe Dashboard.
4. If payment fails, copy `session_id` + booking ID from admin logs for traceability.
5. Export analytics/reports via Admin > Export Reports & Profiles and `Consultancies` panel on a daily/weekly cadence.

Store this file alongside other docs so operators can quickly follow the flow.

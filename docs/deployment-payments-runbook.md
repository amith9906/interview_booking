<!-- Deployment and payments/runbook -->
# Deployment + payments runbook

## 1. Local Stripe + webhook workflow

1. Install Stripe CLI and run `stripe login` to authenticate.
1. Start the webhook tunnel before running the apps:
   ```bash
   stripe listen --forward-to http://localhost:5000/webhooks/stripe
   ```
   Copy the signing secret printed by Stripe into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.
1. Populate the other secrets:
   - Backend `.env`: `STRIPE_SECRET_KEY`, `FRONTEND_URL`, `JWT_SECRET`, `DATABASE_URL`, `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, Cloudinary vars (`CLOUDINARY_URL` or cloud/key/secret), etc.
   - Frontend `.env`: `VITE_API_URL=http://localhost:5000/api`, `VITE_STRIPE_PUBLISHABLE_KEY`.
1. Start services: `cd backend && npm run dev`, `cd frontend && npm run dev`. The frontend will hit Stripe Checkout (card / UPI flows) and the backend will record payments.
1. Use the Payments tab (Admin dashboard) to confirm `PaymentAudit` entries appear with `status=success` and matching `session_id`.
1. To test failure handling, cancel the Stripe Checkout session or use test cards that decline; ensure an entry with `status=failure` shows up, including the message.

## 2. Server/production deployment steps

1. Clone the repo on your server and install dependencies:
   ```bash
   git clone ... && cd interview-booking-app
   cd backend && npm install
   cd ../frontend && npm install && npm run build
   ```
1. Provide environment variables for **both** backend and frontend:
   - Backend store: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, Cloudinary (URL or cloud/name/key/secret), `NODE_ENV=production`, `DISABLE_ADMIN_REMINDERS=false` (or omit).
   - Frontend build: either inject via `.env.production` or your host (NGINX) config: `VITE_API_URL=https://api.yourdomain.com/api`, `VITE_STRIPE_PUBLISHABLE_KEY`.
1. Serve backend with a process manager (PM2/systemd) pointing to `backend/src/index.js`.
1. Serve the built frontend via static host (NGINX/Netlify), pointing to your frontend build output and ensuring `VITE_API_URL` matches the backend domain.
1. Set up reverse proxy/HTTPS so Stripe can reach `https://yourdomain.com/webhooks/stripe`.

## 3. Stripe webhook + secrets on production

1. In Stripe Dashboard, configure a webhook endpoint: `https://yourdomain.com/webhooks/stripe`.
1. Copy its signing key into your server env as `STRIPE_WEBHOOK_SECRET`.
1. Ensure backend `STRIPE_SECRET_KEY` and frontend `VITE_STRIPE_PUBLISHABLE_KEY` target the same Stripe account.
1. If you still want test events, run `stripe listen --forward-to https://yourdomain.com/webhooks/stripe` from a reachable machine; update `STRIPE_WEBHOOK_SECRET` if Stripe rotates it.

## 4. Infrastructure verification

1. Run `cd backend && npm run verify-infra`. It ensures `STRIPE_*`, Cloudinary, and SMTP credentials exist; missing values cause an error and message (useful in CI).
1. The admin reminder job runs weekdays at 09:00 IST (unless disabled). It emails/creates notifications summarizing bookings, payment failures, downloads, and credit changes—confirm it fires in production.
1. Check Cloudinary uploads (resumes) and SMTP emails (booking confirmations, feedback) to verify credentials.

## 5. Payment troubleshooting checklist

1. Run a booking flow through the student UI, then confirm:
   - Stripe Dashboard shows the Checkout session/pays; amount is INR.
   - Admin Payments tab lists the record with matching `session_id`, `amount`, and `status`.
1. If problems occur:
   - Inspect Stripe Dashboard logs (Payments > Events / Developers > Webhooks) for delivery failures.
   - Copy the `session_id` + booking ID from Payments tab to correlate with Stripe events; include these when escalating.
   - Rerun `stripe listen`/`stripe login` if you rotate secrets or change webhook URLs.

## 6. Deployment verification (post-deploy)

1. Run `npm run verify-infra`.
1. Trigger a test booking (card + UPI) and validate the audit entry + webhook delivery.
1. Export analytics/reports from Admin > “Export Reports & Profiles” and the Consultancy export button to ensure CSVs are accessible.
1. Confirm admin notifications (especially the reminder) are arriving unless intentionally disabled.
1. Keep this runbook handy for restart/documentation so the devops/QA team can re-run these steps whenever you rotate secrets or redeploy.

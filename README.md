# CampusCart

A peer-to-peer marketplace for MSRIT students to buy and sell textbooks,
calculators, lab uniforms, notebooks, and lab records — reserve an item,
meet on campus, and hand it over in person.

## Features

- **Auth**: signup restricted to `@msrit.edu` emails, OTP email verification,
  JWT sessions, forgot/reset password (also via OTP).
- **Sell**: list an item (category quick-select incl. custom "Other", multi-photo
  upload, condition tier), a live price preview computed by the backend,
  My Listings with edit (including adding/removing photos), delete, cancel a
  reservation, and mark an item sold.
- **Buy**: browse with category filters, a "Try this out" carousel for
  rare/custom listings, live search, item detail pages, and placing an order
  — which reserves the item and reveals the seller's phone number only on
  that order.
- **Reservation state machine**: Available → Reserved → Sold, with row-level
  locking so two buyers can't reserve the same item, seller-initiated early
  cancellation, and automatic 48-hour expiry back to Available.
- **Trust system**: after a completed order, buyer and seller rate each
  other (1–5 stars, shown as an average on their profile); either party can
  report the other from an order or transaction, and accounts crossing a
  report threshold auto-suspend pending admin review.
- **Notifications**: a bell icon covering order placed, reservation
  expiring/cancelled, item sold, new rating, and account suspended, with
  per-item and mark-all-read.
- **Dashboard/Profile**: average rating, full bought/sold transaction
  history, report-a-user (reachable from any transaction row).
- **Admin/moderation**: a page restricted to admin-flagged accounts listing
  reports, with review (mark reviewed/dismissed) and suspend/unsuspend.

## Stack

- **Frontend:** React (Vite), Tailwind CSS v4, Framer Motion, React Router, Axios
- **Backend:** Node.js + Express
- **Database:** MySQL 8 (local instance)
- **Auth:** JWT + bcrypt
- **Email:** Nodemailer over Gmail SMTP (falls back to logging OTPs to the
  console when SMTP isn't configured, so it's testable without real credentials)
- **Images:** stored on disk under `backend/uploads/`, path saved in MySQL

## Project structure

```
campuscart/
├── backend/
│   ├── src/
│   │   ├── config/       # MySQL pool
│   │   ├── controllers/  # route handlers, one file per resource
│   │   ├── routes/       # Express routers
│   │   ├── middleware/   # JWT auth guard, admin guard, multer upload, validation
│   │   ├── jobs/         # node-cron fallback for reservation expiry
│   │   ├── utils/        # OTP, mailer, JWT signing, stored-procedure caller
│   │   ├── app.js        # Express app (middleware + route mounting)
│   │   └── server.js     # boots the app, verifies DB connection, starts the cron job
│   ├── database/
│   │   ├── schema.sql       # full DDL + triggers/procedures/event
│   │   └── smoke_test.sql   # dev-only regression check for the schema (destructive)
│   ├── uploads/           # local image storage (gitignored, .gitkeep tracked)
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/          # route-level pages, grouped by buy/ and sell/
        ├── components/     # reusable UI, grouped by ui/, layout/, buy/, sell/
        ├── layouts/        # AppLayout (navbar + content shell)
        ├── context/        # AuthContext (JWT session + user)
        ├── hooks/          # useDebouncedValue, useCountdown, useRole
        ├── api/            # one axios wrapper module per backend resource
        └── index.css       # Tailwind v4 theme tokens (blue/white palette, fonts)
```

## Local setup

### 1. Database

```bash
cd backend
cp .env.example .env      # fill in DB_PASSWORD, JWT_SECRET, SMTP creds (see below)
mysql -u root -p < database/schema.sql
```

The schema creates its own `campuscart` database, plus a MySQL
`EVENT` (`ev_expire_reservations`) that auto-expires reservations every 15
minutes. That requires the event scheduler to be on:

```sql
SET GLOBAL event_scheduler = ON;
```

If you'd rather not touch global server config, skip that — the backend
also runs a `node-cron` job calling the same `sp_expire_reservations()`
procedure every 15 minutes as a fallback, so either one alone is enough.

To sanity-check the schema's triggers/procedures after applying it (destructive — truncates every table when done, so only run this against a scratch database, never real data):

```bash
mysql -u root -p < database/smoke_test.sql
```

### 2. Backend environment variables

All of these live in `backend/.env` (copy `backend/.env.example` as a starting point):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Frontend origin, for CORS (default `http://localhost:5173`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Long random string used to sign session tokens |
| `JWT_EXPIRES_IN` | Session lifetime (default `7d`) |
| `COLLEGE_EMAIL_DOMAIN` | Domain signup is restricted to (`msrit.edu`) |
| `OTP_EXPIRY_MINUTES` | How long a verification code is valid |
| `SMTP_HOST`, `SMTP_PORT` | Defaults already set for Gmail (`smtp.gmail.com`, `587`) |
| `SMTP_USER` | Your full Gmail address |
| `SMTP_PASSWORD` | A **16-character Gmail App Password** — not your login password. Generate one at Google Account → Security → 2-Step Verification (must be on) → App passwords |
| `SMTP_FROM` | Should match `SMTP_USER`'s address, e.g. `"CampusCart <you@gmail.com>"` |
| `UPLOAD_DIR`, `MAX_UPLOAD_MB` | Local image storage settings |

Leave `SMTP_USER`/`SMTP_PASSWORD` blank to skip real email entirely — OTP
codes are printed to the backend's console in a bordered block instead, so
the whole signup/login/reset flow is testable with no email setup at all.

### 3. Backend

```bash
cd backend
npm install
npm run dev      # http://localhost:5000 — GET /api/health to verify
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173, proxies /api and /uploads to :5000
```

### 5. Becoming an admin

The admin/moderation page (`/admin`) is gated by a `users.is_admin` flag
that nothing in the UI can set — sign up normally through the app, then
promote yourself directly in MySQL:

```sql
UPDATE users SET is_admin = 1 WHERE email = 'you@msrit.edu';
```

Log out and back in afterward so your session token picks up the change.

## Design decisions worth knowing about

- **"New" condition discount:** the spec calls for 0–10% off; the schema
  uses a fixed 5% (configurable via `app_settings.discount_new_pct`) so
  pricing stays deterministic rather than randomized.
- **Reservation locking:** `sp_reserve_item` uses `SELECT ... FOR UPDATE`
  inside a transaction on the `items` row, so two concurrent buyers can't
  both reserve the same item.
- **Report threshold:** configurable via `app_settings.report_suspend_threshold`
  (default 3) rather than hardcoded, so it can be tuned without a migration.
- **Role is not stored server-side:** "Buy" vs "Sell" is just which section
  of the app you're in (derived from the current route), not a persisted
  user attribute — any account can both buy and sell.

# Campus Marketplace

A buy/sell marketplace for MSRIT students — list textbooks, calculators, lab gear
and more, reserve items, and complete handovers in person.

## Stack

- **Frontend:** React (Vite), Tailwind CSS v4, Framer Motion, React Router, Axios
- **Backend:** Node.js + Express
- **Database:** MySQL 8 (local instance)
- **Auth:** JWT + bcrypt, with email OTP verification restricted to `@msrit.edu.in`
- **Images:** stored on disk under `backend/uploads/`, path saved in MySQL

## Project structure

```
campus-marketplace/
├── backend/
│   ├── src/
│   │   ├── config/       # DB pool, env-derived config
│   │   ├── controllers/  # route handlers (added as routes are built)
│   │   ├── routes/       # Express routers (added as routes are built)
│   │   ├── middleware/   # auth guard, upload handling, validation
│   │   ├── jobs/         # node-cron fallback for reservation expiry
│   │   ├── utils/        # helpers (OTP, mailer, schema runner)
│   │   ├── app.js        # Express app (middleware + route mounting)
│   │   └── server.js     # boots the app, verifies DB connection
│   ├── database/
│   │   ├── schema.sql       # full DDL + triggers/procedures/event
│   │   └── smoke_test.sql   # dev-only regression check for the schema
│   ├── uploads/          # local image storage (gitignored, .gitkeep tracked)
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/         # route-level pages
        ├── components/    # reusable UI
        ├── layouts/       # shared page chrome
        ├── context/       # auth/notification context providers
        ├── hooks/
        ├── api/           # axios client
        └── index.css      # Tailwind v4 theme tokens (brand palette, fonts)
```

## Local setup

### 1. Database

```bash
cd backend
cp .env.example .env      # fill in DB_PASSWORD, JWT_SECRET, SMTP creds
mysql -u root -p < database/schema.sql
# or: npm run db:schema   (reads .env and applies schema.sql)
```

The schema creates its own `campus_marketplace` database. It also creates a
MySQL `EVENT` (`ev_expire_reservations`) that auto-expires reservations after
48 hours — this requires the event scheduler to be on:

```sql
SET GLOBAL event_scheduler = ON;
```

If you'd rather not touch global server config, skip that and rely on the
Node-side `node-cron` fallback job instead (calls the same
`sp_expire_reservations()` procedure).

To sanity-check the schema's triggers/procedures after applying it:

```bash
mysql -u root -p < database/smoke_test.sql   # destructive — truncates all tables when done
```

### 2. Backend

```bash
cd backend
npm install
npm run dev      # http://localhost:5000, GET /api/health to verify
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173, proxies /api and /uploads to :5000
```

## Design decisions worth knowing about

- **"New" condition discount:** the spec says 0–10% off; the schema uses a
  fixed 5% (configurable via `app_settings.discount_new_pct`) rather than a
  range, so pricing stays deterministic.
- **Reservation locking:** `sp_reserve_item` uses `SELECT ... FOR UPDATE`
  inside a transaction on the `items` row, so two concurrent buyers can't
  both reserve the same item.
- **Report threshold:** configurable via `app_settings.report_suspend_threshold`
  (default 3) rather than hardcoded, so it can be tuned without a migration.

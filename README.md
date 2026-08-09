# Employee Salary Management System

A web app that lets an HR Manager maintain accurate, current, and
historical salary data for ~10,000 employees across multiple countries,
and answer questions about how the org pays its people — without
exporting anything to Excel first.

See [`docs/REQUIREMENTS.pdf`](docs/REQUIREMENTS.pdf)for the
full brief and scope, [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for
how the codebase is organized and why.

## Live demo

- **App:** https://frontend-bice-seven-99.vercel.app
- **API:** https://esm-backend-rhz6.onrender.com/api/v1/health
- **Login:** `seed-admin@acme.test` / `seed-admin-password`

Backend is on Render's free tier, which spins down after inactivity — the
first request after a while may take 30–60s to wake up.

## Structure

An npm workspaces monorepo:

- `backend/` — Node.js + Express REST API (`/api/v1/...`), PostgreSQL via Prisma
- `frontend/` — Next.js UI (TypeScript, Tailwind CSS, Zustand)
- `docs/` — requirements, architecture, and decision records

## Getting started

```bash
npm install                                     # installs both workspaces

# Backend
cp backend/.env.example backend/.env            # set DATABASE_URL to a local Postgres instance
npm run prisma:migrate --workspace=backend      # create the schema
npm run seed --workspace=backend                # deterministic 10,000-employee seed
npm run dev:backend                             # http://localhost:4000

# Frontend
cp frontend/.env.example frontend/.env.local    # NEXT_PUBLIC_API_BASE_URL, defaults to localhost:4000
npm run dev:frontend                            # http://localhost:3000
```

The seed script also creates the one HR Manager login the app supports:

```
email:    seed-admin@acme.test
password: seed-admin-password
```

## Pages

| Route             | What it does                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`          | HR Manager sign-in                                                                                                                                                                    |
| `/dashboard`      | Landing page after login                                                                                                                                                              |
| `/employees`      | Search/filter/paginate all employees                                                                                                                                                  |
| `/employees/[id]` | Profile, current salary, full salary history, update-salary form                                                                                                                      |
| `/reports`        | Click-to-fetch answers: overall spend, most expensive department, pay-by-country, cross-country fairness comparison, highest/lowest earners, salary distribution, pay-over-time trend |

## Scripts

| Command                                                               | Runs                                                              |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `npm run dev:backend` / `dev:frontend`                                | Dev servers                                                       |
| `npm run test:backend` / `test:frontend`                              | Test suites (Vitest)                                              |
| `npm run build:backend` / `build:frontend`                            | Production builds                                                 |
| `npm run seed --workspace=backend`                                    | Re-seed 10,000 employees (SEED_COUNT env var overrides the count) |
| `npm run create-hr-manager --workspace=backend -- <email> <password>` | Bootstrap an additional HR Manager account                        |

# Employee Salary Management System

Phase 1 of a system that replaces spreadsheet-based salary tracking with a
web app an HR Manager can use to maintain accurate, current, and historical
salary data for ~10,000 employees. See [`docs/REQUIREMENTS.pdf`](docs/REQUIREMENTS.pdf)
for the full brief and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how
the codebase is organized and why.

## Structure

This is an npm workspaces monorepo:

- `backend/` — Node.js + Express REST API (`/api/v1/...`), PostgreSQL via Prisma
- `frontend/` — Next.js UI (TypeScript, Tailwind CSS, Zustand)
- `docs/` — requirements and architecture docs

## Getting started

```bash
npm install                 # installs both workspaces from the repo root

# backend
cp backend/.env.example backend/.env   # set DATABASE_URL to a local Postgres instance
npm run dev:backend                    # http://localhost:4000

# frontend
npm run dev:frontend                   # http://localhost:3000
```

## Scripts

| Command | Runs |
|---|---|
| `npm run dev:backend` | Backend dev server (`tsx watch`) |
| `npm run dev:frontend` | Frontend dev server (Next.js) |
| `npm run test:backend` | Backend test suite (Vitest) |
| `npm run build:backend` | Backend TypeScript build |
| `npm run build:frontend` | Frontend production build |

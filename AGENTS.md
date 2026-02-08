# Repository Guidelines

## Project Structure & Module Organization
- backend/: Node + TypeScript API (Express). Key dirs: `src/modules/*`, `prisma/`, `tests/`, `dist/`.
- frontend-web/: Vite + React app (`src/`).
- app-mobile/: Expo React Native app (`src/`).
- docs/: Architecture, audits, runbooks; scripts/: helper utilities (e.g., `scripts/test-e2e-fase2.sh`).
- .github/workflows/ci.yml: Backend CI (install, lint, build, test).
- docker-compose.yml: Local Postgres service for development/testing.

## Build, Test, and Development Commands
- Start DB: `docker-compose up -d postgres` (creates Postgres at `localhost:5432`).
- Backend install/dev: `cd backend && npm ci && npm run dev` (tsx watch).
- Backend build/run: `cd backend && npm run build && npm start`.
- Prisma: `cd backend && npx prisma generate && npx prisma migrate dev` (schema changes).
- Tests (backend): `cd backend && npm test` (Jest; see CI for env vars).
- Frontend dev: `cd frontend-web && npm run dev`.
- Mobile dev: `cd app-mobile && npm start` (Expo; use `--android/--ios` as needed).

## Coding Style & Naming Conventions
- TypeScript across packages; 2‑space indentation. Run `npm run lint` and `npm run format` per package.
- Naming: camelCase (vars/functions), PascalCase (classes/React components), kebab-case files in React where practical.
- Backend organization: group by domain under `src/modules/<feature>/*` (controllers/services/routes/utilities co-located).

## Testing Guidelines
- Framework: Jest (backend). Tests live in `backend/tests` (e.g., `integration/*.test.ts`).
- Database: use the local Postgres (`docker-compose`) and set `DATABASE_URL` (see `backend/.env.example`).
- Target coverage of critical flows: auth, consultations, messages, payments; seed/migrate as needed (`npm run prisma:seed`).
- CI runs lint/build/tests; replicate locally before opening a PR.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits with scopes: `backend`, `frontend-web`, `app-mobile`, `docs`.
  - Examples: `feat(backend): accept consultation flow`, `fix(frontend-web): align header on dashboard`.
- PRs: include a clear description, linked issues, test steps/commands, and screenshots for UI changes. Update docs and `.env.example` when config changes. Ensure CI green.

## Security & Configuration
- Never commit secrets. Copy from `.env.example` to local `.env` in each package. Rotate test creds when publishing logs.
- Required env highlights (see examples): `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_WEB_URL`, `MOBILE_APP_URL`, CORS settings. After schema changes, run Prisma generate/migrate.


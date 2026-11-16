# Breadcrumbs

A quiet skill-building app: choose an adventure, try a small task, reflect, and watch a skill tree grow.

## Run on your computer

Requires Node.js 22.9+ and Docker with Compose (or an existing PostgreSQL database).

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env`. Set a long random `POSTGRES_PASSWORD` and use the same password in `DATABASE_URL`. Keep `.env` private.
3. Start PostgreSQL: `npm run db:start`. Skip this if using an existing database.
4. Start the app: `npm run dev`.
5. Open <http://localhost:3000>.

Set `DATABASE_URL` to a managed PostgreSQL URL to use a hosted database. Preserve the provider's TLS requirements. The application creates its tables on startup from `migrations/001_initial.sql`. The database role needs permission to create those tables. Use a private database connection and a persistent database volume.

The supplied Compose file binds PostgreSQL to loopback only and stores data in a named volume. `npm run db:stop` stops the database without removing data. Do not remove the volume if you want to keep user data.

## AI guide

Set `OPENAI_API_KEY` in `.env` and restart the server to enable the server-side OpenAI integration. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and can be changed to a compatible model with JSON output support. A curated guide works without a key or when the provider is unavailable. The UI identifies which guide generated the task.

API requests include the skill, learning preference, duration, prior experience, and previous feedback. No API secret is sent to the browser. Learning preferences guide presentation; they are not treated as fixed cognitive learning-style categories.

## Data and sessions

PostgreSQL stores users, hashed session tokens, and each user's garden (skills, preferences, and field notes) as a JSONB document. Writes use an atomic revision check to prevent one tab from silently overwriting another.

A random, HttpOnly, SameSite=Lax browser cookie identifies each user for 90 days. HTTPS requests receive a Secure cookie. This prototype uses private browser sessions, not email/password accounts: there is no sign-in or cross-device recovery. Clearing the cookie loses access to that session. Preferences includes a JSON export for backup. A browser-local copy also protects against temporary connectivity loss; reload to reconnect.

For an internet-facing launch, add account sign-in, account recovery, and a production host for this Node service and its database. The current cloud preview is not a public production deployment.

`.gitignore` excludes `.env`, environment-specific variants, databases, logs, keys, user uploads, build output, and dependencies. `.env.example` contains placeholders only. Keep real secrets out of tracked files; `.gitignore` cannot untrack previously committed credentials.

## Build and verify

- `npm run build`: creates the production frontend.
- `npm start`: serves the production build and API.
- `npm test`: tests PostgreSQL persistence, session isolation, conflicting writes, request validation, and curated task generation. Uses a temporary PostgreSQL schema and removes it afterward. The test database user needs schema creation permission.
- `npm run test:browser`: tests onboarding, completing a task, field notes, database restoration, session isolation, and responsive overflow. Requires Chromium (`CHROMIUM_PATH` overrides `/usr/bin/chromium`).

There are no streak penalties. Practice sessions count as steps; the tree's milestones reflect self-reported confident practice and do not certify mastery. AI task generation requires a configured key and has not been validated against a paid provider in this environment.

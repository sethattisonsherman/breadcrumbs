# Breadcrumbs

Website: https://sethattisonsherman.github.io/breadcrumbs/

A quiet skill-building app: choose an adventure, explore a personal galaxy, try a small task, and watch skill-shaped constellations grow brighter.

## Run on your computer

Requires Node.js 22.9+ and Docker with Compose (or an existing PostgreSQL database).

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env`. Set a long random `POSTGRES_PASSWORD` and use the same password in `DATABASE_URL`. Keep `.env` private.
3. Start PostgreSQL: `npm run db:start`. Skip this if using an existing database.
4. Start the app: `npm run dev`.
5. Open <http://localhost:3000>.

Set `DATABASE_URL` to a managed PostgreSQL URL to use a hosted database. Preserve the provider's TLS requirements. The application creates its tables on startup from the versioned SQL files in `migrations/`. The database role needs permission to create those tables. Use a private database connection and a persistent database volume.

The supplied Compose file binds PostgreSQL to loopback only and stores data in a named volume. `npm run db:stop` stops the database without removing data. Do not remove the volume if you want to keep user data.

## AI guide

Set `OPENAI_API_KEY` in `.env` and restart the server to enable the server-side OpenAI integration. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and can be changed to a compatible model with JSON output support. A curated guide works without a key or when the provider is unavailable. The UI identifies which guide generated the task.

### Gemini through Supabase

The app can use Gemini through a Supabase Edge Function. The Gemini key stays in Supabase and is never returned to the app or browser. When the Supabase function is configured, it takes priority over the optional OpenAI integration above.

1. In Supabase, open **Edge Functions → Secrets** and add `GEMINI_API_KEY`, `GEMINI_PROXY_TOKEN`, and optionally `GEMINI_MODEL`. Choose a Gemini model available on your API key's free tier. Generate a long random value for `GEMINI_PROXY_TOKEN`.
2. Link this repository to your Supabase project with `supabase link --project-ref <project-ref>`, then deploy the function with `supabase functions deploy gemini-plan`.
3. In the app server's private `.env` or host environment, set `SUPABASE_GEMINI_FUNCTION_URL` to `https://kwykvpxunzbjwfczccey.supabase.co/functions/v1/gemini-plan` and `SUPABASE_GEMINI_FUNCTION_TOKEN` to the same random token used for `GEMINI_PROXY_TOKEN`.
4. Restart the app server. `/api/status` will report the AI guide as configured.

The function disables Supabase JWT verification because this app uses a private server-to-server token instead. Keep `SUPABASE_GEMINI_FUNCTION_TOKEN` only on the app server and `GEMINI_PROXY_TOKEN` in Supabase Edge Function secrets. Never put either token or `GEMINI_API_KEY` in frontend code. For local function development, put `GEMINI_API_KEY`, `GEMINI_PROXY_TOKEN`, and `GEMINI_MODEL` in `supabase/functions/.env`; that file is ignored by Git.

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


## Supabase (database only)

The existing backend connects directly to Supabase PostgreSQL using `pg`. Supabase Auth is not used; the private browser-session behavior remains the same.

1. In your Supabase project, choose **Connect** and copy the **Session pooler** PostgreSQL URI (port 5432). This is suitable for the persistent Node server and supports IPv4 environments.
2. Put that URI in the server’s ignored `.env` as `DATABASE_URL`. Replace the password placeholder with the project’s database password; URL-encode reserved characters. A Supabase publishable, anon, or service-role API key is not a PostgreSQL password.
3. Keep `DATABASE_POOL_MAX=5` and `DATABASE_SCHEMA=public` unless you have deliberately provisioned another schema. The server must connect as the table owner (the project’s default `postgres` user works).
4. Supabase hostnames automatically use `sslmode=verify-full`. If your provider requires a custom CA, download its server CA certificate and set `DATABASE_CA_CERT_PATH` to a file inside the ignored `secrets/` folder. Do not disable certificate verification.
5. Run `npm run db:check`, then restart the Node server. It applies both migrations, including enabling row-level security with no public client policies. User data is accessed through the Node API, not directly through Supabase’s browser Data API.

Do not put database URLs in `VITE_` variables or frontend code. The live Supabase connection cannot be verified until you configure your project’s connection string. Changing the connection URL selects a different database; it does not copy existing development data automatically.

[Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres) · [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Constellation interface

New visitors start with a learning-preference survey. A galaxy view shows one constellation per skill: a guitar or musical note, code brackets, a pencil, a mountain, a speech bubble, a book, or a compass for other interests. Drag (or use arrow keys while the sky is focused) to pan, use the zoom controls, and choose a skill to reveal the next practice. Home / Reset view recenters the sky.

Practice counts illuminate additional stars and create branching connections; self-reported confidence adds brightness. These represent effort, not certified mastery. Deferring or closing a task never deducts progress. Existing browser and PostgreSQL data remain compatible with the redesign.

## AI mentor prompt

The canonical system prompt is [`ai/system-prompt.txt`](ai/system-prompt.txt). The Node server loads it directly, so editing this file and restarting the server updates the OpenAI instructions. [`ai/examples.json`](ai/examples.json) contains sample task and deferral requests and responses.

The voice is concise, encouraging, and grounded. AI tasks target 60–120 seconds even when a longer session window is available; the duration is an estimate. Tasks contain one atomic action split into three brief instructions. Practical, retrieval, mind-mapping, and elaborative modes are supported, with flexible presentation preferences and adaptation from feedback. The optional `learning_mode` request field can choose a mode explicitly.

`ai/plan-contract.js` validates generated JSON, reading length, method, and time estimate. Malformed or overly long responses use the existing curated fallback. The focused task preview is reused when practice starts, so its task matches the practice modal and does not trigger a second paid generation. Factual retrieval checks are hidden until the user enters an attempt, then shown on request. These checks are model-generated, not independent grading.

Deferrals remain instant, local UI responses and do not spend API tokens or deduct progress. The prompt also defines an `action=defer` JSON format for a future AI-driven deferral route; the current `/api/plan` endpoint deliberately requests task generation only. Configure `OPENAI_API_KEY` in the server's ignored `.env` to activate OpenAI. No live paid-provider response has been verified without that key.

The new mentor system prompt and strict micro-task contract apply to the OpenAI path. The existing Supabase/Gemini Edge Function remains available and keeps its own instructions and response contract.


## GitHub Pages deployment

GitHub Pages hosts static files. It cannot compile JSX or run the Node/PostgreSQL/AI API. The `Deploy Breadcrumbs to GitHub Pages` workflow installs dependencies, runs `npm run build:pages`, and deploys `dist/`. The same build also prepares root `index.html` and `assets/` for the existing branch-based publisher. The Pages build uses the `/breadcrumbs/` base path so JavaScript and CSS resolve under the repository URL.

The repository supports both Pages sources. With **GitHub Actions**, the workflow deploys `dist/`. With the existing **Deploy from a branch → main / (root)** setting, Pages serves the generated root `index.html` and `assets/`. Editable frontend files live in `client/`; Vite uses `client/index.html` for development. Run `npm run build:pages` and commit the generated root HTML/assets alongside source changes before pushing. No Pages administration permission is needed for the branch-based setup.

Without a backend URL, the Pages build uses curated practice tasks and saves progress in the browser. Onboarding, practice, constellations, notes, and export remain usable. It does not claim to be connected to the database. Run `npm run build:pages && npm run test:pages` to verify this deployment mode locally.

To connect a hosted Node backend, set the repository's **Actions variable** `VITE_API_BASE_URL` to its public HTTPS origin and rerun the deployment workflow. The backend must allow credentialed requests from `https://sethattisonsherman.github.io` and use cookie settings appropriate to that deployment. A Supabase project origin alone does not provide this app's `/api/user`, `/api/status`, or `/api/plan` routes. The project's Gemini Edge Function is an AI proxy, not those session/storage routes.

Keep `DATABASE_URL`, OpenAI/Gemini API keys, and Supabase proxy tokens only on the backend or in private server environment variables. Never put them in `VITE_` build variables; those are visible to every visitor.


### Local session while Supabase is unavailable

Keep the Supabase connection in the ignored `.env`. To use a local PostgreSQL database for development, put only its local `DATABASE_URL` in an ignored `.env.local` and run `npm run dev:local`. The local override is loaded after `.env`; the production `npm start` command continues to use `.env` only. Database tests also prefer `.env.local` when present so development tests do not need to use the remote project. Never commit either environment file.

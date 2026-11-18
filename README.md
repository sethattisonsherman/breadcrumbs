# Constellations

Website: https://sethattisonsherman.github.io/breadcrumbs/

A focused learning app: answer a short preference survey, type what you want to learn into an open sky, and complete one activity at a time. Each completed lesson becomes a star in its subject's constellation.

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
2. Link this repository to your Supabase project with `supabase link --project-ref <project-ref>`, then deploy the function with `supabase functions deploy gemini-learning`.
3. In the app server's private `.env` or host environment, set `SUPABASE_GEMINI_FUNCTION_URL` to `https://kwykvpxunzbjwfczccey.supabase.co/functions/v1/gemini-learning` and `SUPABASE_GEMINI_FUNCTION_TOKEN` to the same random token used for `GEMINI_PROXY_TOKEN`.
4. Restart the app server. `/api/status` will report the AI guide as configured.

The gateway-level JWT check is disabled to keep the old private server-token path working during a transition. The function checks browser user JWTs inside its handler. Keep `SUPABASE_GEMINI_FUNCTION_TOKEN` only on the app server and `GEMINI_PROXY_TOKEN` in Supabase Edge Function secrets. Never put either token or `GEMINI_API_KEY` in frontend code. For local function development, put `GEMINI_API_KEY`, `GEMINI_PROXY_TOKEN`, and `GEMINI_MODEL` in `supabase/functions/.env`; that file is ignored by Git.

### Gemini from GitHub Pages (no Node host)

The GitHub Pages build can call `gemini-learning` directly. It signs visitors in anonymously with Supabase Auth, keeps progress in that browser, and does not need a Render service or a PostgreSQL connection URI. The function checks the visitor's Supabase session and allows up to 20 AI plans per user each UTC day. At the limit, the app offers a friendly break message. Each browser gets its own anonymous Supabase user. Clearing browser data or switching devices loses access to that identity and the browser's saved progress; the unused Supabase auth record may remain until it is cleaned up.

1. In Supabase, enable anonymous sign-ins under **Authentication → Settings**. Create a Cloudflare Turnstile widget for your website hostname (and `localhost` for local testing). Add its public site key to GitHub Actions as `VITE_TURNSTILE_SITE_KEY`. In Supabase, choose Turnstile under **Authentication → Settings → Bot and Abuse Protection** and enter the widget's secret key, but leave CAPTCHA protection off until the updated Pages build is live. For local development, put the public site key in `.env.local` as `VITE_TURNSTILE_SITE_KEY=...`.
2. Keep `GEMINI_API_KEY` in **Edge Functions → Secrets**. `GEMINI_MODEL` is optional. `GEMINI_PROXY_TOKEN` can remain for a Node server during a transition; the GitHub Pages browser never receives it.
3. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_TURNSTILE_SITE_KEY`. Use the project URL and publishable key from Supabase, and the site key from Cloudflare Turnstile. These are public browser settings. Do not add a Gemini key, Supabase secret key, Turnstile secret key, or proxy token here.
4. Connect this repository to the Supabase GitHub integration with working directory `.`. Enable production deployment from `main`. The integration applies the new `supabase/migrations` file and deploys the updated `gemini-learning` function. If you are deploying manually instead, run `npx supabase login`, `npx supabase link --project-ref <project-ref>`, `npx supabase db push`, and `npx supabase functions deploy gemini-learning` from the repository root.
5. Merge the code changes to `main` and let GitHub Pages build finish. The Pages workflow passes the three public values into the browser build. Then turn on **Enable CAPTCHA protection** in Supabase. The app shows the Turnstile check before its first anonymous sign-in.

The function validates a user JWT inside its handler because it also retains the old private server-token path. Do not remove that check or place `GEMINI_PROXY_TOKEN` in a browser variable. The daily cap is per anonymous user; CAPTCHA and Supabase Auth limits help discourage automated account creation.

API requests include the subject, ranked learning preferences, duration, prior experience, recent lessons and feedback. The app computes a deterministic three-phase framework and Gemini fills its activities. No API secret is sent to the browser. Learning preferences guide presentation; they are not fixed cognitive learning-style categories.

## Data and sessions

PostgreSQL stores users, hashed session tokens, and each user's garden (skills, preferences, and field notes) as a JSONB document. Writes use an atomic revision check to prevent one tab from silently overwriting another.

A random, HttpOnly, SameSite=Lax browser cookie identifies each user for 90 days. HTTPS requests receive a Secure cookie. This prototype uses private browser sessions, not email/password accounts: there is no sign-in or cross-device recovery. Clearing the cookie loses access to that session. Preferences includes a JSON export for backup. A browser-local copy also protects against temporary connectivity loss; reload to reconnect.

For an internet-facing launch, add account sign-in, account recovery, and a production host for this Node service and its database. The current cloud preview is not a public production deployment.

`.gitignore` excludes `.env`, environment-specific variants, databases, logs, keys, user uploads, build output, and dependencies. `.env.example` contains placeholders only. Keep real secrets out of tracked files; `.gitignore` cannot untrack previously committed credentials.

## Build and verify

- `npm run build`: creates the production frontend.
- `npm start`: serves the production build and API.
- `npm test`: tests PostgreSQL persistence, session isolation, conflicting writes, request validation, and curated task generation. Uses a temporary PostgreSQL schema and removes it afterward. The test database user needs schema creation permission.
- `npm run test:browser`: checks onboarding, lesson resumption/completion, history, database restoration, session isolation and responsive overflow. AI responses are mocked; requires a configured test database and an installed Chrome/Edge/Chromium browser (`CHROMIUM_PATH` overrides detection).

There are no streak penalties. Stars represent completed lessons and effort, not certified mastery. Offline practice is identified explicitly when Gemini is unavailable.


## Supabase (database only)

The Node backend connects directly to Supabase PostgreSQL using `pg`; its private browser-session API does not use Supabase Auth. The GitHub Pages Gemini path uses anonymous Supabase Auth only to protect calls to the Edge Function.

1. In your Supabase project, choose **Connect** and copy the **Session pooler** PostgreSQL URI (port 5432). This is suitable for the persistent Node server and supports IPv4 environments.
2. Put that URI in the server’s ignored `.env` as `DATABASE_URL`. Replace the password placeholder with the project’s database password; URL-encode reserved characters. A Supabase publishable, anon, or service-role API key is not a PostgreSQL password.
3. Keep `DATABASE_POOL_MAX=5` and `DATABASE_SCHEMA=public` unless you have deliberately provisioned another schema. The server must connect as the table owner (the project’s default `postgres` user works).
4. Supabase hostnames automatically use `sslmode=verify-full`. If your provider requires a custom CA, download its server CA certificate and set `DATABASE_CA_CERT_PATH` to a file inside the ignored `secrets/` folder. Do not disable certificate verification.
5. Run `npm run db:check`, then restart the Node server. It applies both migrations, including enabling row-level security with no public client policies. User data is accessed through the Node API, not directly through Supabase’s browser Data API.

Do not put database URLs in `VITE_` variables or frontend code. The live Supabase connection cannot be verified until you configure your project’s connection string. Changing the connection URL selects a different database; it does not copy existing development data automatically.

[Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres) · [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Constellation interface

New visitors answer six untimed situational questions. Only the question and its text choices appear over the stars. Every answer contributes equally; recent answers resolve tied preference scores. The survey ranks hands-on practice, worked examples, reading/reflection and explaining aloud.

Home centers “What do you want to learn?” over a transparent text field. Enter or the arrow begins a lesson, with three activities shown one at a time. Leaving saves the current activity and response so it can be resumed without another generation. Completing the final response contracts the lesson into a star before a summary fades in.

A new subject gets its first star only after its first completed lesson. Later completions connect additional stars. Select a constellation to continue the subject; select an individual star or history entry to revisit a lesson. Completion IDs prevent double-clicks from adding duplicate stars. Existing progress is retained, and retaking the survey preserves lessons.

Settings holds the ranked preferences, survey retake, session duration and JSON export. “Try a different approach” in a completion summary changes the presentation order for that subject's next lesson. Reduced motion removes scene movement and uses a static completion moment.

The shared/learning.js module owns the survey and all 24 ranked frameworks. Each has orientation, an attempt, and retrieval/reflection. The server and Gemini function recompute the framework from validated preferences. A recent history of up to three lessons helps the guide move forward. These are presentation scaffolds, not a diagnosis or an assessment of mastery.

For database-free verification, run Node's test runner against tests/async.test.js, tests/learning.test.js, tests/journey.test.js, tests/framework-provider.test.js, tests/ai-plan.test.js and tests/db-config.test.js. The browser scripts detect Chrome, Edge or Chromium; CHROMIUM_PATH overrides detection. The Pages browser regression script expects an offline build with the Supabase browser settings unset so it does not require a CAPTCHA or spend AI requests.

## AI mentor prompt

The canonical system prompt is [`ai/system-prompt.txt`](ai/system-prompt.txt). The Node server loads it directly, so editing this file and restarting the server updates the OpenAI instructions. [`ai/examples.json`](ai/examples.json) contains sample task and deferral requests and responses.

The voice is concise, encouraging, and grounded. AI tasks target 60–120 seconds even when a longer session window is available; the duration is an estimate. Tasks contain one atomic action split into three brief instructions. Practical, retrieval, mind-mapping, and elaborative modes are supported, with flexible presentation preferences and adaptation from feedback. The optional `learning_mode` request field can choose a mode explicitly.

`ai/plan-contract.js` validates OpenAI JSON, reading length, method, and time estimate. Gemini retains its five-field response contract with validated content and exactly three steps. Both providers receive the canonical ranked framework. Invalid responses use curated offline practice. Generated lessons are persisted and reused when resumed. OpenAI retrieval checks remain hidden until a response is entered, then can be revealed on request; they are model-generated examples, not independent grading.

Deferrals remain instant, local UI responses and do not spend API tokens or deduct progress. The prompt also defines an `action=defer` JSON format for a future AI-driven deferral route; the current `/api/plan` endpoint deliberately requests task generation only. Configure `OPENAI_API_KEY` in the server's ignored `.env` to activate OpenAI. No live paid-provider response has been verified without that key.

The new mentor system prompt and strict micro-task contract apply to the OpenAI path. The existing Supabase/Gemini Edge Function remains available and keeps its own instructions and response contract.


## GitHub Pages deployment

GitHub Pages hosts static files. It cannot compile JSX or run the Node/PostgreSQL/AI API. The `Deploy Constellations to GitHub Pages` workflow installs dependencies, runs `npm run build:pages`, and deploys `dist/`. The same build also prepares root `index.html` and `assets/` for the existing branch-based publisher. The Pages build uses the `/breadcrumbs/` base path so JavaScript and CSS resolve under the repository URL.

The repository supports both Pages sources. With **GitHub Actions**, the workflow deploys `dist/`. With the existing **Deploy from a branch → main / (root)** setting, Pages serves the generated root `index.html` and `assets/`. Editable frontend files live in `client/`; Vite uses `client/index.html` for development. Run `npm run build:pages` and commit the generated root HTML/assets alongside source changes before pushing. No Pages administration permission is needed for the branch-based setup.

Without a Node backend URL or Supabase browser settings, the Pages build uses curated practice and saves progress in the browser. With Supabase browser settings it calls the Gemini Edge Function and still saves progress in the browser. The survey, lessons, constellations, history and export work in either mode. The Pages browser regression expects an offline build with public Supabase/Turnstile variables set to empty strings; CI builds this fixture before rebuilding the production site with its existing public settings.

The Pages workflow uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to call Gemini through the Edge Function. Vite reads environment files from the repository root; ignored `.env.pages.local` can hold public settings for local Pages builds. The optional `VITE_API_BASE_URL` path supports a separately hosted Node backend with PostgreSQL storage tied to a private browser session. A Supabase project URL alone does not provide the app's `/api/user` route.

Keep `DATABASE_URL`, OpenAI/Gemini API keys, and Supabase proxy tokens only on the backend or in private server environment variables. Never put them in `VITE_` build variables; those are visible to every visitor.


### Local session while Supabase is unavailable

Keep the Supabase connection in the ignored `.env`. To use a local PostgreSQL database for development, put only its local `DATABASE_URL` in an ignored `.env.local` and run `npm run dev:local`. The local override is loaded after `.env`; the production `npm start` command continues to use `.env` only. Database tests also prefer `.env.local` when present so development tests do not need to use the remote project. Never commit either environment file.

The product is branded Constellations. The existing GitHub repository path, PostgreSQL/Docker identifiers, session cookie, and `breadcrumbs-v1` browser storage key remain compatible with existing deployments and saved progress.

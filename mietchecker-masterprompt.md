**MASTER PROMPT — Generate the full “Mietchecker” SaaS project**

> **High-level instruction for Claude Code:**
> You are an expert full-stack engineer and infra engineer. Generate a complete, production-ready JavaScript / TypeScript SaaS codebase called **Mietchecker** that is **runnable locally** and **ready to deploy** to Vercel with Supabase for auth & DB, Stripe for payments, and Gemini (`gemini-2.5-flash-lite`) for LLM calls. Use modern tooling (Next.js + React + TypeScript). Produce clean, well-documented code, tests, and a precise README / documentation. Do not deliver partials — deliver a complete repository structure with runnable scripts and clear environment variables. Keep security, performance, and GDPR (Germany-focused) compliance in mind. Provide seed/sample data and test accounts to run locally.

---

# 1 — Project overview (what to build)

**Name:** Mietchecker
**Purpose:** Collect dispersed open data (OpenStreetMap + public city datasets in Germany) about a specific property/location and provide an AI-powered recommendation/score and an interactive chatbot per property (each property is a “Project”).
**Primary users:** House hunters in Germany.
**Initial data points:** Light pollution, Noise pollution, Crime rate, Internet speed, Demographic (age/family status distribution), Nearby grocery stores, Nearby laundromats, Parking situation.
**Core features:**

* User authentication (Supabase) and onboarding
* Create / manage Projects — one Project = one property (address or lat/lon)
* Data ingestion pipeline for OSM + city open data (initial implementation: OSM + example city datasets via fetcher modules)
* Property detail page: summary cards for each metric above + aggregated score and explanation
* Per-Project chatbot (LLM) that answers questions about the property and explains recommendations (with conversation history)
* Payment gating via Stripe: free trial + paid plan to unlock advanced features or longer chat history
* Light / Dark mode, responsive and accessible UI (liquid glass aesthetic)
* Documentation (README, architecture.md, developer setup, API spec)
* Tests: unit, integration (API), and E2E smoke tests
* CI workflow for tests and deploy checks

---

# 2 — Tech stack & libraries

**Frontend**

* Next.js (App Router) with TypeScript
* React
* Tailwind CSS + Tailwind UI principles (liquid glass aesthetic)
* shadcn/ui components permitted
* framer-motion for subtle animation
* i18n: next-intl or next-translate (German support)
* state: React Query (TanStack Query) for network caching
* optional small utility: clsx

**Backend**

* Serverless API with Next.js route handlers (edge / server functions) written in TypeScript
* Supabase (Postgres) for DB, realtime, and Auth
* Supabase local dev (supabase CLI recommended)
* Stripe server integration for checkout and webhooks
* Gemini LLM calls from server (never call LLM directly from browser). Use `gemini-2.5-flash-lite`.
* Data ingestion modules to query OpenStreetMap (Overpass API) + configurable city open data endpoints (CSV/JSON)
* Background job runner: lightweight job queue (e.g., BullMQ with Redis) OR serverless cron via Vercel for ingestion tasks. For initial iteration implement ingestion as on-demand serverless tasks plus an example background worker script runnable locally via `node scripts/ingest.js`.

**Dev / infra**

* Vercel deployment (production)
* Supabase project (production)
* GitHub Actions CI for tests & lint
* ESLint, Prettier, TypeScript strict mode
* Testing: Jest + React Testing Library + Playwright for a basic E2E
* Docker optional for local dev (only if needed for services)
* Environment management: `.env.local` and `.env.example`

---

# 3 — App architecture & file structure (example)

```
/mietchecker
├─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ data-sources.md
│  └─ privacy-gdpr.md
├─ .github/workflows/ci.yml
├─ next.config.js
├─ vercel.json
├─ package.json
├─ tsconfig.json
├─ .eslintrc.js
├─ app/                           # Next.js app router
│  ├─ layout.tsx
│  ├─ globals.css
│  ├─ (auth)/
│  ├─ projects/
│  │  ├─ route.ts                 # API for projects (create/list)
│  │  └─ [projectId]/
│  │     ├─ page.tsx              # Project UI + Chat UI
│  │     └─ route.ts              # API for project-level actions (start ingestion)
│  └─ api/
│     ├─ stripe/
│     │  └─ webhooks.ts
│     └─ gemini/
│        └─ chat.ts               # Server-side LLM proxy
├─ components/
│  ├─ Nav.tsx
│  ├─ ProjectCard.tsx
│  ├─ Chat/ (chat components)
│  └─ UI/ (reusable UI)
├─ lib/
│  ├─ supabaseClient.ts
│  ├─ gemini.ts                   # server-side LLM client + templates
│  ├─ osm.ts                      # Overpass/OSM helpers
│  └─ cityData.ts                 # city datasets helpers
├─ prisma/ (optional) or sql/      # DB schema & migrations if needed
├─ db/
│  ├─ schema.sql                  # Supabase table creation SQL
│  └─ seed.sql
├─ scripts/
│  ├─ ingest.js                   # local ingestion runner
│  └─ seed-local.js
├─ tests/
│  ├─ unit/
│  └─ e2e/
└─ .env.example
```

---

# 4 — Database schema (Supabase/Postgres)

Provide SQL to create tables and RLS policies. The generator should create this in `db/schema.sql` and also create seed data.

**Tables (concise definitions):**

```sql
-- users handled by Supabase Auth

-- projects: one per property
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  visibility text DEFAULT 'private' -- private | shared
);

-- project_metrics: store raw / aggregated metrics per project
CREATE TABLE project_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  metric_key text NOT NULL, -- e.g., 'noise', 'light', 'crime', 'internet_speed'
  metric_value numeric,     -- normalized value or measured
  raw JSONB,                -- raw source payload
  source text,              -- e.g., "osm", "city_of_berlin_open_data"
  fetched_at timestamptz DEFAULT now()
);

-- conversations: chat history per project
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL, -- 'user' or 'assistant' or 'system'
  message text,
  metadata JSONB,
  created_at timestamptz DEFAULT now()
);

-- payments
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  stripe_checkout_session_id text,
  stripe_payment_id text,
  status text,
  amount integer,
  currency text,
  created_at timestamptz DEFAULT now()
);
```

**RLS / policies**

* Projects: only return rows where `owner_id = auth.uid()`
* Conversations: only for project owners
* Use Supabase Policies created in SQL. Generator should include example RLS SQL statements.

---

# 5 — Supabase usage (Auth, client, policies)

* Use Supabase Auth for registration, sign-in (email + magic link + OAuth optional).
* Use Supabase client on server and on client. For server-only secrets (service_role key), ensure they are only used on server functions and not shipped to the browser.
* Provide `supabaseClient.ts` for browser usage (anon key) and `supabaseAdmin.ts` for server (service_role).
* Provide `.env.example` variables:

  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `SUPABASE_SERVICE_ROLE_KEY`
  * `DATABASE_URL` (if needed)
  * `VERCEL_URL` (for webhook verifications)
  * `STRIPE_SECRET_KEY`
  * `STRIPE_WEBHOOK_SECRET`
  * `STRIPE_PRICE_ID`
  * `OPENSTREETMAP_OVERPASS_URL` (default Overpass API)
  * `GEMINI_API_KEY`
  * `GEMINI_MODEL=gemini-2.5-flash-lite`

---

# 6 — Data ingestion design

**Goal:** Fetch and normalize data per property. Implement modular fetchers:

* `lib/osm.ts`:

  * Use Overpass API queries to fetch POIs (grocery, laundromat), roads (parking tags), noise-related tags, and nearby amenities.
  * Implement `fetchNearbyPOIs(lat, lon, radius, tags[])` returning normalized array.

* `lib/cityData.ts`:

  * Abstract loader for city open data endpoints (CSV or JSON). Provide an adapter pattern:

    * `fetchCityCrime(lat, lon, radius, cityConfig)` — uses city-specific endpoints; if none available, returns `null`.
  * Include example config for Berlin & Hamburg with sample endpoints (explain in `docs/data-sources.md` how to add more).

* `scripts/ingest.js`:

  * CLI to run ingestion for single project or bulk import.
  * Calls OSM fetcher + city fetchers and writes `project_metrics` rows to Postgres via Supabase Admin.

**Normalization & scoring**

* Provide a `lib/score.ts` to normalize metrics (0-100) and aggregate weighted score.
* Default metric weights (configurable per project): e.g., noise 20%, crime 20%, internet 20%, parking 15%, amenities 15%, light 10%.

**Caching & rate-limits**

* For Overpass, implement local caching (Supabase table or in-memory) with TTL to avoid rate limits.
* Provide backoff retry logic.

---

# 7 — LLM (Gemini) integration and chatbot

**Critical**: All LLM calls must be server-side through Next.js API routes.

* Create `app/api/gemini/chat.ts` (server handler) which:

  * Accepts `projectId` and `userMessage`.
  * Loads project metrics and recent conversation history (limit to last N messages).
  * Constructs a system prompt and user prompt using templates (see below).
  * Calls Gemini `gemini-2.5-flash-lite` and stores assistant response into `conversations`.
  * Returns streamed or chunked response if possible; otherwise return full response.

**System prompt template (server side)** — include in code exactly:

```
SYSTEM_PROMPT:
You are Mietchecker Assistant — a helpful assistant specialized in German real estate evaluation.
- You only use the provided project metrics and trustworthy public sources.
- If data is missing, state what is missing and suggest how to obtain it.
- Provide short, actionable recommendations and a summary score (0-100) where higher is better.
- When asked for legal or medical advice, refuse and recommend seeking a professional.
- Use German for end-user-facing text; use English only for internal logs.
```

**User prompt template**:

```
USER_PROMPT:
User asks about property: {project.title}, address: {project.address}, coords: {lat},{lon}.
Project metrics (JSON): {metrics_json}

User message:
{user_message}

Instructions:
- Answer in German unless user explicitly requested English.
- Keep reply <= 300 words for the main answer, then offer actionable checklist bullets.
- Cite where conclusions come from (e.g., "based on noise measurement from city dataset X (fetched_at YYYY-MM-DD)").
```

**Gemini call**

* Use `GEMINI_API_KEY` server env and `gemini-2.5-flash-lite`.
* Provide retry logic and fallback behavior.
* Throttle user requests (per-user rate-limiting) to avoid cost overruns.

**Prompt engineering**

* Provide a set of few-shot examples (2-3) in the generator for properties and expected assistant responses.

---

# 8 — Stripe integration

* Implement Stripe Checkout for subscription (or a single paid plan). Provide a `GET /api/stripe/create-checkout-session` server route that creates a checkout session and returns the URL to the frontend. Use server-side `STRIPE_SECRET_KEY`.
* Implement `api/stripe/webhooks.ts` to handle `checkout.session.completed` and `invoice.payment_succeeded` events. Verify with `STRIPE_WEBHOOK_SECRET`.
* On successful payment, write `payments` row and update user metadata in Supabase (e.g., `is_premium: true` in `auth.users` user_metadata).
* Provide client-side gating: basic features free; premium features include more ingestion frequency, more chat tokens / history, or PDF export.

---

# 9 — Frontend / UX details

**Design**

* Liquid glass look: blurred translucent cards with subtle borders and soft shadows. Use Tailwind `backdrop-blur` + `bg-white/5` for dark and `bg-white/30` for light, with contrast.
* Provide light/dark toggle and persist preference in `localStorage` and Supabase user_metadata when logged in.
* Accessible contrast and keyboard navigation.
* Use modern fonts (system stack).

**Pages**

* Landing page with signup CTA
* Dashboard: lists Projects (cards)
* Project page: header with map (leaflet or Mapbox — use OSM tiles), summary metrics, score, timeline of fetches, and a chat panel on the right (collapsible on mobile).
* Chat UI: streaming responses, message bubble components, save/export conversation button (PDF export optional).
* Settings: payment & billing, data export, privacy controls, connected city datasets.

**Map**

* Use Leaflet with OSM tiles or `react-leaflet`. Show POIs, heatmap overlay for noise or crime if available (simple circle radii or choropleth using normalized values).

---

# 10 — Internationalization & language rules

* Default language: German (`de`).
* UI strings in `locales/de.json` and `locales/en.json`.
* LLM replies should default to German; allow English when user requests.

---

# 11 — Security & privacy (German/GDPR)

* Do not store more PII than necessary. Minimize retention. Document retention policy in `docs/privacy-gdpr.md`.
* Provide mechanisms to delete user data (Supabase deletion endpoints).
* Require explicit opt-in for data sharing.
* Ensure server-side verification for Stripe & Gemini using secret keys (never exposed to frontend).
* Logging: redact PII before saving logs. Conversations saved are tied to `project_id` and `user_id`; mark them as user data that can be exported or deleted.
* Provide a `privacy` page and cookie consent flow.

---

# 12 — Local development & run instructions (must be runnable locally)

**Deliver a README with exact commands. Example:**

1. Clone repo
2. `cp .env.example .env.local` and fill in keys (Supabase project, Stripe keys, Gemini key). For local Supabase: `supabase start` recommended.
3. Start Supabase locally (instructions + link to supabase CLI)
4. Run DB migrations/seeds:

   * `pnpm db:setup` or `npm run db:setup` (should apply `db/schema.sql` and seed sample projects)
5. Install & run dev server:

   * `pnpm install`
   * `pnpm dev` (or `npm run dev`) — runs Next.js locally ([http://localhost:3000](http://localhost:3000))
6. Run ingestion script locally for example property:

   * `node scripts/ingest.js --lat=52.5200 --lon=13.4050 --projectId=<seeded-id>`
7. Run tests:

   * `pnpm test` and `pnpm e2e` for Playwright smoke test

**Important**: The produced repo must be runnable without paid plans (use test keys for Stripe; Gemini test keys if provided; otherwise mock LLM responses locally with a `GEMINI_MOCK=true` env var).

---

# 13 — CI/CD & deployment

* Provide `vercel.json` for the Vercel project and `README` steps: connect GitHub repo to Vercel, set environment variables in Vercel (list them).
* Provide GitHub Actions workflow:

  * On PR: run lint, tests
  * On merge to main: run tests, push deploy preview (Vercel automatically handles deploys)
* Provide infra checklist for launching to production (create Supabase project, set RLS policies, configure Stripe product).

---

# 14 — Documentation & deliverables

**Must include these docs (concise & precise):**

* `README.md` — quick start, local dev, deployment checklist
* `docs/architecture.md` — architecture diagrams (ASCII or text), data flow, component responsibilities
* `docs/data-sources.md` — details about Overpass queries used, example city endpoints, how to add new city connectors
* `docs/privacy-gdpr.md` — German data handling & deletion endpoints
* `docs/api.md` — API endpoints with request/response schema and sample requests
* `docs/testing.md` — how to run tests locally and in CI
* `docs/maintenance.md` — how to add a new metric (noise, light, etc)

---

# 15 — Tests & acceptance criteria

**Acceptance tests (must pass):**

1. App boots locally with sample data and you can sign up using Supabase Auth (in dev mode).
2. Create a Project with an address or lat/lon — ingestion script populates `project_metrics`.
3. Project detail page shows cards for the 8 metrics and an aggregated score.
4. Chatbot accepts a message and returns an LLM response (if `GEMINI_MOCK=true`, it returns a deterministic mocked response).
5. Stripe checkout session creation works in test mode and webhook handler updates user premium flag (use Stripe test keys).
6. Basic unit tests for ingestion functions and LLM prompt-builder; a Playwright E2E that covers signup -> create project -> open chat -> send message.

**Tests to include**

* Jest unit tests for `lib/osm.ts`, `lib/score.ts`, and `lib/gemini.ts` (mock network).
* Integration test for API route `api/gemini/chat` (mock Gemini).
* Playwright or Cypress minimal E2E.

---

# 16 — Extra developer instructions (for Claude Code)

* Generate TypeScript types for DB entities (e.g., `Project`, `ProjectMetric`, `Conversation`).
* Keep LLM prompt templates in a single module for easy tuning.
* Comment critical code paths and include TODOs for production hardening (monitoring, secrets rotation).
* Provide sample Postman collection or an OpenAPI minimal spec for the key endpoints.
* Keep code modular: ingestion adapters can be extended for new cities.

---

# 17 — What I expect you to return (deliverables)

When finished, deliver a single repository with:

* Complete Next.js app (TypeScript) in `app/` + components + lib
* `db/schema.sql` and seed scripts
* `scripts/ingest.js` for local ingestion
* Supabase RLS policy SQL and instructions
* Stripe webhook route and checkout integration
* Gemini server proxy with prompt templates and example few-shot
* README and all docs listed above
* Tests (unit + E2E)
* `.env.example`
* A small set of sample seed projects (2 properties: Berlin & Hamburg coordinates) and at least one sample conversation stored.

---

# 18 — Quality & style constraints

* Use TypeScript strict mode; types for all exported functions.
* Keep code well-structured and idiomatic. No large single-file monsters.
* UI polished and modern; subtle animations but not flashy.
* Keep LLM prompt outputs in German by default.
* Avoid sending LLM keys or Stripe keys to the client.
* Provide clear, minimal logs for debugging.

---

# 19 — Example prompts/few-shot for LLM assistant (include in repo)

Provide 2-3 short example turn pairs that teach the assistant to answer concisely and cite sources. Example for inclusion in `lib/gemini.ts`.

---

# 20 — Closing constraints

* If a requested external key is missing (Stripe, Gemini), the code must fall back to a deterministic mock mode and document how to enable mock. Mocks must be simple deterministic responses suitable for unit tests and local demos.
* The generated repo must be **immediately runnable locally** with `pnpm dev` (or `npm run dev`) after following `README.md` steps and filling `.env.local` (use `GEMINI_MOCK=true` for first run if a real key is not available).

---

If any of the above is ambiguous, assume the user prefers German-first UX, modular code with clear typings, and an MVP that favors correctness and extensibility over bells and whistles. Start by generating the entire codebase in a single repository with the structure, files, and documentation described above.

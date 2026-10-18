# OpportunityKit v2

A student opportunity discovery hub built around the Google Stitch OpportunityKit design package. It is designed for Next.js on Vercel, Supabase for persistence/authentication, Google Gemini for structured AI extraction, Firecrawl for public-page scraping, and a Telegram bot for link-based submissions.

> **Implementation status:** UI routes, sample data, ingestion API, Telegram webhook, Supabase schema, and deployment notes are included. This is a starter implementation: live credentials, database setup, bot webhook registration, and a production review are still required. The saved-opportunity view and application tracker currently include demo/local UI data; per-user CRUD and authenticated AI fit scoring are not yet fully wired.

## Included

- Responsive dashboard using the Stitch-inspired dark indigo / violet / teal visual system.
- Opportunity discovery with search, category filters, and sorting.
- Opportunity details, starter saved view, application tracker, profile editor, AI fit report shell, and integration settings.
- `POST /api/ingest/link`: Firecrawl page extraction → Gemini JSON extraction → Supabase upsert.
- `POST /api/telegram/webhook?secret=...`: receives a Telegram message, checks an optional chat allowlist, imports its first URL, and replies with extracted details.
- `POST /api/telegram/setup`: registers webhook using the Telegram Bot API; protected by `CRON_SECRET`.
- `POST /api/scrape`: protected batch ingestion endpoint for up to 10 supplied URLs.
- `POST /api/discover/search`: protected Firecrawl web search followed by page extraction and Gemini structuring (up to 8 results per query).
- `GET /api/opportunities` and `GET /api/health`.
- Supabase SQL migration with opportunities, profiles, saved opportunities, applications, and fit-report tables.
- Original Stitch HTML and screen captures retained under `public/design-reference/` for reference.

## Local development

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The UI can be explored with curated sample data before credentials are configured. Some sample rows are explicitly marked as demo; verify all deadlines and eligibility on official sites.

## Credentials and integrations

Create `.env.local` locally. Never commit it or send its values in chat. In Vercel, add the same required variables under **Project → Settings → Environment Variables**.

### 1. Supabase

1. Create a project at https://supabase.com/.
2. Open **Project Settings → API** (or **Connect**) and copy the Project URL and publishable/anon key.
3. Copy the `service_role` secret only to server-side environment variables. Never prefix it with `NEXT_PUBLIC_`.
4. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
5. Configure Authentication providers and the site's allowed redirect URLs before enabling production login.

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

### 2. Google Gemini

Create an API key in Google AI Studio: https://aistudio.google.com/apikey

- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash` (adjust to a model enabled for your account)

Gemini extracts opportunity fields from webpage text. AI extraction can be wrong; always review official dates and eligibility.

### 3. Firecrawl

Create an API key at https://www.firecrawl.dev/.

- `FIRECRAWL_API_KEY`
- `FIRECRAWL_API_BASE_URL=https://api.firecrawl.dev/v2`

Firecrawl is the scraping/extraction API. It may have usage limits or paid plans; verify its current plan and terms. Do not scrape sites that prohibit it, bypass authentication/paywalls, or ignore robots/terms.

### 4. Telegram bot

1. In Telegram, open the official `@BotFather`, run `/newbot`, and store the bot token privately.
2. Deploy the site to HTTPS (Vercel is recommended) and set `APP_BASE_URL` to that public URL.
3. Generate a long random webhook secret and set `TELEGRAM_WEBHOOK_SECRET`.
4. Set `CRON_SECRET` to a different long random secret; it protects webhook setup and the batch scrape endpoint.
5. For production, set `TELEGRAM_ALLOWED_CHAT_IDS` to comma-separated numeric chat IDs permitted to submit links. An empty value denies all chat submissions until an allowlist is configured. This is the safe default.
6. After deployment, register the webhook with:

```bash
curl -X POST "$APP_BASE_URL/api/telegram/setup" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Then send a public opportunity URL to the bot. It fetches the page through Firecrawl, extracts structured details with Gemini, upserts the listing into Supabase, and replies with a summary. If credentials are missing, it responds with a configuration error. The bot does not join groups or read all messages by default; users must send the URL to the bot or explicitly configure group access.

### All environment variables

See `.env.example`. `APP_BASE_URL` must be the deployed HTTPS origin for Telegram. `CRON_SECRET` should be different from `TELEGRAM_WEBHOOK_SECRET`.

## API examples

Import a single URL (when `CRON_SECRET` is configured, the request must be authorized):

```bash
curl -X POST "$APP_BASE_URL/api/ingest/link" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"url":"https://official.example.org/hackathon"}'
```

Batch scrape up to 10 known URLs:

```bash
curl -X POST "$APP_BASE_URL/api/scrape" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"urls":["https://official.example.org/hackathon"]}'
```

Check integration readiness:

```bash
curl "$APP_BASE_URL/api/health"
```

The discovery endpoint can search the web for a specific opportunity query and process a bounded set of results. Example: `curl -X POST "$APP_BASE_URL/api/discover/search" -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" -d '{"query":"student hackathons accepting applications 2026","limit":5}'`. Automated recurring discovery still needs a schedule, source strategy, and rate limits. This project intentionally does not crawl the entire web indiscriminately.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import `OpportunityKit-v2`.
3. Set the environment variables in Vercel for Preview and Production as appropriate.
4. Deploy; use the production HTTPS domain as `APP_BASE_URL`.
5. Register the Telegram webhook with the curl command above.
6. Check `/api/health`, then test with a public opportunity URL.

## Security notes

- Never commit `.env.local`, API keys, Supabase service-role keys, or Telegram tokens.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; it bypasses Row Level Security.
- Configure `TELEGRAM_ALLOWED_CHAT_IDS` before public launch.
- `CRON_SECRET` is a shared secret, not a user-authentication system. Use authenticated, per-user authorization before exposing user-specific features.
- Opportunity page text is untrusted input. The extractor treats it as data and limits input length, but outputs still need review.
- Add request throttling, monitoring, duplicate review, and source allowlisting before large-scale public ingestion.
- This starter has not been security-audited or tested with live credentials.

## Next production steps

1. Add Supabase SSR authentication and per-user protected routes.
2. Wire saved opportunities and application CRUD to the current schema.
3. Add profile-backed Gemini fit reports and persist them per user.
4. Add scheduled ingestion from a curated list of official feeds/APIs and deduplication review.
5. Add rate limiting, source allowlists, abuse controls, tests, and deployment checks.

# OpportunityKit

<p align="center">
  <strong>Discover opportunities. Organize applications. Accelerate your growth.</strong>
</p>

<p align="center">
  An AI-assisted opportunity discovery and application workspace for students.
</p>

<p align="center">
  <a href="https://opportunity-kit-v2.vercel.app/">Live Demo</a> ·
  <a href="https://github.com/awakenedarpit/OpportunityKit-v2/issues">Report a Bug</a> ·
  <a href="https://github.com/awakenedarpit/OpportunityKit-v2/issues">Request a Feature</a>
</p>

---

## Overview

OpportunityKit helps students discover opportunities and manage the steps that follow. It brings opportunity listings, saved items, personal application tracking, and profile information into one workspace—so students can spend less time searching across scattered sources and more time preparing strong applications.

The app is built with Next.js and Supabase. Its optional ingestion pipeline uses Firecrawl to retrieve public webpage content and AI providers to extract structured opportunity details. A Telegram bot accepts links, queues imports, and sends the extracted result back after processing.

> **Project status:** OpportunityKit is actively developed. External integrations require credentials and correct deployment configuration. AI-extracted information can be incomplete or inaccurate; always verify deadlines, eligibility, and application instructions on the original source.

## Features

### Discover and organize
- Browse, search, filter, and sort opportunity listings.
- View opportunity details such as organization, type, location, work mode, deadline, eligibility, skills, and source link when available.
- Save opportunities to a personal saved list.
- Track applications through Saved, Applied, Assessment, Interview, Offer, Rejected, and Withdrawn statuses.
- Add notes and review application progress.
- Maintain a profile with education, skills, and interests.

### AI-assisted opportunity ingestion
- Submit a public opportunity URL for processing.
- Firecrawl retrieves readable page content.
- AI providers extract structured fields such as title, organization, deadline, eligibility, skills, stipend, and description.
- Imported opportunities are saved to Supabase, with the source URL used for deduplication.
- Provider fallback support helps ingestion continue when a configured AI provider is unavailable.

### Telegram link importer
- Send a public opportunity URL to the configured Telegram bot.
- The webhook validates the chat against an allowlist and places the URL in a Supabase queue.
- A scheduled GitHub Actions workflow calls the protected worker endpoint.
- The worker processes queued imports, saves successful results, and replies in Telegram with the extracted details.
- Failed jobs can be retried; jobs that exhaust their attempts are marked failed.

### Account and data
- Supabase email/password authentication.
- Protected workspace pages and authentication callback handling.
- User-owned profiles, saved opportunities, and application records protected with Row Level Security (RLS).

## How it works

1. **Discover:** Browse opportunities and open the original source for full details.
2. **Save:** Bookmark listings worth revisiting.
3. **Track:** Add opportunities to your tracker and update application status or notes.
4. **Import:** Submit a public URL through the app's ingestion API or Telegram bot.
5. **Extract:** Firecrawl retrieves page content; the configured AI provider chain returns structured data.
6. **Review:** Check the saved listing and verify important information against the official source.

## Technology stack

| Technology | Purpose |
| --- | --- |
| Next.js 15 | App Router, pages, route handlers, server-side logic |
| React 19 | Interactive user interface |
| TypeScript | Application types |
| Supabase | Authentication, PostgreSQL database, and Row Level Security |
| Google Gemini | Primary and secondary AI extraction models |
| Groq / OpenRouter | Optional cross-provider AI fallbacks |
| Firecrawl | Public webpage scraping |
| Telegram Bot API | Opportunity link submission and result notifications |
| GitHub Actions | Scheduled Telegram import queue worker |
| Vercel | Recommended hosting for the Next.js application |
| Lucide | Interface icons |

## Project structure

```text
.
├── .github/workflows/
│   └── telegram-import-worker.yml  # Scheduled Telegram queue processor
├── public/                         # Static assets and design references
├── src/
│   ├── app/
│   │   ├── api/                    # Health, discovery, ingestion, Telegram routes
│   │   ├── auth/callback/           # Supabase auth callback
│   │   ├── login/                   # Sign-in
│   │   ├── signup/                  # Registration
│   │   ├── discover/                # Opportunity discovery
│   │   ├── saved/                   # Saved opportunities
│   │   ├── tracker/                 # Application tracker
│   │   └── profile/                 # Profile editing
│   ├── components/                 # Shared UI components
│   └── lib/
│       ├── supabase/                # Supabase clients
│       ├── ingest.ts                # Scraping and AI extraction pipeline
│       └── security.ts              # URL and access validation
├── supabase/migrations/             # Database schema migrations
├── middleware.ts                   # Session refresh and access redirects
├── .env.example                    # Environment variable template
└── package.json
```

This is a high-level map; individual files may change as development continues.

## Getting started

### Prerequisites

- Node.js 20.9 or newer
- npm and Git
- A Supabase project
- Optional API credentials for Firecrawl and AI providers
- Optional Telegram bot token

### 1. Clone and install

```bash
git clone https://github.com/awakenedarpit/OpportunityKit-v2.git
cd OpportunityKit-v2
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Add the credentials for the services you intend to use. Never commit `.env.local` or paste secret values into issues, screenshots, or public messages.

### 3. Set up Supabase

Create a Supabase project, configure its URL and keys, and run the SQL migrations in `supabase/migrations/` in filename order using the Supabase SQL Editor. This includes the initial schema, user workspace tables, and Telegram import queue/function migration.

In Supabase Authentication settings, configure the Site URL and allowed redirect URLs for both local development and your deployed domain. Keep RLS enabled on user-owned tables and verify policies with separate test accounts.

If your project already has manually modified tables, compare the live schema with the migration files before applying changes. Back up important data first.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the production app |
| `npm run start` | Start the production server |
| `npm run lint` | Run the configured lint script |

## Environment variables

Copy the names from `.env.example`; configure only the integrations you use.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database operations; secret and must never be exposed to the browser |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Primary Gemini model |
| `GEMINI_FALLBACK_MODEL` | Secondary Gemini model |
| `OPENROUTER_API_KEY` | Optional OpenRouter fallback credential |
| `OPENROUTER_MODEL` | OpenRouter model identifier |
| `GROQ_API_KEY` | Optional Groq fallback credential |
| `GROQ_MODEL` | Groq model identifier |
| `FIRECRAWL_API_KEY` | Firecrawl API key |
| `FIRECRAWL_API_BASE_URL` | Firecrawl API base URL; defaults to `https://api.firecrawl.dev/v2` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Secret used to validate incoming Telegram webhook requests |
| `TELEGRAM_ALLOWED_CHAT_IDS` | Comma-separated Telegram chat IDs allowed to submit links |
| `APP_BASE_URL` | Public app origin; use HTTPS in production |
| `CRON_SECRET` | Bearer secret protecting setup, ingestion, and worker endpoints |

The AI extraction chain attempts the configured Gemini primary model, then the Gemini fallback when applicable, followed by Groq and OpenRouter when their credentials are configured. Provider/model availability and pricing can change; choose model IDs supported by your provider accounts.

### Where to get credentials

- Supabase: https://supabase.com/dashboard
- Gemini: https://aistudio.google.com/apikey
- Firecrawl: https://www.firecrawl.dev/
- OpenRouter: https://openrouter.ai/
- Groq: https://console.groq.com/keys
- Telegram: https://t.me/BotFather

## Telegram bot setup

Telegram imports use a queue and a separate worker. Configuring only the bot token is not enough.

1. Create a bot with [@BotFather](https://t.me/BotFather) and set `TELEGRAM_BOT_TOKEN`.
2. Set `TELEGRAM_WEBHOOK_SECRET` to a long random value.
3. Set `TELEGRAM_ALLOWED_CHAT_IDS` to the numeric chat IDs allowed to submit opportunity links. An empty allowlist is fail-closed.
4. Set `APP_BASE_URL` to your deployed HTTPS origin.
5. Set `CRON_SECRET` to a long random value.
6. Add the same value as a GitHub Actions repository secret named `OPPORTUNITYKIT_CRON_SECRET` in **Settings → Secrets and variables → Actions**.
7. Add the app environment variables in Vercel and redeploy.
8. Register the Telegram webhook by calling the protected setup endpoint:

```bash
curl -X POST "$APP_BASE_URL/api/telegram/setup" \
  -H "Authorization: Bearer $CRON_SECRET"
```

9. Ensure the GitHub Actions workflow `.github/workflows/telegram-import-worker.yml` is enabled. It runs on a five-minute schedule and can also be started manually from the Actions tab.
10. Send a public opportunity URL to the bot. The bot should acknowledge that the link was queued, then send a result after the worker processes it.

**Important:** The GitHub secret `OPPORTUNITYKIT_CRON_SECRET` must exactly match the Vercel environment variable `CRON_SECRET`. If they differ, the scheduled worker receives an unauthorized response. The worker also requires Supabase service-role access, Firecrawl, and Telegram configuration in the deployed app.

Keep bot tokens and secrets private. Do not put secrets in a URL, commit them, or share them in screenshots.

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Reports whether key integrations are configured |
| `GET` | `/api/opportunities` | Returns available opportunity listings |
| `POST` | `/api/ingest/link` | Ingests one public opportunity URL; requires bearer authorization |
| `POST` | `/api/scrape` | Batch-ingests a bounded list of URLs |
| `POST` | `/api/discover/search` | Searches for opportunities and processes a bounded result set |
| `POST` | `/api/telegram/setup` | Registers the Telegram webhook; requires `CRON_SECRET` |
| `POST` | `/api/telegram/webhook` | Receives Telegram updates and queues a submitted URL |
| `GET` / `POST` | `/api/telegram/worker` | Claims and processes queued imports; requires `CRON_SECRET` |

### Health check

```bash
curl "$APP_BASE_URL/api/health"
```

### Ingest a URL

```bash
curl -X POST "$APP_BASE_URL/api/ingest/link" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"url":"https://example.org/opportunity"}'
```

Use public source URLs and verify the returned details on the original page.

## Deploy to Vercel

1. Import `awakenedarpit/OpportunityKit-v2` at https://vercel.com/new.
2. Use the Next.js framework preset and the standard Next.js build settings.
3. Add the environment variables required by your enabled features.
4. Deploy the application.
5. Add the deployed domain to Supabase Auth redirect settings.
6. Set `APP_BASE_URL` to the public HTTPS deployment URL and redeploy.
7. If using Telegram, complete the Telegram setup above and add the matching GitHub Actions secret.
8. Check `/api/health` and test authentication, saved items, application tracking, and Telegram ingestion.

Environment variable changes generally require a redeployment. Never expose service-role keys or bot tokens in client-side code.

## Security and data quality

- Never commit `.env.local`, service-role keys, AI provider keys, Telegram tokens, or shared secrets.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; it bypasses RLS.
- Keep RLS enabled and test that one user cannot access another user's private records.
- Restrict Telegram submissions with `TELEGRAM_ALLOWED_CHAT_IDS`.
- Use different values for `CRON_SECRET` and `TELEGRAM_WEBHOOK_SECRET`.
- Treat scraped webpage content and AI output as untrusted data.
- Verify deadlines, eligibility, stipend details, and application instructions on the official source.
- Add appropriate monitoring, rate limiting, and abuse protection before broad public use.

## Known limitations

- Listing coverage and freshness depend on the sources and data currently available.
- Some listings may be sample, incomplete, expired, or unverified.
- AI extraction can misinterpret or omit information.
- Scraping may fail on pages that require login, block automated access, or provide little readable content.
- External services have their own rate limits, model availability, and pricing.
- The project has not been represented as security-audited or fully tested against every deployment configuration.

## Contributing

Contributions and bug reports are welcome.

1. Fork the repository.
2. Create a focused branch for your change.
3. Keep credentials and personal data out of commits and logs.
4. Run relevant checks locally.
5. Open a pull request with a clear summary and migration notes if database changes are involved.

Use [GitHub Issues](https://github.com/awakenedarpit/OpportunityKit-v2/issues) for bugs and feature requests.

## License

No license has been confirmed in this README. Unless a license file is added to the repository, do not assume the code is licensed for reuse, redistribution, or commercial use.

# OpportunityKit v2

<p align="center">
  <strong>Discover opportunities. Organize applications. Keep your next step in reach.</strong>
</p>

<p align="center">
  A student-focused opportunity discovery and application workspace built with Next.js, Supabase, Gemini, Firecrawl, and Telegram.
</p>

<p align="center">
  <a href="https://opportunity-kit-v2.vercel.app/">Live Demo</a> ·
  <a href="https://github.com/awakenedarpit/OpportunityKit-v2/issues">Report a Bug</a> ·
  <a href="https://github.com/awakenedarpit/OpportunityKit-v2/issues">Request a Feature</a>
</p>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [How it works](#how-it-works)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Opportunity ingestion and Telegram bot](#opportunity-ingestion-and-telegram-bot)
- [API reference](#api-reference)
- [Run locally](#run-locally)
- [Deploy to Vercel](#deploy-to-vercel)
- [Security and privacy](#security-and-privacy)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## Overview

**OpportunityKit** is a web application intended to help students discover opportunities and manage the work that follows. Instead of keeping opportunities in scattered bookmarks and tracking application stages separately, users can discover listings, save relevant items, maintain an application tracker, and manage a profile from one workspace.

The project combines a Next.js interface with Supabase authentication and persistence. Optional ingestion integrations use Firecrawl to retrieve public webpage content, Google Gemini to turn that content into structured opportunity information, and Telegram to submit opportunity links to the application.

The interface follows the OpportunityKit Stitch-inspired visual direction: midnight navy, electric blue, and violet accents.

> **Project status:** This repository is an actively developed project, not a claim of a fully audited production service. Authentication, profile editing, saved opportunities, and application tracking have been implemented. External integrations require your own credentials and setup. Review the known limitations below before relying on the application for important deadlines.

## Features

### Account and profile

- Email/password sign-up and sign-in through Supabase Auth.
- Authentication callback handling for confirmation and recovery flows.
- Protected application pages and session refresh middleware.
- Sign-out from the application shell.
- Profile editing for name, education, skills, and interests, stored against the signed-in user's profile.

Supabase email confirmation and redirect URLs must be configured for the domain you use.

### Discover opportunities

- Browse opportunity listings in a searchable discovery interface.
- Filter and sort listings using the available opportunity metadata.
- Open a detail page with information such as organization, opportunity type, location or work mode, deadline, eligibility, skills, and source URL when provided.
- Starter and curated data can be used to explore the interface. Treat unverified or sample listings as examples, not confirmed openings.

### Saved opportunities

- Save an opportunity from a listing card.
- View saved opportunities on the Saved page.
- Remove an item from the saved list.
- Store saved records per authenticated user in Supabase.

### Application tracker

- Add opportunities to a personal application tracker.
- Track statuses such as **Saved**, **Applied**, **Assessment**, **Interview**, **Offer**, **Rejected**, and **Withdrawn**.
- Record notes and application/deadline details where available.
- Update a status or remove a tracker entry.
- View a summary of tracked applications.

### Opportunity ingestion

- Submit a public opportunity URL for ingestion.
- Use Firecrawl to retrieve page content and Gemini to extract structured fields.
- Persist ingested listings in Supabase when the required server-side configuration is present.
- Search for opportunities through the discovery API and process a bounded set of results.
- Import a URL through the Telegram bot webhook.

AI-generated fields may be incomplete or incorrect. Always open the original source to verify the deadline, eligibility, stipend, and application requirements.

### Health and integration visibility

- A health endpoint reports whether key integration settings are configured.
- API routes validate request data and protect administrative ingestion actions with a shared secret where configured.

## How it works

1. **Discover:** Browse listings and open the original opportunity source for full details.
2. **Save:** Bookmark opportunities you want to revisit.
3. **Track:** Add an opportunity to your tracker and update its application status or notes.
4. **Personalize:** Maintain your profile details for your own workspace.
5. **Ingest (optional):** Send a public URL through the API or Telegram. Firecrawl retrieves page content, Gemini extracts structured fields, and the server can store the result in Supabase.

The ingestion integrations are optional for local UI development, but the corresponding environment variables are required to use them.

## Technology stack

| Technology | Role |
| --- | --- |
| [Next.js](https://nextjs.org/) 15 | App Router, pages, route handlers, and server-side application logic |
| [React](https://react.dev/) 19 | Interactive UI components |
| [TypeScript](https://www.typescriptlang.org/) | Application types |
| [Supabase](https://supabase.com/) | Authentication, PostgreSQL database, and Row Level Security |
| [Google Gemini](https://ai.google.dev/) | Structured extraction from opportunity page content |
| [Firecrawl](https://www.firecrawl.dev/) | Public-page scraping and web search for ingestion |
| [Telegram Bot API](https://core.telegram.org/bots/api) | Link submission through a Telegram bot |
| [Lucide](https://lucide.dev/) | Interface icons |
| [Vercel](https://vercel.com/) | Recommended hosting platform for the Next.js application |

## Project structure

The main folders and files are organized approximately as follows:

```text
.
├── public/
│   └── design-reference/       # Original Stitch design references
├── src/
│   ├── app/
│   │   ├── api/                # Health, ingestion, discovery, and Telegram routes
│   │   ├── auth/callback/      # Supabase auth callback
│   │   ├── login/              # Sign-in page
│   │   ├── signup/             # Registration page
│   │   ├── saved/              # Saved opportunities
│   │   ├── tracker/            # Application tracker
│   │   └── profile/            # Profile editing
│   ├── components/             # Shared UI and workspace components
│   └── lib/
│       ├── supabase/            # Browser and server Supabase clients
│       ├── demo-data.ts         # Starter opportunity data
│       ├── ingest.ts            # Ingestion and extraction pipeline
│       └── security.ts          # Request and Telegram access checks
├── supabase/
│   └── migrations/              # SQL schema migrations
├── middleware.ts                # Session refresh and page access redirects
├── .env.example                 # Environment variable template
└── package.json
```

This is a guide to the key areas; exact filenames may evolve as the project develops.

## Getting started

### Prerequisites

Install the following:

- **Node.js 20.9 or newer**
- **npm**
- A Git client
- A Supabase project for authentication and persistent user data
- Optional: Gemini and Firecrawl API keys for ingestion
- Optional: a Telegram bot token for link submission

### 1. Clone the repository

```bash
git clone https://github.com/awakenedarpit/OpportunityKit-v2.git
cd OpportunityKit-v2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your local environment file

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and add the credentials you need. Never commit this file or share secret values in screenshots, issues, or chat.

### 4. Configure Supabase

Follow the [Supabase setup](#supabase-setup) section before testing sign-in or persistent workspace features.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Stop the server with `Ctrl+C`. If Next.js reports stale or missing files under `.next`, stop the server, remove the generated build cache with `rm -rf .next`, and run `npm run dev` again.

### Available npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server after building |
| `npm run lint` | Run the configured lint script; check compatibility with the installed Next.js version if it fails |

## Environment variables

Copy `.env.example` to `.env.local` and fill in only the integrations you intend to use.

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase features | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server Supabase client | Publishable/anon key; designed for client use when RLS is configured correctly |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side ingestion/admin database operations | **Secret. Never expose to browser code or prefix with `NEXT_PUBLIC_`.** |
| `GEMINI_API_KEY` | AI extraction | Google AI Studio API key |
| `GEMINI_MODEL` | AI extraction | Example: `gemini-2.5-flash`; use a model enabled for your account |
| `FIRECRAWL_API_KEY` | Page scraping/search | Firecrawl API key |
| `FIRECRAWL_API_BASE_URL` | Page scraping/search | Usually `https://api.firecrawl.dev/v2` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot | Token created through `@BotFather` |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook | Random secret checked by the webhook route |
| `TELEGRAM_ALLOWED_CHAT_IDS` | Telegram access control | Comma-separated numeric chat IDs; configure an allowlist for production |
| `APP_BASE_URL` | Telegram setup and generated callback/webhook URLs | Public HTTPS origin in production; `http://localhost:3000` locally |
| `CRON_SECRET` | Protected ingestion/setup endpoints | Long random secret; keep distinct from the Telegram webhook secret |

Do not paste secret values into the README. The example file intentionally contains blank placeholders.

### Where to get the keys

- Supabase: [Supabase Dashboard](https://supabase.com/dashboard)
- Gemini: [Google AI Studio API keys](https://aistudio.google.com/apikey)
- Firecrawl: [Firecrawl](https://www.firecrawl.dev/)
- Telegram: open [@BotFather](https://t.me/BotFather) in Telegram

Firecrawl and AI providers may have usage limits or paid plans. Check current pricing and terms before enabling them.

## Supabase setup

1. Create a Supabase project.
2. Open **Project Settings → API** (or the project's **Connect** panel) and copy the project URL and publishable/anon key.
3. Add those values to `.env.local`.
4. In the Supabase SQL Editor, run the repository's initial schema migration:
   - `supabase/migrations/001_initial_schema.sql`
5. Run the user workspace migration:
   - `supabase/migrations/20261019_user_workspace.sql`
6. In **Authentication → URL Configuration**, set the Site URL and allowed redirect URLs for local development and your deployed domain. Include the application's auth callback route as needed.
7. Enable and configure email/password authentication and confirmation emails according to your deployment needs.
8. Confirm Row Level Security (RLS) is enabled on user-owned tables and that policies restrict records to the authenticated owner.

**Existing database warning:** If you created or altered tables manually while testing earlier versions, your schema may not match the checked-in migration files exactly. Review the actual columns, constraints, and policies before rerunning or modifying migrations. Do not assume a successful page load proves the database schema is fully reconciled. Back up important data before applying schema changes.

For production, keep the Supabase service-role key server-only. It bypasses Row Level Security, so any code using it must perform its own authorization checks.

## Opportunity ingestion and Telegram bot

### Ingest a link

The ingestion flow is intended for public opportunity pages:

1. The API receives a URL.
2. Firecrawl retrieves readable page content.
3. Gemini extracts structured opportunity fields.
4. The server validates the extracted data and stores the listing when database configuration is available.
5. The result is returned to the caller.

The source page remains authoritative. Confirm every AI-extracted field against the original listing.

### Set up Telegram

1. Create a bot using `@BotFather` and copy the bot token into `TELEGRAM_BOT_TOKEN`.
2. Deploy the application to an HTTPS domain.
3. Set `APP_BASE_URL` to the deployed origin, with no private credentials in the URL.
4. Generate a long random value for `TELEGRAM_WEBHOOK_SECRET`.
5. Set a different long random value for `CRON_SECRET`.
6. Set `TELEGRAM_ALLOWED_CHAT_IDS` to the numeric chat IDs permitted to submit links. An empty allowlist is intentionally fail-closed and means submissions are not authorized.
7. Add all values to your hosting provider's environment settings and redeploy.
8. Register the webhook:

```bash
curl -X POST "$APP_BASE_URL/api/telegram/setup" \
  -H "Authorization: Bearer $CRON_SECRET"
```

9. Send a public opportunity URL directly to the bot and review the response.

Do not share the bot token or webhook secrets. Restrict bot access to trusted chat IDs and do not expose the setup endpoint without its authorization header.

## API reference

The exact response fields may change with implementation updates. The following describes the main routes currently included in the project.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Reports whether key integrations are configured |
| `GET` | `/api/opportunities` | Returns available opportunity listings |
| `POST` | `/api/ingest/link` | Ingests a single opportunity URL |
| `POST` | `/api/scrape` | Batch-ingests a bounded list of URLs (up to 10) |
| `POST` | `/api/discover/search` | Searches for opportunities and processes a bounded number of results |
| `POST` | `/api/telegram/setup` | Registers the Telegram webhook; requires bearer authorization |
| `POST` | `/api/telegram/webhook` | Receives Telegram updates and imports a submitted URL |

### Example: check health

```bash
curl "$APP_BASE_URL/api/health"
```

### Example: ingest one URL

```bash
curl -X POST "$APP_BASE_URL/api/ingest/link" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"url":"https://official.example.org/opportunity"}'
```

### Example: batch ingest URLs

```bash
curl -X POST "$APP_BASE_URL/api/scrape" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"urls":["https://official.example.org/opportunity"]}'
```

### Example: search for opportunities

```bash
curl -X POST "$APP_BASE_URL/api/discover/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"query":"student hackathons accepting applications","limit":5}'
```

Use real public source URLs in place of the example domain. Protect ingestion endpoints from abuse and keep request sizes and provider usage within acceptable limits.

## Run locally

For a quick local check:

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase settings
npm run dev
```

Then test the following manually:

- Sign up and sign in with a test account.
- Verify auth redirects and sign-out behavior.
- Edit and save profile fields.
- Save an opportunity, refresh, and confirm it remains saved.
- Add an application tracker entry, update its status, and confirm persistence after refresh.
- Test with a second account and confirm it cannot see the first account's private records.
- Test ingestion endpoints only after configuring the relevant server-side keys and authorization secrets.

These are recommended verification steps, not a statement that every test has been run in every environment.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Open [Vercel New Project](https://vercel.com/new) and import `awakenedarpit/OpportunityKit-v2`.
3. Keep the framework preset set to **Next.js**.
4. Use the default build command or `npm run build`.
5. Leave the output directory at the Next.js default; do not configure static export output such as `out` because this app uses server route handlers.
6. Add the required environment variables in **Project Settings → Environment Variables** for the environments you will use.
7. Deploy and configure Supabase Auth redirect URLs to match the deployed domain.
8. Set `APP_BASE_URL` to the public HTTPS deployment origin, redeploy, and register the Telegram webhook if using the bot.
9. Open `/api/health` and run the manual verification checklist above.

Environment variable changes usually require a new deployment before they take effect. Never place service-role keys or bot tokens in client-side variables.

## Security and privacy

- Never commit `.env.local`, service-role keys, Gemini/Firecrawl keys, Telegram bot tokens, or webhook secrets.
- Keep `SUPABASE_SERVICE_ROLE_KEY` on the server only. It bypasses RLS.
- Keep RLS enabled on all user-owned data and verify ownership policies using separate test accounts.
- Configure Telegram's chat allowlist before enabling submissions outside a private test.
- Use a different secret for `CRON_SECRET` and `TELEGRAM_WEBHOOK_SECRET`.
- Validate untrusted page content and AI output; do not treat scraped text as trusted instructions.
- Add rate limiting, monitoring, error reporting, and abuse protection before broad public access.
- Configure leaked-password protection and other available Supabase Auth security controls.
- Do not rely on AI-extracted deadlines or eligibility without checking the official opportunity page.

## Known limitations

- Opportunity sources and listing quality depend on the data currently available in the database and starter data. Not every listing is guaranteed to be live, current, or independently verified.
- Gemini extraction can produce incorrect, incomplete, or outdated fields.
- Firecrawl/Gemini/Telegram integrations require valid keys, appropriate account access, and deployment configuration.
- The README's setup steps do not replace an end-to-end test of your own Supabase project and deployment.
- Existing Supabase projects may have schema changes applied manually; compare the live schema with the checked-in SQL migrations before relying on migrations for reproducible setup.
- AI fit-report functionality and other integration surfaces may require further verification before being treated as production-ready.
- The project has not been represented as security-audited or fully tested against all deployment configurations.

## Contributing

Contributions and issue reports are welcome.

1. Fork the repository.
2. Create a focused branch for your change.
3. Keep credentials and personal data out of commits, logs, and screenshots.
4. Run the relevant checks locally.
5. Open a pull request with a concise description, screenshots for UI changes, and any required database migration notes.

For bugs and feature requests, use the [GitHub Issues](https://github.com/awakenedarpit/OpportunityKit-v2/issues) page.

## License

No license has been confirmed in this README. Unless a license file is added to the repository, do not assume the code is licensed for reuse, redistribution, or commercial use.

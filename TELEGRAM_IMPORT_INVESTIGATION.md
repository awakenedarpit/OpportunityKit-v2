# Telegram import investigation

## Findings

The workflow was not completely broken in production. The live OpportunityKit Supabase project contains completed Telegram jobs and imported opportunities, the public app health endpoint reports all four integrations configured, GitHub Actions runs for the worker are succeeding, and imported rows are rendered on `/discover`.

The repository did contain several real correctness defects that explain intermittent or apparently missing imports:

1. **Multiple links in one Telegram update could not be imported.** The webhook selected only `urls[0]`, and the database enforced `unique(update_id)`. Even if the webhook had attempted all links, the first insert would have prevented the others.
2. **Channel posts were not subscribed to.** The setup route registered only `message` and `edited_message`, so links posted by a configured channel were never delivered to this webhook. The handler also did not accept edited channel posts.
3. **The existing idempotency table was unused.** `telegram_processed_updates` exists in the live database, but the webhook relied on the queue's unique update ID instead. The replacement composite constraint gives the needed behavior directly: a Telegram retry is idempotent per `(update_id, url)`, while one update can contain multiple links.
4. **AI output parsing was too brittle.** Valid JSON wrapped in Markdown code fences was rejected, and date values such as ISO timestamps or human-readable dates were discarded unless they were already exactly `YYYY-MM-DD`. Provider responses are now parsed from a fenced or surrounding JSON object, validated for a title, and dates are normalized before database insertion. Provider responses that are malformed are now treated as provider failures, allowing the configured cross-provider fallback path to run.
5. **Terminal failure messages could expose provider or infrastructure details.** Telegram failure notifications now redact URLs and credential-like values and keep the detailed error only in server logs and the queue's `last_error` field.

The worker URL and secret wiring are internally consistent for the current deployment: the public production URL is `https://opportunity-kit-v2.vercel.app`, the workflow calls that URL, and the workflow's successful runs show that the bearer secret is accepted. The worker still requires the GitHub Actions secret `OPPORTUNITYKIT_CRON_SECRET` to equal the Vercel `CRON_SECRET` exactly.

## Files changed

- `src/app/api/telegram/webhook/route.ts`: handles message, caption, hidden `text_link`, channel-post, and edited-channel-post inputs; validates all URLs; independently queues every valid URL; reports queued and duplicate counts; preserves retry idempotency.
- `src/app/api/telegram/setup/route.ts`: subscribes Telegram to `channel_post` and `edited_channel_post` updates.
- `src/app/api/telegram/worker/route.ts`: redacts sensitive details from terminal Telegram failure messages.
- `src/lib/ingest.ts`: validates provider JSON before accepting it, supports Markdown-fenced JSON and surrounding text, invokes fallback behavior for malformed provider output, and normalizes parseable date formats.
- `supabase/migrations/20261122_telegram_multi_link_idempotency.sql`: replaces the queue's single-column update uniqueness with a unique `(update_id, url)` index.
- `README.md`: documents the new migration, supported Telegram update types, and the production URL requirement.

## Verification performed

- `npm run build`: passed. Next.js compiled all routes and generated the production build. Existing lint warnings remain in unrelated files (`settings/page.tsx`, `application-tracker.tsx`, and `opportunities-view.tsx`); they do not fail the configured lint command.
- `npm run lint`: passed with the existing warnings above.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
- Production `GET /api/health`: returned `{"ok":true}` with Supabase, Gemini, Firecrawl, and Telegram all reported configured.
- Production `GET /api/telegram/worker` without a bearer token: returned HTTP 401, confirming the endpoint is protected.
- Production `/discover`: rendered 24 `Telegram / AI import` markers in the returned HTML, confirming imported Supabase rows are visible through the website query path.
- Live Supabase inspection: `telegram_import_jobs` exists with the claim RPC and three completed historical jobs; `opportunities` contains 12 rows, including Telegram imports. The live claim RPC uses `FOR UPDATE SKIP LOCKED` and increments attempts atomically.
- Public GitHub Actions inspection: the latest three Telegram worker runs completed successfully.

## Deployment steps still required

The new migration must be applied to the OpportunityKit Supabase project before deploying the webhook code. Then deploy the application and call the protected setup endpoint again so Telegram replaces the old webhook subscription with the new channel-aware `allowed_updates` list.

A complete fresh end-to-end test still requires access to the configured Telegram bot and production secrets. That access was not present in this sandbox, so I did not send a test message to a real bot or claim verification of a new production job. After deployment, test one normal message, one hidden `text_link`, one channel post, one message containing two links, a repeated Telegram update, a malformed/difficult source page, and a provider fallback. For each test, verify the webhook response, queue rows, worker result, opportunity row, `/discover` visibility, and Telegram notification.

The database migration and webhook deployment should be treated as one release. Without applying the migration first, the updated webhook's multi-link insert behavior will still encounter the old `unique(update_id)` constraint.

## External model documentation checked

Google's current model documentation lists the configured Gemini model IDs `gemini-3.8-flash` and `gemini-3.6-flash`, so those defaults were not changed without evidence [1]. The provider model list API documentation also confirms that model identifiers should be checked against the account's available models and supported generation methods [2].

## References

[1]: https://aistudio.google.com/docs/models "Google AI Studio models"
[2]: https://aistudio.google.com/api-reference/models "Gemini API models reference"

# Telegram import investigation

## Final conclusion

The Telegram webhook, Supabase queue, GitHub Actions worker, scraping, database write, and website visibility paths are working in production. The immediate reason the reported link was not importing was the AI fallback chain: Gemini timed out/returned 503, Groq rejected the configured credential with HTTP 401, and OpenRouter returned an empty visible answer because reasoning consumed the response budget. The fallback extraction request now disables reasoning and keeps a bounded JSON completion budget.

The fix is deployed in production as commit `eb79111` (`Disable fallback reasoning for JSON extraction`).

## Findings and fixes

1. Multiple links in one Telegram update were previously reduced to the first URL, and the queue uniqueness rule allowed only one row per Telegram update. The webhook now queues every valid URL and the migration uses unique `(update_id, url)` idempotency.
2. Channel posts were not subscribed to. Telegram setup now includes `channel_post` and `edited_channel_post`, and the webhook handles those update types.
3. AI parsing was brittle. Provider responses now support fenced/surrounding JSON, validate the required title, and normalize parseable dates before insertion.
4. Provider failures are sanitized in Telegram-facing errors. Detailed diagnostics remain in server-side queue data/logs without exposing credentials.
5. OpenRouter fallback requests now use `max_tokens: 4096` with `reasoning: { effort: 'none' }`, preventing reasoning tokens from consuming the entire visible JSON response.
6. The production `GROQ_API_KEY` is still invalid and must be corrected separately if Groq is intended to be a working fallback. The successful import below used the OpenRouter path after the no-reasoning fix.

## End-to-end production verification

Test URL: `https://founders-house-kolkata.devfolio.co/overview`

- GitHub Actions run `45209483515` completed successfully.
- Worker response: `{"ok":true,"processed":1,"completed":1}`.
- Supabase queue record `id=4`: `status=completed`, `attempts=2`, `last_error=null`.
- Saved opportunity ID: `7ec1857a-cd99-4037-95a4-74c9b3c16b18`.
- Saved title: `Founders' House Kolkata`.
- Saved source: `Telegram / AI import`.
- Saved description contains the extracted event details, including the 72-hour startup sprint, selection dates, offline event dates, and free-of-cost status.
- Live `GET /api/opportunities` returned the row with source `supabase+curated-demo`.
- Live `/discover` HTML contained both `Founders' House Kolkata` and the source URL.
- The worker endpoint accepted the GitHub Actions bearer secret; its successful completion invokes the existing Telegram success-notification path.

## Repository and deployment verification

- `npm run build`: passed.
- `git diff --check`: passed.
- Working tree: clean after the production push.
- Vercel production deployment for commit `eb79111`: `READY`.
- Existing unrelated lint warnings remain in `settings/page.tsx`, `application-tracker.tsx`, and `opportunities-view.tsx`; they do not fail the configured build/lint workflow.

## Remaining operational action

Correct `GROQ_API_KEY` in the Vercel environment if Groq fallback coverage is required. The current OpenRouter fallback is verified. Also keep the Supabase migration and webhook deployment together for future environments; otherwise the multi-link webhook behavior can encounter the old single-column uniqueness constraint.

## Earlier verification

- Production `GET /api/health` reported Supabase, Gemini, Firecrawl, and Telegram configured.
- Production `GET /api/telegram/worker` without a bearer token returned HTTP 401.
- The queue claim RPC uses `FOR UPDATE SKIP LOCKED` and increments attempts atomically.
- The workflow calls `https://opportunity-kit-v2.vercel.app/api/telegram/worker` and requires `OPPORTUNITYKIT_CRON_SECRET` to match the production `CRON_SECRET`.

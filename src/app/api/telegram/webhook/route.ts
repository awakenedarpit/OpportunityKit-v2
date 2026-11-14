import { NextRequest, NextResponse, after } from 'next/server';
import { ingestLink } from '@/lib/ingest';
import { getAdminSupabase } from '@/lib/supabase';
import { isAuthorizedTelegramChat, isValidHttpUrl } from '@/lib/security';

export const maxDuration = 60;

const api = (method: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

async function send(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  const response = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Telegram sendMessage failed (${response.status})`);
}

type TelegramEntity = { type?: string; url?: string };
type TelegramMessage = {
  text?: string;
  caption?: string;
  entities?: TelegramEntity[];
  caption_entities?: TelegramEntity[];
  chat?: { id?: string | number };
};
type QueuedJob = { id: number; chat_id: string; url: string; attempts: number };

function extractMessageUrls(message: TelegramMessage): string[] {
  const text = typeof message.text === 'string'
    ? message.text
    : typeof message.caption === 'string' ? message.caption : '';
  const entities = [
    ...(Array.isArray(message.entities) ? message.entities : []),
    ...(Array.isArray(message.caption_entities) ? message.caption_entities : []),
  ];
  const visible = text.match(/https?:\\/\\/[^\\s<>]+/gi) || [];
  const hidden = entities.filter(e => e.type === 'text_link' && typeof e.url === 'string').map(e => e.url as string);
  const trim = (value: string) => value.replace(/[),.!?]+$/, '');
  return [...new Set([...visible, ...hidden].map(trim))];
}

/**
 * Run the queued import after the webhook response has been sent.
 * This keeps Telegram's webhook acknowledgement fast without relying on a
 * separate scheduler being enabled in GitHub Actions.
 */
function scheduleQueueProcessing(db: NonNullable<ReturnType<typeof getAdminSupabase>>) {
  after(async () => {
    try {
      const { data, error } = await db.rpc('claim_telegram_import_jobs', { p_limit: 1 });
      if (error) throw new Error(`Queue claim failed: ${error.message}`);
      const job = ((data || []) as QueuedJob[])[0];
      if (!job) return;

      try {
        const item = await ingestLink(job.url, job.chat_id);
        const summary = [
          '✅ Opportunity saved to OpportunityKit',
          '',
          item.title,
          `Organization: ${item.organization}`,
          `Type: ${item.type} · ${item.mode}`,
          `Deadline: ${item.deadline || 'Not specified — check source'}`,
          `Location: ${item.location}`,
          `Skills: ${item.skills.slice(0, 6).join(', ') || 'Not specified'}`,
          '',
          item.description.slice(0, 450),
          '',
          `Source: ${item.url}`,
          process.env.APP_BASE_URL ? `Dashboard: ${process.env.APP_BASE_URL}/discover` : '',
        ].filter(Boolean).join('\\n');
        await send(job.chat_id, summary);

        const { error: updateError } = await db.from('telegram_import_jobs')
          .update({ status: 'completed', last_error: null, locked_at: null, updated_at: new Date().toISOString() })
          .eq('id', job.id);
        if (updateError) throw updateError;
      } catch (jobError) {
        const message = jobError instanceof Error ? jobError.message : String(jobError);
        console.error('Telegram queued import failed:', { jobId: job.id, error: message });
        const terminal = job.attempts >= 3;
        const { error: updateError } = await db.from('telegram_import_jobs').update({
          status: terminal ? 'failed' : 'pending',
          last_error: message.slice(0, 1000),
          locked_at: null,
          next_attempt_at: new Date(Date.now() + (terminal ? 0 : 60_000 * job.attempts)).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);
        if (updateError) console.error('Could not update failed Telegram job:', updateError.message);

        if (terminal) {
          try {
            await send(job.chat_id, `❌ I couldn't import this page after 3 attempts. Error: ${message.slice(0, 500)}`);
          } catch (sendError) {
            console.error('Telegram failure notification failed:', sendError);
          }
        }
      }
    } catch (error) {
      console.error('Telegram background queue processing failed:', error);
    }
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.nextUrl.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot is not configured' }, { status: 503 });
  }

  try {
    const update = await req.json();
    const msg = update.message as TelegramMessage | undefined;
    if (!msg?.chat?.id) return NextResponse.json({ ok: true, ignored: true });
    const chatId = msg.chat.id;

    if (!isAuthorizedTelegramChat(chatId)) {
      try { await send(chatId, 'This chat is not authorized to import opportunities.'); }
      catch (error) { console.error('Telegram reply failed:', error); }
      return NextResponse.json({ ok: true, ignored: true });
    }

    const urls = extractMessageUrls(msg);
    if (!urls.length) {
      try { await send(chatId, 'I could not find a link. Send a public opportunity URL in the message text or caption.'); }
      catch (error) { console.error('Telegram reply failed:', error); }
      return NextResponse.json({ ok: true, missingUrl: true });
    }

    const url = urls[0];
    if (!isValidHttpUrl(url)) {
      try { await send(chatId, 'That URL is not a valid public HTTP(S) page.'); }
      catch (error) { console.error('Telegram reply failed:', error); }
      return NextResponse.json({ ok: true, invalidUrl: true });
    }

    const db = getAdminSupabase();
    if (!db) {
      console.error('Telegram queue unavailable: Supabase admin credentials are missing');
      return NextResponse.json({ error: 'Import queue is unavailable' }, { status: 503 });
    }

    const updateId = Number(update.update_id);
    if (!Number.isSafeInteger(updateId)) return NextResponse.json({ ok: true, ignored: true });

    const { error } = await db.from('telegram_import_jobs').insert({
      update_id: updateId,
      chat_id: String(chatId),
      url,
      status: 'pending',
    });
    if (error && error.code !== '23505') {
      console.error('Telegram queue insert failed:', error.message);
      return NextResponse.json({ error: 'Could not queue this import' }, { status: 503 });
    }

    // Schedule even for duplicate Telegram deliveries: the original webhook
    // may have queued the row but failed before its background task ran.
    scheduleQueueProcessing(db);
    return NextResponse.json({ ok: true, accepted: true, duplicate: Boolean(error) });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}

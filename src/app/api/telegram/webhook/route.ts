import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { ingestLink } from '@/lib/ingest';
import { getAdminSupabase } from '@/lib/supabase';
import { isAuthorizedTelegramChat, isValidHttpUrl } from '@/lib/security';

export const maxDuration = 60;

const api = (method: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

async function send(chatId: string | number, text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const response = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Telegram sendMessage failed (${response.status}): ${detail.slice(0, 300)}`);
  }
}

async function alreadyProcessed(updateId: number): Promise<boolean> {
  const db = getAdminSupabase();
  if (!db) return false;

  const { error } = await db.from('telegram_processed_updates').insert({ update_id: updateId });
  if (!error) return false;
  if (error.code === '23505') return true;
  console.error('Telegram idempotency storage unavailable:', error.message);
  return false;
}

/** Telegram puts URLs in text, captions, or hidden text_link entities. */
type TelegramEntity = { type?: string; url?: string };
type TelegramMessage = {
  text?: string;
  caption?: string;
  entities?: TelegramEntity[];
  caption_entities?: TelegramEntity[];
  chat?: { id?: string | number };
};

function extractMessageUrls(message: TelegramMessage): string[] {
  const text = typeof message.text === 'string'
    ? message.text
    : typeof message.caption === 'string'
      ? message.caption
      : '';
  const entities = [
    ...(Array.isArray(message.entities) ? message.entities : []),
    ...(Array.isArray(message.caption_entities) ? message.caption_entities : []),
  ];

  const visibleUrls = text.match(/https?:\/\/[^\s<>]+/gi) || [];
  const hiddenUrls = entities
    .filter((entity) => entity.type === 'text_link' && typeof entity.url === 'string')
    .map((entity) => entity.url as string);

  const trimTrailingPunctuation = (value: string) => {
    let end = value.length;
    while (end > 0) {
      const ch = value[end - 1];
      if (ch !== ')' && ch !== ',' && ch !== '.' && ch !== '!' && ch !== '?') break;
      end -= 1;
    }
    return value.slice(0, end);
  };

  return [...new Set([...visibleUrls, ...hiddenUrls].map(trimTrailingPunctuation))];
}

async function processMessage(chatId: string | number, url: string) {
  try {
    // Do not report success unless the ingestion service can persist the result.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
    }
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error('Page extraction is not configured. Set FIRECRAWL_API_KEY in Vercel.');
    }

    console.info('Telegram import started', { chatId: String(chatId), host: new URL(url).hostname });
    const item = await ingestLink(url, String(chatId));
    const deadline = item.deadline || 'Not specified — check source';
    const summary = [
      '✅ Opportunity saved to OpportunityKit',
      '',
      item.title,
      `Organization: ${item.organization}`,
      `Type: ${item.type} · ${item.mode}`,
      `Deadline: ${deadline}`,
      `Location: ${item.location}`,
      `Skills: ${item.skills.slice(0, 6).join(', ') || 'Not specified'}`,
      '',
      item.description.slice(0, 450),
      '',
      `Source: ${item.url}`,
      process.env.APP_BASE_URL ? `Dashboard: ${process.env.APP_BASE_URL}/discover` : '',
    ].filter(Boolean).join('\n');
    await send(chatId, summary);
    console.info('Telegram import saved', { chatId: String(chatId), title: item.title });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('Telegram opportunity import failed:', message);
    await send(
      chatId,
      `I couldn't import this page: ${message}\nNo successful import was recorded. Please check the link and integration configuration, then try again.`,
    );
  }
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
    const updateId = Number(update.update_id);
    if (!Number.isSafeInteger(updateId)) return NextResponse.json({ ok: true, ignored: true });

    if (await alreadyProcessed(updateId)) return NextResponse.json({ ok: true, duplicate: true });

    const msg = update.message as TelegramMessage | undefined;
    if (!msg?.chat?.id) return NextResponse.json({ ok: true, ignored: true });

    const chatId = msg.chat.id;
    if (!isAuthorizedTelegramChat(chatId)) {
      after(() => send(chatId, 'This chat is not authorized to import opportunities. Ask the administrator to add your numeric Telegram chat ID to TELEGRAM_ALLOWED_CHAT_IDS.'));
      return NextResponse.json({ ok: true, ignored: true });
    }

    const urls = extractMessageUrls(msg);
    if (!urls.length) {
      after(() => send(chatId, 'I received your message, but could not find a link. Send a public opportunity URL in the message text or caption.'));
      return NextResponse.json({ ok: true, missingUrl: true });
    }

    const url = urls[0];
    if (!isValidHttpUrl(url)) {
      after(() => send(chatId, 'That URL does not look like a valid public web page. Please send an https:// link.'));
      return NextResponse.json({ ok: true, invalidUrl: true });
    }

    after(async () => {

      try {
        await send(chatId, '🔎 Link received. I am extracting the opportunity details and saving them to OpportunityKit.');
      } catch (error) {
        console.error('Telegram acknowledgement failed:', error);
      }
      await processMessage(chatId, url);
    });

    return NextResponse.json({ ok: true, accepted: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}

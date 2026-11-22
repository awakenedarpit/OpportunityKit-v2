import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { isAuthorizedTelegramChat, isValidHttpUrl } from '@/lib/security';

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
type TelegramUpdate = {
  update_id?: unknown;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

function extractMessageUrls(message: TelegramMessage): string[] {
  const texts = [
    typeof message.text === 'string' ? message.text : '',
    typeof message.caption === 'string' ? message.caption : '',
  ];
  const entities = [
    ...(Array.isArray(message.entities) ? message.entities : []),
    ...(Array.isArray(message.caption_entities) ? message.caption_entities : []),
  ];
  const visible = texts.flatMap(text => text.match(/https?:\/\/[^\s<>]+/gi) || []);
  const hidden = entities
    .filter(entity => entity.type === 'text_link' && typeof entity.url === 'string')
    .map(entity => entity.url as string);
  const trim = (value: string) => value.trim().replace(/[),.!?;:]+$/, '');
  return [...new Set([...visible, ...hidden].map(trim).filter(Boolean))];
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
    const update = await req.json() as TelegramUpdate;
    const msg = update.message || update.edited_message || update.channel_post || update.edited_channel_post;
    if (msg?.chat?.id === undefined || msg.chat.id === null) {
      return NextResponse.json({ ok: true, ignored: true });
    }
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

    const validUrls = urls.filter(isValidHttpUrl);
    if (!validUrls.length) {
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

    // Insert each URL independently so a duplicate URL does not roll back other links
    // from the same Telegram update. The unique (update_id, url) constraint makes
    // Telegram retries idempotent while still allowing multiple links per message.
    const results = await Promise.all(validUrls.map(url => db.from('telegram_import_jobs').insert({
      update_id: updateId,
      chat_id: String(chatId),
      url,
      status: 'pending',
    })));
    const unexpected = results.find(result => result.error && result.error.code !== '23505');
    if (unexpected?.error) {
      console.error('Telegram queue insert failed:', { updateId, chatId: String(chatId), error: unexpected.error.message });
      return NextResponse.json({ error: 'Could not queue this import' }, { status: 503 });
    }

    const queued = results.filter(result => !result.error).length;
    const duplicates = results.length - queued;
    try {
      await send(chatId, queued
        ? `${queued} opportunity link${queued === 1 ? '' : 's'} queued. I will send the result when processing completes${duplicates ? ` (${duplicates} duplicate${duplicates === 1 ? '' : 's'} skipped)` : ''}.`
        : 'Those links are already queued. I will send the result when processing completes.');
    } catch (replyError) {
      console.error('Telegram queue acknowledgement failed:', replyError instanceof Error ? replyError.message : String(replyError));
    }
    return NextResponse.json({ ok: true, accepted: queued > 0, queued, duplicates });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}

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
};

function extractMessageUrls(message: TelegramMessage): string[] {
  const text = typeof message.text === 'string'
    ? message.text
    : typeof message.caption === 'string' ? message.caption : '';
  const entities = [
    ...(Array.isArray(message.entities) ? message.entities : []),
    ...(Array.isArray(message.caption_entities) ? message.caption_entities : []),
  ];
  const visible = text.match(/https?:\/\/[^\s<>]+/gi) || [];
  const hidden = entities.filter(e => e.type === 'text_link' && typeof e.url === 'string').map(e => e.url as string);
  const trim = (value: string) => value.replace(/[),.!?]+$/, '');
  return [...new Set([...visible, ...hidden].map(trim))];
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
    const msg = update.message || update.edited_message || update.channel_post;
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

    try {
      await send(chatId, error
        ? 'This link is already queued. I will send the result when processing completes.'
        : 'Link received. I will send the extracted opportunity details here when processing completes.');
    } catch (replyError) {
      console.error('Telegram queue acknowledgement failed:', replyError instanceof Error ? replyError.message : String(replyError));
    }
    return NextResponse.json({ ok: true, accepted: true, duplicate: Boolean(error) });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}

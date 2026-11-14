import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { isAuthorizedTelegramChat, isValidHttpUrl } from '@/lib/security';

export const maxDuration = 10;

const api = (method: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

async function send(chatId: string | number, text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const response = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
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
    const update = await req.json();
    const msg = update.message as TelegramMessage | undefined;
    if (!msg?.chat?.id) return NextResponse.json({ ok: true, ignored: true });
    const chatId = msg.chat.id;

    if (!isAuthorizedTelegramChat(chatId)) {
      try { await send(chatId, 'This chat is not authorized to import opportunities.'); } catch (e) { console.error('Telegram reply failed', e); }
      return NextResponse.json({ ok: true, ignored: true });
    }

    const urls = extractMessageUrls(msg);
    if (!urls.length) {
      try { await send(chatId, 'I could not find a link. Send a public opportunity URL in the message text or caption.'); } catch (e) { console.error('Telegram reply failed', e); }
      return NextResponse.json({ ok: true, missingUrl: true });
    }
    const url = urls[0];
    if (!isValidHttpUrl(url)) {
      try { await send(chatId, 'That URL is not a valid public HTTP(S) page.'); } catch (e) { console.error('Telegram reply failed', e); }
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

    if (!error) {
      try { await send(chatId, '📥 Link received and queued. I will send the extracted details here when the import is complete.'); }
      catch (e) { console.error('Telegram queue acknowledgement failed:', e); }
    }
    return NextResponse.json({ ok: true, accepted: true, duplicate: Boolean(error) });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}

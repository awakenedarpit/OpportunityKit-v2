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
  if (error.code === '23505') return true; // Telegram redelivered the same update.
  // If the migration has not been applied yet, keep the bot usable but log the missing table.
  console.error('Telegram idempotency storage unavailable:', error.message);
  return false;
}

async function processMessage(chatId: string | number, url: string) {
  try {
    const item = await ingestLink(url, String(chatId));
    const deadline = item.deadline || 'Not specified — check source';
    const summary = [
      '✅ Opportunity imported to OpportunityKit',
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
  } catch (error) {
    console.error('Telegram opportunity import failed:', error);
    await send(
      chatId,
      `I couldn't import this page. ${error instanceof Error ? error.message : 'Unexpected error'}\nPlease check the page URL and import service configuration.`,
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

    // Telegram retries webhook updates when the handler takes too long.
    // Persist update_id before acknowledging so one incoming message is processed once.
    if (await alreadyProcessed(updateId)) return NextResponse.json({ ok: true, duplicate: true });

    const msg = update.message; // Ignore edited_message to avoid re-importing edited copies.
    if (!msg?.chat?.id || !msg?.text) return NextResponse.json({ ok: true, ignored: true });

    const chatId = msg.chat.id;
    if (!isAuthorizedTelegramChat(chatId)) {
      after(() => send(chatId, 'This chat is not authorized to import opportunities. Ask the administrator to add your numeric Telegram chat ID to TELEGRAM_ALLOWED_CHAT_IDS.'));
      return NextResponse.json({ ok: true, ignored: true });
    }

    const urls = String(msg.text).match(/https?:\/\/[^\s<>]+/g) || [];
    if (!urls.length) {
      after(() => send(chatId, 'Send one public hackathon, internship, scholarship, or opportunity URL. I will extract its key details and add it to OpportunityKit.'));
      return NextResponse.json({ ok: true });
    }

    const url = (urls[0] ?? '').replace(/[),.!?]+$/, '');
    if (!isValidHttpUrl(url)) {
      after(() => send(chatId, 'That URL does not look like a valid public web page. Please send an https:// link.'));
      return NextResponse.json({ ok: true });
    }

    // Acknowledge Telegram immediately; continue scraping and AI extraction after the response.
    after(async () => {
      await send(chatId, '🔎 Link received. I am processing it once; I will send the extracted opportunity details when ready.');
      await processMessage(chatId, url);
    });

    return NextResponse.json({ ok: true, accepted: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ingestLink } from '@/lib/ingest';
import { getAdminSupabase } from '@/lib/supabase';

export const maxDuration = 300;

type Job = { id: number; chat_id: string; url: string; attempts: number };
const telegramApi = (method: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

async function send(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  const response = await fetch(telegramApi('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Telegram sendMessage failed (${response.status})`);
}

async function runWorker(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getAdminSupabase();
  if (!db) return NextResponse.json({ error: 'Supabase admin credentials are missing' }, { status: 503 });
  if (!process.env.FIRECRAWL_API_KEY || !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Firecrawl or Telegram configuration is missing' }, { status: 503 });
  }

  const { data, error } = await db.rpc('claim_telegram_import_jobs', { p_limit: 1 });
  if (error) {
    console.error('Telegram queue claim failed:', error.message);
    return NextResponse.json({ error: 'Could not claim queued import' }, { status: 500 });
  }

  const jobs = (data || []) as Job[];
  if (!jobs.length) return NextResponse.json({ ok: true, processed: 0 });

  let completed = 0;
  for (const job of jobs) {
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
      ].filter(Boolean).join('\n');
      await send(job.chat_id, summary);
      const { error: updateError } = await db.from('telegram_import_jobs')
        .update({ status: 'completed', last_error: null, locked_at: null, updated_at: new Date().toISOString() })
        .eq('id', job.id);
      if (updateError) throw updateError;
      completed += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Telegram queued import failed:', { jobId: job.id, error: message });
      const terminal = job.attempts >= 3;
      await db.from('telegram_import_jobs').update({
        status: terminal ? 'failed' : 'pending',
        last_error: message.slice(0, 1000),
        locked_at: null,
        next_attempt_at: new Date(Date.now() + (terminal ? 0 : 60_000 * job.attempts)).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', job.id);
      if (terminal) {
        try { await send(job.chat_id, `❌ I couldn't import this page after 3 attempts. Error: ${message.slice(0, 500)}`); }
        catch (sendError) { console.error('Telegram failure notification failed:', sendError); }
      }
    }
  }
  return NextResponse.json({ ok: true, processed: jobs.length, completed });
}

export async function GET(req: NextRequest) { return runWorker(req); }
export async function POST(req: NextRequest) { return runWorker(req); }

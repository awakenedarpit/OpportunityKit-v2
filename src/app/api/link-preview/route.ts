import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600;

function isPrivateAddress(ip: string) {
  if (isIP(ip) === 4) {
    const p = ip.split('.').map(Number);
    return p[0] === 0 || p[0] === 10 || p[0] === 127 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
      p[0] >= 224;
  }
  const v = ip.toLowerCase();
  return v === '::' || v === '::1' || v.startsWith('fc') ||
    v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') ||
    v.startsWith('fea') || v.startsWith('feb') || v.startsWith('::ffff:127.') ||
    v.startsWith('::ffff:10.') || v.startsWith('::ffff:192.168.');
}

async function safeUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only HTTP(S) URLs are supported.');
  if (url.username || url.password) throw new Error('Credentials in URLs are not allowed.');
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Private hosts are not allowed.');
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error('Private hosts are not allowed.');
  } else {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) throw new Error('Private hosts are not allowed.');
  }
  return url;
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp('<meta[^>]+(?:property|name)\\s*=\\s*["\\']' + escaped + '["\\'][^>]+content\\s*=\\s*["\\']([^"\\']+)["\\'][^>]*>', 'i'),
    new RegExp('<meta[^>]+content\\s*=\\s*["\\']([^"\\']+)["\\'][^>]+(?:property|name)\\s*=\\s*["\\']' + escaped + '["\\'][^>]*>', 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  }
  return '';
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw || raw.length > 2048) return NextResponse.json({ error: 'Provide a valid website URL.' }, { status: 400 });
  try {
    let url = await safeUrl(raw);
    let response: Response | undefined;
    for (let redirects = 0; redirects <= 3; redirects++) {
      response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
        headers: { 'user-agent': 'OpportunityKitPreviewBot/1.0', accept: 'text/html,application/xhtml+xml' },
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get('location');
      if (!location || redirects === 3) throw new Error('Too many redirects.');
      url = await safeUrl(new URL(location, url).toString());
    }
    if (!response?.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
      return NextResponse.json({ title: url.hostname, description: '', image: null, url: url.toString(), domain: url.hostname });
    }
    const html = (await response.text()).slice(0, 1_000_000);
    const title = meta(html, 'og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || url.hostname;
    const description = meta(html, 'og:description') || meta(html, 'description');
    const imageRaw = meta(html, 'og:image') || meta(html, 'og:image:url') || meta(html, 'twitter:image');
    let image: string | null = null;
    if (imageRaw) {
      try {
        const candidate = new URL(imageRaw, url);
        if (candidate.protocol === 'https:' || candidate.protocol === 'http:') image = candidate.toString();
      } catch { /* use branded fallback */ }
    }
    return NextResponse.json({ title: title.slice(0, 180), description: description.slice(0, 400), image, url: url.toString(), domain: url.hostname }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json({ error: 'Preview unavailable for this website.' }, { status: 422 });
  }
}

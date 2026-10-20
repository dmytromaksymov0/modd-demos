// Cloudflare Pages Function: POST /api/lead → Telegram.
// Env (Pages → Settings → Variables and secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// Optional TELEGRAM_API_BASE points at a mock server in e2e tests.
// fetch() clients (Accept: application/json) get JSON (200 / 422 / 502 / 503); plain form posts (no JS) get a 303 redirect.
// Without the secrets (demo before the bot is connected) the visitor gets 503 + SEND_FAIL: phone and messengers, never a bare 500.
import { validateLead, telegramMessage, errorRedirect, thanksUrl, SEND_FAIL } from '../../src/lib/lead.ts';

interface Env { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string; TELEGRAM_API_BASE?: string }

/** FormData → plain object; repeated keys become arrays. */
function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of new Set(fd.keys())) { const all = fd.getAll(k).map(String); out[k] = all.length > 1 ? all : all[0]; }
  return out;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  let data: Record<string, unknown> = {};
  const reply = (status: number, body: Record<string, unknown>, redirect: string) =>
    wantsJson
      ? new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
      : new Response(null, { status: 303, headers: { location: redirect } });

  try {
    const type = request.headers.get('content-type') ?? '';
    data = type.includes('application/json') ? await request.json() : formToObject(await request.formData());
  } catch {
    return reply(400, { ok: false, delivery: true, errors: { form: SEND_FAIL } }, errorRedirect(undefined, 'send'));
  }
  const page = typeof data.page === 'string' ? data.page : undefined;
  const fail = errorRedirect(page), notSent = errorRedirect(page, 'send');

  const result = validateLead(data);
  if (!result.ok && result.spam) return reply(200, { ok: true, thanks: '/dyakuyemo/' }, '/dyakuyemo/'); // pretend success to bots
  if (!result.ok) return reply(422, { ok: false, errors: result.errors }, fail);

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.error('lead: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured');
    return reply(503, { ok: false, delivery: true, errors: { form: SEND_FAIL } }, notSent);
  }
  const base = env.TELEGRAM_API_BASE ?? 'https://api.telegram.org';
  try {
    const tg = await fetch(`${base}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: telegramMessage(result.lead, new Date()), parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!tg.ok) throw new Error(`telegram ${tg.status}: ${(await tg.text()).slice(0, 200)}`);
  } catch (err) {
    console.error('lead: delivery failed', err);
    return reply(502, { ok: false, delivery: true, errors: { form: SEND_FAIL } }, notSent);
  }
  const thanks = thanksUrl(result.lead);
  return reply(200, { ok: true, thanks }, thanks);
};

export const onRequestGet = (): Response => new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });

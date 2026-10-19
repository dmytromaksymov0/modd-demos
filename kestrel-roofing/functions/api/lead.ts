// Cloudflare Pages Function: POST /api/lead → Telegram.
// Env (Pages → Settings → Variables): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (secrets).
// Optional TELEGRAM_API_BASE for local testing against a mock server.
// JSON clients (the site's JS) get JSON back; plain form posts (no JS) get a 303 redirect.
import { validateLead, telegramMessage } from '../../src/lib/lead.ts';
import { serviceArea } from '../../src/config/site.ts';

interface Env { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string; TELEGRAM_API_BASE?: string }

const cityFor = (zip: string) => serviceArea.find((a) => a.zips.includes(zip))?.city ?? (zip.startsWith('432') ? 'Columbus' : null);

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const reply = (status: number, body: Record<string, unknown>, redirect: string) =>
    wantsJson
      ? new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
      : new Response(null, { status: 303, headers: { location: redirect } });

  let data: Record<string, unknown>;
  try {
    const type = request.headers.get('content-type') ?? '';
    data = type.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply(400, { ok: false, errors: { form: 'Could not read the form.' } }, '/free-inspection/?error=1#form-error');
  }
  if (!data.page) data.page = request.headers.get('referer') ?? '';

  const result = validateLead(data);
  // Spam: pretend success so bots don't learn anything.
  if (!result.ok && result.spam) return reply(200, { ok: true }, '/thanks/');
  if (!result.ok) return reply(422, { ok: false, errors: result.errors }, '/free-inspection/?error=1#form-error');

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.error('lead: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured');
    return reply(503, { ok: false, errors: { form: 'Form is not configured yet. Please call us.' } }, '/free-inspection/?error=1#form-error');
  }

  const base = env.TELEGRAM_API_BASE ?? 'https://api.telegram.org';
  try {
    const tg = await fetch(`${base}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: telegramMessage(result.lead, cityFor(result.lead.zip), new Date()), parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!tg.ok) throw new Error(`telegram ${tg.status}: ${(await tg.text()).slice(0, 200)}`);
  } catch (e) {
    console.error('lead: delivery failed', e);
    return reply(502, { ok: false, errors: { form: 'Delivery failed. Please call us.' } }, '/free-inspection/?error=1#form-error');
  }
  return reply(200, { ok: true }, '/thanks/');
};

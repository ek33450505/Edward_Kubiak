// Contact-form backend for edwardkubiak.com. Request order: origin allowlist ->
// path -> preflight -> method -> content-type -> Content-Length pre-check ->
// rate limiter (fail closed) -> streamed size cap -> JSON parse -> honeypot ->
// validation -> config guard -> Turnstile -> Resend (text only).

const MAX_BODY_BYTES = 16 * 1024;
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';
const UPSTREAM_TIMEOUT_MS = 8000;

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
// One bare address: no quotes, parens, <>, commas, semicolons or whitespace; dotted ASCII domain.
const EMAIL_RE =
  /^(?!\.)(?!.*\.\.)(?!.*\.@)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
/* eslint-disable no-control-regex */
const ALL_CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
const CONTROL_EXCEPT_NL_TAB = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
/* eslint-enable no-control-regex */
// Line/paragraph separators and zero-width/bidi characters: invisible in a name or address.
const INVISIBLE = /[\u2028\u2029\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function respond(body, status, origin, extra = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...extra,
  });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

// Read the body with a running byte count; stop and cancel as soon as the cap is passed.
async function readCapped(request) {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } catch (err) {
    reader.cancel().catch(() => {});
    throw err;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function validate(data) {
  const fields = {};
  const name = typeof data.name === 'string' ? data.name.replace(ALL_CONTROL, '').replace(INVISIBLE, '').trim() : null;
  const email = typeof data.email === 'string' ? data.email.replace(ALL_CONTROL, '').replace(INVISIBLE, '').trim() : null;
  const message =
    typeof data.message === 'string' ? data.message.replace(CONTROL_EXCEPT_NL_TAB, '').trim() : null;

  const len = (s) => [...s].length;
  if (name === null || len(name) < 1 || len(name) > 100) fields.name = 'invalid';
  if (email === null || len(email) > 254 || !EMAIL_RE.test(email)) fields.email = 'invalid';
  if (message === null || len(message) < 10 || len(message) > 5000) fields.message = 'invalid';

  return Object.keys(fields).length ? { fields } : { value: { name, email, message } };
}

async function verifyTurnstile(env, token, ip, origin) {
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (ip) form.set('remoteip', ip);
  let result;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error('turnstile_http', res.status);
      return 'unavailable';
    }
    result = await res.json();
  } catch (err) {
    console.error('turnstile_error', err?.name);
    return 'unavailable';
  }
  if (result?.success !== true) {
    console.error('turnstile_rejected', JSON.stringify(result?.['error-codes'] ?? []));
    return 'failed';
  }
  const hostOk =
    result.hostname === env.TURNSTILE_EXPECTED_HOSTNAME ||
    (result.hostname === 'localhost' && LOCALHOST_ORIGIN.test(origin));
  return hostOk ? 'ok' : 'failed';
}

async function sendMail(env, { name, email, message }, origin) {
  const text = [
    'Unverified sender — this address was typed by the visitor; verify before replying.',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Origin: ${origin}`,
    `Sent: ${new Date().toISOString()}`,
    '',
    message,
  ].join('\n');
  // name is already control-char-free and <= 100 code points, so the subject is safe.
  const subject = `Portfolio contact — ${name}`;
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject,
        text,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) console.error('resend_http', res.status);
    return res.ok;
  } catch (err) {
    console.error('resend_error', err?.name);
    return false;
  }
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get('Origin');
    if (!requestOrigin || !allowedOrigins(env).includes(requestOrigin)) {
      return respond({ error: 'forbidden_origin' }, 403, null);
    }
    const origin = requestOrigin;

    if (new URL(request.url).pathname !== '/') {
      return respond({ error: 'not_found' }, 404, origin);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        },
      });
    }

    if (request.method !== 'POST') {
      return respond({ error: 'method_not_allowed' }, 405, origin, { Allow: 'POST, OPTIONS' });
    }
    if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
      return respond({ error: 'unsupported_media_type' }, 415, origin);
    }
    const declared = Number(request.headers.get('Content-Length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      return respond({ error: 'payload_too_large' }, 413, origin);
    }

    const ip = request.headers.get('CF-Connecting-IP');
    if (env.CONTACT_LIMITER) {
      const { success } = await env.CONTACT_LIMITER.limit({ key: ip || 'unknown' });
      if (!success) return respond({ error: 'rate_limited' }, 429, origin);
    } else if (env.DEV !== 'true') {
      // Fail closed: only local dev (DEV=true) may run without the limiter.
      console.error('not_configured', 'CONTACT_LIMITER');
      return respond({ error: 'not_configured' }, 503, origin);
    }

    let raw;
    try {
      raw = await readCapped(request);
    } catch (err) {
      console.error('body_read_error', err?.name);
      return respond({ error: 'bad_request' }, 400, origin);
    }
    if (raw === null) return respond({ error: 'payload_too_large' }, 413, origin);

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return respond({ error: 'invalid_json' }, 400, origin);
    }
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return respond({ error: 'invalid_json' }, 400, origin);
    }

    // Honeypot: pretend success so bots learn nothing.
    if (data.website !== undefined && data.website !== null && data.website !== '') {
      return respond({ ok: true }, 200, origin);
    }

    const checked = validate(data);
    if (checked.fields) {
      return respond({ error: 'validation_failed', fields: checked.fields }, 400, origin);
    }

    if (
      !env.RESEND_API_KEY ||
      !env.CONTACT_TO_EMAIL ||
      !env.TURNSTILE_SECRET ||
      !env.TURNSTILE_EXPECTED_HOSTNAME ||
      !env.FROM_EMAIL
    ) {
      console.error('not_configured');
      return respond({ error: 'not_configured' }, 503, origin);
    }

    const token = typeof data.turnstileToken === 'string' ? data.turnstileToken : '';
    if (!token) return respond({ error: 'verification_failed' }, 403, origin);
    const verdict = await verifyTurnstile(env, token, ip, origin);
    if (verdict === 'unavailable') return respond({ error: 'verification_unavailable' }, 503, origin);
    if (verdict !== 'ok') return respond({ error: 'verification_failed' }, 403, origin);

    if (!(await sendMail(env, checked.value, origin))) {
      return respond({ error: 'send_failed' }, 502, origin);
    }
    return respond({ ok: true }, 200, origin);
  },
};

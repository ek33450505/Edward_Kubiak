import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index.js';

const ORIGIN = 'https://edwardkubiak.com';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND = 'https://api.resend.com/emails';

const baseEnv = () => ({
  ALLOWED_ORIGINS: 'https://edwardkubiak.com',
  FROM_EMAIL: 'Portfolio Contact <portfolio@compute-atlas.com>',
  TURNSTILE_EXPECTED_HOSTNAME: 'edwardkubiak.com',
  RESEND_API_KEY: 're_test',
  CONTACT_TO_EMAIL: 'ed@example.com',
  TURNSTILE_SECRET: 'ts_secret',
  CONTACT_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
});

const validBody = () => ({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello Ed, this is a long enough message.',
  website: '',
  turnstileToken: 'tok',
});

function req(body, { method = 'POST', headers = {}, raw } = {}) {
  return new Request('https://contact.edwardkubiak.com/', {
    method,
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', ...headers },
    body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined,
  });
}

const call = (request, env) => worker.fetch(request, env, {});

function mockFetch({ verify = { success: true, hostname: 'edwardkubiak.com' }, resendOk = true } = {}) {
  return vi.fn(async (url) => {
    if (url === SITEVERIFY) return new Response(JSON.stringify(verify), { status: 200 });
    if (url === RESEND) return new Response('{}', { status: resendOk ? 200 : 500 });
    throw new Error(`unexpected fetch ${url}`);
  });
}

let fetchMock;
beforeEach(() => {
  fetchMock = mockFetch();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CORS', () => {
  it('answers preflight for an allowed origin', async () => {
    const res = await call(req(null, { method: 'OPTIONS' }), baseEnv());
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
    expect(res.headers.get('Vary')).toBe('Origin');
  });

  it('rejects preflight and POST from a disallowed origin without ACAO', async () => {
    for (const request of [
      req(null, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }),
      req(validBody(), { headers: { Origin: 'https://evil.example' } }),
    ]) {
      const res = await call(request, baseEnv());
      expect(res.status).toBe(403);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://edwardkubiak.com.evil.example',
    'https://edwardkubiak.com/',
    'HTTPS://EDWARDKUBIAK.COM',
    'https://www.edwardkubiak.com',
    'null',
  ])('403 for near-miss origin %s', async (bad) => {
    for (const request of [
      req(validBody(), { headers: { Origin: bad } }),
      req(null, { method: 'OPTIONS', headers: { Origin: bad } }),
    ]) {
      const res = await call(request, baseEnv());
      expect(res.status).toBe(403);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a request with no Origin header', async () => {
    const request = new Request('https://contact.edwardkubiak.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody()),
    });
    expect((await call(request, baseEnv())).status).toBe(403);
  });

  it('sets ACAO, Vary, JSON and no-store on responses', async () => {
    const res = await call(req(validBody()), baseEnv());
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Vary')).toBe('Origin');
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('request gating', () => {
  it('405 on non-POST with Allow header', async () => {
    const request = new Request('https://contact.edwardkubiak.com/', { method: 'GET', headers: { Origin: ORIGIN } });
    const res = await call(request, baseEnv());
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST, OPTIONS');
  });

  it('415 on non-JSON content type', async () => {
    const res = await call(req(null, { headers: { 'Content-Type': 'text/plain' }, raw: 'x' }), baseEnv());
    expect(res.status).toBe(415);
  });

  it('413 when Content-Length exceeds the cap', async () => {
    const res = await call(req(validBody(), { headers: { 'Content-Length': '20000' } }), baseEnv());
    expect(res.status).toBe(413);
  });

  it('413 when the actual body exceeds the cap without a header', async () => {
    const big = JSON.stringify({ ...validBody(), message: 'a'.repeat(17 * 1024) });
    const request = new Request('https://contact.edwardkubiak.com/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: new Blob([big]).stream(),
      duplex: 'half',
    });
    expect(request.headers.get('Content-Length')).toBeNull();
    expect((await call(request, baseEnv())).status).toBe(413);
  });

  it('429 when rate limited, before any parsing or outbound call', async () => {
    const env = baseEnv();
    env.CONTACT_LIMITER.limit.mockResolvedValue({ success: false });
    const res = await call(req(null, { raw: 'not json' }), env);
    expect(res.status).toBe(429);
    expect(env.CONTACT_LIMITER.limit).toHaveBeenCalledWith({ key: 'unknown' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keys the limiter on CF-Connecting-IP', async () => {
    const env = baseEnv();
    await call(req(validBody(), { headers: { 'CF-Connecting-IP': '203.0.113.9' } }), env);
    expect(env.CONTACT_LIMITER.limit).toHaveBeenCalledWith({ key: '203.0.113.9' });
  });

  it('fails closed (503) when the rate-limit binding is absent', async () => {
    const env = baseEnv();
    delete env.CONTACT_LIMITER;
    const res = await call(req(validBody()), env);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not_configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('runs without the binding only when DEV=true', async () => {
    const env = { ...baseEnv(), DEV: 'true' };
    delete env.CONTACT_LIMITER;
    expect((await call(req(validBody()), env)).status).toBe(200);
  });

  it('stops reading the stream once the cap is exceeded', async () => {
    let pulled = 0;
    const stream = new ReadableStream({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(4096).fill(97));
        if (pulled >= 1000) controller.close();
      },
    }, { highWaterMark: 0 });
    const request = new Request('https://contact.edwardkubiak.com/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    });
    expect((await call(request, baseEnv())).status).toBe(413);
    expect(pulled).toBeLessThan(20);
  });

  it('413 by bytes, not characters (5600 euro signs is ~16.8 KB)', async () => {
    const res = await call(req({ ...validBody(), message: '€'.repeat(5600) }), baseEnv());
    expect(res.status).toBe(413);
  });

  it('decodes a multi-byte character split across chunks intact', async () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ ...validBody(), message: 'smile 😀 and more text' }),
    );
    const at = bytes.indexOf(0xf0) + 2; // split the 4-byte emoji 2+2
    const parts = [bytes.slice(0, at), bytes.slice(at)];
    const stream = new ReadableStream({
      pull(controller) {
        const next = parts.shift();
        if (next) controller.enqueue(next);
        else controller.close();
      },
    });
    const request = new Request('https://contact.edwardkubiak.com/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    });
    expect((await call(request, baseEnv())).status).toBe(200);
    const sent = JSON.parse(fetchMock.mock.calls.find(([u]) => u === RESEND)[1].body);
    expect(sent.text).toContain('smile 😀 and more text');
  });

  it('400 on a POST with no body', async () => {
    const request = new Request('https://contact.edwardkubiak.com/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    });
    const res = await call(request, baseEnv());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_json' });
  });

  it('400 bad_request (not a 500) when the body stream errors mid-read', async () => {
    let n = 0;
    const stream = new ReadableStream({
      pull(controller) {
        n += 1;
        if (n === 1) controller.enqueue(new TextEncoder().encode('{"name":'));
        else controller.error(new Error('client aborted'));
      },
    });
    const request = new Request('https://contact.edwardkubiak.com/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    });
    const res = await call(request, baseEnv());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
  });

  it('404 for any path other than /, including preflight', async () => {
    for (const method of ['OPTIONS', 'POST']) {
      const request = new Request('https://contact.edwardkubiak.com/other', {
        method,
        headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
        body: method === 'POST' ? '{}' : undefined,
      });
      expect((await call(request, baseEnv())).status).toBe(404);
    }
  });

  it('400 on invalid JSON and non-object JSON', async () => {
    expect((await call(req(null, { raw: '{nope' }), baseEnv())).status).toBe(400);
    expect((await call(req(null, { raw: '[1,2]' }), baseEnv())).status).toBe(400);
    expect((await call(req(null, { raw: 'null' }), baseEnv())).status).toBe(400);
  });
});

describe('honeypot', () => {
  it('returns silent 200 and makes no outbound calls', async () => {
    const res = await call(req({ ...validBody(), website: 'http://spam.example' }), baseEnv());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('validation', () => {
  const cases = [
    ['name missing', { name: undefined }, 'name'],
    ['name blank', { name: '   ' }, 'name'],
    ['name too long', { name: 'a'.repeat(101) }, 'name'],
    ['name not a string', { name: 5 }, 'name'],
    ['email malformed', { email: 'not-an-email' }, 'email'],
    ['email with space', { email: 'a b@example.com' }, 'email'],
    ['email no dot in domain', { email: 'a@localhost' }, 'email'],
    ['email too long', { email: `${'a'.repeat(250)}@example.com` }, 'email'],
    ['message too short', { message: 'too short' }, 'message'],
    ['message too long', { message: 'a'.repeat(5001) }, 'message'],
    ['message not a string', { message: ['x'] }, 'message'],
  ];
  it.each(cases)('400 when %s', async (_label, patch, field) => {
    const res = await call(req({ ...validBody(), ...patch }), baseEnv());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.fields[field]).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('strips CR/LF from name, email and subject; keeps newlines in message', async () => {
    const res = await call(
      req({
        ...validBody(),
        name: 'Ada\r\nBcc: evil@example.com',
        email: 'ada@exam\r\nple.com',
        message: 'line one\nline\ttwo\r\x00 end',
      }),
      baseEnv(),
    );
    expect(res.status).toBe(200);
    const sent = JSON.parse(fetchMock.mock.calls.find(([u]) => u === RESEND)[1].body);
    expect(sent.subject).not.toMatch(/[\r\n]/);
    expect(sent.subject).toBe('Portfolio contact — AdaBcc: evil@example.com');
    expect(sent.reply_to).toBe('ada@example.com');
    expect(sent.text).toContain('Name: AdaBcc: evil@example.com');
    expect(sent.text).toContain('line one\nline\ttwo end');
    expect(sent.text).not.toContain('\r');
    expect(sent.text).not.toContain(String.fromCharCode(0));
  });

  it('strips invisible separators and bidi controls from name, email and subject', async () => {
    const res = await call(
      req({
        ...validBody(),
        name: 'Ada\u2028\u2029\u200B\u200F\u202E\u2066\uFEFFL',
        email: 'ada\u200B@exam\u202Eple.com',
      }),
      baseEnv(),
    );
    expect(res.status).toBe(200);
    const sent = JSON.parse(fetchMock.mock.calls.find(([u]) => u === RESEND)[1].body);
    expect(sent.subject).toBe('Portfolio contact — AdaL');
    expect(sent.reply_to).toBe('ada@example.com');
    expect(sent.text).toContain('Name: AdaL');
  });

  it.each(['a@b.co,x@y.zz', 'x<y@z.ww>', '"a"@b.co', 'a@b.co;c@d.ee', 'a(b)@c.dd', 'a@.b.co', 'a@b.co.', 'a@-b.co', 'a@b-.co', '@b.co', 'a..b@c.dd'])(
    'rejects non-bare email %s',
    async (email) => {
      const res = await call(req({ ...validBody(), email }), baseEnv());
      expect(res.status).toBe(400);
      expect((await res.json()).fields.email).toBeTruthy();
    },
  );

  it.each(['ada@example.com', 'first.last+tag@sub.example.co.uk', "o'brien@ex-ample.org"])(
    'accepts normal email %s',
    async (email) => {
      expect((await call(req({ ...validBody(), email }), baseEnv())).status).toBe(200);
    },
  );

  it('counts length in code points, not UTF-16 units', async () => {
    const ok = await call(req({ ...validBody(), name: '😀'.repeat(100), message: '😀'.repeat(10) }), baseEnv());
    expect(ok.status).toBe(200);
    const tooLong = await call(req({ ...validBody(), name: '😀'.repeat(101) }), baseEnv());
    expect(tooLong.status).toBe(400);
    const tooShort = await call(req({ ...validBody(), message: '😀'.repeat(9) }), baseEnv());
    expect(tooShort.status).toBe(400);
  });
});

describe('turnstile', () => {
  it('403 when the token is missing, with no siteverify call', async () => {
    const noToken = { ...validBody(), turnstileToken: undefined };
    const res = await call(req(noToken), baseEnv());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'verification_failed' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('403 when siteverify says failure', async () => {
    vi.stubGlobal('fetch', mockFetch({ verify: { success: false } }));
    expect((await call(req(validBody()), baseEnv())).status).toBe(403);
  });

  it('403 on a wrong hostname even when success is true', async () => {
    const f = mockFetch({ verify: { success: true, hostname: 'evil.example' } });
    vi.stubGlobal('fetch', f);
    const res = await call(req(validBody()), baseEnv());
    expect(res.status).toBe(403);
    expect(f.mock.calls.some(([u]) => u === RESEND)).toBe(false);
  });

  it('accepts hostname localhost only from a localhost origin', async () => {
    const env = { ...baseEnv(), ALLOWED_ORIGINS: `${ORIGIN},http://localhost:5173` };
    vi.stubGlobal('fetch', mockFetch({ verify: { success: true, hostname: 'localhost' } }));
    const local = await call(req(validBody(), { headers: { Origin: 'http://localhost:5173' } }), env);
    expect(local.status).toBe(200);
    const prod = await call(req(validBody()), env);
    expect(prod.status).toBe(403);
  });

  it('sends secret, response and remoteip form-encoded', async () => {
    await call(req(validBody(), { headers: { 'CF-Connecting-IP': '203.0.113.9' } }), baseEnv());
    const [, init] = fetchMock.mock.calls.find(([u]) => u === SITEVERIFY);
    const form = new URLSearchParams(init.body);
    expect(form.get('secret')).toBe('ts_secret');
    expect(form.get('response')).toBe('tok');
    expect(form.get('remoteip')).toBe('203.0.113.9');
  });

  it('logs Turnstile error-codes (no PII) on rejection', async () => {
    vi.stubGlobal('fetch', mockFetch({ verify: { success: false, 'error-codes': ['invalid-input-secret'] } }));
    await call(req(validBody()), baseEnv());
    const logged = JSON.stringify(console.error.mock.calls);
    expect(logged).toContain('invalid-input-secret');
    expect(logged).not.toContain('ada@example.com');
    expect(logged).not.toContain('tok"');
  });

  it('503 when siteverify throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect((await call(req(validBody()), baseEnv())).status).toBe(503);
  });
});

describe('send', () => {
  it.each(['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'TURNSTILE_SECRET', 'TURNSTILE_EXPECTED_HOSTNAME', 'FROM_EMAIL'])('503 when %s is missing', async (key) => {
    const env = baseEnv();
    delete env[key];
    const res = await call(req(validBody()), env);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not_configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('502 when Resend returns non-2xx', async () => {
    vi.stubGlobal('fetch', mockFetch({ resendOk: false }));
    const res = await call(req(validBody()), baseEnv());
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'send_failed' });
  });

  it('502 when Resend throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u) => {
        if (u === SITEVERIFY) return new Response(JSON.stringify({ success: true, hostname: 'edwardkubiak.com' }));
        throw new Error('boom');
      }),
    );
    expect((await call(req(validBody()), baseEnv())).status).toBe(502);
  });

  it('200 with the exact Resend payload shape', async () => {
    const res = await call(req(validBody()), baseEnv());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls.find(([u]) => u === RESEND);
    expect(url).toBe(RESEND);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    const sent = JSON.parse(init.body);
    expect(Object.keys(sent).sort()).toEqual(['from', 'reply_to', 'subject', 'text', 'to']);
    expect(sent).not.toHaveProperty('html');
    expect(sent.from).toBe('Portfolio Contact <portfolio@compute-atlas.com>');
    expect(sent.to).toEqual(['ed@example.com']);
    expect(sent.reply_to).toBe('ada@example.com');
    expect(sent.subject).toBe('Portfolio contact — Ada Lovelace');
    expect(sent.text.split('\n')[0]).toBe(
      'Unverified sender — this address was typed by the visitor; verify before replying.',
    );
    expect(sent.text).toContain('Name: Ada Lovelace');
    expect(sent.text).toContain('Email: ada@example.com');
    expect(sent.text).toContain('Origin: https://edwardkubiak.com');
    expect(sent.text).toMatch(/Sent: \d{4}-\d{2}-\d{2}T/);
    expect(sent.text).toContain('Hello Ed, this is a long enough message.');
  });

  it('never logs visitor data or secrets on failure', async () => {
    vi.stubGlobal('fetch', mockFetch({ resendOk: false }));
    await call(req(validBody()), baseEnv());
    const logged = JSON.stringify(console.error.mock.calls);
    for (const s of ['Ada', 'ada@example.com', 'Hello Ed', 're_test', 'ts_secret']) {
      expect(logged).not.toContain(s);
    }
  });
});

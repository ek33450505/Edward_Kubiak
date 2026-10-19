# ek-contact

Cloudflare Worker backing the contact form on edwardkubiak.com. It accepts a JSON `POST`, validates it, verifies a Turnstile token, and emails the message to Ed through Resend. Served at `https://contact.edwardkubiak.com`.

## Request

`POST /` with `Content-Type: application/json`:

```json
{ "name": "...", "email": "...", "message": "...", "website": "", "turnstileToken": "..." }
```

`website` is the honeypot and must stay empty. Responses are JSON: `200 {ok:true}`, `400` (with `fields`), `403`, `413`, `415`, `429`, `502`, `503`.

## Security model

- **Origin allowlist.** Only origins in `ALLOWED_ORIGINS` get CORS headers; any other or missing `Origin` gets 403. This stops other websites from using a visitor's browser, not non-browser clients (they can forge `Origin`), so the controls below carry the real load.
- **Turnstile.** Every send needs a token that Cloudflare confirms with `success: true` and `hostname === TURNSTILE_EXPECTED_HOSTNAME`. `localhost` is accepted only when the request itself comes from a localhost origin.
- **Honeypot.** A non-empty `website` returns a silent `200` and sends nothing.
- **Rate limit.** 3 requests per 60 seconds per `CF-Connecting-IP`, checked before the body is read. This is a soft, per-Cloudflare-location limit, not a global cap. If the binding is missing the Worker fails closed with 503 `not_configured`; only `DEV=true` (local `.dev.vars`) bypasses that. `namespace_id` in `wrangler.toml` must be unique on the Cloudflare account.
- **Size cap.** 16 KB, enforced on `Content-Length` and on the body stream itself: reading stops and the stream is cancelled as soon as the cap is passed.
- **Header injection.** Control characters (including CR/LF) are stripped from name and email, so the subject and `reply_to` cannot carry injected headers.
- **Accepted risk: `reply_to`.** `reply_to` is the visitor-typed address, which is unverified. The email's first line says so; check before replying.
- **Text-only email.** No `html` field is ever sent, so visitor content is never rendered as markup.
- **Logging.** Only error classes and status codes; never visitor data or secrets.

## Configuration

Plain vars live in `wrangler.toml`. Secrets (never committed):

| Secret | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Where messages are delivered (Ed's inbox) |
| `TURNSTILE_SECRET` | Turnstile widget secret key |

**Never add `localhost` to the production `ALLOWED_ORIGINS`, and never add it to the production Turnstile widget's domains.** Local dev overrides these in `.dev.vars` only. The apex `https://edwardkubiak.com` is the sole production origin (`www` redirects to it).

**Never set `DEV` as a var or secret in production**: it disables the fail-closed rate-limiter check.

`FROM_EMAIL` is cosmetic (visitors never receive mail) and can be swapped in `wrangler.toml`.

## Local dev

```bash
cd workers/contact
npm install
cp .dev.vars.example .dev.vars   # gitignored; fill in real values
npx wrangler dev
npm test
```

`.dev.vars.example` uses Cloudflare's always-pass Turnstile test secret and adds `http://localhost:5173` to `ALLOWED_ORIGINS`.

## Deploy checklist (Ed)

1. `npx wrangler login`
2. Create a Turnstile widget for `edwardkubiak.com`. Put the site key in the frontend; set the secret with `npx wrangler secret put TURNSTILE_SECRET`.
3. Create a Resend API key with sending access restricted to `compute-atlas.com`, then `npx wrangler secret put RESEND_API_KEY`.
4. `npx wrangler secret put CONTACT_TO_EMAIL`
5. `npx wrangler deploy` (creates the `contact.edwardkubiak.com` custom domain on the Cloudflare zone).
6. Smoke test (expect 403 `verification_failed` without a real token, which proves the gate is live):

```bash
curl -i -X POST https://contact.edwardkubiak.com/ \
  -H 'Origin: https://edwardkubiak.com' -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"t@example.com","message":"smoke test message","turnstileToken":"x"}'
```

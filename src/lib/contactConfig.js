// Contact form config. Turnstile site keys are public by design — the secret
// lives only in the Worker. Defaults to the production site key;
// VITE_TURNSTILE_SITEKEY overrides it at build time (e.g. Cloudflare's test key
// for local dev). ContactForm degrades to a LinkedIn link if the key is empty.
export const CONTACT_ENDPOINT =
  import.meta.env.VITE_CONTACT_ENDPOINT || "https://contact.edwardkubiak.com/";
export const TURNSTILE_SITEKEY =
  import.meta.env.VITE_TURNSTILE_SITEKEY || "0x4AAAAAAFburgHQqjNVohH6";

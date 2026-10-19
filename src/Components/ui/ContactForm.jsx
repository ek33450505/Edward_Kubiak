import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { CONTACT_ENDPOINT, TURNSTILE_SITEKEY } from "../../lib/contactConfig";
import { contact } from "../../data/resume";

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LINKEDIN_URL = `https://www.${contact.linkedin}`;

// Limits mirror the Worker (code points); the server stays authoritative.
const LIMITS = { name: [1, 100], message: [10, 5000], email: [3, 254] };
// Copied verbatim from workers/contact/src/index.js (EMAIL_RE); a drift test keeps them equal.
const EMAIL_RE =
  /^(?!\.)(?!.*\.\.)(?!.*\.@)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

const MAX_BODY_BYTES = 16384;
const TOKEN_POLL_MS = 500;

const len = (s) => [...s].length;

function validate({ name, email, message }) {
  const errors = {};
  const n = name.trim();
  const e = email.trim();
  const m = message.trim();
  if (len(n) < LIMITS.name[0] || len(n) > LIMITS.name[1]) {
    errors.name = "Enter your name (up to 100 characters).";
  }
  if (len(e) > LIMITS.email[1] || !EMAIL_RE.test(e)) {
    errors.email = "Enter a valid email address.";
  }
  if (len(m) < LIMITS.message[0] || len(m) > LIMITS.message[1]) {
    errors.message = "Write a message of 10 to 5000 characters.";
  }
  return errors;
}

const SERVER_FIELD_ERRORS = {
  name: "Enter your name (up to 100 characters).",
  email: "Enter a valid email address.",
  message: "Write a message of 10 to 5000 characters.",
};

const GENERIC_FAILURE =
  "Something went wrong sending your message. Please try again later, or reach me on LinkedIn.";

function loadTurnstile(onReady, onError) {
  if (window.turnstile) {
    onReady();
    return () => {};
  }
  let script = document.querySelector(`script[src="${TURNSTILE_SRC}"]`);
  if (!script) {
    script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  const handleError = () => {
    // Drop the failed tag so a later mount can retry.
    script.remove();
    onError();
  };
  script.addEventListener("load", onReady);
  script.addEventListener("error", handleError);
  return () => {
    script.removeEventListener("load", onReady);
    script.removeEventListener("error", handleError);
  };
}

const inputClass =
  "mt-2 block min-h-11 w-full rounded border border-border-strong bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const labelClass =
  "font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground";
const errorClass = "mt-1 flex items-start gap-1.5 text-sm text-terra";

function Field({ id, label, error, children }) {
  return (
    <div>
      {/* eslint-disable-next-line jsx-a11y/label-has-for -- associated via htmlFor/id; the linter cannot see the wrapper */}
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={errorClass}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [token, setToken] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | sending | success
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const widgetEl = useRef(null);
  const honeypotEl = useRef(null);
  const widgetId = useRef(null);
  const spentToken = useRef("");
  const confirmationEl = useRef(null);
  const formEl = useRef(null);
  const hintEl = useRef(null);

  useEffect(() => {
    if (!TURNSTILE_SITEKEY) return undefined;
    const renderWidget = () => {
      if (!widgetEl.current || widgetId.current !== null || !window.turnstile) return;
      widgetId.current = window.turnstile.render(widgetEl.current, {
        sitekey: TURNSTILE_SITEKEY,
        callback: (t) => setToken(t),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    };
    const stopListening = loadTurnstile(renderWidget, () => setScriptFailed(true));
    return () => {
      stopListening();
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, []);

  // Resync workaround for a lost or stale-cleared token callback (root cause
  // unconfirmed). While idle with no token, adopt the widget's response, except
  // the token already submitted: tokens are single-use and getResponse may still
  // report it right after reset.
  useEffect(() => {
    if (phase !== "idle" || token) return undefined;
    const timer = setInterval(() => {
      if (widgetId.current === null) return;
      try {
        const live = window.turnstile?.getResponse?.(widgetId.current);
        if (live && live !== spentToken.current) setToken(live);
      } catch {
        // widget gone mid-poll; the next tick or remount recovers
      }
    }, TOKEN_POLL_MS);
    return () => clearInterval(timer);
  }, [token, phase]);

  useEffect(() => {
    if (phase === "success") confirmationEl.current?.focus();
  }, [phase]);

  const resetWidget = useCallback(() => {
    setToken("");
    if (widgetId.current !== null && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, []);

  if (!TURNSTILE_SITEKEY || scriptFailed) {
    return (
      <p className="panel p-6 text-foreground">
        {scriptFailed
          ? "Verification couldn't load — reach me on"
          : "The contact form isn't live yet — reach me on"}{" "}
        <a
          href={LINKEDIN_URL}
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        .
      </p>
    );
  }

  if (phase === "success") {
    return (
      <div className="panel text-foreground">
        <div className="panel-head">
          <span className="inline-flex items-center gap-2 text-primary">
            <span className="status-dot" aria-hidden="true" />
            Sent
          </span>
        </div>
        <div
          ref={confirmationEl}
          tabIndex={-1}
          className="p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <h2 className="font-display text-xl font-semibold">Message sent</h2>
          <p className="mt-2 text-muted-foreground">
            Thanks for reaching out. I&apos;ll reply to the address you gave.
          </p>
        </div>
      </div>
    );
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => {
      if (!errs[name]) return errs;
      const rest = { ...errs };
      delete rest[name];
      return rest;
    });
  };

  const focusFirstInvalid = (errs) => {
    const first = ["name", "email", "message"].find((k) => errs[k]);
    if (first) formEl.current?.elements.namedItem(first)?.focus();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (phase === "sending") return;
    const clientErrors = validate(values);
    setErrors(clientErrors);
    setFailed(false);
    if (Object.keys(clientErrors).length > 0) {
      setStatus("Please fix the highlighted fields.");
      focusFirstInvalid(clientErrors);
      return;
    }
    if (!token) {
      setStatus("Complete the verification above to send.");
      hintEl.current?.focus();
      return;
    }
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
      website: honeypotEl.current?.value ?? "",
      turnstileToken: token,
    };
    if (new TextEncoder().encode(JSON.stringify(payload)).length > MAX_BODY_BYTES) {
      setErrors({ message: "Message is too long." });
      setStatus("Please fix the highlighted fields.");
      focusFirstInvalid({ message: true });
      return;
    }
    spentToken.current = token;
    setPhase("sending");
    setStatus("Sending…");
    let message = GENERIC_FAILURE;
    let fallback = true;
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        resetWidget();
        setPhase("success");
        setStatus("Message sent.");
        return;
      }
      if (res.status === 400 && data.error === "validation_failed" && data.fields) {
        const serverErrors = {};
        for (const key of Object.keys(SERVER_FIELD_ERRORS)) {
          if (data.fields[key]) serverErrors[key] = SERVER_FIELD_ERRORS[key];
        }
        setErrors(serverErrors);
        focusFirstInvalid(serverErrors);
        message = "Please fix the highlighted fields.";
        fallback = false;
      } else if (res.status === 403) {
        message = "Verification failed — please retry the challenge.";
        fallback = false;
      } else if (res.status === 429) {
        message = "Too many messages — try again in a minute.";
        fallback = false;
      } else if (res.status === 413) {
        message = "That message is too large. Please shorten it.";
        fallback = false;
      }
    } catch {
      // network error: fall through to the generic failure
    }
    setPhase("idle");
    setStatus(message);
    setFailed(fallback);
    resetWidget();
  };

  const describedBy = (id) => (errors[id] ? `contact-${id}-error` : undefined);
  const sending = phase === "sending";

  return (
    <form ref={formEl} onSubmit={onSubmit} noValidate className="panel space-y-5 p-6">
      <p className="text-sm text-muted-foreground">All fields are required.</p>
      <Field id="contact-name" label="Name" error={errors.name}>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- labelled via htmlFor */}
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-required="true"
          maxLength={100}
          value={values.name}
          onChange={onChange}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={describedBy("name")}
          className={inputClass}
        />
      </Field>
      <Field id="contact-email" label="Email" error={errors.email}>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- labelled via htmlFor */}
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-required="true"
          maxLength={254}
          value={values.email}
          onChange={onChange}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={describedBy("email")}
          className={inputClass}
        />
      </Field>
      <Field id="contact-message" label="Message" error={errors.message}>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- labelled via htmlFor */}
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          aria-required="true"
          maxLength={5000}
          value={values.message}
          onChange={onChange}
          aria-invalid={errors.message ? "true" : "false"}
          aria-describedby={describedBy("message")}
          className={inputClass}
        />
      </Field>

      {/* Honeypot: off-screen (not display:none), unreachable by keyboard and AT. */}
      <div className="sr-only" aria-hidden="true">
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- honeypot is intentionally unlabelled and aria-hidden */}
        <input
          type="text"
          name="website"
          ref={honeypotEl}
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          defaultValue=""
        />
      </div>

      <div ref={widgetEl} />

      <button
        type="submit"
        aria-disabled={!token || sending}
        aria-describedby={token ? undefined : "contact-token-hint"}
        className="inline-flex min-h-11 items-center rounded bg-primary px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send message"}
      </button>

      {!token && (
        <p
          id="contact-token-hint"
          ref={hintEl}
          tabIndex={-1}
          className="text-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Complete the verification above to send.
        </p>
      )}

      <p role="status" aria-live="polite" className="text-sm text-foreground">
        {status}
        {failed && (
          <>
            {" "}
            <a
              href={LINKEDIN_URL}
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </>
        )}
      </p>
    </form>
  );
}

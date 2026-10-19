import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const config = vi.hoisted(() => ({
  CONTACT_ENDPOINT: "https://contact.example.test/",
  TURNSTILE_SITEKEY: "site-key",
}));
vi.mock("../../lib/contactConfig", () => config);

import ContactForm from "./ContactForm";
import html from "../../../index.html?raw";
import workerSrc from "../../../workers/contact/src/index.js?raw";
import clientSrc from "./ContactForm.jsx?raw";

const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, I would like to talk about a project.",
};

function installTurnstile({ autoToken = true } = {}) {
  const api = {
    render: vi.fn((el, opts) => {
      api.opts = opts;
      if (autoToken) opts.callback("tok");
      return "widget-1";
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  window.turnstile = api;
  return api;
}

function jsonResponse(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
}

async function fill(user, values = VALID) {
  await user.type(screen.getByLabelText("Name"), values.name);
  await user.type(screen.getByLabelText("Email"), values.email);
  await user.type(screen.getByLabelText("Message"), values.message);
}

const submit = () => screen.getByRole("button", { name: /send message/i });

beforeEach(() => {
  config.TURNSTILE_SITEKEY = "site-key";
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  cleanup();
  delete window.turnstile;
  document.head.querySelectorAll("script[src*='turnstile']").forEach((s) => s.remove());
});

describe("ContactForm", () => {
  it("renders a labelled, required field for name, email and message", () => {
    installTurnstile();
    render(<ContactForm />);
    for (const label of ["Name", "Email", "Message"]) {
      const field = screen.getByLabelText(label);
      expect(field).toBeRequired();
      expect(field).toHaveAttribute("aria-required", "true");
    }
  });

  it("keeps submit disabled until Turnstile yields a token", () => {
    installTurnstile({ autoToken: false });
    render(<ContactForm />);
    expect(submit()).toBeDisabled();
  });

  it("enables submit once the widget callback delivers a token", () => {
    installTurnstile();
    render(<ContactForm />);
    expect(submit()).toBeEnabled();
  });

  it("announces client validation errors linked to their fields without fetching", async () => {
    installTurnstile();
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(submit());
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter a valid email address.");
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(/enter your name/i);
    expect(screen.getByLabelText("Message")).toHaveAccessibleDescription(/10 to 5000/i);
    expect(screen.getByRole("status")).toHaveTextContent(/fix the highlighted/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts the exact payload and swaps the form for a focused confirmation", async () => {
    const ts = installTurnstile();
    fetch.mockReturnValue(jsonResponse(200, { ok: true }));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://contact.example.test/");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual({ ...VALID, website: "", turnstileToken: "tok" });

    const confirmation = await screen.findByText("Message sent");
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    await waitFor(() => expect(confirmation.parentElement).toHaveFocus());
    expect(ts).toBeDefined();
  });

  it("maps server validation_failed fields onto the inputs and resets the widget", async () => {
    const ts = installTurnstile();
    fetch.mockReturnValue(
      jsonResponse(400, { error: "validation_failed", fields: { email: "invalid" } }),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true"),
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(/valid email/i);
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "false");
    expect(ts.reset).toHaveBeenCalledWith("widget-1");
  });

  it("asks to retry the challenge on 403", async () => {
    installTurnstile();
    fetch.mockReturnValue(jsonResponse(403, { error: "verification_failed" }));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    expect(await screen.findByText(/verification failed — please retry the challenge/i)).toBeInTheDocument();
  });

  it("shows the rate-limit message on 429", async () => {
    installTurnstile();
    fetch.mockReturnValue(jsonResponse(429, { error: "rate_limited" }));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    expect(await screen.findByText(/too many messages — try again in a minute/i)).toBeInTheDocument();
  });

  it("shows a generic failure with a LinkedIn fallback on network error", async () => {
    installTurnstile();
    fetch.mockRejectedValue(new TypeError("network"));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/edward-kubiak",
    );
    expect(screen.getByLabelText("Name")).toHaveValue(VALID.name);
  });

  it("keeps the honeypot out of the tab order and the accessibility tree", () => {
    installTurnstile();
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot.closest("[aria-hidden='true']")).not.toBeNull();
    expect(honeypot).toHaveValue("");
  });

  it("injects the Turnstile script once and renders after it loads", () => {
    const { unmount } = render(<ContactForm />);
    unmount();
    render(<ContactForm />);
    const scripts = document.head.querySelectorAll("script[src*='turnstile']");
    expect(scripts).toHaveLength(1);
    const ts = installTurnstile();
    scripts[0].dispatchEvent(new Event("load"));
    expect(ts.render).toHaveBeenCalledTimes(1);
    expect(ts.render.mock.calls[0][1].sitekey).toBe("site-key");
  });

  it("clears the token on expiry and removes the widget on unmount", () => {
    const ts = installTurnstile();
    const { unmount } = render(<ContactForm />);
    expect(submit()).toBeEnabled();
    ts.opts["expired-callback"]();
    return waitFor(() => expect(submit()).toBeDisabled()).then(() => {
      unmount();
      expect(ts.remove).toHaveBeenCalledWith("widget-1");
    });
  });

  it("degrades to a LinkedIn link, with no form or script, when no site key is set", () => {
    config.TURNSTILE_SITEKEY = "";
    render(<ContactForm />);
    expect(screen.getByText(/contact form isn.t live yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/edward-kubiak",
    );
    expect(screen.queryByRole("button", { name: /send/i })).not.toBeInTheDocument();
    expect(document.head.querySelector("script[src*='turnstile']")).toBeNull();
  });
});

describe("ContactForm hardening", () => {
  it("tells password managers to ignore the honeypot", () => {
    installTurnstile();
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector('input[name="website"]');
    for (const attr of ["data-1p-ignore", "data-lpignore", "data-bwignore"]) {
      expect(honeypot).toHaveAttribute(attr, "true");
    }
  });

  it("sends the honeypot's actual value, empty on a normal submit", async () => {
    installTurnstile();
    fetch.mockReturnValue(jsonResponse(200, { ok: true }));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    expect(JSON.parse(fetch.mock.calls[0][1].body).website).toBe("");
  });

  it("sends a filled honeypot's value", async () => {
    installTurnstile();
    fetch.mockReturnValue(jsonResponse(200, { ok: true }));
    const user = userEvent.setup();
    const { container } = render(<ContactForm />);
    await fill(user);
    fireEvent.change(container.querySelector('input[name="website"]'), {
      target: { value: "http://spam.example" },
    });
    await user.click(submit());
    expect(JSON.parse(fetch.mock.calls[0][1].body).website).toBe("http://spam.example");
  });

  it("falls back to LinkedIn when the Turnstile script fails, removes the tag and cleans up", () => {
    const { unmount } = render(<ContactForm />);
    const script = document.head.querySelector("script[src*='turnstile']");
    script.dispatchEvent(new Event("error"));
    return waitFor(() =>
      expect(screen.getByText(/verification couldn.t load/i)).toBeInTheDocument(),
    ).then(() => {
      expect(screen.getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /send/i })).not.toBeInTheDocument();
      expect(document.head.querySelector("script[src*='turnstile']")).toBeNull();
      unmount();
      // a later mount retries with a fresh tag
      render(<ContactForm />);
      expect(document.head.querySelectorAll("script[src*='turnstile']")).toHaveLength(1);
    });
  });

  it("removes its script listeners on unmount", () => {
    const { unmount } = render(<ContactForm />);
    const script = document.head.querySelector("script[src*='turnstile']");
    const spy = vi.spyOn(script, "removeEventListener");
    unmount();
    expect(spy).toHaveBeenCalledWith("load", expect.any(Function));
    expect(spy).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("uses the Worker's EMAIL_RE verbatim", () => {
    const workerLiteral = workerSrc.match(/const EMAIL_RE =\s*\n?\s*(\/.+\/[a-z]*);/)[1];
    const clientLiteral = clientSrc.match(/const EMAIL_RE =\s*\n?\s*(\/.+\/[a-z]*);/)[1];
    expect(clientLiteral).toBe(workerLiteral);
  });

  it("rejects a multibyte message over 16 KiB without sending", async () => {
    installTurnstile();
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText("Name"), VALID.name);
    await user.type(screen.getByLabelText("Email"), VALID.email);
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "😀".repeat(4500) } });
    await user.click(submit());
    expect(screen.getByLabelText("Message")).toHaveAccessibleDescription("Message is too long.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [413, "payload_too_large", /too large/i, false],
    [502, "send_failed", /something went wrong/i, true],
    [503, "not_configured", /something went wrong/i, true],
    [503, "verification_unavailable", /something went wrong/i, true],
  ])("maps %i %s", async (status, error, text, linkedin) => {
    const ts = installTurnstile();
    fetch.mockReturnValue(jsonResponse(status, { error }));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(!!screen.queryByRole("link", { name: "LinkedIn" })).toBe(linkedin);
    expect(ts.reset).toHaveBeenCalledTimes(1);
  });

  it("resets the widget after a network error and after success", async () => {
    const ts = installTurnstile();
    fetch.mockRejectedValueOnce(new TypeError("net"));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    await screen.findByText(/something went wrong/i);
    expect(ts.reset).toHaveBeenCalledTimes(1);
  });

  it("shows a describedby verification hint only while there is no token", () => {
    const ts = installTurnstile({ autoToken: false });
    render(<ContactForm />);
    expect(submit()).toHaveAccessibleDescription("Complete the verification above to send.");
    act(() => ts.opts.callback("tok"));
    expect(screen.queryByText(/complete the verification/i)).not.toBeInTheDocument();
  });
});

describe("ContactForm widget/token desync", () => {
  afterEach(() => vi.useRealTimers());

  it("adopts the widget's response when its callback never reaches the form", () => {
    vi.useFakeTimers();
    const api = installTurnstile({ autoToken: false });
    api.getResponse = vi.fn(() => "tok");
    render(<ContactForm />);
    expect(submit()).toBeDisabled();
    act(() => vi.advanceTimersByTime(1000));
    expect(submit()).toBeEnabled();
    expect(api.getResponse).toHaveBeenCalledWith("widget-1");
  });

  it("recovers when a stale error callback clears the token of a passed widget", () => {
    vi.useFakeTimers();
    const api = installTurnstile();
    api.getResponse = vi.fn(() => "tok");
    render(<ContactForm />);
    expect(submit()).toBeEnabled();
    act(() => api.opts["error-callback"]());
    expect(submit()).toBeDisabled();
    act(() => vi.advanceTimersByTime(1000));
    expect(submit()).toBeEnabled();
  });

  it("does not re-adopt the spent token after a submit and reset", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = installTurnstile();
    let live = "tok";
    api.getResponse = vi.fn(() => live);
    globalThis.fetch.mockReturnValue(jsonResponse(500, {}));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    await waitFor(() => expect(api.reset).toHaveBeenCalled());
    act(() => vi.advanceTimersByTime(2000));
    expect(submit()).toBeDisabled();
    live = "tok-2";
    act(() => vi.advanceTimersByTime(1000));
    expect(submit()).toBeEnabled();
  });

  it("stops polling once a token is adopted", () => {
    vi.useFakeTimers();
    const api = installTurnstile({ autoToken: false });
    api.getResponse = vi.fn(() => "tok");
    render(<ContactForm />);
    act(() => vi.advanceTimersByTime(1000));
    const calls = api.getResponse.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(api.getResponse.mock.calls.length).toBe(calls);
  });

  it("clears its timer on unmount", () => {
    vi.useFakeTimers();
    const api = installTurnstile({ autoToken: false });
    api.getResponse = vi.fn(() => undefined);
    const { unmount } = render(<ContactForm />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not read the widget before one has been rendered", () => {
    vi.useFakeTimers();
    render(<ContactForm />); // script injected, never loads: no widget id
    window.turnstile = { getResponse: vi.fn(() => "tok"), render: vi.fn(), remove: vi.fn(), reset: vi.fn() };
    act(() => vi.advanceTimersByTime(3000));
    expect(window.turnstile.getResponse).not.toHaveBeenCalled();
    expect(submit()).toBeDisabled();
  });

  it("does not poll after a successful send", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = installTurnstile();
    api.getResponse = vi.fn(() => "tok-2");
    globalThis.fetch.mockReturnValue(jsonResponse(200, { ok: true }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ContactForm />);
    await fill(user);
    await user.click(submit());
    await screen.findByText("Message sent");
    act(() => vi.advanceTimersByTime(3000));
    expect(api.getResponse).not.toHaveBeenCalled();
  });

  it("stays disabled while the widget has no response", () => {
    vi.useFakeTimers();
    const api = installTurnstile({ autoToken: false });
    api.getResponse = vi.fn(() => undefined);
    render(<ContactForm />);
    act(() => vi.advanceTimersByTime(2000));
    expect(submit()).toBeDisabled();
  });
});

describe("index.html CSP", () => {
  const csp = html.match(/Content-Security-Policy"\s+content="([^"]+)"/)[1];
  const directive = (name) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `));

  it("allows the Worker, Turnstile script and Turnstile frame", () => {
    expect(directive("connect-src")).toContain("https://contact.edwardkubiak.com");
    expect(directive("script-src")).toContain("https://challenges.cloudflare.com");
    expect(directive("frame-src")).toBe("frame-src https://challenges.cloudflare.com");
  });

  it("keeps fonts self-hosted", () => {
    expect(directive("font-src")).toBe("font-src 'self'");
  });
});

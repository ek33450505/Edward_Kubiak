import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Contact from "./Contact";
import { contact } from "../data/resume";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Contact />
    </MemoryRouter>,
  );

describe("Contact", () => {
  it("renders the heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Get in touch" })).toBeInTheDocument();
  });

  // Ed approved showing his email on /contact on 2026-11-09 (GetInTouch still shows none).
  it("shows the email address from `contact` as text", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 2, name: "01 / Email" })).toBeInTheDocument();
    expect(screen.getByText(contact.email)).toBeInTheDocument();
  });

  it("has an Email me link that opens the mail app with a subject", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /email me.*opens your mail app/i });
    // WCAG 2.5.3 Label in Name: the accessible name must contain the visible text.
    expect(link.getAttribute("aria-label").toLowerCase()).toContain(link.textContent.toLowerCase());
    const href = link.getAttribute("href");
    expect(href.startsWith(`mailto:${contact.email}?subject=`)).toBe(true);
    expect(decodeURIComponent(href.split("?subject=")[1])).toBe("Hello from edwardkubiak.com");
    expect(link).not.toHaveAttribute("target");
  });

  it("links to LinkedIn in a new tab", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /message me on linkedin.*opens in new tab/i });
    expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/edward-kubiak");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links to GitHub in a new tab", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /github.*opens in new tab/i });
    expect(link).toHaveAttribute("href", "https://github.com/ek33450505");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has no form, textbox or Turnstile script", () => {
    const { container } = renderPage();
    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
  });
});

describe("index.html CSP", () => {
  const html = readFileSync("index.html", "utf8");
  it("allows neither Turnstile nor the contact Worker", () => {
    expect(html).not.toContain("challenges.cloudflare.com");
    expect(html).not.toContain("contact.edwardkubiak.com");
  });
  it("keeps self-hosted fonts", () => {
    expect(html).toContain("font-src 'self'");
  });
});

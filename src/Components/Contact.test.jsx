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

  // Ed removed the public email address on 2026-11-11 (reverses the 2026-11-09 approval).
  it("shows no email address and no mailto link", () => {
    const { container } = renderPage();
    expect(contact).not.toHaveProperty("email");
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.textContent).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
  });

  it("has a single LinkedIn and GitHub section", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 2, name: "01 / LinkedIn and GitHub" }),
    ).toBeInTheDocument();
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

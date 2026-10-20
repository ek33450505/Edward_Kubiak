import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PULSE_END_MS } from "../lib/facilityField";
import Accessibility from "./Accessibility";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Accessibility />
    </MemoryRouter>,
  );

describe("Accessibility", () => {
  it("renders the h1 and the five sections in order", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Accessibility" })).toBeInTheDocument();
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual(["Target", "How it's tested", "Motion", "Known limitations", "Feedback"]);
  });

  it("states the axe rule coverage precisely", () => {
    renderPage();
    expect(
      screen.getByText(/WCAG 2\.0 and 2\.1 at levels A and AA, and WCAG 2\.2 at level AA/),
    ).toBeInTheDocument();
  });

  it("derives the motion seconds from PULSE_END_MS", () => {
    renderPage();
    const seconds = (PULSE_END_MS / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 });
    expect(screen.getByText(new RegExp(`settles within ${seconds} seconds`))).toBeInTheDocument();
  });

  it("links internally to /contact and /resume", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Get in touch" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "résumé page" })).toHaveAttribute("href", "/resume");
  });

  it("opens compute-atlas.com in a new tab with a cue in the name", () => {
    renderPage();
    const link = screen.getByRole("link", { name: "compute-atlas.com (opens in new tab)" });
    expect(link).toHaveAttribute("href", "https://compute-atlas.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("records the VoiceOver spot check and no longer lists it as a limitation", () => {
    renderPage();
    expect(screen.getByText(/manual spot check with VoiceOver on macOS \(Safari\)/)).toBeInTheDocument();
    expect(screen.getByText(/same pages were checked in Chrome, through its accessibility tree and by keyboard/)).toBeInTheDocument();
    expect(screen.queryByText(/not yet complete/)).toBeNull();
    expect(screen.queryByText(/current-page marker/)).toBeNull();
  });

  it("states the screen-reader checks as spot checks, not an unfinished audit", () => {
    renderPage();
    expect(screen.queryByText(/isn't finished/)).toBeNull();
    expect(
      screen.getByText(/spot checks rather than a full audit, so I don't claim full conformance\./),
    ).toBeInTheDocument();
  });

  it("shows the formatted updated date", () => {
    renderPage();
    expect(screen.getByText("Statement last updated 20 October 2026.")).toBeInTheDocument();
  });
});

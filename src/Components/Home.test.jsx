import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";

// Section order and numbering are what is under test; stub the heavy/unrelated blocks.
vi.mock("./Home/HeroSection", () => ({ default: () => null }));
vi.mock("./ui/GetInTouch", () => ({ default: () => null }));

describe("Home section numbering", () => {
  it("numbers the section heads 01-05 in page order", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const heads = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => ({
        index: h.previousElementSibling?.textContent.trim(),
        title: h.textContent,
      }))
      .filter((h) => /^\d\d \/$/.test(h.index ?? ""));
    expect(heads.map((h) => h.index)).toEqual(["01 /", "02 /", "03 /", "04 /", "05 /"]);
    expect(heads.map((h) => h.title)).toEqual([
      "Featured work",
      "How it's built",
      "Currently building",
      "Core competencies",
      expect.stringContaining("CAST ecosystem"),
    ]);
  });
});

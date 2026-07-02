/**
 * Reveal.test.jsx — behavioral render tests for the shared Reveal wrapper.
 *
 * Covers: children forwarding, className forwarding, `as` prop element selection,
 *         forwarded props (role, aria-label).
 *
 * Note: motion/react is auto-mocked by the Vitest setup so whileInView animations
 * render synchronously in tests — no IntersectionObserver stub required.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Reveal from "./Reveal";

describe("Reveal — children", () => {
  it("renders children text", () => {
    render(<Reveal>Hello world</Reveal>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders nested elements", () => {
    render(
      <Reveal>
        <span>inner</span>
      </Reveal>
    );
    expect(screen.getByText("inner")).toBeInTheDocument();
  });
});

describe("Reveal — `as` prop", () => {
  it("renders as div by default", () => {
    const { container } = render(<Reveal>content</Reveal>);
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("renders as section when as='section'", () => {
    const { container } = render(<Reveal as="section">content</Reveal>);
    expect(container.querySelector("section")).toBeInTheDocument();
  });
});

describe("Reveal — forwarded props", () => {
  it("forwards className to the root element", () => {
    const { container } = render(<Reveal className="mt-8">content</Reveal>);
    expect(container.firstChild.className).toContain("mt-8");
  });

  it("forwards role prop", () => {
    render(<Reveal role="region">content</Reveal>);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("forwards aria-label prop", () => {
    render(<Reveal aria-label="Skills section" role="region">content</Reveal>);
    expect(screen.getByRole("region", { name: "Skills section" })).toBeInTheDocument();
  });
});

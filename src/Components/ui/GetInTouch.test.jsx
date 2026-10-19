import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GetInTouch from "./GetInTouch";

describe("GetInTouch", () => {
  it("links to /contact and exposes no email address", () => {
    const { container } = render(
      <MemoryRouter>
        <GetInTouch />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Contact: ways to reach Edward" }),
    ).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "/contact");
    expect(container.textContent).not.toContain("@");
    expect(container.innerHTML).not.toContain("mail" + "to:");
    expect(container.innerHTML).not.toContain("@");
  });
});

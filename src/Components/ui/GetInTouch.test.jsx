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
      screen.getByRole("link", { name: "Send Edward a message via the contact form" }),
    ).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: /send a message/i })).toHaveAttribute("href", "/contact");
    expect(container.textContent).not.toContain("@");
    expect(container.innerHTML).not.toContain("mail" + "to:");
    expect(container.innerHTML).not.toContain("@");
  });
});

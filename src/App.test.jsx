/**
 * NavBar mobile-menu behaviour.
 *
 * The menu closes on route change to cover navigation the NavBar did not
 * initiate — browser back/forward, or a link elsewhere on the page — where no
 * nav-link onClick fires. That was an effect calling setState in its body;
 * these tests pin the behaviour so the fix could be proven behaviour-preserving.
 *
 * Navigation is driven by a probe button rendered OUTSIDE the NavBar, so the
 * NavBar never sees a click of its own.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { NavBar } from "./App";
import { CommandPaletteProvider } from "./Components/CommandPaletteContext";

function NavProbe({ to }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      navigate elsewhere
    </button>
  );
}

function Harness({ to = "/about" }) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <CommandPaletteProvider>
        <NavBar />
        <NavProbe to={to} />
      </CommandPaletteProvider>
    </MemoryRouter>
  );
}

const toggle = () => screen.getByRole("button", { name: /toggle menu/i });
const probe = () => screen.getByRole("button", { name: /navigate elsewhere/i });

describe("NavBar — mobile menu", () => {
  it("starts closed", () => {
    render(<Harness />);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens and closes on the toggle button", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when the route changes without a nav-link click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");

    await user.click(probe());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("stays closed when the route changes while already closed", async () => {
    const user = userEvent.setup();
    render(<Harness to="/projects" />);
    await user.click(probe());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("can be reopened after a route change closed it", async () => {
    const user = userEvent.setup();
    render(<Harness to="/now" />);
    await user.click(toggle());
    await user.click(probe());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });
});

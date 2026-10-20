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

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { NavBar, AppShell } from "./App";
import { CommandPaletteProvider } from "./Components/CommandPaletteContext";
import { ROUTE_META } from "./data/routeMeta.js";
import { CAST_STATS } from "./data/castStats";
import { ATLAS_STATS } from "./data/atlasStats";

const originalResizeObserver = globalThis.ResizeObserver;
const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

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

  it("returns focus to the toggle when Escape closes the menu", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(toggle());
    within(document.getElementById("mobile-menu")).getAllByRole("link")[0].focus();
    await user.keyboard("{Escape}");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveFocus();
  });

  it("Escape with the menu closed does not move focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    probe().focus();
    await user.keyboard("{Escape}");
    expect(probe()).toHaveFocus();
  });
});

describe("footer contact link", () => {
  it("links to /contact and shows no email address", async () => {
    const { default: App } = await import("./App");
    render(<App />);
    const footer = await screen.findByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    expect(within(footer).getByRole("link", { name: "Accessibility" })).toHaveAttribute("href", "/accessibility");
    expect(footer.textContent).not.toContain("@");
    expect(footer.innerHTML).not.toContain("mail" + "to:");
  });

  it("has a Sponsor button that opens the sponsor chooser", async () => {
    const user = userEvent.setup();
    const { default: App } = await import("./App");
    render(<App />);
    const footer = await screen.findByRole("contentinfo");
    await user.click(within(footer).getByRole("button", { name: /^sponsor/i }));
    expect(await screen.findByRole("dialog", { name: "Support my work" })).toBeInTheDocument();
  });
});

describe("app shell", () => {
  it("primary nav lists Work/Practice/About/Resume/Contact and not Now", () => {
    render(<Harness />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const expected = {
      Work: "/projects",
      Practice: "/practice",
      About: "/about",
      Resume: "/resume",
      Contact: "/contact",
    };
    for (const [name, href] of Object.entries(expected)) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(nav).queryByRole("link", { name: "Now" })).toBeNull();
  });

  it("exposes a banner landmark that contains the Primary navigation", () => {
    render(<Harness />);
    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("marks the masthead home link current on / only", () => {
    const { unmount } = render(<Harness />);
    expect(screen.getByRole("link", { name: /Edward Kubiak/ })).toHaveAttribute("aria-current", "page");
    unmount();
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <CommandPaletteProvider>
          <NavBar />
        </CommandPaletteProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Edward Kubiak/ })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
  });

  it("mobile menu lists the five primary rows and not Now", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(toggle()).not.toHaveAttribute("aria-controls");
    await user.click(toggle());
    const menu = document.getElementById("mobile-menu");
    expect(toggle()).toHaveAttribute("aria-controls", "mobile-menu");
    const expected = { Work: "/projects", Practice: "/practice", About: "/about", Resume: "/resume", Contact: "/contact" };
    for (const [name, href] of Object.entries(expected)) {
      expect(within(menu).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(menu).queryByRole("link", { name: "Now" })).toBeNull();
  });

  it("footer shows feed-sourced CAST and Atlas versions", async () => {
    const { default: App } = await import("./App");
    render(<App />);
    const footer = await screen.findByRole("contentinfo");
    expect(footer.textContent).toContain(`CAST ${CAST_STATS.version}`);
    expect(footer.textContent).toContain(`Compute Atlas ${ATLAS_STATS.version}`);
    expect(within(footer).getByRole("link", { name: "Now" })).toHaveAttribute("href", "/now");
  });

  it("shell (nav + footer) renders no location text", async () => {
    const { default: App } = await import("./App");
    render(<App />);
    const footer = await screen.findByRole("contentinfo");
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const text of [nav.textContent, footer.textContent]) {
      expect(text).not.toContain("Columbus");
      expect(text).not.toContain("\u00b0N");
    }
  });
});

describe("AppShell — modal command palette", () => {
  it("makes the page behind the palette inert only while it is open", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <CommandPaletteProvider>
          <AppShell />
        </CommandPaletteProvider>
      </MemoryRouter>
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav.closest("[inert]")).toBeNull();

    await user.click(screen.getByRole("button", { name: /open command palette/i }));
    const dialog = await screen.findByRole("dialog", { name: /command menu/i });
    expect(nav.closest("[inert]")).not.toBeNull();
    expect(dialog.closest("[inert]")).toBeNull();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(nav.closest("[inert]")).toBeNull());
  });
});

describe("NavBar — Escape inside a dialog", () => {
  it("leaves the mobile menu open when Escape closes the command palette", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <CommandPaletteProvider>
          <AppShell />
        </CommandPaletteProvider>
      </MemoryRouter>
    );
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: /open command palette/i }));
    await screen.findByRole("dialog", { name: /command menu/i });

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /command menu/i })).toBeNull());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });
});

describe("trailing-slash paths (GitHub Pages 301s /about to /about/)", () => {
  function renderAt(path) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <CommandPaletteProvider>
          <AppShell />
        </CommandPaletteProvider>
      </MemoryRouter>
    );
  }
  const nav = () => screen.getByRole("navigation", { name: "Primary" });

  it.each(["/about", "/about/"])("%s sets the About title and marks About current", async (path) => {
    renderAt(path);
    await waitFor(() => expect(document.title).toBe(ROUTE_META["/about"].title));
    expect(within(nav()).getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    expect(within(nav()).getByRole("link", { name: "Work" })).not.toHaveAttribute("aria-current");
  });

  it("/projects/ is the index: Projects title, Work current", async () => {
    renderAt("/projects/");
    await waitFor(() => expect(document.title).toBe(ROUTE_META["/projects"].title));
    expect(within(nav()).getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "page");
  });

  it("/projects/compute-atlas/ marks Work as the current section, not the current page", async () => {
    const user = userEvent.setup();
    renderAt("/projects/compute-atlas/");
    expect(await screen.findByRole("heading", { level: 1, name: /Compute Atlas/ })).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "true");
    const current = within(nav()).getAllByRole("link").filter((l) => l.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(0);

    await user.click(toggle());
    const menu = document.getElementById("mobile-menu");
    expect(within(menu).getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "true");
  });

  it.each(Object.keys(ROUTE_META))("%s/ applies that route's title", async (route) => {
    renderAt(route === "/" ? "/" : `${route}/`);
    await waitFor(() => expect(document.title).toBe(ROUTE_META[route].title));
  });

  it("mobile menu marks exactly one link current on /about/", async () => {
    const user = userEvent.setup();
    renderAt("/about/");
    await user.click(toggle());
    const menu = document.getElementById("mobile-menu");
    const links = within(menu).getAllByRole("link");
    expect(within(menu).getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    expect(links.filter((l) => l.getAttribute("aria-current") === "page")).toHaveLength(1);
  });

  it("/projects/compute-atlas/ renders the detail page and keeps its own title", async () => {
    renderAt("/projects/compute-atlas/");
    expect(await screen.findByRole("heading", { level: 1, name: /Compute Atlas/ })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe("Compute Atlas — Edward Kubiak"));
  });

  it("a non-project route resets a leaked project og:image to the site card", async () => {
    let og = document.head.querySelector('meta[property="og:image"]');
    if (!og) {
      og = document.createElement("meta");
      og.setAttribute("property", "og:image");
      document.head.appendChild(og);
    }
    og.setAttribute("content", "https://edwardkubiak.com/og/compute-atlas.png");
    renderAt("/about/");
    await waitFor(() =>
      expect(document.head.querySelector('meta[property="og:image"]')).toHaveAttribute(
        "content",
        "https://edwardkubiak.com/og-image.png"
      )
    );
  });

  it("an unknown trailing-slash path shows not-found with the fallback title", async () => {
    renderAt("/no-such-page/");
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe("Edward Kubiak"));
  });
});

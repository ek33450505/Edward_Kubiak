import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import CommandPalette from "./CommandPalette";
import { CommandPaletteProvider, useCommandPalette } from "./CommandPaletteContext";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
Element.prototype.scrollIntoView ??= vi.fn();

function Opener() {
  const { setOpen } = useCommandPalette();
  return <button onClick={() => setOpen(true)}>open</button>;
}
function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

describe("CommandPalette", () => {
  it("has a Contact entry that navigates client-side and no Email entry", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CommandPaletteProvider>
          <Opener />
          <Where />
          <CommandPalette />
        </CommandPaletteProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.queryByText("Email")).toBeNull();
    await user.click(await screen.findByText("Contact"));
    expect(screen.getByTestId("where")).toHaveTextContent("/contact");
  });
});

function renderPalette() {
  return render(
    <MemoryRouter>
      <CommandPaletteProvider>
        <Opener />
        <CommandPalette />
      </CommandPaletteProvider>
    </MemoryRouter>,
  );
}

describe("CommandPalette — assistive tech", () => {
  it("announces the filtered result count in a persistent status region", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(screen.getByRole("button", { name: "open" }));
    const input = await screen.findByRole("combobox");
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");

    await user.type(input, "resume");
    await waitFor(() => expect(status).toHaveTextContent(/^1 result$/));

    await user.clear(input);
    await user.type(input, "zzzzqq");
    await waitFor(() => expect(status).toHaveTextContent(/^No results$/));
    expect(screen.getByRole("status")).toBe(status);
  });

  it("uses the plural for several results", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(screen.getByRole("button", { name: "open" }));
    await user.type(await screen.findByRole("combobox"), "jump to");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/^[2-9]\d* results$/));
  });

  it("returns focus to the trigger when closed with Escape", async () => {
    const user = userEvent.setup();
    renderPalette();
    const trigger = screen.getByRole("button", { name: "open" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

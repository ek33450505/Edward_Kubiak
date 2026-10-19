import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

import { describe, it, expect } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SponsorButton } from "./SponsorDialog";

function setup() {
  render(
    <SponsorButton aria-label="Sponsor Edward's work: choose a platform">Sponsor</SponsorButton>,
  );
  return screen.getByRole("button", { name: /^sponsor/i });
}

describe("SponsorDialog", () => {
  it("opens a dialog named 'Support my work' from the trigger", async () => {
    const user = userEvent.setup();
    const trigger = setup();
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Support my work" })).toBeInTheDocument();
  });

  it("offers exactly two outbound links with safe attributes", async () => {
    const user = userEvent.setup();
    await user.click(setup());
    const dialog = screen.getByRole("dialog", { name: "Support my work" });
    const links = within(dialog).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName(/^GitHub Sponsors: monthly sponsorship/);
    expect(links[0]).toHaveAttribute("href", "https://github.com/sponsors/ek33450505");
    expect(links[1]).toHaveAccessibleName(/^Ko-fi: one-off tip/);
    expect(links[1]).toHaveAttribute("href", "https://ko-fi.com/L2T725R7FV");
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });

  it("closes via the close button and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const trigger = setup();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on Esc (native close) and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const trigger = setup();
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Support my work" });
    screen.getByRole("button", { name: "Close" }).focus();
    // Browser Esc path: dialog.close() fires the native "close" event.
    act(() => dialog.close());
    expect(dialog.open).toBe(false);
    expect(trigger).toHaveFocus();
  });

  const RECT = { left: 100, top: 100, right: 400, bottom: 400, width: 300, height: 300 };
  const OUT = { clientX: 10, clientY: 10 };
  const IN = { clientX: 200, clientY: 200 };
  const stubRect = (dialog) => {
    dialog.getBoundingClientRect = () => RECT;
  };

  it("closes on a backdrop click and returns focus", async () => {
    const user = userEvent.setup();
    const trigger = setup();
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Support my work" });
    stubRect(dialog);
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog, OUT);
    expect(dialog.open).toBe(false);
    expect(trigger).toHaveFocus();
  });

  it("stays open when a press on the backdrop is released inside the panel", async () => {
    const user = userEvent.setup();
    await user.click(setup());
    const dialog = screen.getByRole("dialog", { name: "Support my work" });
    stubRect(dialog);
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog, IN);
    expect(dialog.open).toBe(true);
  });

  it("stays open on a click with no preceding press (press state is reset)", async () => {
    const user = userEvent.setup();
    const trigger = setup();
    await user.click(trigger);
    let dialog = screen.getByRole("dialog", { name: "Support my work" });
    stubRect(dialog);
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog, OUT);
    expect(dialog.open).toBe(false);
    await user.click(trigger);
    dialog = screen.getByRole("dialog", { name: "Support my work" });
    stubRect(dialog);
    fireEvent.click(dialog, OUT);
    expect(dialog.open).toBe(true);
  });

  it("stays open when a press inside the panel ends in a click on the backdrop", async () => {
    const user = userEvent.setup();
    await user.click(setup());
    const dialog = screen.getByRole("dialog", { name: "Support my work" });
    stubRect(dialog);
    fireEvent.pointerDown(screen.getByText("Open source, built in the open."));
    fireEvent.click(dialog, OUT);
    expect(dialog.open).toBe(true);
  });

  it("closes when a link is activated", async () => {
    const user = userEvent.setup();
    const trigger = setup();
    await user.click(trigger);
    await user.click(screen.getByRole("link", { name: /^Ko-fi/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

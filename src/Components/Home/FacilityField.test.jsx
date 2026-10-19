/**
 * FacilityField.test.jsx — canvas lifecycle: fetch/validate, reduced motion, the bounded
 * animation, pause/resume, DPR changes and teardown. jsdom has no canvas, ResizeObserver or
 * matchMedia, and rAF is driven by hand so the animation clock is fully controlled.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import FacilityField from "./FacilityField";
import { PULSE_END_MS } from "../../lib/facilityField";

const payload = {
  w: 200,
  h: 100,
  count: 4,
  statuses: ["operational", "under_construction", "permitted", "proposed", "cancelled"],
  pts: [10, 10, 0, 50, 40, 1, 120, 60, 2, 180, 90, 4],
};

let ctx;
let roInstances;
let ioInstances;
let mqls;
let reducedMatches;
let rafQueue;
let rafCalls;
let rafSpy;
let cancelSpy;

const makeMql = (query, matches) => {
  const listeners = new Set();
  const mql = {
    query,
    matches,
    listeners,
    addEventListener: vi.fn((_t, cb) => listeners.add(cb)),
    removeEventListener: vi.fn((_t, cb) => listeners.delete(cb)),
    fire(next) {
      mql.matches = next;
      [...listeners].forEach((cb) => cb({ matches: next }));
    },
  };
  mqls.push(mql);
  return mql;
};
const reducedMql = () => mqls.find((m) => m.query.includes("prefers-reduced-motion"));
const dprMqls = () => mqls.filter((m) => m.query.includes("resolution"));

function stubEnvironment({ reduced = false, response } = {}) {
  ctx = { fillRect: vi.fn(), clearRect: vi.fn(), setTransform: vi.fn(), fillStyle: "", globalAlpha: 1 };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);

  roInstances = [];
  ioInstances = [];
  mqls = [];
  reducedMatches = reduced;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb) {
        this.cb = cb;
        this.disconnect = vi.fn();
        roInstances.push(this);
      }
      observe() {
        this.cb([{ contentRect: { width: 400, height: 200 } }]);
      }
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb) {
        this.cb = cb;
        this.observe = vi.fn();
        this.disconnect = vi.fn();
        ioInstances.push(this);
      }
    },
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => makeMql(query, query.includes("prefers-reduced-motion") ? reducedMatches : false)),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(() => response ?? Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })),
  );
}

// Runs the single pending animation frame at timestamp `ts`.
const frame = (ts) => {
  const next = rafQueue.shift();
  expect(next, "a frame was pending").toBeDefined();
  act(() => next.cb(ts));
};
const setHidden = (hidden) => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
};

beforeEach(() => {
  rafQueue = [];
  rafCalls = 0;
  rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafCalls++;
    rafQueue.push({ id: rafCalls, cb });
    return rafCalls;
  });
  cancelSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    rafQueue = rafQueue.filter((f) => f.id !== id);
  });
});

afterEach(() => {
  delete document.hidden;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const canvasOf = (container) => container.querySelector("canvas");
const mountRunning = async (props) => {
  stubEnvironment({ reduced: false });
  const utils = render(<FacilityField {...props} />);
  await waitFor(() => expect(rafQueue).toHaveLength(1));
  return utils;
};

describe("FacilityField — loading", () => {
  it("renders an aria-hidden canvas once the points load", async () => {
    stubEnvironment({ reduced: true });
    const { container } = render(<FacilityField />);
    await waitFor(() => expect(canvasOf(container)).toBeInTheDocument());
    expect(canvasOf(container)).toHaveAttribute("aria-hidden", "true");
  });

  it("renders nothing and does not throw when the fetch rejects", async () => {
    stubEnvironment({ response: Promise.reject(new Error("offline")) });
    const { container } = render(<FacilityField />);
    await act(async () => {});
    expect(canvasOf(container)).toBeNull();
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("renders nothing for an invalid payload", async () => {
    stubEnvironment({
      response: Promise.resolve({ ok: true, json: () => Promise.resolve({ ...payload, count: 99 }) }),
    });
    const { container } = render(<FacilityField />);
    await act(async () => {});
    expect(canvasOf(container)).toBeNull();
  });

  it("renders nothing for a payload with an unknown status name", async () => {
    stubEnvironment({
      response: Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...payload, statuses: ["operational", "retired", "permitted", "proposed", "cancelled"] }),
      }),
    });
    const { container } = render(<FacilityField />);
    await act(async () => {});
    expect(canvasOf(container)).toBeNull();
  });

  it("renders nothing for a non-ok response", async () => {
    stubEnvironment({ response: Promise.resolve({ ok: false, status: 404 }) });
    const { container } = render(<FacilityField />);
    await act(async () => {});
    expect(canvasOf(container)).toBeNull();
  });

  it("ignores a response that lands after unmount (no state update, no warning)", async () => {
    let resolve;
    stubEnvironment({ response: new Promise((r) => (resolve = r)) });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<FacilityField />);
    unmount();
    await act(async () => {
      resolve({ ok: true, json: () => Promise.resolve(payload) });
    });
    expect(errors).not.toHaveBeenCalled();
    expect(rafSpy).not.toHaveBeenCalled();
  });
});

describe("FacilityField — reduced motion", () => {
  it("draws one static frame and never starts rAF", async () => {
    stubEnvironment({ reduced: true });
    render(<FacilityField />);
    await waitFor(() => expect(ctx.fillRect).toHaveBeenCalled());
    expect(ctx.fillRect).toHaveBeenCalledTimes(payload.count);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("calls onReady once", async () => {
    stubEnvironment({ reduced: true });
    const onReady = vi.fn();
    render(<FacilityField onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
  });

  it("stays static if the preference flips to no-preference after a reduced-motion load", async () => {
    stubEnvironment({ reduced: true });
    render(<FacilityField />);
    await waitFor(() => expect(ctx.fillRect).toHaveBeenCalled());
    act(() => reducedMql().fire(false));
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("switching to reduce mid-animation stops the loop and draws the settled frame; switching back resumes", async () => {
    await mountRunning();
    frame(0);
    expect(rafQueue).toHaveLength(1);
    const clears = ctx.clearRect.mock.calls.length;
    act(() => reducedMql().fire(true));
    expect(rafQueue).toHaveLength(0);
    expect(ctx.clearRect.mock.calls.length).toBe(clears + 1);
    act(() => reducedMql().fire(false));
    expect(rafQueue).toHaveLength(1);
  });
});

describe("FacilityField — animation", () => {
  it("starts the rAF loop under normal motion and calls onReady after the first drawn frame", async () => {
    const onReady = vi.fn();
    await mountRunning({ onReady });
    expect(onReady).not.toHaveBeenCalled();
    frame(0);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("ends at PULSE_END_MS: draws a final settled frame and schedules no further frames", async () => {
    await mountRunning();
    frame(100); // t0
    frame(100 + 1000);
    frame(100 + PULSE_END_MS - 1);
    expect(rafQueue).toHaveLength(1); // still running just before the end
    const draws = ctx.clearRect.mock.calls.length;
    frame(100 + PULSE_END_MS);
    expect(ctx.clearRect.mock.calls.length).toBe(draws + 1); // the final settled frame
    expect(rafQueue).toHaveLength(0);
    // Settled frame is fully opaque, so the pulse has been eased out.
    expect(ctx.globalAlpha).toBe(1);
    const calls = rafCalls;
    act(() => ioInstances[0].cb([{ isIntersecting: false }]));
    act(() => ioInstances[0].cb([{ isIntersecting: true }]));
    setHidden(true);
    setHidden(false);
    expect(rafCalls).toBe(calls); // pause/resume cannot restart a finished animation
  });

  it("IO pause/resume never starts a second rAF chain", async () => {
    await mountRunning();
    frame(0);
    expect(rafCalls).toBe(2);
    const io = ioInstances[0];
    act(() => io.cb([{ isIntersecting: false }]));
    expect(rafQueue).toHaveLength(0);
    act(() => io.cb([{ isIntersecting: true }]));
    expect(rafCalls).toBe(3);
    act(() => io.cb([{ isIntersecting: true }]));
    expect(rafCalls).toBe(3);
    expect(rafQueue).toHaveLength(1);
  });

  it("pauses while the document is hidden and resumes when visible again", async () => {
    await mountRunning();
    frame(0);
    setHidden(true);
    expect(rafQueue).toHaveLength(0);
    setHidden(false);
    expect(rafQueue).toHaveLength(1);
    setHidden(false);
    expect(rafQueue).toHaveLength(1);
  });

  it("re-sizes and redraws when the device pixel ratio changes, then re-subscribes", async () => {
    await mountRunning();
    frame(0);
    const [first] = dprMqls();
    expect(first.listeners.size).toBe(1);
    const transforms = ctx.setTransform.mock.calls.length;
    const clears = ctx.clearRect.mock.calls.length;
    act(() => first.fire(true));
    expect(ctx.setTransform.mock.calls.length).toBe(transforms + 1);
    expect(ctx.clearRect.mock.calls.length).toBe(clears + 1);
    expect(first.listeners.size).toBe(0);
    expect(dprMqls().at(-1).listeners.size).toBe(1);
  });
});

describe("FacilityField — teardown", () => {
  it("cancels rAF and removes every observer and listener on unmount", async () => {
    const { unmount } = await mountRunning();
    const removeDoc = vi.spyOn(document, "removeEventListener");
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    expect(rafQueue).toHaveLength(0);
    expect(roInstances[0].disconnect).toHaveBeenCalled();
    expect(ioInstances[0].disconnect).toHaveBeenCalled();
    expect(removeDoc).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(reducedMql().listeners.size).toBe(0);
    expect(dprMqls().every((m) => m.listeners.size === 0)).toBe(true);
  });
});

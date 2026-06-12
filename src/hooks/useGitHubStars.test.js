/**
 * Tests for useGitHubStars.js
 *
 * @testing-library/react is not installed in this project.
 * The React hook is verified to be a function export.
 * The caching semantics are tested directly on fetchStarsMap — the core logic
 * (cache hit, no refetch, graceful failure) lives there.
 *
 * Each describe block that needs an isolated module cache calls
 * vi.resetModules() before re-importing so tests are independent.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("fetchStarsMap — happy path", () => {
  it("fetches /github-stars.json and resolves with the parsed JSON", async () => {
    const payload = { "my-repo": 42 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    }));

    const { fetchStarsMap } = await import("./useGitHubStars");
    const result = await fetchStarsMap();

    expect(fetch).toHaveBeenCalledWith("/github-stars.json");
    expect(result).toEqual(payload);
  });
});

describe("fetchStarsMap — cache hit returns same data without a second fetch", () => {
  it("does not call fetch a second time when cache is already populated", async () => {
    const payload = { "cached-repo": 7 };
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStarsMap } = await import("./useGitHubStars");

    // First call — hits the network.
    const first = await fetchStarsMap();
    expect(first).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call — must return the same data from cache, no additional fetch.
    const second = await fetchStarsMap();
    expect(second).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1); // still 1, not 2
  });
});

describe("fetchStarsMap — concurrent calls share a single in-flight promise", () => {
  it("issues only one fetch when called twice before the first resolves", async () => {
    let resolveFirst;
    const fetchMock = vi.fn().mockReturnValueOnce(
      new Promise((res) => {
        resolveFirst = () => res({ ok: true, json: () => Promise.resolve({ r: 1 }) });
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStarsMap } = await import("./useGitHubStars");

    const p1 = fetchStarsMap();
    const p2 = fetchStarsMap(); // second call before first resolves

    resolveFirst();

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ r: 1 });
    expect(r2).toEqual({ r: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1); // only one HTTP call
  });
});

describe("fetchStarsMap — fetch failure graceful fallback", () => {
  it("resolves to {} when the response is not ok (non-2xx status)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }));

    const { fetchStarsMap } = await import("./useGitHubStars");
    const result = await fetchStarsMap();

    expect(result).toEqual({});
  });

  it("resolves to {} when fetch rejects (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("offline")));

    const { fetchStarsMap } = await import("./useGitHubStars");
    const result = await fetchStarsMap();

    expect(result).toEqual({});
  });
});

describe("useGitHubStars — export contract", () => {
  it("is exported as a function", async () => {
    const { useGitHubStars } = await import("./useGitHubStars");
    expect(typeof useGitHubStars).toBe("function");
  });
});

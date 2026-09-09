/**
 * Tests for useGitHubStars.js
 *
 * Caching semantics are tested directly on fetchStarsMap — cache hit, single
 * in-flight promise, graceful failure. The hook itself is exercised through
 * renderHook, including the no-target case and a target arriving late, which
 * is the path the loading flag has to get right.
 *
 * Each describe block that needs an isolated module cache calls
 * vi.resetModules() before re-importing so tests are independent.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

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

describe("useGitHubStars — hook behaviour", () => {
  it("settles immediately with no stars when owner or repo is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { useGitHubStars } = await import("./useGitHubStars");

    for (const [owner, repo] of [[undefined, undefined], ["ek33450505", undefined], [undefined, "cast"]]) {
      const { result } = renderHook(() => useGitHubStars(owner, repo));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.stars).toBeNull();
    }
    // No target means no network call at all.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves the star count from the static JSON map", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ cast: 128 }),
    }));
    const { useGitHubStars } = await import("./useGitHubStars");

    const { result } = renderHook(() => useGitHubStars("ek33450505", "cast"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stars).toBe(128);
  });

  it("falls back to the GitHub API when the repo is absent from the map", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ "other-repo": 1 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ stargazers_count: 55 }) });
    vi.stubGlobal("fetch", fetchMock);
    const { useGitHubStars } = await import("./useGitHubStars");

    const { result } = renderHook(() => useGitHubStars("ek33450505", "misfire"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stars).toBe(55);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://api.github.com/repos/ek33450505/misfire");
  });

  it("stops loading and reports no stars when both sources fail", async () => {
    vi.stubGlobal("fetch", vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false }));
    const { useGitHubStars } = await import("./useGitHubStars");

    const { result } = renderHook(() => useGitHubStars("ek33450505", "nope"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stars).toBeNull();
  });

  it("loads and resolves when a target arrives after the first render", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cast: 9 }),
    }));
    const { useGitHubStars } = await import("./useGitHubStars");

    const { result, rerender } = renderHook(
      ({ owner, repo }) => useGitHubStars(owner, repo),
      { initialProps: { owner: undefined, repo: undefined } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stars).toBeNull();

    rerender({ owner: "ek33450505", repo: "cast" });
    await waitFor(() => expect(result.current.stars).toBe(9));
    expect(result.current.loading).toBe(false);
  });

  it("does not report a stale count while a changed repo is still resolving", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cast: 9, misfire: 3 }),
    }));
    const { useGitHubStars } = await import("./useGitHubStars");

    const { result, rerender } = renderHook(
      ({ repo }) => useGitHubStars("ek33450505", repo),
      { initialProps: { repo: "cast" } }
    );
    await waitFor(() => expect(result.current.stars).toBe(9));

    rerender({ repo: "misfire" });
    // Asserted synchronously and BEFORE any waitFor: the old count must be gone
    // the moment the target changes. waitFor would retry past a stale value and
    // report nothing, which is how a weak version of this test passed a
    // deliberately stale implementation.
    expect(result.current.stars).toBeNull();
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.stars).toBe(3));
    expect(result.current.loading).toBe(false);
  });

  it("clears the count and settles when the target goes away again", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cast: 9 }),
    }));
    const { useGitHubStars } = await import("./useGitHubStars");

    const { result, rerender } = renderHook(
      ({ repo }) => useGitHubStars("ek33450505", repo),
      { initialProps: { repo: "cast" } }
    );
    await waitFor(() => expect(result.current.stars).toBe(9));

    // A resolved target followed by no target: nothing is loading, and the
    // previous repo's count must not linger.
    rerender({ repo: undefined });
    expect(result.current.stars).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

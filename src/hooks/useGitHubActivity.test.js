import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGitHubActivity } from "./useGitHubActivity";

const commit = { id: "a", repo: "r", repoFull: "ek33450505/r", sha: "a".repeat(40), message: "m", time: "2026-10-19T00:00:00Z" };
const ok = (body) => ({ ok: true, json: async () => body });
const notFound = { ok: false, json: async () => ({}) };

function stubFetch(routes) {
  const fn = vi.fn(async (url) => {
    const r = routes[url];
    if (r instanceof Error) throw r;
    return r ?? notFound;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe("useGitHubActivity", () => {
  it("uses the static file when it has commits", async () => {
    const f = stubFetch({ "/github-activity.json": ok([commit]) });
    const { result } = renderHook(() => useGitHubActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([commit]);
    expect(result.current.error).toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("falls to last-known when the static file is empty", async () => {
    stubFetch({
      "/github-activity.json": ok([]),
      "/last-known-commits.json": ok({ commits: [commit], cachedAt: "2026-10-19T01:00:00Z" }),
    });
    const { result } = renderHook(() => useGitHubActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
    expect(result.current.lastKnownCommits).toEqual([commit]);
    expect(result.current.lastKnownCachedAt).toBe("2026-10-19T01:00:00Z");
    expect(result.current.error).toBe(false);
  });

  it("falls to last-known when the static file is a 404", async () => {
    stubFetch({ "/last-known-commits.json": ok({ commits: [commit], cachedAt: "t" }) });
    const { result } = renderHook(() => useGitHubActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lastKnownCommits).toEqual([commit]);
  });

  it("ends empty and not loading when both fail", async () => {
    stubFetch({ "/github-activity.json": new Error("net"), "/last-known-commits.json": new Error("net") });
    const { result } = renderHook(() => useGitHubActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
    expect(result.current.lastKnownCommits).toEqual([]);
    expect(result.current.error).toBe(true);
  });

  it("reports an error when last-known is empty too", async () => {
    stubFetch({ "/last-known-commits.json": ok({ commits: [], cachedAt: "" }) });
    const { result } = renderHook(() => useGitHubActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
  });

  it("never calls api.github.com from the browser", async () => {
    const f = stubFetch({});
    const { result } = renderHook(() => useGitHubActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const urls = f.mock.calls.map((c) => String(c[0]));
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((u) => u.includes("api.github.com"))).toEqual([]);
  });
});

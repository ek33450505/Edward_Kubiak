import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectCommits, main, selectPushEvents, toItem } from "./sync-github-activity.mjs";

const sha = (n) => n.toString(16).padStart(40, "0");
const ZERO = "0".repeat(40);
const commit = (n, message = `commit ${n}`, date = "2026-10-19T12:00:00Z") => ({
  sha: sha(n),
  commit: { message, author: { date } },
});
const push = (repoFull, { before = sha(1), head = sha(2), pub = true, type = "PushEvent" } = {}) => ({
  type,
  public: pub,
  repo: { name: repoFull },
  payload: { before, head },
});

// Fake fetch: events URL returns `events`; compare/commit URLs are looked up in `routes`.
function fakeFetch(events, routes = {}) {
  const calls = [];
  const fn = vi.fn(async (url) => {
    calls.push(url);
    if (url.includes("/users/ek33450505/events")) return events;
    return url in routes ? routes[url] : null;
  });
  fn.calls = calls;
  return fn;
}

const dirs = [];
function tmpDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "activity-"));
  dirs.push(d);
  return d;
}
afterEach(() => {
  vi.restoreAllMocks();
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe("selectPushEvents (privacy gate)", () => {
  it("drops private events, other owners, and non-push types", () => {
    const events = [
      push("ek33450505/a"),
      push("ek33450505/secret", { pub: false }),
      push("someone/else"),
      push("ek33450505/b", { type: "WatchEvent" }),
      push("ek33450505x/c"),
      null,
    ];
    expect(selectPushEvents(events).map((e) => e.repo.name)).toEqual(["ek33450505/a"]);
  });

  it("drops traversal-shaped repo names so they never reach a request", async () => {
    const events = [push("ek33450505/.."), push("ek33450505/../x"), push("ek33450505/."), push("ek33450505/a/b")];
    expect(selectPushEvents(events)).toEqual([]);
    const f = fakeFetch([]);
    await collectCommits(events, f);
    expect(f.calls).toEqual([]);
  });

  it("tolerates a non-array", () => {
    expect(selectPushEvents(null)).toEqual([]);
  });

  it("drops the profile README repo but keeps other repos, with no requests for it", async () => {
    const events = [push("ek33450505/ek33450505"), push("ek33450505/compute-atlas")];
    expect(selectPushEvents(events).map((e) => e.repo.name)).toEqual(["ek33450505/compute-atlas"]);
    const f = fakeFetch([]);
    await collectCommits([push("ek33450505/ek33450505")], f);
    expect(f.calls).toEqual([]);
  });
});

describe("toItem (sanitizer)", () => {
  it("builds the consumer shape from the first message line", () => {
    expect(toItem("ek33450505/a", commit(2, "Subject line\n\nbody"))).toEqual({
      id: sha(2),
      repo: "a",
      repoFull: "ek33450505/a",
      sha: sha(2),
      message: "Subject line",
      time: "2026-10-19T12:00:00Z",
    });
  });

  it("drops a bad sha, bad repo, empty message and bad date", () => {
    expect(toItem("ek33450505/a", { ...commit(2), sha: "XYZ" })).toBeNull();
    expect(toItem("ek33450505/a", { ...commit(2), sha: sha(0xabc).toUpperCase() })).toBeNull();
    expect(toItem("ek33450505/a b", commit(2))).toBeNull();
    expect(toItem("ek33450505/a/../b", commit(2))).toBeNull();
    expect(toItem("other/a", commit(2))).toBeNull();
    expect(toItem("ek33450505/..", commit(2))).toBeNull();
    expect(toItem("ek33450505/a", commit(2, "\n  \nbody"))).toBeNull();
    expect(toItem("ek33450505/a", commit(2, "ok", "not a date"))).toBeNull();
    expect(toItem("ek33450505/a", { sha: sha(2) })).toBeNull();
  });

  it("caps the message at 200 chars", () => {
    expect(toItem("ek33450505/a", commit(2, "x".repeat(500))).message).toHaveLength(200);
  });
});

describe("collectCommits", () => {
  it("uses compare for a normal push, newest commit first", async () => {
    const url = `https://api.github.com/repos/ek33450505/a/compare/${sha(1)}...${sha(4)}`;
    const f = fakeFetch([], { [url]: { commits: [commit(3), commit(4)] } });
    const items = await collectCommits([push("ek33450505/a", { before: sha(1), head: sha(4) })], f);
    expect(items.map((i) => i.sha)).toEqual([sha(4), sha(3)]);
    expect(f.calls).toEqual([url]);
  });

  it("uses the commit endpoint when before is the zero sha", async () => {
    const url = `https://api.github.com/repos/ek33450505/a/commits/${sha(4)}`;
    const f = fakeFetch([], { [url]: commit(4) });
    const items = await collectCommits([push("ek33450505/a", { before: ZERO, head: sha(4) })], f);
    expect(items.map((i) => i.sha)).toEqual([sha(4)]);
    expect(f.calls).toEqual([url]);
  });

  it("skips a push whose compare fails and continues", async () => {
    const good = `https://api.github.com/repos/ek33450505/b/compare/${sha(1)}...${sha(9)}`;
    const f = fakeFetch([], { [good]: { commits: [commit(9)] } });
    const items = await collectCommits(
      [push("ek33450505/a", { head: sha(5) }), push("ek33450505/b", { head: sha(9) })],
      f
    );
    expect(items.map((i) => i.sha)).toEqual([sha(9)]);
    expect(f.calls).toHaveLength(2);
  });

  it("never requests a private event's repo", async () => {
    const f = fakeFetch([]);
    await collectCommits([push("ek33450505/secret", { pub: false })], f);
    expect(f.calls).toEqual([]);
  });

  it("caps output at 10 commits", async () => {
    const url = `https://api.github.com/repos/ek33450505/a/compare/${sha(1)}...${sha(40)}`;
    const commits = Array.from({ length: 25 }, (_, i) => commit(100 + i));
    const f = fakeFetch([], { [url]: { commits } });
    const items = await collectCommits([push("ek33450505/a", { head: sha(40) })], f);
    expect(items).toHaveLength(10);
  });

  it("caps API calls at 12 when pushes resolve to nothing", async () => {
    const f = fakeFetch([]);
    const events = Array.from({ length: 30 }, (_, i) => push("ek33450505/a", { head: sha(i + 2) }));
    expect(await collectCommits(events, f)).toEqual([]);
    expect(f.calls).toHaveLength(12);
  });

  it("stops issuing calls once the time budget is spent, keeping what resolved", async () => {
    const u1 = `https://api.github.com/repos/ek33450505/a/commits/${sha(5)}`;
    const f = fakeFetch([], { [u1]: commit(5) });
    let t = 0;
    const clock = () => t;
    const wrapped = vi.fn(async (url) => {
      t += 30_000; // each call "takes" 30s
      return f(url);
    });
    const events = [
      push("ek33450505/a", { before: ZERO, head: sha(5) }),
      push("ek33450505/a", { before: ZERO, head: sha(6) }),
      push("ek33450505/a", { before: ZERO, head: sha(7) }),
    ];
    const items = await collectCommits(events, wrapped, { clock, budgetMs: 45_000 });
    expect(items.map((i) => i.sha)).toEqual([sha(5)]);
    expect(wrapped).toHaveBeenCalledTimes(2); // third call refused at 60s
  });

  it("dedupes by sha across pushes", async () => {
    const u1 = `https://api.github.com/repos/ek33450505/a/commits/${sha(7)}`;
    const f = fakeFetch([], { [u1]: commit(7) });
    const ev = push("ek33450505/a", { before: ZERO, head: sha(7) });
    const items = await collectCommits([ev, ev], f);
    expect(items).toHaveLength(1);
  });

  it("drops sanitizer failures inside a compare result", async () => {
    const url = `https://api.github.com/repos/ek33450505/a/compare/${sha(1)}...${sha(4)}`;
    const f = fakeFetch([], { [url]: { commits: [commit(3, ""), { ...commit(5), sha: "bad" }, commit(4)] } });
    const items = await collectCommits([push("ek33450505/a", { head: sha(4) })], f);
    expect(items.map((i) => i.sha)).toEqual([sha(4)]);
  });
});

describe("main", () => {
  const lastKnownSeed = JSON.stringify({ commits: [], cachedAt: "" });

  it("writes the feed and rewrites last-known when commits resolve", async () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, "last-known-commits.json"), lastKnownSeed);
    const url = `https://api.github.com/repos/ek33450505/a/commits/${sha(4)}`;
    const f = fakeFetch([push("ek33450505/a", { before: ZERO, head: sha(4) })], { [url]: commit(4) });
    const now = new Date("2026-10-19T15:00:00Z");
    await main({ fetch: f, outDir: dir, now });
    const feed = JSON.parse(fs.readFileSync(path.join(dir, "github-activity.json"), "utf8"));
    expect(feed).toHaveLength(1);
    const lk = JSON.parse(fs.readFileSync(path.join(dir, "last-known-commits.json"), "utf8"));
    expect(lk).toEqual({ commits: feed, cachedAt: now.toISOString() });
  });

  it("on events failure writes [] , leaves last-known byte-identical, and warns", async () => {
    const dir = tmpDir();
    const seed = JSON.stringify({ commits: [{ sha: "keep" }], cachedAt: "2026-01-01T00:00:00.000Z" });
    fs.writeFileSync(path.join(dir, "last-known-commits.json"), seed);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ fetch: async () => null, outDir: dir });
    expect(JSON.parse(fs.readFileSync(path.join(dir, "github-activity.json"), "utf8"))).toEqual([]);
    expect(fs.readFileSync(path.join(dir, "last-known-commits.json"), "utf8")).toBe(seed);
    expect(warn.mock.calls.flat().join("\n")).toContain("::warning title=sync-github-activity::");
  });

  it("on an unexpected throw, best-effort writes [] and leaves last-known alone", async () => {
    const dir = tmpDir();
    const seed = JSON.stringify({ commits: [{ sha: "keep" }], cachedAt: "x" });
    fs.writeFileSync(path.join(dir, "last-known-commits.json"), seed);
    fs.writeFileSync(path.join(dir, "github-activity.json"), '[{"stale":true}]');
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await main({
      fetch: async () => {
        throw new Error("boom");
      },
      outDir: dir,
    });
    expect(result).toBeNull();
    expect(JSON.parse(fs.readFileSync(path.join(dir, "github-activity.json"), "utf8"))).toEqual([]);
    expect(fs.readFileSync(path.join(dir, "last-known-commits.json"), "utf8")).toBe(seed);
    expect(warn.mock.calls.flat().join("\n")).toContain("failed (boom)");
  });

  it("never throws on an IO error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const missing = path.join(tmpDir(), "does", "not", "exist");
    await expect(main({ fetch: async () => [], outDir: missing })).resolves.toBeNull();
  });
});

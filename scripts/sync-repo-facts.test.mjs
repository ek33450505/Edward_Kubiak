import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import os from "node:os";
import { FALLBACK, checkFacts, checkOutput, countCommits, countTree, hasClaudeTrailer, isRealDate, main, validateSnapshot } from "./sync-repo-facts.mjs";
import { githubHeaders } from "./sync-tool-versions.mjs";
import { githubHeaders as sharedHeaders } from "./lib/github.mjs";
import { REPO_FACTS } from "../src/data/repoFacts.js";

const blob = (p) => ({ type: "blob", path: p });
const tree = (entries, truncated = false) => ({ truncated, tree: entries });

describe("countTree", () => {
  const entries = [
    blob("app/api/a/route.ts"),
    blob("src/app/api/b/c/route.js"),
    blob("app/api/d/route.tsx"),
    blob("app/api/route.ts"), // no segment between api/ and route -> not a handler
    blob("app/page.tsx"),
    blob("lib/a.test.ts"),
    blob("lib/b.test.mjs"),
    blob("e2e/c.spec.ts"), // Playwright, deliberately excluded
    blob("node_modules/x/y.test.js"),
    blob(".github/workflows/ci.yml"),
    blob(".github/workflows/codeql.yaml"),
    blob(".github/workflows/sub/nested.yml"),
    { type: "tree", path: "app/api/z/route.ts" },
  ];

  it("applies each counting rule", () => {
    expect(countTree(tree(entries))).toEqual({ routeHandlers: 3, testFiles: 2, workflows: 2 });
  });

  it("returns null for a truncated tree", () => {
    expect(countTree(tree(entries, true))).toBeNull();
  });

  it("returns null for an empty tree or one with only directories", () => {
    expect(countTree(tree([]))).toBeNull();
    expect(countTree(tree([{ type: "tree", path: "app" }]))).toBeNull();
  });

  it("returns null for malformed or missing input", () => {
    expect(countTree(null)).toBeNull();
    expect(countTree({ truncated: false })).toBeNull();
    expect(countTree({ tree: entries })).toBeNull(); // truncated flag absent -> unproven complete
  });
});

describe("hasClaudeTrailer", () => {
  it.each([
    "Fix x\n\nCo-Authored-By: Claude Opus 4 <noreply@anthropic.com>",
    "Fix x\n\nCo-authored-by: Crosby (Claude Opus 5.5) <noreply@anthropic.com>",
  ])("counts %j", (m) => expect(hasClaudeTrailer(m)).toBe(true));

  it("ignores a non-Claude co-author", () => {
    expect(hasClaudeTrailer("Fix x\n\nCo-authored-by: Jane <jane@example.com>")).toBe(false);
  });

  it("ignores a mention that is not a trailer line", () => {
    expect(hasClaudeTrailer("Ask Claude about co-authored-by: nothing")).toBe(false);
  });

  it("handles non-string messages", () => {
    expect(hasClaudeTrailer(undefined)).toBe(false);
  });
});

describe("countCommits", () => {
  const mk = (n, claudeEvery) =>
    Array.from({ length: n }, (_, i) => ({
      commit: { message: i % claudeEvery === 0 ? "m\n\nCo-Authored-By: Claude <noreply@anthropic.com>" : "m" },
    }));

  it("stops on a short page and sums across pages", async () => {
    const pages = [mk(100, 2), mk(100, 2), mk(5, 1)];
    const requested = [];
    const result = await countCommits(async (n) => (requested.push(n), pages[n - 1]));
    expect(result).toEqual({ commits: 205, claudeCoauthored: 50 + 50 + 5 });
    expect(requested).toEqual([1, 2, 3]);
  });

  it("stops after an empty page following a full one", async () => {
    const pages = [mk(100, 1), []];
    expect(await countCommits(async (n) => pages[n - 1])).toEqual({ commits: 100, claudeCoauthored: 100 });
  });

  it("returns null when a page contains a non-commit item", async () => {
    expect(await countCommits(async () => [null, null])).toBeNull();
    expect(await countCommits(async () => [{ commit: {} }])).toBeNull();
  });

  it("returns null when page 1 is empty", async () => {
    expect(await countCommits(async () => [])).toBeNull();
  });

  it("returns null when the page cap is hit", async () => {
    expect(await countCommits(async () => mk(100, 1), 3)).toBeNull();
  });

  it("returns null when any page fails", async () => {
    expect(await countCommits(async (n) => (n === 2 ? null : mk(100, 1)))).toBeNull();
  });
});

describe("githubHeaders (shared)", () => {
  it("is re-exported by sync-tool-versions", () => {
    expect(githubHeaders).toBe(sharedHeaders);
  });

  it("sends the token only to api.github.com", () => {
    expect(githubHeaders("https://api.github.com/x", "tok").Authorization).toBe("Bearer tok");
    expect(githubHeaders("https://evil.example/x", "tok")).not.toHaveProperty("Authorization");
  });
});

describe("repoFacts drift", () => {
  it("src/data/repoFacts.js matches public/repo-facts.json", () => {
    const snapshot = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "..", "public", "repo-facts.json"), "utf8"));
    expect(REPO_FACTS.computeAtlas).toEqual(snapshot.computeAtlas);
  });
});

describe("isRealDate", () => {
  it.each(["2026-10-19", "2024-02-29"])("accepts %s", (d) => expect(isRealDate(d)).toBe(true));
  it.each(["2026-02-31", "2025-02-29", "2026-13-01", "2026-00-10", "yesterday", "2026-1-1", "", undefined, 20261019])(
    "rejects %j",
    (d) => expect(isRealDate(d)).toBe(false),
  );
});

describe("validateSnapshot", () => {
  const good = {
    routeHandlers: 1, testFiles: 2, workflows: 3, commits: 5, claudeCoauthored: 4,
    treeAsOf: "2026-10-19", commitsAsOf: "2026-10-18",
  };

  it("keeps valid groups", () => {
    expect(validateSnapshot(good)).toEqual({ facts: good, warnings: [] });
  });

  it("drops a whole group when any one field is invalid, keeping the other group", () => {
    const { facts, warnings } = validateSnapshot({ ...good, testFiles: -1 });
    expect(facts).toEqual({ commits: 5, claudeCoauthored: 4, commitsAsOf: "2026-10-18" });
    expect(warnings).toHaveLength(1);
  });

  it("drops a group on a bad date, a zero, or cross-field nonsense", () => {
    expect(validateSnapshot({ ...good, treeAsOf: "2026-02-31" }).facts).not.toHaveProperty("routeHandlers");
    expect(validateSnapshot({ ...good, workflows: 0 }).facts).not.toHaveProperty("treeAsOf");
    expect(validateSnapshot({ ...good, claudeCoauthored: 9 }).facts).not.toHaveProperty("commits");
  });

  it("drops a partial group, and skips an absent group silently", () => {
    expect(validateSnapshot({ commits: 5, claudeCoauthored: 4 }).warnings).toHaveLength(1);
    expect(validateSnapshot({ commits: 5, claudeCoauthored: 4, commitsAsOf: "2026-10-18" })).toEqual({
      facts: { commits: 5, claudeCoauthored: 4, commitsAsOf: "2026-10-18" },
      warnings: [],
    });
  });

  it("tolerates a missing block", () => {
    expect(validateSnapshot(undefined)).toEqual({ facts: {}, warnings: [] });
  });
});

describe("checkOutput", () => {
  it("the FALLBACK constants pass the gate", () => {
    for (const g of ["tree", "commits"]) expect(checkOutput(g, FALLBACK, FALLBACK.treeAsOf)).toEqual([]);
  });

  it("rejects a future as-of and an impossible date", () => {
    expect(checkOutput("tree", { ...FALLBACK, treeAsOf: "2026-11-01" }, "2026-10-30")[0]).toMatch(/future/);
    expect(checkOutput("tree", { ...FALLBACK, treeAsOf: "2026-02-31" }, "2026-10-30")[0]).toMatch(/real/);
  });

  it("rejects bad counts regardless of baseline", () => {
    expect(checkOutput("commits", { ...FALLBACK, claudeCoauthored: 0 }, "2026-10-30")[0]).toMatch(/claudeCoauthored/);
  });
});

describe("checkFacts", () => {
  const snapTree = { routeHandlers: 20, testFiles: 335, workflows: 9 };
  const snapCommits = { commits: 645, claudeCoauthored: 494 };

  it.each([
    ["accepts a healthy tree", "tree", { routeHandlers: 20, testFiles: 335, workflows: 9 }, snapTree, []],
    ["accepts a tree at exactly half", "tree", { routeHandlers: 10, testFiles: 168, workflows: 5 }, snapTree, []],
    ["accepts healthy commits", "commits", { commits: 700, claudeCoauthored: 500 }, snapCommits, []],
    ["accepts equal commits", "commits", { commits: 645, claudeCoauthored: 494 }, snapCommits, []],
    ["accepts a first run with no snapshot", "commits", { commits: 3, claudeCoauthored: 1 }, undefined, []],
    ["rejects a tree count under half", "tree", { routeHandlers: 9, testFiles: 335, workflows: 9 }, snapTree, [/routeHandlers fell/]],
    ["rejects shrunk commits", "commits", { commits: 644, claudeCoauthored: 494 }, snapCommits, [/commits shrank/]],
    ["rejects shrunk claudeCoauthored", "commits", { commits: 700, claudeCoauthored: 400 }, snapCommits, [/claudeCoauthored shrank/]],
    ["rejects 700 commits with 0 Claude co-authored", "commits", { commits: 700, claudeCoauthored: 0 }, snapCommits, [/claudeCoauthored must be/]],
    ["rejects zero on a first run", "tree", { routeHandlers: 0, testFiles: 0, workflows: 0 }, undefined, [/routeHandlers must be/, /testFiles must be/, /workflows must be/]],
    ["rejects claudeCoauthored above commits", "commits", { commits: 5, claudeCoauthored: 6 }, undefined, [/exceeds commits/]],
    ["rejects a missing key", "tree", { routeHandlers: 20, testFiles: 335 }, snapTree, [/workflows must be/]],
    ["rejects a non-integer", "commits", { commits: 1.5, claudeCoauthored: 1 }, undefined, [/commits must be/]],
    ["rejects an undeclared key", "tree", { routeHandlers: 1, testFiles: 1, workflows: 1, extra: 4 }, undefined, [/unexpected key extra/]],
    ["rejects an unknown group", "nope", { a: 1 }, undefined, [/unknown group/]],
  ])("%s", (_name, group, live, snap, expected) => {
    const reasons = checkFacts(group, live, snap);
    expect(reasons).toHaveLength(expected.length);
    expected.forEach((re, i) => expect(reasons[i]).toMatch(re));
  });
});

describe("main", () => {
  const TREE_URL = "/git/trees/main";
  const goodTree = { truncated: false, tree: [blob("app/api/a/route.ts"), blob("a.test.ts"), blob(".github/workflows/ci.yml")] };
  const page = (n, claude = n) =>
    Array.from({ length: n }, (_, i) => ({ commit: { message: i < claude ? "m\n\nCo-Authored-By: Claude <noreply@anthropic.com>" : "m" } }));
  const snapshot = {
    routeHandlers: 1, testFiles: 1, workflows: 1, commits: 3, claudeCoauthored: 1,
    treeAsOf: "2026-01-01", commitsAsOf: "2026-02-02",
  };
  const dirs = [];

  function setup(snap) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-facts-"));
    dirs.push(dir);
    const snapshotPath = path.join(dir, "repo-facts.json");
    if (snap) fs.writeFileSync(snapshotPath, JSON.stringify({ computeAtlas: snap }));
    return { snapshotPath, outJsPath: path.join(dir, "repoFacts.js"), today: "2026-10-30" };
  }
  const read = (paths) => JSON.parse(fs.readFileSync(paths.snapshotPath, "utf8")).computeAtlas;
  const fetcher = ({ treeBody = goodTree, commitPages = [page(4, 2)] } = {}) => async (url) =>
    url.includes(TREE_URL) ? treeBody : commitPages[Number(new URL(url).searchParams.get("page")) - 1] ?? null;

  afterEach(() => {
    vi.restoreAllMocks();
    while (dirs.length) fs.rmSync(dirs.pop(), { recursive: true, force: true });
  });

  it("publishes both groups live with today's date", async () => {
    const paths = setup(snapshot);
    await main({ ...paths, fetch: fetcher() });
    expect(read(paths)).toEqual({
      routeHandlers: 1, testFiles: 1, workflows: 1, commits: 4, claudeCoauthored: 2,
      treeAsOf: "2026-10-30", commitsAsOf: "2026-10-30",
    });
    expect(fs.readFileSync(paths.outJsPath, "utf8")).toContain("export const REPO_FACTS");
  });

  it("keeps snapshot values and date for a failed tree while commits go live", async () => {
    const paths = setup(snapshot);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: fetcher({ treeBody: null }) });
    expect(read(paths)).toMatchObject({ routeHandlers: 1, treeAsOf: "2026-01-01", commits: 4, commitsAsOf: "2026-10-30" });
    expect(warn.mock.calls.flat().join("\n")).toContain("::warning title=sync-repo-facts::tree fell back; serving values as of 2026-01-01");
  });

  it("leaves the snapshot unchanged when both fail", async () => {
    const paths = setup(snapshot);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: async () => null });
    expect(read(paths)).toEqual(snapshot);
  });

  it("uses fallback constants and their dates with no snapshot and failed fetches", async () => {
    const paths = setup(null);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: async () => null });
    expect(read(paths)).toEqual({
      routeHandlers: 20, testFiles: 335, workflows: 9, commits: 645, claudeCoauthored: 494,
      treeAsOf: "2026-10-19", commitsAsOf: "2026-10-19",
    });
  });

  it("falls back when page 1 is empty (no zero count published)", async () => {
    const paths = setup(snapshot);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: fetcher({ commitPages: [[]] }) });
    expect(read(paths)).toMatchObject({ commits: 3, claudeCoauthored: 1, commitsAsOf: "2026-02-02" });
  });

  it("falls back when an empty tree is returned", async () => {
    const paths = setup(snapshot);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: fetcher({ treeBody: { truncated: false, tree: [] } }) });
    expect(read(paths)).toMatchObject({ routeHandlers: 1, treeAsOf: "2026-01-01" });
  });

  it("rejects a live commit count below the snapshot", async () => {
    const paths = setup({ ...snapshot, commits: 50 });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: fetcher() });
    expect(read(paths)).toMatchObject({ commits: 50, commitsAsOf: "2026-02-02" });
  });

  it("rejects a live tree count that collapsed vs the snapshot", async () => {
    const paths = setup({ ...snapshot, routeHandlers: 20 });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: fetcher() });
    expect(read(paths)).toMatchObject({ routeHandlers: 20, treeAsOf: "2026-01-01" });
  });

  it("treats an invalid snapshot group as a unit: constants with the constant date, other group intact", async () => {
    const paths = setup({ ...snapshot, workflows: -4 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: async () => null });
    expect(read(paths)).toMatchObject({
      routeHandlers: 20, testFiles: 335, workflows: 9, treeAsOf: "2026-10-19",
      commits: 3, claudeCoauthored: 1, commitsAsOf: "2026-02-02",
    });
    expect(warn.mock.calls.flat().join("\n")).toContain("snapshot tree group is invalid");
  });

  it("publishes nothing from the reviewer's bad-snapshot probe", async () => {
    const paths = setup({
      routeHandlers: 0, claudeCoauthored: 9, commits: 3, testFiles: 1, workflows: 1,
      treeAsOf: "2026-02-31", commitsAsOf: "yesterday",
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: async () => null });
    expect(read(paths)).toEqual(FALLBACK);
  });

  it("replaces a group (counts and date together) when its merged output fails the final gate", async () => {
    // Valid-looking but future-dated snapshot group; GitHub down.
    const paths = setup({ ...snapshot, treeAsOf: "2027-01-01" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: async () => null });
    expect(read(paths)).toMatchObject({ routeHandlers: 20, testFiles: 335, workflows: 9, treeAsOf: "2026-10-19", commits: 3 });
  });

  it("treats an invalid today as a failure: no write, null", async () => {
    const paths = setup(snapshot);
    const before = fs.readFileSync(paths.snapshotPath);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await main({ ...paths, today: "2026-02-31", fetch: fetcher() })).toBeNull();
    expect(fs.readFileSync(paths.snapshotPath).equals(before)).toBe(true);
    expect(fs.existsSync(paths.outJsPath)).toBe(false);
    expect(warn.mock.calls.flat().join("\n")).toContain("no files were updated");
  });

  it("rejects live 700 commits / 0 Claude co-authored (only the >= 1 rule applies: no snapshot)", async () => {
    const paths = setup(null);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await main({ ...paths, fetch: fetcher({ commitPages: [...Array(7).fill(page(100, 0)), []] }) });
    expect(read(paths)).toMatchObject({ commits: 645, claudeCoauthored: 494, commitsAsOf: "2026-10-19" });
  });

  describe("IO failures", () => {
    const leftovers = (paths) => fs.readdirSync(path.dirname(paths.snapshotPath)).filter((f) => f.includes(".tmp-"));

    it.each([
      ["the JS target directory is missing", (p) => path.join(p.outJsPath, "no", "such", "dir.js")],
      ["the JS target is a directory (rename fails)", (p) => { fs.mkdirSync(p.outJsPath); return p.outJsPath; }],
    ])("leaves the snapshot byte-identical and no temp files when %s", async (_name, breakJs) => {
      const paths = setup(snapshot);
      const before = fs.readFileSync(paths.snapshotPath);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = await main({ ...paths, outJsPath: breakJs(paths), fetch: fetcher() });
      expect(result).toBeNull();
      expect(fs.readFileSync(paths.snapshotPath).equals(before)).toBe(true);
      expect(leftovers(paths)).toEqual([]);
      expect(warn.mock.calls.flat().join("\n")).toContain("no files were updated");
    });

    it("reports the JS file as updated when only the snapshot write fails", async () => {
      const paths = setup(null);
      fs.mkdirSync(paths.snapshotPath); // snapshot target is a directory
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = await main({ ...paths, fetch: fetcher() });
      expect(result).toBeNull();
      expect(fs.existsSync(paths.outJsPath)).toBe(true);
      expect(warn.mock.calls.flat().join("\n")).toMatch(/updated before failure: .*repoFacts\.js/);
      expect(leftovers(paths)).toEqual([]);
    });
  });
});

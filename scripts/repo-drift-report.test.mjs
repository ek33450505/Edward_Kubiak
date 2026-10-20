import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { main, scanAnchors, scanText } from "./repo-drift-report.mjs";

const TODAY = new Date("2026-10-19T12:00:00Z");
const API = "https://api.github.com";

let tmp;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "drift-"));
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

function put(rel, text) {
  const p = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}

const ok = (body) => ({ status: 200, body });
const repo = (name, extra = {}) => ({
  name,
  html_url: `https://github.com/ek33450505/${name}`,
  fork: false,
  archived: false,
  created_at: "2026-10-10T00:00:00Z",
  ...extra,
});

const PROJECTS = [
  { github: "https://github.com/ek33450505/compute-atlas" },
  { github: "https://github.com/ek33450505/attest" },
  { title: "no repo" },
];
const TOOLS = { attest: "v0.3.0", misfire: "v0.2.0" };

// Routes by URL; unknown URLs 404.
function router(routes) {
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    for (const [prefix, res] of routes) {
      if (url.startsWith(`${API}${prefix}`)) return typeof res === "function" ? res(url) : res;
    }
    return { status: 404, body: null };
  };
  fetch.calls = calls;
  return fetch;
}

async function run(routes, extra = {}) {
  const out = { text: "", write(s) { this.text += s; } };
  const fetch = router(routes);
  const result = await main({ fetch, today: TODAY, out, rootDir: tmp, projects: PROJECTS, toolVersions: TOOLS, ...extra });
  return { result, text: out.text, fetch };
}

describe("section A: new public repos", () => {
  it("keeps only new, non-fork, non-archived, non-homebrew, off-site repos", async () => {
    const list = [
      repo("fresh-tool"),
      repo("a-fork", { fork: true }),
      repo("shelved", { archived: true }),
      repo("homebrew-thing"),
      repo("Compute-Atlas"), // already on site, case-insensitive
      repo("ancient", { created_at: "2026-01-01T00:00:00Z" }),
    ];
    const { result } = await run([["/users/ek33450505/repos", ok(list)]]);
    expect(result.newRepos.items.map((i) => i.name)).toEqual(["fresh-tool"]);
  });

  it("stops paging once it reaches repos older than the window", async () => {
    const full = Array.from({ length: 100 }, (_, i) => repo(`r${i}`, { created_at: i < 50 ? "2026-10-01T00:00:00Z" : "2026-02-01T00:00:00Z" }));
    const { fetch } = await run([["/users/ek33450505/repos", ok(full)]]);
    expect(fetch.calls.filter((u) => u.includes("/users/"))).toHaveLength(1);
  });

  it("skips private repos defensively", async () => {
    const { result } = await run([["/users/ek33450505/repos", ok([repo("secret", { private: true }), repo("open")])]]);
    expect(result.newRepos.items.map((i) => i.name)).toEqual(["open"]);
  });

  it("pages when a full page is all inside the window, up to 3 pages", async () => {
    const full = Array.from({ length: 100 }, (_, i) => repo(`r${i}`));
    const { fetch, result, text } = await run([["/users/ek33450505/repos", ok(full)]]);
    expect(fetch.calls.filter((u) => u.includes("/users/"))).toHaveLength(3);
    expect(result.newRepos.note).toBe("list may be incomplete: page cap reached");
    expect(text).toContain("list may be incomplete: page cap reached");
  });
});

describe("section B: site repo state", () => {
  it("reports gone, renamed and archived; skips projects without a repo", async () => {
    const projects = [
      { github: "https://github.com/ek33450505/vanished" },
      { github: "https://github.com/ek33450505/old-name" },
      { github: "https://github.com/ek33450505/shelved" },
      { github: "https://github.com/ek33450505/fine" },
      { title: "none" },
    ];
    const { result, fetch } = await run(
      [
        ["/repos/ek33450505/old-name", ok({ full_name: "ek33450505/new-name", archived: false })],
        ["/repos/ek33450505/shelved", ok({ full_name: "ek33450505/Shelved", archived: true })],
        ["/repos/ek33450505/fine", ok({ full_name: "ek33450505/FINE", archived: false })],
        ["/users/", ok([])],
      ],
      { projects, toolVersions: {} },
    );
    expect(result.stateChanges.items).toEqual([
      { name: "vanished", state: "not found (deleted, private, or unreachable)" },
      { name: "old-name", state: "renamed to ek33450505/new-name" },
      { name: "shelved", state: "archived" },
    ]);
    expect(fetch.calls.some((u) => u.includes("undefined"))).toBe(false);
  });
});

describe("section B: other statuses", () => {
  const one = [{ github: "https://github.com/ek33450505/solo" }];
  const runB = (res) => run([["/repos/ek33450505/solo", res], ["/users/", ok([])]], { projects: one, toolVersions: {} });

  it("maps a 301 to moved", async () => {
    const { result } = await runB({ status: 301, body: null });
    expect(result.stateChanges.items).toEqual([{ name: "solo", state: expect.stringContaining("moved (renamed or transferred)") }]);
  });

  it("maps a 200 with private: true to now private (before archived)", async () => {
    const { result } = await runB(ok({ full_name: "ek33450505/solo", private: true, archived: true }));
    expect(result.stateChanges.items).toEqual([{ name: "solo", state: "now private" }]);
  });

  it.each([500, 403])("a %i is unavailable, never a state change", async (status) => {
    const { result, text } = await runB({ status, body: null });
    expect(result.stateChanges.items).toEqual([]);
    expect(result.stateChanges.error).toBe(true);
    expect(text).toMatch(/## B\.[^#]*unavailable/);
  });
});

describe("section C: releases", () => {
  it("lists only releases inside 7 days and flags TOOL_VERSIONS state", async () => {
    const { result } = await run([
      ["/repos/ek33450505/attest/releases/latest", ok({ tag_name: "v0.3.0", published_at: "2026-10-15T00:00:00Z" })],
      ["/repos/ek33450505/misfire/releases/latest", ok({ tag_name: "v0.3.0", published_at: "2026-10-18T00:00:00Z" })],
      ["/repos/ek33450505/compute-atlas/releases/latest", ok({ tag_name: "v9", published_at: "2026-09-01T00:00:00Z" })],
      ["/users/", ok([])],
      ["/repos/ek33450505/", ok({ full_name: "x", archived: false })],
    ]);
    // routes match by prefix in order, so the specific release URLs above win
    expect(result.releases.items).toEqual([
      { name: "attest", tag: "v0.3.0", published: "2026-10-15", inToolVersions: true },
      { name: "misfire", tag: "v0.3.0", published: "2026-10-18", inToolVersions: false },
    ]);
  });

  it.each([500, 403])("a %i on releases/latest is unavailable, not 'no releases'", async (status) => {
    const { result, text } = await run([
      ["/repos/ek33450505/attest/releases/latest", { status, body: null }],
      ["/users/", ok([])],
    ]);
    expect(result.releases.error).toBe(true);
    expect(text).toMatch(/## C\.[^#]*unavailable/);
  });

  it("treats 404 (no releases) as not an error", async () => {
    const { result, text } = await run([["/users/", ok([])]]);
    expect(result.releases.error).toBeUndefined();
    expect(text).toContain("Nothing to report.");
  });
});

describe("section D: anchor scanner", () => {
  const t = (s) => scanText(s, "f.js", TODAY);

  it("parses each anchor form", () => {
    expect(t("tests passing as of August 30, 2026")[0]).toMatchObject({ date: "2026-08-30", ageDays: 50 });
    expect(t("as of Aug 30 2026")[0]).toMatchObject({ date: "2026-08-30" });
    expect(t("As Of 2026-08-30.")[0]).toMatchObject({ date: "2026-08-30", ageDays: 50 });
    expect(t("as of August 2026")[0]).toMatchObject({ date: "2026-08-31", ageDays: 49 });
  });

  it("treats month-only as the last day of the month (leap February)", () => {
    expect(t("as of February 2028")[0].date).toBe("2028-02-29");
    expect(t("as of February 2026")[0].date).toBe("2026-02-28");
  });

  it("computes age across a year boundary", () => {
    const hit = scanText("as of December 15, 2025", "f.js", new Date("2026-01-14T00:00:00Z"))[0];
    expect(hit.ageDays).toBe(30);
  });

  it("skips interpolated anchors", () => {
    expect(t("as of ${stats.month} 2026")).toEqual([]);
    expect(t("as of August ${day}, 2026")).toEqual([]);
    expect(t("as of ${y}-08-30")).toEqual([]);
  });

  it("ignores impossible dates and unrelated text", () => {
    expect(t("as of February 31, 2026")).toEqual([]);
    expect(t("as of today")).toEqual([]);
  });

  it("scans the right files, skips tests, and keeps only > 60 days", () => {
    put("src/data/resume.js", 'x\n"1,193 tests as of August 30, 2026" // 50 days\n"old as of June 1, 2026"\n');
    put("src/data/resume.test.js", "as of June 1, 2026");
    put("src/data/deep/nested.js", "as of June 1, 2026");
    put("src/Components/Home/Hero.jsx", "<p>as of 2026-01-02</p>");
    put("src/Components/Home/Hero.test.jsx", "as of 2026-01-02");
    put("scripts/build-resume-pdf.mjs", "// as of March 2026");
    const hits = scanAnchors(tmp, TODAY);
    expect(hits.map((h) => `${h.file}:${h.line}`).sort()).toEqual([
      "scripts/build-resume-pdf.mjs:1",
      "src/Components/Home/Hero.jsx:1",
      "src/data/resume.js:3",
    ]);
    expect(hits).toHaveLength(3);
    expect(hits.find((h) => h.file === "src/data/resume.js").ageDays).toBe(140);
  });

  it("reports the injected-today 50-day anchor only once it passes 60 days", () => {
    put("src/data/resume.js", "1,193 tests passing as of August 30, 2026");
    expect(scanAnchors(tmp, TODAY)).toEqual([]);
    expect(scanAnchors(tmp, new Date("2026-11-01T00:00:00Z"))).toHaveLength(1);
  });
});

describe("failure handling", () => {
  it("marks only the failing section unavailable", async () => {
    const { text, result } = await run([
      ["/users/", { status: 500, body: null }],
      ["/repos/ek33450505/", { status: 404, body: null }],
    ]);
    expect(result.newRepos.error).toBe(true);
    expect(text).toMatch(/## A\.[^#]*unavailable \(GitHub API error\)/);
    expect(text).toMatch(/## B\.[^#]*not found/);
    expect(text).toMatch(/## D\./);
  });

  it("a thrown fetch is unavailable, never a wrong claim", async () => {
    const out = { text: "", write(s) { this.text += s; } };
    await main({ fetch: async () => { throw new Error("boom"); }, today: TODAY, out, rootDir: tmp, projects: PROJECTS, toolVersions: TOOLS });
    expect(out.text).not.toContain("not found");
    expect(out.text.match(/unavailable \(GitHub API error\)/g).length).toBe(3);
  });

  it("caps API calls and says so", async () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ github: `https://github.com/ek33450505/r${i}` }));
    const { fetch, text, result } = await run([["/users/", ok([])]], { projects: many, toolVersions: {} });
    expect(fetch.calls.length).toBe(60);
    expect(result.budget.exhausted).toBe(true);
    expect(text).toContain("API budget exhausted");
  });

  it("emits parseable JSON with --json", async () => {
    const out = { text: "", write(s) { this.text += s; } };
    await main({ fetch: router([["/users/", ok([])]]), today: TODAY, out, json: true, rootDir: tmp, projects: PROJECTS, toolVersions: TOOLS });
    expect(JSON.parse(out.text).date).toBe("2026-10-19");
  });
});

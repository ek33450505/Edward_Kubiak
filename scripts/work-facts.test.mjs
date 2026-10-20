import { describe, expect, it } from "vitest";

import {
  classifyPaths,
  countDeclaredTests,
  countLines,
  findClaims,
  gather,
  identityBreakdown,
  main,
  parseArgs,
  parseCatBatch,
  TEST_DECL_RE,
} from "./work-facts.mjs";

describe("classifyPaths", () => {
  const c = classifyPaths([
    "src/a.js",
    "src/b.jsx",
    "src/c.ts",
    "src/d.tsx",
    "src/a.test.js",
    "src/deep/e.test.tsx",
    "src/style.css",
    "src/readme.md",
    "ses/src/x.jsx",
    "ses/src/x.css",
    "ses/src/x.test.js",
    "scripts/y.js",
    "other/src/z.js",
  ]);
  it("counts src code including tests, css only toward lines", () => {
    expect(c.code).toHaveLength(6);
    expect(c.lines).toHaveLength(7);
    expect(c.app).toEqual(["src/a.js", "src/b.jsx", "src/c.ts", "src/d.tsx"]);
    expect(c.css).toEqual(["src/style.css"]);
    expect(c.tests).toEqual(["src/a.test.js", "src/deep/e.test.tsx"]);
  });
  it("keeps ses/ separate from src figures", () => {
    expect(c.sesCode).toEqual(["ses/src/x.jsx", "ses/src/x.test.js"]);
    expect(c.sesLines).toHaveLength(3);
    expect(c.code.some((p) => p.startsWith("ses/"))).toBe(false);
  });
});

describe("declaration regex", () => {
  it("matches it/test/.each, not describe", () => {
    expect(TEST_DECL_RE.test('  it("a", () => {})')).toBe(true);
    expect(TEST_DECL_RE.test("test('a', () => {})")).toBe(true);
    expect(TEST_DECL_RE.test("  it.each([[1], [2]])('x', () => {})")).toBe(true);
    expect(TEST_DECL_RE.test('describe("a", () => {})')).toBe(false);
    expect(TEST_DECL_RE.test("  // it(")).toBe(false);
    expect(TEST_DECL_RE.test("  const split = x; submit(")).toBe(false);
  });
  it("counts lines", () => {
    expect(countDeclaredTests('describe("s", () => {\n  it("a", f);\n  test("b", f);\n});')).toBe(2);
  });
});

it("identityBreakdown flags Ed's name variants and work email, not others", () => {
  const r = identityBreakdown("Ed Kubiak <w@example.test>\nedward_kubiak <x@example.test>\nJo Doe <j@example.test>\nJo Doe <j@example.test>\n");
  expect(r.find((i) => i.id.startsWith("Jo"))).toMatchObject({ commits: 2, ed: false });
  expect(r.filter((i) => i.ed)).toHaveLength(2);
  expect(r.every((i) => !i.id.includes("@"))).toBe(true);
});

it("identityBreakdown does not count lookalike surnames-in-names as Ed", () => {
  const r = identityBreakdown("Fred Kubiak <x@example.test>\nTed Kubiak <y@example.test>\nEd Kubiak <z@example.test>\n");
  expect(r.filter((i) => i.ed).map((i) => i.id)).toEqual(["Ed Kubiak"]);
});

describe("countLines", () => {
  it("counts newlines like wc -l", () => {
    expect(countLines(Buffer.from("a\nb\n"))).toBe(2);
    expect(countLines(Buffer.from("a\nb"))).toBe(1);
    expect(countLines(Buffer.alloc(0))).toBe(0);
  });
});

const blob = (sha, text) => Buffer.concat([Buffer.from(`${sha} blob ${Buffer.byteLength(text)}\n${text}\n`)]);

it("parseCatBatch splits blobs by size", () => {
  const m = parseCatBatch(Buffer.concat([blob("aa", "x\ny\n"), blob("bb", "z")]));
  expect(m.get("aa").toString()).toBe("x\ny\n");
  expect(m.get("bb").toString()).toBe("z");
});

const HEAD = "a".repeat(40);
const ASOF = "b".repeat(40);

/** Fake git: records calls, serves a tiny tree. */
function fakeGit(calls = []) {
  const files = {
    "src/a.js": ["aa", "l1\nl2\n"],
    "src/a.test.js": ["bb", 'describe("s", () => {\n it("x", f);\n test("y", f);\n});\n'],
    "src/s.css": ["cc", "p{}\n"],
    "ses/src/q.jsx": ["dd", "1\n2\n3\n"],
    "docs/n.md": ["ee", "ignored\n"],
  };
  const git = (args, input) => {
    calls.push(args);
    const [cmd] = args;
    if (cmd === "rev-parse" && args[1] === "--git-dir") return Buffer.from(".git\n");
    if (cmd === "rev-parse") return Buffer.from(`${HEAD}\n`);
    if (cmd === "log") return Buffer.from("Ed Kubiak <ed@example.test>\nEdward Kubiak <e@example.test>\nSomeone Else <s@example.test>\n");
    if (cmd === "rev-list" && args[1] === "-1") return Buffer.from(`${ASOF}\n`);
    if (cmd === "rev-list" && args.includes("-i")) return Buffer.from("7\n");
    if (cmd === "rev-list") return Buffer.from("9\n");
    if (cmd === "show") return Buffer.from("abc1234\t2026-09-16\n");
    if (cmd === "ls-tree")
      return Buffer.from(
        Object.entries(files)
          .map(([p, [sha]]) => `100644 blob ${sha}\t${p}`)
          .join("\n") + "\n",
      );
    if (cmd === "cat-file") {
      const want = input.toString().trim().split("\n");
      return Buffer.concat(
        Object.values(files)
          .filter(([sha]) => want.includes(sha))
          .map(([sha, text]) => blob(sha, text)),
      );
    }
    throw new Error(`unexpected git ${args.join(" ")}`);
  };
  return git;
}

describe("gather", () => {
  it("wires counts, as-of commit selection and author match", () => {
    const calls = [];
    const f = gather(fakeGit(calls), "origin/QA", "2026-09-16");
    expect(calls[0]).toEqual(["rev-parse", "--verify", "--quiet", "--end-of-options", "origin/QA^{commit}"]);
    expect(calls[1]).toEqual(["rev-list", "-1", "--before=2026-09-16T23:59", HEAD]);
    expect(calls.find((a) => a.includes("-i"))).toEqual([
      "rev-list",
      "--count",
      "-E",
      "-i",
      "--author=(^|<)(edward[ _]|ed )kubiak",
      ASOF,
    ]);
    // after resolution only the full sha reaches git, never the user-supplied ref
    for (const a of calls.slice(1)) expect(a.join(" ")).not.toContain("origin/QA");
    expect(f).toMatchObject({
      commitsTotal: 9,
      identities: [
        { id: "Ed Kubiak", commits: 1, ed: true },
        { id: "Edward Kubiak", commits: 1, ed: true },
        { id: "Someone Else", commits: 1, ed: false },
      ],
      commitsEd: 7,
      sourceFiles: 2,
      lines: 2 + 4 + 1,
      appLines: 2,
      testLines: 4,
      cssLines: 1,
      testFiles: 1,
      declaredTests: 2,
      sesFiles: 1,
      sesLines: 3,
      commit: "abc1234",
    });
  });
  it("without --as-of verifies the ref", () => {
    const calls = [];
    gather(fakeGit(calls), "origin/QA", null);
    expect(calls[0]).toEqual(["rev-parse", "--verify", "--quiet", "--end-of-options", "origin/QA^{commit}"]);
    expect(calls.some((a) => a.some((x) => String(x).startsWith("--before")))).toBe(false);
  });
});

describe("findClaims", () => {
  it("finds claim phrases regardless of the figures", () => {
    const hits = findClaims([
      {
        file: "a.js",
        text: [
          "x",
          "~7,000 lines of application code backed by ~9,000 lines of tests",
          "12 source files, 99 tests passing",
          "7 of its 9 commits as of May 2026",
          "6 of them are mine",
          "the suite stands at 99 tests across 4 files",
          "unrelated 5 widgets",
        ].join("\n"),
      },
    ]);
    expect(hits.map((h) => h.line)).toEqual([2, 3, 4, 5, 6]);
  });
});

describe("parseArgs", () => {
  it("parses flags and rejects bad input", () => {
    expect(parseArgs(["--ref", "x", "--as-of", "2026-08-30", "--json"])).toEqual({ ref: "x", asOf: "2026-08-30", json: true, help: false });
    expect(() => parseArgs(["--as-of", "yesterday"])).toThrow();
    expect(() => parseArgs(["--bogus"])).toThrow();
  });
  it("rejects option-like and unsafe refs", () => {
    for (const bad of ["-x", "--output=/tmp/x", "--all", "a..b", "a@{1}", "", "a b", "x/", "/abs", "r.lock"]) {
      expect(() => parseArgs(["--ref", bad]), bad).toThrow(/ref|value/);
    }
    for (const good of ["origin/QA", "f5370436", "v1.2.3", "feature/x-y_z"]) {
      expect(parseArgs(["--ref", good]).ref).toBe(good);
    }
  });
});

describe("main", () => {
  const run = (argv, env, makeRunner = () => fakeGit()) => {
    const out = [];
    const err = [];
    const code = main({ argv, env, makeRunner, claimFiles: [], out: (s) => out.push(s), err: (s) => err.push(s) });
    return { code, out: out.join("\n"), err: err.join("\n") };
  };
  it("requires CROSSCHECK_DIR and never invokes git without it", () => {
    let called = 0;
    const r = run([], {}, () => () => {
      called++;
      return Buffer.from("");
    });
    expect(r.code).toBe(1);
    expect(r.err).toContain("set CROSSCHECK_DIR");
    expect(called).toBe(0);
  });
  it("exits 1 with a message when the dir is missing", () => {
    const r = run([], { CROSSCHECK_DIR: "/nonexistent/crosscheck-xyz" });
    expect(r.code).toBe(1);
    expect(r.err).toContain("does not exist");
  });
  it("exits 1 when the dir is not a git repo", () => {
    const r = run([], { CROSSCHECK_DIR: "/tmp" }, () => () => {
      throw new Error("not a repo");
    });
    expect(r.code).toBe(1);
    expect(r.err).toContain("not a git repository");
  });
  it("prints a table with the fetch note", () => {
    const r = run([], { CROSSCHECK_DIR: "/tmp" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("never fetches");
    expect(r.out).toContain("source files");
    expect(r.out).toContain("application code");
  });
  it("never invokes git for a rejected ref", () => {
    let called = 0;
    for (const bad of ["-x", "--output=/tmp/x", "--all", "a..b"]) {
      const r = run(["--ref", bad, "--as-of", "2026-09-01"], { CROSSCHECK_DIR: "/tmp" }, () => () => {
        called++;
        return Buffer.from("");
      });
      expect(r.code).toBe(1);
      expect(r.err).toContain("invalid --ref");
    }
    expect(called).toBe(0);
  });
  it("exits 1 for an unknown ref", () => {
    const base = fakeGit();
    const r = run([], { CROSSCHECK_DIR: "/tmp" }, () => (args, input) => {
      if (args.includes("--end-of-options")) throw new Error("bad");
      return base(args, input);
    });
    expect(r.code).toBe(1);
    expect(r.err).toContain("unknown ref");
  });
  it("--help prints the archive recipe without touching git", () => {
    const r = run(["--help"], { CROSSCHECK_DIR: "/nonexistent" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("git -C <dir> archive origin/QA");
  });
  it("--json has the stable shape", () => {
    const r = run(["--json"], { CROSSCHECK_DIR: "/tmp" });
    const j = JSON.parse(r.out);
    expect(Object.keys(j).sort()).toEqual(
      [
        "asOf", "claims", "commit", "commitDate", "commitsEd", "commitsTotal", "declaredTests", "identities",
        "lines", "appLines", "testLines", "cssLines", "ref", "sesFiles", "sesLines", "sourceFiles", "testFiles",
      ].sort(),
    );
  });
});

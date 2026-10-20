// Probe planting for the weekly-refresh workflow_dispatch probes. Runs with NO node_modules.
//
//   node scripts/refresh-plant.mjs <quiet|feed-only|feed-plus-prose|facilities-drop> --repo <dir>
//
// Every js/json allowlisted feed is reset to HEAD first, so a probe is deterministic whatever the
// sync scripts fetched this week. Writes go through renderDataModule / renderJsonLike, which keep
// each file's exact style.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { parseDataModule, renderDataModule, jsonStyleOf, renderJsonLike } from "./lib/data-module.mjs";
import { isDirectInvocation } from "./lib/direct-invocation.mjs";
import { writeAtomic } from "./lib/write-atomic.mjs";
import { FEEDS } from "./refresh-gate.mjs";

export const KINDS = ["quiet", "feed-only", "feed-plus-prose", "facilities-drop"];

const DATA_FEEDS = FEEDS.filter((f) => f.kind !== "pdf");

// Discards any local edits to the feeds and README.md (for the CI runner / temp repos only), so a
// probe is deterministic and planting the same kind twice gives identical files.
function resetFeeds(repoDir) {
  execFileSync(
    "git",
    ["-C", repoDir, "checkout", "HEAD", "--", ...DATA_FEEDS.map((f) => f.path), "README.md"],
    { env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" }, stdio: ["ignore", "pipe", "pipe"] },
  );
}

/** Read a feed, let `mutate` edit it (js: the {NAME: value} map; json: the value), write it back. */
function edit(repoDir, relPath, mutate) {
  const abs = path.join(repoDir, relPath);
  const text = fs.readFileSync(abs, "utf8");
  if (relPath.endsWith(".js")) {
    const { segments, exports } = parseDataModule(text);
    const byName = Object.fromEntries(exports.map((e) => [e.name, e.value]));
    mutate(byName);
    writeAtomic(abs, renderDataModule(segments, exports.map((e) => ({ name: e.name, value: byName[e.name] }))));
  } else {
    const value = JSON.parse(text);
    mutate(value);
    writeAtomic(abs, renderJsonLike(value, jsonStyleOf(text)));
  }
}

function plantQuiet(repoDir) {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  edit(repoDir, "src/data/atlasPoints.js", (m) => { m.ATLAS_POINTS.asOf = today; });
  edit(repoDir, "public/atlas-points.json", (v) => { v.asOf = today; });
  edit(repoDir, "src/data/repoFacts.js", (m) => {
    m.REPO_FACTS.computeAtlas.treeAsOf = today;
    m.REPO_FACTS.computeAtlas.commitsAsOf = today;
  });
  edit(repoDir, "public/repo-facts.json", (v) => {
    v.computeAtlas.treeAsOf = today;
    v.computeAtlas.commitsAsOf = today;
  });
  edit(repoDir, "public/last-known-commits.json", (v) => { v.cachedAt = now; });
}

function bumpPatch(version) {
  const m = /^(v?\d+\.\d+\.)(\d+)(.*)$/.exec(version);
  if (!m) throw new Error(`cannot bump version "${version}"`);
  return `${m[1]}${Number(m[2]) + 1}${m[3]}`;
}

function plantFeedOnly(repoDir) {
  const bump = (tools) => {
    const first = Object.keys(tools)[0];
    if (!first) throw new Error("no tool versions to bump");
    tools[first] = bumpPatch(tools[first]);
  };
  edit(repoDir, "src/data/toolStats.js", (m) => bump(m.TOOL_VERSIONS));
  edit(repoDir, "public/tool-versions.json", bump);
}

function plantFeedPlusProse(repoDir) {
  plantFeedOnly(repoDir);
  const readme = path.join(repoDir, "README.md");
  const text = fs.readFileSync(readme, "utf8");
  writeAtomic(readme, `${text}${text.endsWith("\n") ? "" : "\n"}<!-- weekly-refresh probe -->\n`);
}

function plantFacilitiesDrop(repoDir) {
  edit(repoDir, "src/data/atlasStats.js", (m) => {
    m.ATLAS_STATS.facilities = Math.floor(m.ATLAS_STATS.facilities / 2);
  });
  edit(repoDir, "public/atlas-stats.json", (v) => { v.count = Math.floor(v.count / 2); });
}

const PLANTERS = {
  quiet: plantQuiet,
  "feed-only": plantFeedOnly,
  "feed-plus-prose": plantFeedPlusProse,
  "facilities-drop": plantFacilitiesDrop,
};

export function plant(kind, repoDir) {
  if (!Object.hasOwn(PLANTERS, kind)) throw new Error(`unknown probe kind "${kind}"`);
  resetFeeds(repoDir);
  PLANTERS[kind](repoDir);
}

export function main(argv) {
  const [kind, ...rest] = argv;
  const i = rest.indexOf("--repo");
  const repo = i !== -1 ? rest[i + 1] : null;
  if (!Object.hasOwn(PLANTERS, kind ?? "") || !repo) {
    process.stderr.write(`usage: refresh-plant.mjs <${KINDS.join("|")}> --repo <dir>\n`);
    return 2;
  }
  try {
    plant(kind, repo);
  } catch (err) {
    process.stderr.write(`refresh-plant: ${err.message}\n`);
    return 1;
  }
  process.stderr.write(`planted ${kind}\n`);
  return 0;
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

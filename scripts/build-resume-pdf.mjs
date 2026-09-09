#!/usr/bin/env node
/**
 * build-resume-pdf.mjs
 *
 * Puppeteer-based print pipeline:
 *   1. public/Edward_Kubiak_Resume.pdf    — resume from src/data/resume.js, in the
 *                                           shared print design (scripts/lib/print-design.mjs)
 *   2. public/CAST_Portfolio_OnePager.pdf — one-pager from castStats data
 *
 * Both PDFs are also copied to ~/Desktop/ for review.
 *
 * Usage:
 *   npm run build-pdfs
 *
 * Local-only (macOS dev machine). Never runs in CI.
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";

import puppeteer from "puppeteer";

import { CAST_STATS, CAST_DESKTOP_STATS } from "../src/data/castStats.js";
import { ATLAS_STATS } from "../src/data/atlasStats.js";
import { TOOL_VERSIONS } from "../src/data/toolStats.js";
import {
  summary,
  skills,
  experience,
  education,
  earlierCareer,
  aiPractice,
  tagline,
  contact,
  paperContract,
} from "../src/data/resume.js";
import { baseCss, PALETTE, MONO } from "./lib/print-design.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// RESUME_PDF_OUT_DIR lets a verification run write somewhere other than the tracked
// public/ copies — the real PDFs are regenerated deliberately, once, at the end.
const OUT_DIR = process.env.RESUME_PDF_OUT_DIR
  ? path.resolve(process.env.RESUME_PDF_OUT_DIR)
  : path.join(ROOT, "public");
const COPY_TO_DESKTOP = !process.env.RESUME_PDF_OUT_DIR;

const RESUME_PDF = path.join(OUT_DIR, "Edward_Kubiak_Resume.pdf");
const ONEPAGER_PDF = path.join(OUT_DIR, "CAST_Portfolio_OnePager.pdf");
const DESKTOP = os.homedir();

// Ed's designed resume (2026-09-09) is now the TEMPLATE this script renders, so
// generation is on again and the PDFs track the live stat feeds instead of
// freezing at export time. The design system lives in scripts/lib/print-design.mjs
// and is shared with the one-pager so the two cannot drift apart visually.

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Derive a short year or year-range from a period string for education lines.
// "January 2022 — July 2022" → "2022"; "August 2005 — June 2009" → "2005–2009"
// ---------------------------------------------------------------------------
function shortPeriod(period) {
  const years = period.match(/\d{4}/g) || [];
  if (years.length === 0) return period;
  if (years.length === 1 || years[0] === years[1]) return years[0];
  return years[0] + "–" + years[1];
}

// ---------------------------------------------------------------------------
// Flat single-column paper resume HTML — mirrors the docx layout exactly.
// No boxes, no fills, no color blocks beyond black-on-white + hairline rules.
// ---------------------------------------------------------------------------
function renderResumeHtml(
  summaryText,
  skillsMap,
  experienceList,
  educationList,
  earlier,
  practice,
  identity
) {
  const proRoles = experienceList.filter((e) => !e.company.startsWith("Open Source"));
  const ossRoles = experienceList.filter((e) => e.company.startsWith("Open Source"));

  // Emphasise the two proper nouns the summary is really about, without letting
  // the data carry markup.
  const emphasised = esc(summaryText)
    .replace(/CAST (v[\d.]+)/, "<strong>CAST $1</strong>")
    .replace(/Compute Atlas/, "<strong>Compute Atlas</strong>");

  const skillRows = Object.entries(skillsMap)
    .map(
      ([group, items]) =>
        `    <dt>${esc(group)}</dt>\n    <dd>${esc(items.join(", "))}</dd>`
    )
    .join("\n");

  const bullets = (entry) =>
    entry.highlights
      .map((h) => {
        // Bold the product names the eye should catch when scanning.
        const body = esc(h).replace(
          /\b(CrossCheck|SES-Wiki|Customization Web Store|E-Rate dashboard|misfire|attest|looptrip|Compute Atlas|CAST v[\d.]+)\b/g,
          "<strong>$1</strong>"
        );
        return `      <li>${body}</li>`;
      })
      .join("\n");

  const renderRole = (entry, { showOrg }) => {
    const org = showOrg
      ? ` <span class="org">&middot; ${esc(entry.company)} &mdash; ${esc(entry.location)}</span>`
      : "";
    const tech = entry.tech?.length
      ? `\n    <div class="tech">${esc(entry.tech.join("  \u00b7  "))}</div>`
      : "";
    return `  <div class="entry">
    <div class="entry-head">
      <span class="entry-title">${esc(entry.role)}${org}</span>
      <span class="entry-date">${esc(shortMonths(entry.period))}</span>
    </div>${tech}
    <ul class="bullets">
${bullets(entry)}
    </ul>
  </div>`;
  };

  const practiceItems = practice.items
    .map((item) => `      <li>${esc(item)}</li>`)
    .join("\n");

  const earlierLines = earlier.roles
    .map(
      (r) => `  <div class="line">
    <span><span class="entry-title">${esc(r.role)}</span> <span class="org">&middot; ${esc(r.company)} &mdash; ${esc(r.location)}</span></span>
    <span class="entry-date">${esc(shortMonths(r.period))}</span>
  </div>`
    )
    .join("\n");

  const eduLines = educationList
    .map(
      (e) => `  <div class="line">
    <span><span class="entry-title">${esc(e.degree)}</span> <span class="org">&mdash; ${esc(e.institution)}</span></span>
    <span class="entry-date">${shortPeriod(e.period)}</span>
  </div>`
    )
    .join("\n");

  const sep = '<span class="sep">/</span>';
  const metaLine = [
    esc(identity.contact.location),
    `<a href="mailto:${esc(identity.contact.email)}">${esc(identity.contact.email)}</a>`,
    `<a href="https://${esc(identity.contact.site)}">${esc(identity.contact.site)}</a>`,
    `<a href="https://${esc(identity.contact.github)}">${esc(identity.contact.github)}</a>`,
    `<a href="https://${esc(identity.contact.linkedin)}">${esc(identity.contact.linkedin)}</a>`,
  ].join(sep);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Edward Kubiak Resume</title>
  <style>
${baseCss({ bodyPt: paperContract.bodyPt, lineHeight: paperContract.lineHeight })}
    @page { margin: ${paperContract.margin}; size: ${paperContract.size}; }
  </style>
</head>
<body>

  <div class="name">Edward Kubiak</div>
  <div class="tagline">${esc(identity.tagline)}</div>
  <div class="meta">${metaLine}</div>
  <div class="masthead-rule"></div>

  <p>${emphasised}</p>

  <div class="section-head">Skills</div>
  <dl class="rows">
${skillRows}
  </dl>

  <div class="section-head">Professional Experience</div>
${proRoles.map((r) => renderRole(r, { showOrg: true })).join("\n")}

  <div class="section-head">Open Source &mdash; AI Developer Tooling</div>
${ossRoles.map((r) => renderRole(r, { showOrg: false })).join("\n")}

  <div class="section-head">AI-Assisted Engineering Practice</div>
  <div class="note">${esc(practice.note)}</div>
  <ul class="bullets">
${practiceItems}
  </ul>

  <div class="section-head">Earlier Career</div>
  <div class="note">${esc(earlier.note)}</div>
${earlierLines}

  <div class="section-head">Education</div>
${eduLines}

</body>
</html>`;
}

// "August 2022 — Present" → "Aug 2022 — Present"; keeps mono dates compact.
function shortMonths(period) {
  return period.replace(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g,
    (m) => m.slice(0, 3)
  );
}

// ---------------------------------------------------------------------------
// One-pager standalone HTML
// ---------------------------------------------------------------------------
function renderOnePagerHtml(stats, desktopStats, identity) {
  const statCells = [
    { label: "CAST version", value: stats.version },
    { label: "specialist agents", value: stats.agents },
    { label: "packages", value: stats.packages },
    { label: "slash commands", value: stats.commands },
    { label: "skills", value: stats.skills },
    { label: "tests", value: stats.tests.toLocaleString("en-US") },
    { label: "table record", value: stats.tables },
  ];

  const statBandHtml = statCells
    .map(
      (c) => `      <div class="stat-cell">
        <span class="stat-value">${esc(c.value)}</span>
        <span class="stat-label">${esc(c.label)}</span>
      </div>`
    )
    .join("\n");

  const projects = [
    [
      "CAST (Claude Agent Specialist Team)",
      `${stats.agents} specialist agents with hook-driven dispatch, model-aware routing, hook-enforced quality gates, and per-agent persistent memory. ${stats.version} "Make the Gates Tell the Truth": the ${stats.tables}-table SQLite execution record is searchable (cast ask), signed (cast ledger --verify), and predictive (cast predict), and every quality gate is mutation-tested against the defect it guards. ${stats.tests.toLocaleString("en-US")} tests, zero cloud dependencies.`,
    ],
    [
      `Compute Atlas ${ATLAS_STATS.version}`,
      `an open, source-cited census of U.S. grid-scale compute: ${ATLAS_STATS.facilities.toLocaleString("en-US")} facilities across ${ATLAS_STATS.states} states, ${ATLAS_STATS.operationalGw} GW operational and ~${ATLAS_STATS.plannedGw} GW planned — data centers, crypto mining, and the dedicated power generation built to feed them. Interactive MapLibre map, per-facility dossiers, open data plus a public JSON API, and an autonomous daily discovery pipeline that verifies its own sources. compute-atlas.com`,
    ],
    [
      "Cast Desktop",
      `native Tauri 2 + React 19 + Rust app; embedded Express 5 + SQLite backend, ${desktopStats.dashboardViews} dashboard views, real PTY terminal. Shipped ${desktopStats.version}.`,
    ],
    [
      `Claude Code Dashboard ${TOOL_VERSIONS["claude-code-dashboard"]}`,
      "React 19 + TypeScript + Express 5 + SSE observability UI; session cost tracking, per-agent scorecards, evals, reads ~/.claude directly, no telemetry.",
    ],
    [
      "Agent-reliability tools (zero-LLM, deterministic)",
      `misfire ${TOOL_VERSIONS.misfire}: trace-grounded CLAUDE.md adherence auditor; attest ${TOOL_VERSIONS.attest}: verifies a subagent's DONE against the real git delta; looptrip ${TOOL_VERSIONS.looptrip}: trips coordination loops at iteration 2, reproducing prevented duplicate-work spend from a committed fixture.`,
    ],
  ]
    .map(
      ([name, desc]) =>
        `    <div class="project"><span class="project-name">${esc(name)}</span><span class="project-desc"> &mdash; ${esc(desc)}</span></div>`
    )
    .join("\n");

  const sep = '<span class="sep">/</span>';
  const metaLine = [
    esc(identity.contact.location),
    esc(identity.contact.email),
    esc(identity.contact.site),
    esc(identity.contact.github),
    esc(identity.contact.linkedin),
  ].join(sep);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CAST Portfolio One-Pager</title>
  <style>
${baseCss({ bodyPt: 9, lineHeight: 1.3 })}
    @page { margin: ${paperContract.margin}; size: ${paperContract.size}; }

    /* One-pager-only additions on top of the shared system. */
    .name { font-size: 20pt; }
    .stat-band {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 0;
      border: 0.5pt solid ${PALETTE.rule};
      margin: 6px 0 9px;
    }
    .stat-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5px 2px;
      border-right: 0.5pt solid ${PALETTE.ruleSoft};
      text-align: center;
    }
    .stat-cell:last-child { border-right: none; }
    .stat-value {
      font-family: ${MONO};
      font-size: 11pt;
      font-weight: 400;
      color: ${PALETTE.accent};
      line-height: 1.1;
    }
    .stat-label {
      font-family: ${MONO};
      font-size: 6.2pt;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${PALETTE.mutedSoft};
      margin-top: 2px;
    }
    .section-tagline { color: ${PALETTE.muted}; margin-bottom: 2px; }
    .project { margin: 3px 0; }
    .project-name { font-weight: 600; color: ${PALETTE.ink}; }
    .project-desc { color: ${PALETTE.body}; }
    .two-col {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-top: 4px;
    }
    .footer {
      font-family: ${MONO};
      font-size: 6.8pt;
      color: ${PALETTE.mutedSoft};
      text-align: center;
      border-top: 0.5pt solid ${PALETTE.ruleSoft};
      margin-top: 10px;
      padding-top: 5px;
    }
  </style>
</head>
<body>

  <div class="name">Edward Kubiak</div>
  <div class="tagline">${esc(identity.tagline)} &middot; Creator of CAST</div>
  <div class="meta">${metaLine}</div>
  <div class="masthead-rule"></div>

  <div class="section-head">Portfolio &mdash; The CAST Ecosystem</div>
  <div class="section-tagline">An open-source, local-first multi-agent control plane for Claude Code &mdash; built, shipped, and maintained in public.</div>

  <div class="stat-band">
${statBandHtml}
  </div>

  <div class="section-head">What I Build</div>
  <div class="projects">
${projects}
  </div>

  <div class="two-col">
    <div>
      <div class="section-head">Building in Public</div>
      <p>${esc(identity.contact.github)} &mdash; open-source agent infrastructure, shipped in public under MIT.</p>
    </div>
    <div>
      <div class="section-head">Day Job &mdash; Production Track Record</div>
      <p>Applications Developer, META Solutions (2022&ndash;present). Hired out of a full-stack certificate to rebuild <strong>CrossCheck</strong> &mdash; the EMIS validation platform Ohio school districts use &mdash; replacing an end-of-life AngularJS 1.x application, and sole author of 1,706 of its 1,728 commits since. Also ship SES-Wiki, the public PowerSchool catalog, and the E-Rate dashboard front end across React, Flask, Express, PostgreSQL and MS SQL Server.</p>
    </div>
  </div>

  <div class="footer">${esc(identity.contact.github)} &middot; ${esc(identity.contact.email)} &middot; ${esc(identity.contact.site)}</div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Page-count gate.
//
// Nothing pinned the resume's length before this, so it could silently grow past
// the two-page budget on any content edit. Two independent counts are taken from
// the PDF's own bytes and must agree; anything ambiguous THROWS rather than
// passing, because a check that cannot determine its answer must not report
// success. A passing check while the budget is blown looks like: the assertion
// below never fires — which is exactly why maxPages is mutation-tested.
// ---------------------------------------------------------------------------
function pdfPageCount(bytes) {
  // page.pdf() resolves a Uint8Array on current Puppeteer, not a Buffer — calling
  // .toString("latin1") on it ignores the encoding and yields comma-joined digits,
  // which silently matches nothing. Normalize before reading.
  const raw = Buffer.from(bytes).toString("latin1");

  // Count 1: page objects in the document (/Type /Page, never /Type /Pages).
  const pageObjects = (raw.match(/\/Type\s*\/Page(?![s])/g) || []).length;

  // Count 2: the page-tree root's declared /Count. Take the largest declared
  // count, which is the root of the tree.
  const counts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const declared = counts.length ? Math.max(...counts) : null;

  if (!pageObjects) {
    throw new Error("page-count gate: found no page objects in the generated PDF");
  }
  if (declared === null) {
    throw new Error("page-count gate: PDF declares no page-tree /Count");
  }
  if (declared !== pageObjects) {
    throw new Error(
      `page-count gate: the two counts disagree (${pageObjects} page objects vs /Count ${declared}) — refusing to guess`
    );
  }
  return declared;
}

function assertPageBudget(buffer, label, maxPages) {
  const pages = pdfPageCount(buffer);
  const verdict = pages <= maxPages ? "within" : "OVER";
  console.log(`  ${label}: ${pages} page(s), budget ${maxPages} — ${verdict} budget`);
  if (pages > maxPages) {
    throw new Error(
      `${label} is ${pages} pages, over the ${maxPages}-page budget in paperContract. ` +
        `Trim content in src/data/resume.js or raise paperContract.maxPages deliberately.`
    );
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let browser = null;

  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log("Launching Puppeteer ...");
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Resume PDF — rendered in the shared print design
    console.log("Rendering resume PDF ...");
      const resumeHtml = renderResumeHtml(
        summary,
        skills,
        experience,
        education,
        earlierCareer,
        aiPractice,
        { tagline, contact }
      );
      await page.setContent(resumeHtml, { waitUntil: "domcontentloaded" });
      var resumeBuffer = await page.pdf({
        path: RESUME_PDF,
        format: paperContract.size,
        printBackground: true,
        margin: {
          top: paperContract.margin,
          right: paperContract.margin,
          bottom: paperContract.margin,
          left: paperContract.margin,
        },
      });
    console.log("Resume PDF written: " + RESUME_PDF);
    assertPageBudget(resumeBuffer, "Resume", paperContract.maxPages);

    // One-pager PDF
    console.log("Rendering one-pager PDF ...");
    const onePagerHtml = renderOnePagerHtml(CAST_STATS, CAST_DESKTOP_STATS, {
      tagline,
      contact,
    });
    await page.setContent(onePagerHtml, { waitUntil: "domcontentloaded" });
    const onePagerBuffer = await page.pdf({
      path: ONEPAGER_PDF,
      format: paperContract.size,
      printBackground: true,
    });
    console.log("One-pager PDF written: " + ONEPAGER_PDF);
    assertPageBudget(onePagerBuffer, "One-pager", 1);

    // Copy both to ~/Desktop
    if (!COPY_TO_DESKTOP) {
      console.log("\nRESUME_PDF_OUT_DIR set — wrote to " + OUT_DIR + ", skipped ~/Desktop copies.");
      console.log("\nDone.");
      return;
    }

    const desktopOnePager = path.join(DESKTOP, "Desktop", "CAST_Portfolio_OnePager.pdf");
    fs.copyFileSync(ONEPAGER_PDF, desktopOnePager);
    console.log("\nCopied to ~/Desktop:");
    console.log("  " + desktopOnePager);
    const desktopResume = path.join(DESKTOP, "Desktop", "Edward_Kubiak_Resume.pdf");
    fs.copyFileSync(RESUME_PDF, desktopResume);
    console.log("  " + desktopResume);

    console.log("\nDone.");
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
      console.log("Browser closed.");
    }
  }
}

// Only run when invoked as a script. Importing this module used to execute main()
// as a side effect, which overwrote the tracked public/*.pdf and the ~/Desktop
// copies of anything that imported it to reuse a renderer.
const INVOKED_DIRECTLY =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (INVOKED_DIRECTLY) {
  main().catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
  });
}

export { renderResumeHtml, renderOnePagerHtml, pdfPageCount, assertPageBudget };

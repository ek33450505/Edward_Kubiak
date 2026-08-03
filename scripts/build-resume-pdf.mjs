#!/usr/bin/env node
/**
 * build-resume-pdf.mjs
 *
 * Puppeteer-based print pipeline:
 *   1. public/Edward_Kubiak_Resume.pdf    — classic paper resume from src/data/resume.js data
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
import { summary, skills, experience, education } from "../src/data/resume.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const RESUME_PDF = path.join(ROOT, "public", "Edward_Kubiak_Resume.pdf");
const ONEPAGER_PDF = path.join(ROOT, "public", "CAST_Portfolio_OnePager.pdf");
const DESKTOP = os.homedir();

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
function renderResumeHtml(summaryText, skillsMap, experienceList, educationList) {
  const ossRoles = experienceList.filter((e) => e.company.startsWith("Open Source"));
  const proRoles = experienceList.filter((e) => !e.company.startsWith("Open Source"));

  // Skills: bullet list, one line per group
  const skillsItems = Object.entries(skillsMap)
    .map(
      ([group, items]) =>
        `<li><strong>${esc(group)}:</strong> ${esc(items.join(", "))}</li>`
    )
    .join("\n      ");

  // Open Source role-line + bullets (role + period only, no company/location)
  function renderOssRole(entry) {
    const bullets = entry.highlights
      .map((h) => `<li>${esc(h)}</li>`)
      .join("\n      ");
    return `<div class="role-line">
    <span class="role-left">${esc(entry.role)}</span>
    <span class="role-date">${esc(entry.period)}</span>
  </div>
  <ul>
      ${bullets}
  </ul>`;
  }

  // Professional role-line + bullets (role, company, location + period)
  function renderProRole(entry) {
    const bullets = entry.highlights
      .map((h) => `<li>${esc(h)}</li>`)
      .join("\n      ");
    return `<div class="role-line">
    <span class="role-left">${esc(entry.role)} &nbsp;&middot;&nbsp; ${esc(entry.company)} &mdash; ${esc(entry.location)}</span>
    <span class="role-date">${esc(entry.period)}</span>
  </div>
  <ul>
      ${bullets}
  </ul>`;
  }

  const ossHtml = ossRoles.map(renderOssRole).join("\n\n  ");
  const proHtml = proRoles.map(renderProRole).join("\n\n  ");

  // Education: "• degree — institution · short year"
  const eduItems = educationList
    .map(
      (entry) =>
        `<li>${esc(entry.degree)} &mdash; ${esc(entry.institution)} &middot; ${shortPeriod(entry.period)}</li>`
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Edward Kubiak Resume</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }

    /* Header */
    .resume-name {
      font-size: 22pt;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .resume-contact {
      font-size: 9pt;
      color: #333;
      margin-bottom: 12px;
    }

    /* Section headers: bold, sentence case, thin rule — no small-caps, no letter-spacing */
    .section-head {
      font-weight: bold;
      font-size: 10.5pt;
      color: #000;
      border-bottom: 0.75pt solid #666;
      padding-bottom: 1px;
      margin-top: 11px;
      margin-bottom: 4px;
    }

    /* Role line: role/company left, date right */
    .role-line {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 2px;
    }
    .role-left { font-weight: bold; }
    .role-date {
      font-size: 9.5pt;
      color: #333;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Bullet lists */
    ul {
      margin: 0;
      padding-left: 18px;
    }
    li {
      margin: 2px 0;
      page-break-inside: avoid;
    }

    @page { margin: 0.65in; size: Letter; }
  </style>
</head>
<body>

  <div class="resume-name">EDWARD KUBIAK</div>
  <div class="resume-contact">edward.kubiak.dev@gmail.com &nbsp;&bull;&nbsp; Columbus, Ohio &nbsp;&bull;&nbsp; github.com/ek33450505 &nbsp;&bull;&nbsp; edwardkubiak.com &nbsp;&bull;&nbsp; linkedin.com/in/edward-kubiak</div>

  <div class="section-head">Summary</div>
  <p>${esc(summaryText)}</p>

  <div class="section-head">Skills</div>
  <ul>
      ${skillsItems}
  </ul>

  <div class="section-head">Open Source &mdash; AI Developer Tooling</div>
  ${ossHtml}

  <div class="section-head">Professional Experience</div>
  ${proHtml}

  <div class="section-head">Education</div>
  <ul>
      ${eduItems}
  </ul>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// One-pager standalone HTML
// ---------------------------------------------------------------------------
function renderOnePagerHtml(stats, desktopStats) {
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
      (c) => `
    <div class="stat-cell">
      <span class="stat-value">${c.value}</span>
      <span class="stat-label">${c.label}</span>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CAST Portfolio &mdash; Edward Kubiak</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      padding: 0.45in 0.5in;
    }

    /* Header */
    .header { text-align: center; margin-bottom: 10px; }
    .header h1 {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #0f172a;
    }
    .header .subtitle {
      font-size: 9.5pt;
      color: #1e40af;
      font-weight: 600;
      margin-top: 2px;
    }
    .header .contact {
      font-size: 7.5pt;
      color: #475569;
      margin-top: 3px;
    }

    /* Divider */
    .divider { border: none; border-top: 1.5px solid #1e40af; margin: 8px 0; }
    .divider-light { border: none; border-top: 1px solid #e2e8f0; margin: 6px 0; }

    /* Section header */
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #1e40af;
      margin-bottom: 2px;
    }
    .section-tagline {
      font-style: italic;
      color: #475569;
      font-size: 7.5pt;
      margin-bottom: 6px;
    }

    /* Stat band */
    .stat-band {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }
    .stat-cell {
      flex: 1;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 4px 3px;
      text-align: center;
    }
    .stat-value {
      display: block;
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e40af;
    }
    .stat-label {
      display: block;
      font-size: 6pt;
      color: #64748b;
      margin-top: 1px;
    }

    /* What I build */
    .projects { margin-bottom: 8px; }
    .project { margin-bottom: 5px; }
    .project-name { font-weight: 700; color: #0f172a; }
    .project-desc { color: #334155; }

    /* Two-column bottom sections */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      margin-bottom: 6px;
    }
    .col-section p { color: #334155; }

    /* Footer */
    .footer {
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      margin-top: 6px;
    }

    @page { margin: 0; size: Letter; }
    @media print { body { padding: 0.45in 0.5in; } }
  </style>
</head>
<body>

  <div class="header">
    <h1>EDWARD KUBIAK</h1>
    <div class="subtitle">Full Stack Developer &amp; AI Systems Engineer &middot; Creator of CAST</div>
    <div class="contact">edward.kubiak.dev@gmail.com &middot; Columbus, Ohio &middot; github.com/ek33450505 &middot; edwardkubiak.com</div>
  </div>

  <hr class="divider" />

  <div class="section-title">Portfolio &mdash; The CAST Ecosystem</div>
  <div class="section-tagline">An open-source, local-first multi-agent control plane for Claude Code &mdash; built, shipped, and maintained in public.</div>

  <div class="stat-band">
    ${statBandHtml}
  </div>

  <div class="section-title">What I Build</div>
  <div class="projects">
    <div class="project">
      <span class="project-name">CAST (Claude Agent Specialist Team)</span><span class="project-desc"> &mdash; ${stats.agents} specialist agents with hook-driven dispatch, model-aware routing, hook-enforced quality gates, and per-agent persistent memory. v9 &ldquo;The Record That Acts&rdquo;: the ${stats.tables}-table SQLite execution record is searchable (cast ask), signed (cast ledger --verify), and predictive (cast predict). Zero cloud dependencies.</span>
    </div>
    <div class="project">
      <span class="project-name">Cast Desktop</span><span class="project-desc"> &mdash; native Tauri 2 + React 19 + Rust app; embedded Express 5 + SQLite backend, ${desktopStats.dashboardViews} dashboard views, real PTY terminal. Shipped ${desktopStats.version}.</span>
    </div>
    <div class="project">
      <span class="project-name">Claude Code Dashboard v2.5.0</span><span class="project-desc"> &mdash; React 19 + TypeScript + Express 5 + SSE observability UI; 8 pages, reads ~/.claude directly, no telemetry.</span>
    </div>
    <div class="project">
      <span class="project-name">Agent-reliability tools (zero-LLM, deterministic)</span><span class="project-desc"> &mdash; misfire v0.2.0: trace-grounded CLAUDE.md adherence auditor; attest v0.3.0: verifies a subagent&rsquo;s DONE against the real git delta (325 tests); looptrip v0.1.2: trips coordination loops at iteration 2 &mdash; reproduces $792.96 of prevented spend from a committed fixture.</span>
    </div>
  </div>

  <hr class="divider-light" />

  <div class="two-col">
    <div class="col-section">
      <div class="section-title">Writing &amp; Building in Public</div>
      <p>github.com/ek33450505 &mdash; open-source agent infrastructure, shipped in public.</p>
    </div>
    <div class="col-section">
      <div class="section-title">Day Job &mdash; Production Track Record</div>
      <p>Applications Developer, META Solutions (2022&ndash;present). Led CrossCheck&rsquo;s AngularJS&rarr;React migration &mdash; an EMIS validation platform serving 4,200+ users across 900+ Ohio school districts &mdash; and four more production apps (React, Flask, Express, PostgreSQL, MS SQL Server).</p>
    </div>
  </div>

  <div class="footer">github.com/ek33450505 &middot; edward.kubiak.dev@gmail.com</div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let browser = null;

  try {
    console.log("Launching Puppeteer ...");
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Resume PDF — classic paper template
    console.log("Rendering resume PDF ...");
    const resumeHtml = renderResumeHtml(summary, skills, experience, education);
    await page.setContent(resumeHtml, { waitUntil: "domcontentloaded" });
    await page.pdf({
      path: RESUME_PDF,
      format: "Letter",
      printBackground: true,
    });
    console.log("Resume PDF written: " + RESUME_PDF);

    // One-pager PDF
    console.log("Rendering one-pager PDF ...");
    const onePagerHtml = renderOnePagerHtml(CAST_STATS, CAST_DESKTOP_STATS);
    await page.setContent(onePagerHtml, { waitUntil: "domcontentloaded" });
    await page.pdf({
      path: ONEPAGER_PDF,
      format: "Letter",
      printBackground: true,
    });
    console.log("One-pager PDF written: " + ONEPAGER_PDF);

    // Copy both to ~/Desktop
    const desktopResume = path.join(DESKTOP, "Desktop", "Edward_Kubiak_Resume.pdf");
    const desktopOnePager = path.join(DESKTOP, "Desktop", "CAST_Portfolio_OnePager.pdf");
    fs.copyFileSync(RESUME_PDF, desktopResume);
    fs.copyFileSync(ONEPAGER_PDF, desktopOnePager);
    console.log("\nCopied to ~/Desktop:");
    console.log("  " + desktopResume);
    console.log("  " + desktopOnePager);

    console.log("\nDone.");
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
      console.log("Browser closed.");
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

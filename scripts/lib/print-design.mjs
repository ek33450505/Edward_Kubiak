/**
 * Shared print design system for the generated PDFs.
 *
 * Ed produced a designed resume on 2026-09-09 (IBM Plex, deep-teal accent,
 * hairline rules, mono dates) and asked for it to become the template so both
 * PDFs keep tracking the live stat feeds instead of freezing at export time.
 * This module is that design, expressed once and consumed by both documents so
 * they cannot drift apart visually.
 *
 * Values were measured from the designed PDF rather than eyeballed: the embedded
 * fonts are IBM Plex Sans (400/500/600) and IBM Plex Mono (400); the accent is
 * #0c5a4e; body text #191919; muted greys #595959–#898989; rules #bbbbbb/#d4d4d4.
 *
 * Fonts are inlined as base64 so rendering never depends on the host having them
 * or on file:// access from a setContent() page.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const PALETTE = {
  accent: "#0c5a4e",
  accentSoft: "#42786e",
  ink: "#191919",
  body: "#262626",
  muted: "#595959",
  mutedSoft: "#898989",
  rule: "#bbbbbb",
  ruleSoft: "#d4d4d4",
  paper: "#ffffff",
};

const FACES = [
  ["@fontsource/ibm-plex-sans", "ibm-plex-sans-latin-400-normal.woff2", "IBM Plex Sans", 400],
  ["@fontsource/ibm-plex-sans", "ibm-plex-sans-latin-500-normal.woff2", "IBM Plex Sans", 500],
  ["@fontsource/ibm-plex-sans", "ibm-plex-sans-latin-600-normal.woff2", "IBM Plex Sans", 600],
  ["@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff2", "IBM Plex Mono", 400],
];

/**
 * @font-face rules with the woff2 payloads inlined as data URIs.
 * Throws if a face is missing — a silently unstyled PDF is worse than a failed
 * build, and a missing devDependency should be loud.
 */
export function fontFaceCss() {
  return FACES.map(([pkg, file, family, weight]) => {
    const abs = path.join(ROOT, "node_modules", pkg, "files", file);
    if (!fs.existsSync(abs)) {
      throw new Error(
        `print-design: missing font file ${abs}\n` +
          `Run: npm install --save-dev @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono`
      );
    }
    const b64 = fs.readFileSync(abs).toString("base64");
    return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
  }).join("\n");
}

export const SANS = `"IBM Plex Sans", "Helvetica Neue", Helvetica, Arial, sans-serif`;
export const MONO = `"IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace`;

/**
 * The shared shell: fonts, reset, palette, and the primitives both documents use
 * — the masthead, the letterspaced section head over a rule, mono metadata, and
 * en-dash bullets.
 */
export function baseCss({ bodyPt, lineHeight }) {
  return `
${fontFaceCss()}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: ${SANS};
  font-size: ${bodyPt}pt;
  line-height: ${lineHeight};
  color: ${PALETTE.body};
  background: ${PALETTE.paper};
  -webkit-font-smoothing: antialiased;
}

/* ── Masthead ─────────────────────────────────────────────────────────────── */
.name {
  font-family: ${SANS};
  font-weight: 600;
  font-size: 23pt;
  letter-spacing: -0.015em;
  line-height: 1.05;
  color: ${PALETTE.ink};
}
.tagline {
  font-weight: 500;
  font-size: ${bodyPt}pt;
  color: ${PALETTE.accent};
  margin-top: 2px;
}
.meta {
  font-family: ${MONO};
  font-size: 6.9pt;
  color: ${PALETTE.muted};
  margin-top: 5px;
  letter-spacing: -0.005em;
}
.meta a { color: ${PALETTE.accent}; text-decoration: none; }
.meta .sep { color: ${PALETTE.ruleSoft}; padding: 0 4px; }
.masthead-rule {
  border-bottom: 1.4pt solid ${PALETTE.ink};
  margin: 7px 0 8px;
}

/* ── Section heads ────────────────────────────────────────────────────────── */
.section-head {
  font-weight: 600;
  font-size: 7.4pt;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: ${PALETTE.muted};
  border-bottom: 0.5pt solid ${PALETTE.rule};
  padding-bottom: 2px;
  margin: 9px 0 4px;
  page-break-after: avoid;
}

/* ── Entries ──────────────────────────────────────────────────────────────── */
.entry { page-break-inside: auto; }
.entry-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  page-break-after: avoid;
}
.entry-title { font-weight: 600; color: ${PALETTE.ink}; }
.entry-title .org { font-weight: 400; color: ${PALETTE.body}; }
.entry-date {
  font-family: ${MONO};
  font-size: 7.6pt;
  color: ${PALETTE.muted};
  white-space: nowrap;
  flex-shrink: 0;
}
.tech {
  font-family: ${MONO};
  font-size: 7.2pt;
  color: ${PALETTE.mutedSoft};
  margin: 2px 0 3px;
  line-height: 1.45;
}

/* ── Bullets: en-dash markers, breakable but never orphaned ───────────────── */
ul.bullets { list-style: none; margin: 0; padding: 0; }
ul.bullets > li {
  position: relative;
  padding-left: 11px;
  margin: 2px 0;
  orphans: 2;
  widows: 2;
}
ul.bullets > li::before {
  content: "\\2013";
  position: absolute;
  left: 0;
  color: ${PALETTE.mutedSoft};
}
strong { font-weight: 600; color: ${PALETTE.ink}; }
code {
  font-family: ${MONO};
  font-size: 0.92em;
  color: ${PALETTE.body};
}

/* ── Label / value rows (skills, education, earlier career) ───────────────── */
.rows { display: grid; grid-template-columns: 108px minmax(0, 1fr); gap: 2px 12px; }
.rows dt {
  font-weight: 600;
  font-size: 7.8pt;
  color: ${PALETTE.accent};
  line-height: 1.3;
  padding-top: 1px;
}
.rows dd { margin: 0; }
.line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin: 2px 0;
}
.note { color: ${PALETTE.muted}; margin-bottom: 4px; }
`;
}

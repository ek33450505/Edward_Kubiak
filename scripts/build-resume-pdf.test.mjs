/**
 * Contract tests for the generated PDFs' HTML.
 *
 * These render the documents without launching a browser — main() is guarded on
 * direct invocation, so importing the module has no side effects. They assert
 * the things that have actually gone wrong here: dropped contact details, claims
 * the truth pass retired, and stats going stale because they were hardcoded.
 */

import { describe, it, expect } from "vitest";
import {
  renderResumeHtml,
  renderOnePagerHtml,
} from "./build-resume-pdf.mjs";
import { baseCss, PALETTE, fontFaceCss } from "./lib/print-design.mjs";
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
import { CAST_STATS, CAST_DESKTOP_STATS } from "../src/data/castStats.js";
import { ATLAS_STATS } from "../src/data/atlasStats.js";

const identity = { tagline, contact };

/**
 * Visible text of a rendered document.
 *
 * Scanning raw HTML is unsafe here: the design inlines ~118 KB of base64 font
 * data, and short tokens match inside it by chance — "MUI" appears three times
 * in the woff2 payload alone. A claim check that trips on font bytes is worse
 * than no check. Strip the style block, drop tags, decode the entities the
 * renderer emits, and compare against text a reader would actually see.
 */
function textOf(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&rarr;/g, "→")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
const resumeHtml = () =>
  renderResumeHtml(summary, skills, experience, education, earlierCareer, aiPractice, identity);
const onePagerHtml = () =>
  renderOnePagerHtml(CAST_STATS, CAST_DESKTOP_STATS, identity);

describe("print design system", () => {
  it("inlines all four IBM Plex faces so rendering never depends on the host", () => {
    const css = fontFaceCss();
    expect((css.match(/@font-face/g) || [])).toHaveLength(4);
    expect(css).toContain('font-family:"IBM Plex Sans"');
    expect(css).toContain('font-family:"IBM Plex Mono"');
    expect(css).toContain("data:font/woff2;base64,");
  });

  it("carries the measured palette from the designed source", () => {
    expect(PALETTE.accent).toBe("#0c5a4e");
    expect(PALETTE.ink).toBe("#191919");
  });

  it("drives type size from the paper contract", () => {
    const css = baseCss({ bodyPt: 9.2, lineHeight: 1.22 });
    expect(css).toContain("font-size: 9.2pt");
    expect(css).toContain("line-height: 1.22");
  });

  it("lets bullets break across pages but never orphans a line", () => {
    const css = baseCss({ bodyPt: 9, lineHeight: 1.2 });
    expect(css).toMatch(/orphans: 2/);
    expect(css).toMatch(/widows: 2/);
    expect(css).not.toMatch(/ul\.bullets > li \{[^}]*page-break-inside: avoid/);
  });
});

describe("resume PDF — content", () => {
  it("renders every experience bullet in full", () => {
    const text = textOf(resumeHtml());
    experience.forEach((job) =>
      job.highlights.forEach((h) => {
        expect(text).toContain(h.replace(/\s+/g, " ").trim());
      })
    );
  });

  it("renders the pre-engineering roles and education", () => {
    const html = resumeHtml();
    earlierCareer.roles.forEach((r) => expect(html).toContain(r.company));
    education.forEach((e) => expect(html).toContain(e.institution));
  });

  it("carries EVERY contact field, LinkedIn included", () => {
    // The designed export silently dropped LinkedIn while /resume still showed
    // it. Iterating Object.values(contact) alone would NOT catch that — deleting
    // a key just shrinks the loop and the test still passes. Pin the required
    // keys first, then assert each one renders.
    const REQUIRED = ["location", "email", "site", "github", "linkedin"];
    expect(Object.keys(contact).sort()).toEqual([...REQUIRED].sort());

    const text = textOf(resumeHtml());
    REQUIRED.forEach((k) => {
      expect(contact[k], `contact.${k} is empty`).toBeTruthy();
      expect(text).toContain(contact[k]);
    });
  });

  it("uses the shared tagline", () => {
    expect(textOf(resumeHtml())).toContain(tagline);
  });

  it("interpolates live stats rather than freezing them", () => {
    const text = textOf(resumeHtml());
    expect(text).toContain(CAST_STATS.version);
    expect(text).toContain(ATLAS_STATS.facilities.toLocaleString("en-US"));
  });

  it("honours the paper contract", () => {
    const html = resumeHtml();
    expect(html).toContain(`margin: ${paperContract.margin}`);
    expect(html).toContain(`size: ${paperContract.size}`);
  });
});

describe("one-pager PDF — content", () => {
  it("shares the resume's masthead and contact, LinkedIn included", () => {
    const text = textOf(onePagerHtml());
    expect(text).toContain(tagline);
    Object.values(contact).forEach((v) => expect(text).toContain(v));
  });

  it("renders every stat cell from the live feed, not a frozen literal", () => {
    // Scoped to the stat band itself. Asserting the version appears "somewhere"
    // passes even when the cell is hardcoded, because the prose interpolates it
    // too — that weaker check survived a deliberately stale v9.5.3.
    const html = onePagerHtml();
    const band = html.slice(
      html.indexOf('<div class="stat-band">'),
      html.indexOf("</div>", html.lastIndexOf('class="stat-label"'))
    );
    const cells = [...band.matchAll(/<span class="stat-value">([^<]+)<\/span>/g)].map(
      (m) => m[1]
    );
    expect(cells).toEqual([
      CAST_STATS.version,
      String(CAST_STATS.agents),
      String(CAST_STATS.packages),
      String(CAST_STATS.commands),
      String(CAST_STATS.skills),
      CAST_STATS.tests.toLocaleString("en-US"),
      String(CAST_STATS.tables),
    ]);
  });

  it("does NOT repeat the retired CrossCheck migration claim", () => {
    // The truth pass corrected this everywhere except here: it was a ground-up
    // rewrite replacing an end-of-life app, not an AngularJS→React migration.
    const text = textOf(onePagerHtml());
    expect(text).not.toMatch(/AngularJS\s*(→|->)\s*React/);
    expect(text).not.toContain("migration");
    expect(text).toContain("end-of-life AngularJS");
  });
});

describe("both PDFs — claim discipline", () => {
  const both = () => textOf(resumeHtml()) + " " + textOf(onePagerHtml());

  it.each(["AG Grid", "MUI", "MongoDB", "launched publicly", "full test coverage", "go-to resource"])(
    "does not carry the retired claim %s",
    (needle) => expect(both()).not.toContain(needle)
  );

  it("does not publish the E-Rate unauthenticated write-path finding", () => {
    expect(both()).not.toContain("unauthenticated");
  });
});

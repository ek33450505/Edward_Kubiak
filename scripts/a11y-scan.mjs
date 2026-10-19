/* global document, getComputedStyle, window -- referenced only inside page.evaluate callbacks (browser context) */
// Automated accessibility conformance scan (WCAG 2.2 AA) over a built site.
//
//   node scripts/a11y-scan.mjs --dir /tmp/vite-verify [--routes /,/about] [--json out.json] [--no-keyboard] [--concurrency N]
//
// Serves --dir with Vite's preview server (SPA fallback serves index.html for deep
// links), then per route: axe at desktop + mobile, a 320px reflow check, and a
// keyboard walk, plus a content check (status 200, one h1, non-empty main, no error
// boundary, expected title) so a blank page cannot pass. `/` also gets command-palette
// and mobile-menu probes.
// Exit: 0 clean, 1 any failure, 2 harness error (couldn't serve or launch).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer";
import { preview } from "vite";

import {
  buildRoutes,
  checkPageContent,
  detectTrap,
  expectedContent,
  hasFocusIndicator,
  isFocusObscured,
  resolveRoutes,
  summarize,
  trailingSlashFailures,
  trailingSlashRoutes,
} from "./lib/a11y-checks.mjs";

const require = createRequire(import.meta.url);
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const REFLOW = { width: 320, height: 640 };
const SETTLE_MS = 500;
const DEFAULT_CONCURRENCY = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function parseArgs(argv) {
  const args = { dir: null, routes: null, json: null, keyboard: true, concurrency: DEFAULT_CONCURRENCY };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir") args.dir = argv[++i];
    else if (a === "--routes") {
      const value = argv[++i];
      if (value === undefined) throw new Error("--routes needs a comma-separated list");
      args.routes = value.split(",").map((r) => r.trim()).filter(Boolean);
      if (args.routes.length === 0) throw new Error("--routes selected 0 routes");
    }
    else if (a === "--json") args.json = argv[++i];
    else if (a === "--concurrency") args.concurrency = Number.parseInt(argv[++i], 10);
    else if (a === "--no-keyboard") args.keyboard = false;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be a positive integer");
  if (!args.dir) throw new Error("--dir <build dir> is required");
  return args;
}

// domcontentloaded + the h1 selector instead of networkidle0, which can hang on a third party.
// A missing h1 is reported by the content check, not thrown here.
async function load(page, base, route, viewport) {
  await page.setViewport(viewport);
  const response = await page.goto(new URL(route, base).href, { waitUntil: "domcontentloaded", timeout: 30000 });
  let h1Found = true;
  try {
    await page.waitForSelector("h1", { timeout: 15000 });
  } catch {
    h1Found = false;
  }
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await sleep(SETTLE_MS);
  return { status: response?.status() ?? 0, h1Found };
}

function snapshotContent() {
  return {
    h1s: [...document.querySelectorAll("h1")].map((h) => h.textContent ?? ""),
    mainTextLength: (document.querySelector("main")?.innerText ?? "").trim().length,
    errorBoundary: [...document.querySelectorAll('[role="alert"] h1')].some((h) =>
      /unexpected error|new version is available/i.test(h.textContent ?? ""),
    ),
    title: document.title,
  };
}

async function contentFailures(page, loaded, expected) {
  const snap = await page.evaluate(snapshotContent);
  return checkPageContent({ status: loaded.status, ...snap }, expected);
}

// Runs in the page before the walk: record every candidate's unfocused outline and
// box-shadow (the baseline a focus indicator must differ from) and count the real tab stops.
function prepareKeyboard() {
  const pick = (s) => ({ outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, boxShadow: s.boxShadow });
  const sel = 'a[href],button,input:not([type="hidden"]),select,textarea,summary,iframe,[tabindex],[contenteditable=""],[contenteditable="true"]';
  window.__a11yBase = new WeakMap();
  window.__a11yExpected = new WeakSet();
  const groups = new Set();
  let count = 0;
  for (const el of document.querySelectorAll(sel)) {
    const parent = el.parentElement?.closest("a,button") ?? null;
    window.__a11yBase.set(el, {
      self: pick(getComputedStyle(el)),
      parent: parent ? pick(getComputedStyle(parent)) : null,
    });
    if (el.disabled || el.tabIndex < 0 || el.closest('[aria-hidden="true"],[inert]')) continue;
    if (!el.checkVisibility({ checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) continue;
    window.__a11yExpected.add(el);
    // A radio group is a single tab stop, however many radios it holds.
    if (el.type === "radio" && el.name) {
      const key = `${el.form?.id ?? ""}\u0000${el.name}`;
      if (groups.has(key)) continue;
      groups.add(key);
    }
    count++;
  }
  return count;
}

async function runAxe(page, axeSource) {
  await page.evaluate(`${axeSource}\n;void 0;`);
  return page.evaluate(async (tags) => {
    const res = await window.axe.run(document, { runOnly: { type: "tag", values: tags } });
    return res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
      summary: (v.nodes[0]?.failureSummary ?? "").split("\n").slice(0, 2).join(" ").trim(),
    }));
  }, AXE_TAGS);
}

// Runs in the page: describe document.activeElement and evaluate its focus state.
function describeFocus() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { body: true };
  window.__a11yIds ??= new WeakMap();
  window.__a11yIdN ??= 0;
  if (!window.__a11yIds.has(el)) window.__a11yIds.set(el, `el${window.__a11yIdN++}`);

  const pick = (s) => ({ outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, boxShadow: s.boxShadow });
  const cs = getComputedStyle(el);
  const parent = el.parentElement?.closest("a,button") ?? null;
  const labelledBy = el.getAttribute("aria-labelledby");
  const name = (
    el.getAttribute("aria-label") ||
    (labelledBy && labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ")) ||
    el.innerText ||
    el.getAttribute("alt") ||
    el.getAttribute("title") ||
    el.value ||
    ""
  ).trim().replace(/\s+/g, " ").slice(0, 60);

  let hidden = null;
  let fading = false;
  if (el.closest('[aria-hidden="true"]')) hidden = "inside aria-hidden";
  for (let n = el; n; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (s.opacity !== "1") fading = true;
    if (hidden) continue;
    if (s.visibility === "hidden") hidden = "visibility hidden";
    else if (s.opacity === "0") hidden = "opacity 0";
  }

  const rect = el.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const pts = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + 2, rect.top + 2],
    [rect.right - 2, rect.top + 2],
    [rect.left + 2, rect.bottom - 2],
    [rect.right - 2, rect.bottom - 2],
  ];
  const hits = pts.map(([x, y]) => {
    if (x < 0 || y < 0 || x >= viewport.width || y >= viewport.height) return false;
    const top = document.elementsFromPoint(x, y)[0];
    return Boolean(top) && el.contains(top);
  });

  const href = el.getAttribute("href");
  return {
    id: window.__a11yIds.get(el),
    tag: el.tagName.toLowerCase(),
    name,
    href,
    hrefTargetExists: href?.startsWith("#") && href.length > 1 ? Boolean(document.getElementById(href.slice(1))) : null,
    styles: pick(cs),
    parentStyles: parent ? pick(getComputedStyle(parent)) : null,
    expectedStop: window.__a11yExpected?.has(el) ?? false,
    baseline: window.__a11yBase?.get(el)?.self ?? null,
    parentBaseline: window.__a11yBase?.get(el)?.parent ?? null,
    hidden,
    fading,
    rect: { width: rect.width, height: rect.height, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    viewport,
    hits,
  };
}

// The site sets `scroll-behavior: smooth`; the walk turns that off so the focus
// scroll is instant. Scroll-reveal transitions can still be mid-flight right after a
// Tab, so measure immediately and only re-measure (every 50 ms, up to 1 s) when the
// reading would fail or the element is still fading in.
const RETRY_MS = 50;
const RETRY_MAX_MS = 1000;
async function measureFocus(page) {
  let s = await page.evaluate(describeFocus);
  const started = Date.now();
  while (!s.body && needsRetry(s) && Date.now() - started < RETRY_MAX_MS) {
    await sleep(RETRY_MS);
    s = await page.evaluate(describeFocus);
  }
  return s;
}

const needsRetry = (s) =>
  s.fading || s.hidden === "opacity 0" || isFocusObscured({ rect: s.rect, viewport: s.viewport, hits: s.hits }) !== null;

const label = (s) => `<${s.tag}> "${s.name}"${s.href ? ` href=${s.href}` : ""}`;

async function keyboardWalk(page) {
  const failures = [];
  const stops = [];
  // CSSOM write (not a <style> tag), so the page's CSP cannot block it.
  await page.evaluate(() => document.documentElement.style.setProperty("scroll-behavior", "auto", "important"));
  const expectedCount = await page.evaluate(prepareKeyboard);
  const limit = Math.min(80, expectedCount + 5);
  const sequence = [];
  const flagged = new Set();
  const fail = (kind, s, detail) => {
    const key = `${kind}:${s.id}`;
    if (flagged.has(key)) return;
    flagged.add(key);
    failures.push({ kind, detail: `${label(s)}: ${detail}` });
  };

  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const s = await measureFocus(page);
    if (s.body) {
      sequence.push("body");
      if (i === 0) failures.push({ kind: "first-stop", detail: "first Tab did not land on any element" });
      continue;
    }
    sequence.push(s.id);
    stops.push(label(s));

    if (i === 0) {
      if (!/skip/i.test(s.name)) {
        failures.push({ kind: "first-stop", detail: `first Tab landed on ${label(s)}, not a skip link` });
      } else if (!s.href?.startsWith("#") || s.hrefTargetExists !== true) {
        failures.push({ kind: "first-stop", detail: `skip link ${label(s)} target does not exist` });
      }
    }
    const ancestor = s.parentStyles ? { focused: s.parentStyles, baseline: s.parentBaseline } : null;
    if (!s.expectedStop) fail("unexpected-stop", s, "focused element was not among the pre-counted tab stops (if focus reveals it, extend the count selector)");
    if (!hasFocusIndicator(s.styles, s.baseline, ancestor)) {
      fail("no-focus-indicator", s, `outline ${s.styles.outlineStyle} ${s.styles.outlineWidth} ${s.styles.outlineColor}, box-shadow ${s.styles.boxShadow} (unfocused: ${s.baseline?.outlineStyle ?? "?"}/${s.baseline?.boxShadow ?? "?"})`);
    }
    const obscured = isFocusObscured({ rect: s.rect, viewport: s.viewport, hits: s.hits });
    if (obscured) fail("focus-obscured", s, obscured);
    if (s.hidden) fail("focus-hidden", s, s.hidden);
  }

  const trap = detectTrap(sequence, expectedCount);
  if (trap.trapped) failures.push({ kind: "keyboard-trap", detail: trap.reason });
  return { failures, stops: stops.length };
}

const activeInside = (page, selector) =>
  page.evaluate((sel) => Boolean(document.activeElement?.closest(sel)), selector);

async function probeCommandPalette(page, base) {
  const failures = [];
  await load(page, base, "/", DESKTOP);
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.down(mod);
  await page.keyboard.press("k");
  await page.keyboard.up(mod);
  try {
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
  } catch {
    return ["Mod+K did not open a role=dialog"];
  }
  await sleep(SETTLE_MS);
  if (!(await activeInside(page, '[role="dialog"]'))) failures.push("focus is not inside the dialog after opening");
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    if (!(await activeInside(page, '[role="dialog"]'))) {
      failures.push(`focus escaped the dialog on Tab ${i + 1}`);
      break;
    }
  }
  await page.keyboard.press("Escape");
  await sleep(SETTLE_MS);
  if (await page.$('[role="dialog"]')) failures.push("Escape did not close the dialog");
  const restored = await page.evaluate(() => {
    const a = document.activeElement;
    return a === document.body || a === document.documentElement || (a !== null && !a.closest('[role="dialog"]'));
  });
  if (!restored) failures.push("focus was not returned out of the closed dialog");
  return failures;
}

// Pages serves /about as /about/ after a 301, so the slashed form is what visitors see.
async function probeTrailingSlash(page, base, routeMeta) {
  const { routes, failures } = trailingSlashRoutes(routeMeta);
  for (const route of routes) {
    const { h1Found } = await load(page, base, `${route}/`, DESKTOP);
    const snapshot = await page.evaluate((r) => {
      const links = [...document.querySelectorAll('nav[aria-label="Primary"] a')];
      const path = (a) => new URL(a.href).pathname;
      return {
        title: document.title,
        navLinkCount: links.length,
        currentLinks: links.filter((a) => a.getAttribute("aria-current") === "page").map(path),
        navHasRoute: links.some((a) => path(a) === r),
      };
    }, route);
    failures.push(...trailingSlashFailures({ ...snapshot, h1Found }, route, routeMeta[route].title));
  }
  return failures;
}

async function probeMobileMenu(page, base) {
  const failures = [];
  await load(page, base, "/", MOBILE);
  const toggle = 'nav[aria-label="Primary"] button[aria-expanded]';
  if (!(await page.$(toggle))) return ["menu toggle with aria-expanded not found"];
  const expanded = () => page.$eval(toggle, (b) => b.getAttribute("aria-expanded"));
  const menuOpen = async () => Boolean(await page.$("#mobile-menu"));
  const open = async () => {
    await page.focus(toggle);
    await page.keyboard.press("Enter");
    await sleep(SETTLE_MS);
  };

  if ((await expanded()) !== "false") failures.push("toggle should start aria-expanded=false");
  await open();
  if ((await expanded()) !== "true" || !(await menuOpen())) failures.push("activating the toggle did not open the menu");
  let reached = false;
  for (let i = 0; i < 4 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await activeInside(page, "#mobile-menu");
  }
  if (!reached) failures.push("Tab from the toggle never reached a link in the open menu");

  await page.keyboard.press("Escape");
  await sleep(SETTLE_MS);
  if ((await expanded()) !== "false" || (await menuOpen())) failures.push("Escape did not close the menu");

  await open();
  if (!(await menuOpen())) failures.push("menu failed to reopen");
  await page.focus(toggle);
  await page.keyboard.press("Enter");
  await sleep(SETTLE_MS);
  if ((await expanded()) !== "false" || (await menuOpen())) failures.push("activating the toggle again did not close the menu");
  return failures;
}

async function scanRoute(browser, base, route, axeSource, expected, { keyboard }) {
  // Own browser context per route: isolated focus/viewport state while routes run concurrently.
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  try {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    // Without this the second load of a URL revalidates and the response status reads 304, not 200.
    await page.setCacheEnabled(false);
    const out = { route, content: {}, axe: { desktop: [], mobile: [] }, reflow: null, keyboard: null };

    const desktop = await load(page, base, route, DESKTOP);
    out.content.desktop = await contentFailures(page, desktop, expected);
    if (!desktop.h1Found) {
      // Nothing rendered: axe/reflow/keyboard on a blank page would only be noise (or false green).
      out.content.mobile = [];
      return out;
    }
    out.axe.desktop = await runAxe(page, axeSource);
    const mobile = await load(page, base, route, MOBILE);
    out.content.mobile = await contentFailures(page, mobile, expected);
    out.axe.mobile = await runAxe(page, axeSource);

    await load(page, base, route, REFLOW);
    out.reflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      fail: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));

    if (keyboard) {
      await load(page, base, route, DESKTOP);
      out.keyboard = await keyboardWalk(page);
    }
    return out;
  } finally {
    await context.close().catch(() => {});
  }
}

// Run `worker(item)` over items with at most `limit` in flight; results keep input order.
async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i]);
    }
  });
  await Promise.all(lanes);
  return out;
}

function report(results, summary) {
  console.table(
    results.routes.map((r) => ({
      route: r.route,
      content: (r.content.desktop?.length ?? 0) + (r.content.mobile?.length ?? 0),
      "axe desktop": r.axe.desktop.length,
      "axe mobile": r.axe.mobile.length,
      reflow: !r.reflow ? "skipped" : r.reflow.fail ? `FAIL (${r.reflow.scrollWidth}px)` : "ok",
      keyboard: r.keyboard ? r.keyboard.failures.length : "skipped",
    })),
  );
  console.log(`Scanned ${results.routes.length} routes`);
  if (results.probes.length === 0) console.log("probes skipped (route / not in --routes)");
  for (const p of results.probes) console.log(`probe ${p.name}: ${p.failures.length ? "FAIL" : "ok"}`);
  if (summary.failures.length === 0) {
    console.log("\nNo accessibility failures.");
    return;
  }
  console.log(`\n${summary.failures.length} failure(s):`);
  for (const f of summary.failures) console.log(`  ${f.route}  [${f.check}] ${f.id}: ${f.detail}`);
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    return 2;
  }
  const dir = path.resolve(args.dir);
  const results = { dir, routes: [], probes: [] };
  let server = null;
  let browser = null;
  try {
    if (!fs.existsSync(path.join(dir, "index.html"))) throw new Error(`no index.html in ${dir}`);
    const { ROUTE_META } = await import("../src/data/routeMeta.js");
    const projects = (await import("../src/data/projects.js")).default;
    const routes = resolveRoutes(args.routes, buildRoutes(ROUTE_META, projects));
    const expectedByRoute = new Map(routes.map((r) => [r, expectedContent(r, ROUTE_META, projects)]));
    const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

    server = await preview({
      configFile: false,
      root: process.cwd(),
      preview: { port: 0, host: "127.0.0.1" },
      build: { outDir: dir },
    });
    const base = server.resolvedUrls.local[0];
    browser = await puppeteer.launch({
      headless: true,
      args: process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
    });

    results.routes = await pool(routes, args.concurrency, (route) =>
      scanRoute(browser, base, route, axeSource, expectedByRoute.get(route), { keyboard: args.keyboard }),
    );
    if (routes.includes("/")) {
      const page = await browser.newPage();
      try {
        await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
        results.probes.push({ name: "command-palette", failures: await probeCommandPalette(page, base) });
        results.probes.push({ name: "mobile-menu", failures: await probeMobileMenu(page, base) });
        results.probes.push({ name: "trailing-slash", failures: await probeTrailingSlash(page, base, ROUTE_META) });
      } finally {
        await page.close();
      }
    }
  } catch (err) {
    results.harnessError = String(err?.stack ?? err);
    console.error(`Harness error: ${results.harnessError}`);
  } finally {
    await browser?.close().catch(() => {});
    await server?.close().catch(() => {});
  }

  const summary = summarize(results);
  results.summary = summary;
  if (args.json) {
    fs.mkdirSync(path.dirname(path.resolve(args.json)), { recursive: true });
    fs.writeFileSync(args.json, JSON.stringify(results, null, 2));
  }
  if (!results.harnessError) report(results, summary);
  return summary.exitCode;
}

/** True when argv1 and moduleUrl resolve to the same real file (symlink-safe); a missing argv1 is "not direct". */
export function isDirectInvocation(argv1, moduleUrl) {
  try {
    return fs.realpathSync(argv1) === fs.realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 2;
    });
}

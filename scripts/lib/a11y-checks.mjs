// Pure decision helpers for scripts/a11y-scan.mjs. No browser, no I/O — everything
// here is unit-tested in a11y-checks.test.mjs.

export const NOT_FOUND_ROUTE = "/no-such-page";

/** Every ROUTE_META key, every /projects/<slug>, plus one 404 path. De-duplicated, order kept. */
export function buildRoutes(routeMeta, projects) {
  const routes = [
    ...Object.keys(routeMeta),
    ...projects.map((p) => `/projects/${p.slug}`),
    NOT_FOUND_ROUTE,
  ];
  return [...new Set(routes)];
}

/** Validate a --routes selection against the known list; an empty or unknown selection is a harness error. */
export function resolveRoutes(requested, known) {
  if (requested === null) return known;
  if (requested.length === 0) throw new Error("--routes selected 0 routes");
  const unknown = requested.filter((r) => !known.includes(r));
  if (unknown.length > 0) throw new Error(`--routes names unknown route(s): ${unknown.join(", ")}`);
  return requested;
}

/** What a rendered route must look like: exact title, or a substring, plus an h1 substring for the 404. */
export function expectedContent(route, routeMeta, projects) {
  if (route === NOT_FOUND_ROUTE) {
    return { title: "Edward Kubiak", h1Includes: "Page not found" };
  }
  if (Object.hasOwn(routeMeta, route)) return { title: routeMeta[route].title };
  const project = projects.find((p) => `/projects/${p.slug}` === route);
  if (project) return { titleIncludes: project.title };
  return {};
}

/**
 * Content sanity for a loaded route. snapshot: { status, h1s: string[], mainTextLength,
 * errorBoundary, title }. Returns a list of failure messages (empty = healthy), so a
 * blank, unhydrated or error-boundary page cannot pass axe by being empty.
 */
export function checkPageContent(snapshot, expected) {
  const out = [];
  if (snapshot.status !== 200) out.push(`HTTP status ${snapshot.status}, expected 200`);
  if (snapshot.h1s.length !== 1) {
    out.push(`expected exactly one <h1>, found ${snapshot.h1s.length}`);
  } else if (snapshot.h1s[0].trim() === "") {
    out.push("<h1> is empty");
  } else if (expected.h1Includes && !snapshot.h1s[0].includes(expected.h1Includes)) {
    out.push(`<h1> "${snapshot.h1s[0]}" does not contain "${expected.h1Includes}"`);
  }
  if (!(snapshot.mainTextLength > 0)) out.push("<main> is empty");
  if (snapshot.errorBoundary) out.push("error boundary rendered");
  const expectedTitle = expected.title ?? expected.titleIncludes ?? "";
  if (expectedTitle === "") {
    out.push("no expected title for route");
  } else if (expected.title !== undefined && snapshot.title !== expected.title) {
    out.push(`title "${snapshot.title}" !== "${expected.title}"`);
  } else if (expected.title === undefined && !snapshot.title.includes(expected.titleIncludes)) {
    out.push(`title "${snapshot.title}" does not contain "${expected.titleIncludes}"`);
  }
  return out;
}

// --- focus indicator --------------------------------------------------------

// Alpha of a computed CSS colour: rgb()/rgba()/hsl() comma form, or the modern
// "fn(... / a)" form (color(), oklab(), oklch(), lab(), lch()). Unknown shapes count as opaque.
function colorAlpha(color) {
  const c = color.trim().toLowerCase();
  if (c === "transparent") return 0;
  const body = c.match(/^[a-z-]+\((.*)\)$/s)?.[1];
  if (body === undefined) return 1;
  const slash = body.split("/");
  let raw = null;
  if (slash.length === 2) raw = slash[1];
  else if (body.includes(",") && body.split(",").length === 4) raw = body.split(",")[3];
  if (raw === null) return 1;
  raw = raw.trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 1;
  return raw.endsWith("%") ? n / 100 : n;
}

function splitTopLevel(str) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of str) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

// True when some layer of a computed box-shadow can be seen: non-transparent colour
// and a non-zero blur or spread (a pure offset-only shadow is decorative depth).
function shadowVisible(boxShadow) {
  if (!boxShadow || boxShadow === "none") return false;
  return splitTopLevel(boxShadow).some((layer) => {
    const color = layer.match(/[a-z-]+\([^)]*\)|transparent/i)?.[0] ?? "";
    const rest = layer.replace(color, "");
    const [, , blur = 0, spread = 0] = (rest.match(/-?[\d.]+(?=px)/g) ?? []).map(Number);
    return colorAlpha(color) > 0 && (blur !== 0 || spread !== 0);
  });
}

function outlineVisible(s) {
  const width = parseFloat(s.outlineWidth);
  return s.outlineStyle !== "none" && Number.isFinite(width) && width > 0 && colorAlpha(s.outlineColor ?? "") > 0;
}

const sameStyle = (a, b) =>
  a.outlineStyle === b.outlineStyle &&
  a.outlineWidth === b.outlineWidth &&
  a.outlineColor === b.outlineColor &&
  a.boxShadow === b.boxShadow;

const changedAndVisible = (focused, baseline) =>
  Boolean(focused) &&
  !sameStyle(focused, baseline ?? { outlineStyle: "none", outlineWidth: "0px", outlineColor: "", boxShadow: "none" }) &&
  (outlineVisible(focused) || shadowVisible(focused.boxShadow));

/**
 * Focus-indicator decision. `focused` / `baseline` are the element's computed
 * { outlineStyle, outlineWidth, outlineColor, boxShadow } while focused and while not.
 * An indicator counts only if the focused state DIFFERS from the baseline AND is
 * visible. `ancestor` is { focused, baseline } for the closest parent a/button (or null),
 * accepted when the element has none of its own.
 */
export function hasFocusIndicator(focused, baseline, ancestor = null) {
  if (changedAndVisible(focused, baseline)) return true;
  return ancestor ? changedAndVisible(ancestor.focused, ancestor.baseline) : false;
}

// --- keyboard trap -----------------------------------------------------------

/**
 * Keyboard-trap detection over the focused-element ids, one per Tab ("body" = no element).
 * `expectedCount` is the page's real number of tab stops, counted before the walk.
 * - more distinct stops reached than `expectedCount` (including expectedCount 0) is a failure:
 *   the count undershot, so the wrap rule below cannot be trusted;
 * - the same id on 3 consecutive Tabs is a trap;
 * - a return to the first stop is a legitimate wrap only if the distinct stops reached
 *   before it cover >= `coverage` of expectedCount, otherwise it is a cycle (trap);
 * - 10 consecutive Tabs with no new stop before any wrap is a trap.
 *
 * Known limit: if the pre-walk count undercounts the page's real tab stops (N) and a trap
 * cycles over K distinct counted stops with 0.9·N <= K <= N, the cycle is indistinguishable
 * from a legitimate wrap. Closing it needs an independent count (e.g. the accessibility
 * tree), which would risk false traps. A page whose first Tab lands on body is reported
 * separately by the first-stop check in a11y-scan.mjs.
 */
export function detectTrap(sequence, expectedCount, { repeat = 3, window: win = 10, coverage = 0.9 } = {}) {
  const reached = new Set(sequence.filter((id) => id !== "body"));
  // Fail closed on an undercount: focus cannot reach more distinct stops than were counted.
  if (reached.size > 0 && reached.size > expectedCount) {
    return {
      trapped: true,
      reason: `tab-stop count is ${expectedCount} but focus reached ${reached.size} distinct stops`,
    };
  }
  let run = 1;
  for (let i = 1; i < sequence.length; i++) {
    run = sequence[i] === sequence[i - 1] ? run + 1 : 1;
    if (run >= repeat) {
      return { trapped: true, reason: `focus stuck on ${sequence[i]} for ${run} consecutive Tabs` };
    }
  }
  const seen = new Set();
  let sinceNew = 0;
  for (let i = 0; i < sequence.length; i++) {
    const id = sequence[i];
    if (i > 0 && id !== "body" && id === sequence[0]) {
      if (seen.size >= coverage * expectedCount) return { trapped: false, reason: null };
      return {
        trapped: true,
        reason: `focus cycled back to the first stop after ${seen.size} of ${expectedCount} tab stops`,
      };
    }
    if (id === "body" || seen.has(id)) {
      if (++sinceNew >= win) {
        return { trapped: true, reason: `no new focus stop over ${win} Tabs before wrapping` };
      }
    } else {
      seen.add(id);
      sinceNew = 0;
    }
  }
  return { trapped: false, reason: null };
}

/**
 * WCAG 2.4.11 (minimum): focus is failing when the element has no area, is wholly
 * outside the viewport, or none of the sampled points hit the element itself.
 * `hits` is one boolean per sampled point.
 */
export function isFocusObscured({ rect, viewport, hits }) {
  if (!(rect.width > 0 && rect.height > 0)) return "zero-area";
  if (
    rect.right <= 0 || rect.bottom <= 0 ||
    rect.left >= viewport.width || rect.top >= viewport.height
  ) {
    return "outside-viewport";
  }
  if (!hits.some(Boolean)) return "covered";
  return null;
}

/**
 * Flatten scan results into failures.
 * results: { harnessError?, routes: [{ route, content, axe, reflow, keyboard }], probes: [{ name, failures }] }
 */
export function summarize(results) {
  if (results.harnessError) {
    return { failures: [], exitCode: 2 };
  }
  const failures = [];
  for (const r of results.routes ?? []) {
    for (const vp of ["desktop", "mobile"]) {
      for (const msg of r.content?.[vp] ?? []) {
        failures.push({ route: r.route, check: `content-${vp}`, id: "content", detail: msg });
      }
      for (const v of r.axe?.[vp] ?? []) {
        failures.push({
          route: r.route,
          check: `axe-${vp}`,
          id: v.id,
          detail: `${v.impact ?? "n/a"}, ${v.nodes} node(s): ${(v.targets ?? []).join(" | ")}`,
        });
      }
    }
    if (r.reflow?.fail) {
      failures.push({
        route: r.route,
        check: "reflow",
        id: "reflow-320",
        detail: `scrollWidth ${r.reflow.scrollWidth} > innerWidth ${r.reflow.innerWidth}`,
      });
    }
    for (const k of r.keyboard?.failures ?? []) {
      failures.push({ route: r.route, check: "keyboard", id: k.kind, detail: k.detail });
    }
  }
  for (const p of results.probes ?? []) {
    for (const f of p.failures ?? []) {
      failures.push({ route: "/", check: "probe", id: p.name, detail: f });
    }
  }
  return { failures, exitCode: failures.length > 0 ? 1 : 0 };
}

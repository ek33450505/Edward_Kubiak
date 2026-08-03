# Next Session — Portfolio SEO fixes (continuation)

**Started:** 2026-08-03 · **Base commit at start:** `5c80fc8` · **Branch:** `main`
**Driving doc:** `docs/seo-audit-2026-08-03.md` (full prioritized audit)

> Continuity checkpoint for the SEO quick-win implementation. Update the **Status** and
> **Checkpoint log** as units land so any session can resume cleanly.

## Working agreement
- Work the audit's **P0/P1 quick wins** as scoped `frontend-writer` units.
- Each code unit: `frontend-writer` → mandatory `code-reviewer` gate → `commit` agent. Commit between units.
- Do NOT run `npm run build` in-session (prebuild churns generated files) — verify with
  `npx vite build --outDir /tmp/vite-verify`. Tests are not a per-merge gate (see CLAUDE.md policy).
- Push is manual/CI — deploys auto-publish on push to `main` + daily cron (`deploy.yml`).

## Status: H2 SHIPPED — quick-win wave (#26) merged; per-project summaries (H2) in PR

**#26 (quick-win wave) MERGED** to `main` `7e86094` (2026-08-03). **H2 (per-project summaries)** committed
`6edf735` on `feature/seo-project-summaries` — 19 ≤160-char `summary` fields + ProjectDetail `summary ?? description`
fallback (code-reviewer PASS, build + 75 tests green). Deploys auto-publish on merge to `main` + daily cron.

### ▶ KICKOFF BLOCK (paste into a fresh session)
```
Resume Edward_Kubiak SEO work. Read docs/next-session.md + docs/seo-audit-2026-08-03.md first.

PRE-FLIGHT:
1. Check the H2 PR (feature/seo-project-summaries) — merged? If yes: git checkout main &&
   git pull --ff-only, delete the merged branch. If CI still pending, watch it.
2. Confirm clean tree.

NEXT: quick-win units are done. The remaining audit backlog is H3–H6 + P2/P3 (see table below).
- DECISION NEEDED FROM ED before C1: build-time prerender (vite-react-ssg) is the biggest lift /
  highest payoff (deep-link 404 crawlability + non-JS OG/canonical + static JSON-LD). Ask first.
- Otherwise pick the next cheap win: H3 (eager-load Home + un-animate hero H1 for LCP) or
  H5 (RSS pubDate fix + wire generate-rss into prebuild) are the smallest self-contained units.
- Ceremony per unit: frontend-writer → orchestrator-run code-reviewer gate (nested self-dispatch
  is blocked at agent depth — run code-reviewer at main level) → scoped commit.
```

| Unit | Scope | Files | State |
|---|---|---|---|
| **1** | Per-route descriptions (C2) + title/role consistency (P2) + manifest link (C3) + richer static homepage description | `src/App.jsx`, `index.html` | ✅ committed `5f72e96` (review PASS, 17/17 tests) |
| **2** | Manifest hygiene (description/id/start_url) + project OG fallback (H1) | `public/manifest.json`, `src/Components/ProjectDetail.jsx` | ✅ committed `9d5c61f` (review PASS) |
| **3 (H2)** | Per-project ≤160-char `summary` for all 19 projects; wire `description: summary ?? description` | `src/data/projects.js`, `src/Components/ProjectDetail.jsx` | ✅ committed `6edf735` (review PASS, build + 75 tests) |

## Unit details / exact anchors

### Unit 1 (dispatched)
- `src/App.jsx:31-37` `ROUTE_META` — add `description` to all 5 routes (copy = audit Appendix A).
- `src/App.jsx:32` — title `"…AI Engineer"` → `"…AI Systems Engineer"` (match index.html + JSON-LD `jobTitle`).
- `src/App.jsx:65` — nav masthead `"Software Engineer · Columbus OH"` → `"Full Stack Developer · Columbus OH"` (reconcile 4th role variant).
- `index.html:12,17,27` — meta/og/twitter description → richer Appendix-A `/` copy (names CAST + Compute Atlas).
- `index.html:~33` — add `<link rel="manifest" href="/manifest.json" />` (C3).

### Unit 2 (queued)
- `public/manifest.json` — add `"description"` (reuse meta desc), add `"id": "/"`, change `"start_url": "."` → `"/"`.
- `src/Components/ProjectDetail.jsx:26` — `ogImage: project ? \`/og/${slug}.png\` : undefined` → point at the known-good `/og-image.png` until per-slug images are generated (comment to restore once `generate-og-image.mjs` is wired into `prebuild`).

### Unit 3 / H2 (queued — next session)
- Add a `summary` (≤160 char) field to each of the 19 projects in `src/data/projects.js`.
- `src/Components/ProjectDetail.jsx:24` — `description: project?.summary ?? project?.description`.
- Rationale: current ProjectDetail meta descriptions reuse 400–640-char body copy → Google truncates mid-sentence.

## Remaining audit backlog (post quick-wins, not yet scheduled)
- **C1 (strategic):** build-time prerender (`vite-react-ssg`) — fixes deep-link 404 crawlability + non-JS OG/canonical + enables static JSON-LD. Biggest lift, highest payoff. **Needs a decision from Ed.**
- **H3:** eager-load `Home` route + un-animate the hero H1 (LCP).
- **H4:** lazy-load `CommandPalette` (cmdk); add `rollup-plugin-visualizer`.
- **H5:** RSS epoch-`pubDate` fix (`generate-rss.mjs:46`) + add `rss` npm script / fold into `prebuild`.
- **H6:** `WebSite` (static) + `useJsonLd` hook for `BreadcrumbList` + per-project `SoftwareSourceCode`/`SoftwareApplication`.
- **P2:** sitemap real per-project `lastmod`; Fraunces font preload; GitHub JSON local-parity + seed `last-known-commits.json`; `Person.image`.
- **P3:** hero image WebP/AVIF; "View plate →" aria-labels; cross-link /resume & /now; alt into data model.

## Checkpoint log
- 2026-08-03 — Audit complete (`docs/seo-audit-2026-08-03.md`), 8-agent fan-out, findings cross-verified. Quick-win Unit 1 dispatched.
- 2026-08-03 — Unit 1 committed `5f72e96` on `feature/seo-quick-wins` (code-reviewer PASS, 17/17 tests). Unit 2 dispatched.
- 2026-08-03 — Unit 2 committed `9d5c61f` (code-reviewer PASS). Quick-win wave (C2/C3/H1/P2-title + manifest hygiene) complete. `docs/` committed as `7296ee0`.
- 2026-08-03 — Branch pushed (remote SHA verified = local), **PR #26 opened** against `main`. Session wrapped here. Next unit: H2 (19 per-project summaries) — see KICKOFF BLOCK above.
- 2026-08-03 — **PR #26 merged** to `main` `7e86094`; merged local branches pruned. H2 executed: `frontend-writer` added 19 `summary` fields + JSDoc + ProjectDetail fallback → `code-reviewer` PASS (one 161-char nit trimmed inline) → committed `6edf735` on `feature/seo-project-summaries` (build + 75 tests green). Quick-win + H2 waves complete. Remaining: H3–H6, P2/P3, and C1 prerender (needs Ed's decision).

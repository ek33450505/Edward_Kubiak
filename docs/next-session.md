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

## Status: SEO BACKLOG WRAPPED — C1 + H3/H4 + H5/P2 + P3 committed on `feature/seo-prerender-c1` (final PR)

**#26 (quick-win wave) + #27 (H2 summaries) MERGED** to `main`. The remaining audit backlog was then
wrapped in one session on `feature/seo-prerender-c1` (four commits, each code-reviewer-gated + orchestrator-verified;
75/75 vitest, clean build, C1 prerender emits 24 shells):
- **C1** `f31f78b` — build-time head-only route prerender (folds in H1 non-JS OG + H6 static JSON-LD).
- **H3/H4** `827dc53` — eager-load Home + opaque hero H1 (LCP); lazy-split CommandPalette (52 kB async chunk).
- **H5/P2** `398020d` — real per-project `dateAdded` → RSS pubDate (RFC-822, no more 1970) + sitemap `lastmod`; `generate-rss` wired into prebuild.
- **P3** `f94d3e5` — "See also" internal cross-links on /now + /resume.

Deploys auto-publish on merge to `main` + daily cron. **After merge:** run the Cloudflare/post-deploy verification
(deep links now 200, revalidate OG cards, submit sitemap to Search Console) — note Cloudflare is DNS-only (grey cloud),
so there is no Cloudflare cache to purge; GitHub Pages' Fastly cache is `max-age=600`.

### ▶ KICKOFF BLOCK (paste into a fresh session)
```
Resume Edward_Kubiak SEO. Read docs/next-session.md + docs/seo-audit-2026-08-03.md first.

PRE-FLIGHT:
1. Check the SEO wrap-up PR (feature/seo-prerender-c1) — merged? If yes: git checkout main &&
   git pull --ff-only, delete the merged branch. If CI pending, watch it.
2. Confirm clean tree; curl -sI a deep link (e.g. /projects/compute-atlas) — expect HTTP 200 (was 404).

NEXT: only DEFERRED items remain (each needs an asset, a dep, or a call — see "Deferred" below):
per-slug OG images (H1), hero WebP/AVIF (P3), Fraunces preload (P2), rollup-visualizer (H4 diag),
Person.image (P2), GitHub-JSON local-parity (P2). None are blockers. Ask Ed which (if any) to pursue.
Ceremony per unit: frontend-writer → orchestrator-run code-reviewer gate → scoped commit.
```

| Unit | Scope | Files | State |
|---|---|---|---|
| **1** | Per-route descriptions (C2) + title/role consistency (P2) + manifest link (C3) + richer static homepage description | `src/App.jsx`, `index.html` | ✅ committed `5f72e96` (review PASS, 17/17 tests) |
| **2** | Manifest hygiene (description/id/start_url) + project OG fallback (H1) | `public/manifest.json`, `src/Components/ProjectDetail.jsx` | ✅ committed `9d5c61f` (review PASS) |
| **3 (H2)** | Per-project ≤160-char `summary` for all 19 projects; wire `description: summary ?? description` | `src/data/projects.js`, `src/Components/ProjectDetail.jsx` | ✅ committed `6edf735` → merged #27 |
| **4 (C1)** | Build-time head-only route prerender (24 shells) + static JSON-LD (folds H1 non-JS + H6) | `scripts/prerender-routes.mjs`, `src/data/routeMeta.js`, `src/App.jsx`, `package.json` | ✅ committed `f31f78b` (review PASS after XSS-fix cycle) |
| **5 (H3/H4)** | Eager Home + opaque hero H1 (LCP); lazy-split CommandPalette | `src/App.jsx`, `HeroSection.jsx`, `CommandPalette.jsx`, `CommandPaletteContext.jsx` | ✅ committed `827dc53` (review PASS) |
| **6 (H5/P2)** | Real `dateAdded` → RSS pubDate + sitemap lastmod; wire generate-rss into prebuild | `projects.js`, `generate-rss.mjs`, `generate-sitemap.mjs`, `package.json` | ✅ committed `398020d` (review PASS) |
| **7 (P3)** | "See also" internal cross-links on /now + /resume | `Now.jsx`, `Resume.jsx` | ✅ committed `f94d3e5` (review PASS) |

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

## Audit backlog — status
- **C1** ✅ SHIPPED (`f31f78b`) — built as a head-only post-`vite build` prerender script (NOT vite-react-ssg; chosen for zero hydration risk on Vite 8 / RR7 / BrowserRouter). Emits real 200 shells at all 24 routes.
- **H1** ✅ non-JS OG covered by C1 (static og-image.png per shell) + the earlier ProjectDetail `/og-image.png` fallback. Real per-slug OG images = DEFERRED (see below).
- **H3** ✅ SHIPPED (`827dc53`). **H4** ✅ lazy CommandPalette SHIPPED (`827dc53`); `rollup-plugin-visualizer` = DEFERRED (dev diagnostic, adds a devDep).
- **H5** ✅ SHIPPED (`398020d`). **H6** ✅ static JSON-LD (WebSite/BreadcrumbList/SoftwareSourceCode/SoftwareApplication) emitted by C1's prerender — the client `useJsonLd` hook is unnecessary (crawlers read the static shells).
- **P2** ✅ sitemap per-project `lastmod` SHIPPED (`398020d`); title/role standardization done in Unit 1. Font preload / GitHub-JSON local-parity / `Person.image` = DEFERRED.
- **P3** ✅ internal cross-links SHIPPED (`f94d3e5`). Hero WebP/AVIF + "View plate" aria-labels + alt-in-data-model = DEFERRED.

### Deferred (each needs an asset, a dep, or a decision — none blocking)
- **Real per-slug OG images (H1):** wire `scripts/generate-og-image.mjs` into `prebuild`/deploy to emit `/og/<slug>.png`, then restore `ogImage: /og/${slug}.png` in ProjectDetail + the prerender script.
- **Hero WebP/AVIF (P3):** needs `sharp` + a source hero image + a build step.
- **Fraunces font preload (P2):** needs hashed-asset resolution at build time (could extend `prerender-routes.mjs` to inject a `<link rel="preload">` for the resolved woff2).
- **`rollup-plugin-visualizer` (H4):** dev-only bundle treemap; adds a devDep.
- **`Person.image` (P2):** needs a hosted headshot URL.
- **GitHub-JSON local-parity + seed `last-known-commits.json` (P2):** dev-env resilience, not user-facing.
- **"View plate →" aria-labels (P3):** coupled to `FeaturedWork.test.jsx` name queries; retitle links + update tests together.

## Checkpoint log
- 2026-08-03 — Audit complete (`docs/seo-audit-2026-08-03.md`), 8-agent fan-out, findings cross-verified. Quick-win Unit 1 dispatched.
- 2026-08-03 — Unit 1 committed `5f72e96` on `feature/seo-quick-wins` (code-reviewer PASS, 17/17 tests). Unit 2 dispatched.
- 2026-08-03 — Unit 2 committed `9d5c61f` (code-reviewer PASS). Quick-win wave (C2/C3/H1/P2-title + manifest hygiene) complete. `docs/` committed as `7296ee0`.
- 2026-08-03 — Branch pushed (remote SHA verified = local), **PR #26 opened** against `main`. Session wrapped here. Next unit: H2 (19 per-project summaries) — see KICKOFF BLOCK above.
- 2026-08-03 — **PR #26 merged** to `main` `7e86094`; merged local branches pruned. H2 executed: `frontend-writer` added 19 `summary` fields + JSDoc + ProjectDetail fallback → `code-reviewer` PASS (one 161-char nit trimmed inline) → committed `6edf735` on `feature/seo-project-summaries` (build + 75 tests green). Quick-win + H2 waves complete. Remaining: H3–H6, P2/P3, and C1 prerender (needs Ed's decision).
- 2026-08-03 — **PR #27 (H2) merged**; main synced. Ed chose to wrap the whole remaining backlog this session in one final PR (+ a Cloudflare step list). C1 approach decided = head-only route shells (not vite-react-ssg). C1 built + reviewed (XSS-fix cycle) + independently verified → committed `f31f78b`. Then 3 parallel `frontend-writer` units on disjoint files: H3/H4 `827dc53`, H5/P2 `398020d`, P3 `f94d3e5` — each code-reviewer-gated; combined tree re-verified (75/75 vitest, clean build, 24 prerender shells). Recurring CAST code-reviewer self-approval security-warning quirk observed on several dispatches (reviewer writes its own cast.db record) — tooling artifact, gate decisions made on independent verification. Also fixed the GitHub keychain-modal (ran `gh auth setup-git` → gh-only helper for github.com); see memory [[edward-kubiak-github-push-auth]].

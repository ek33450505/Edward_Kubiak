# Edward_Kubiak

Personal portfolio site — React 19 + Vite 8 + JSX + Tailwind CSS v4, deployed to GitHub Pages.
Visual identity: **Systems Console** (see Design system below).

## Install
```bash
npm install
```

## Run
```bash
npm run dev       # Vite dev server (localhost:5173, or the next free port)
npm run preview   # preview production build locally
```

## Build
```bash
npm run build     # prebuild (sync-cast-stats + sync-atlas-stats + sync-atlas-points + sync-tool-versions + sync-repo-facts + sync-github-activity + generate-sitemap + generate-rss) then vite build
npm run deploy    # build + push to gh-pages branch
```

## Test
```bash
npm test          # vitest
```

## Design system — Systems Console
Single dark graphite theme, **no light mode / no toggle**. Restraint is the bar: hairlines
over fills, mono for labels and figures, one amber signal, space over clutter. Dark ≠ neon.
The previous identity (Night Survey) is preserved at git tag `era/night-survey`.

- **Tokens:** semantic Tailwind v4 `@theme` vars in `src/index.css` — `background` `#111214`,
  `card`, `muted`, `foreground`, `muted-foreground`, `primary` amber `#F2A93B` +
  `primary-foreground`, `border` (decorative hairline), `border-strong` (control outline,
  ≥ 3:1), accents `terra`/`water`/`sepia`, the `status-*` palette for the facility
  visualization, and `--spacing-nav`. Mirrored in `src/lib/tokens.js` and enforced by
  `src/lib/tokens.test.js` (WCAG contrast + two-way mirror).
- **Type:** Geist (`font-display` / body) + Geist Mono (`font-mono`, tabular-nums),
  self-hosted via `@fontsource-variable`. The CSP is `font-src 'self'` — never load fonts
  from a CDN.
- **Utilities:** `panel` / `panel-head` / `hairline` / `status-dot` / `min-h-page` /
  `card` / `card-interactive`. Crisp `rounded` corners only — no pills.
- **Patterns:** page header (mono eyebrow + Geist h1 + intro + hairline); `SectionHead`
  (mono "01 /" index + h2 + hairline); panel cards with `panel-head` strips; readout grids
  (dt-first, `flex-col-reverse`); label-in-name links; targets ≥ 44px.
- **Accessibility:** WCAG 2.2 AA target; every UI unit gets a `frontend-qa` review; global
  `MotionConfig reducedMotion="user"`; sections use `aria-labelledby`.

## Non-obvious

- `prebuild` runs `sync-cast-stats`, `sync-atlas-stats`, `sync-atlas-points`, `sync-tool-versions`, `sync-repo-facts`, `sync-github-activity`, `generate-sitemap` and `generate-rss` before every `npm run build`.
  - `sync-cast-stats.mjs` fetches canonical CAST stats from the flagship repo over https (with a timeout + graceful fallback to `public/cast-stats.json`). Does NOT require a local `~/Projects/personal/claude-agent-team` clone.
  - `sync-atlas-stats.mjs` fetches Compute Atlas figures from `compute-atlas.com/api/stats`, producing `src/data/atlasStats.js` (`ATLAS_STATS`) and `public/atlas-stats.json` with graceful fallback.
  - `sync-atlas-points.mjs` fetches `www.compute-atlas.com/data/hero-points.json` (cache-busted; the Atlas edge has served stale copies), projects it onto a fixed AlbersUsa-style composite and writes `public/atlas-points.json` (fetched at runtime by the hero canvas) plus `src/data/atlasPoints.js` (`ATLAS_POINTS` summary: count, per-status counts, w/h — the hero legend renders from it on first paint). A drift test keeps the two in step.
  - `sync-tool-versions.mjs` resolves ecosystem tool versions from GitHub API, producing `src/data/toolStats.js` (`TOOL_VERSIONS`) and `public/tool-versions.json` with graceful fallback.
  - `sync-repo-facts.mjs` counts Compute Atlas route handlers / test files / workflows (git tree) and commits / Claude co-authored commits (paginated list) from the public repo, producing `src/data/repoFacts.js` (`REPO_FACTS`) and `public/repo-facts.json`. Each group is all-or-nothing (truncated tree, failed page or page cap = fall back) and carries its own `treeAsOf`/`commitsAsOf` date. Unauthenticated GitHub allows 60 requests/hour, so a shared-IP build can fall back; set `GITHUB_TOKEN` to avoid it. The monotonic commit floor deliberately freezes the commits group if compute-atlas history is ever rewritten; the exit is to hand-edit `public/repo-facts.json` + `src/data/repoFacts.js` (commits group) in a reviewed PR.
  - `sync-github-activity.mjs` writes `public/github-activity.json` (gitignored) for Home §03. GitHub's Events API dropped `payload.commits` from PushEvents, so each push is resolved through the compare/commit endpoints; only public PushEvents on `ek33450505/*` are kept (a user token can return private events). `public/last-known-commits.json` (tracked) is rewritten only when at least one commit resolves; the browser never calls api.github.com for activity.
  All six are best-effort with graceful fallback, share the hardened `scripts/lib/fetch-json.mjs` (single settle, deadline, byte cap — a truncated body must never fail the build), and re-run at deploy time for self-healing.
- `npm run drift-report` (`scripts/repo-drift-report.mjs`, NOT in prebuild) prints a markdown report of what changed across the public repos that the site may need to reflect: new repos not on the site (30d), site repos gone/renamed/archived, releases in the last 7d, and literal "as of" anchors older than 60 days. It never edits site content (claims stay Ed-approved), always exits 0, caps itself at 60 API calls, and shows "unavailable (GitHub API error)" for a failed section. `--json` for machine output; set `GITHUB_TOKEN` to avoid the 60/hr unauthenticated limit.
- PDFs: `npm run build-pdfs` (`build-resume-pdf.mjs`, puppeteer) regenerates
  `public/Edward_Kubiak_Resume.pdf` (2 pages) and `public/CAST_Portfolio_OnePager.pdf`
  (1 page) from `src/data/resume.js` + the stat feeds, and copies both to `~/Desktop`.
  - **Design system: `scripts/lib/print-design.mjs`** — Ed's designed resume
    (2026-09-09) rebuilt as the template, shared by BOTH documents so they cannot drift
    apart visually. IBM Plex Sans/Mono inlined as base64 (devDependencies
    `@fontsource/ibm-plex-sans` + `-mono`; it throws if a face is missing rather than
    rendering unstyled), accent `#0c5a4e`, ink `#191919`, hairlines `#bbbbbb`/`#d4d4d4`.
    Portrait Letter — the original export was landscape only because it was printed
    from Firefox.
  - **`paperContract`** in `resume.js` (`size`/`margin`/`bodyPt`/`lineHeight`/`maxPages`)
    drives the PDF *and* `printStyles`, so Cmd+P on `/resume` and the download share one
    paper contract. ⚠️ `page.pdf()` ignores CSS `@page` margins — they are passed
    explicitly in the `page.pdf()` options.
  - **Fitting the page budget is about the line box, not the type size.** Height scales
    with `bodyPt × lineHeight`: 10pt/1.20 and 9.4pt/1.28 are the same height. Current
    9.2pt/1.22 leaves ~69px spare on two pages.
  - **`assertPageBudget`** is fail-closed: two independent counts from the PDF bytes must
    agree, and it throws on anything ambiguous rather than passing.
  - `RESUME_PDF_OUT_DIR` redirects output for verification runs. `main()` only runs on
    direct invocation, so importing a renderer never overwrites `public/` or `~/Desktop`.
  - `tagline` and `contact` in `resume.js` are shared by `/resume` and both PDFs — the
    designed export had silently dropped LinkedIn while the page still showed it.
  - The legacy `npm run build-resume` (docx → LibreOffice headless) still exists but is
    superseded.
- OG card: the live `/og-image.png` is the COMMITTED `public/og-image.png`; regenerate with
  `node scripts/generate-og-image.mjs --outDir public` (the default outDir `public/og/` is
  where deploy.yml writes per-project cards, which nothing references yet). Colors come from
  `src/lib/tokens.js`. sharp/librsvg can't load the Geist woff2, so text renders in the
  Helvetica/Menlo fallbacks locally (DejaVu on the CI runner).
- Animation package is `motion` (npm) not `framer-motion` — `import { motion } from "motion/react"`.
- Deploy target is GitHub Pages (`gh-pages -d dist`); no Vercel or Netlify config.
- Deploys are AUTOMATIC: `deploy.yml` publishes to gh-pages on every push to `main` and on a
  daily 08:00 UTC cron. It fetches canonical CAST stats fresh at deploy time, so the live
  site self-heals stats; manual `npm run deploy` is rarely needed.
- CI drift gate (`cast-stats-check.yml`): committed `public/cast-stats.json` must match
  canonical `claude-agent-team/main/cast-stats.json` (a moving target when that repo is
  active). Fix: `npm run sync-stats` (now pulls canonical), then commit the updated
  `public/cast-stats.json` + `src/data/castStats.js`.
- During agent work, never `npm run build` (prebuild churns `src/data/castStats.js` and
  `public/sitemap.xml`) — verify with `npx vite build --outDir /tmp/vite-verify`.
- Home → Featured Work panel order is deliberate and hardcoded in
  `src/Components/Home/FeaturedWork.jsx`: Compute Atlas is panel 01 ("Live product"), CAST is
  panel 02 ("Development architecture"). `src/data/projects.js` mirrors that order in the flagship group.
  Both the panel number (`idx(n)`) and the motion `delay` are per-block literals — swapping
  the blocks means swapping those too.
- The hero is a typographic **console header** (`src/Components/Home/HeroSection.jsx`) beside
  the **facility field**: a lazy canvas-2D map (`FacilityField.jsx`, helpers in
  `src/lib/facilityField.js`) of every Compute Atlas facility in an aria-hidden slot
  (`data-slot="facility-field"`, aspect from `ATLAS_POINTS.w/h`). All motion ends by
  `PULSE_END_MS` (WCAG 2.2.2) and reduced motion gets one static frame; the visible legend
  is the text equivalent. Home section 02 is the scroll-driven `ArchitectureFlow.jsx`
  (`motion.div` fills — React drops `scaleX` on a plain div). Neither is a 3D scene. The old Celestial WebGL starfield (`src/Components/Celestial/`), the shared
  `src/lib/three/` utilities, the `three`/`@react-three`/`postprocessing` dependencies,
  and the orphaned StravaStats widget were **removed entirely** in this session (recoverable
  via the `era/celestial-revival` tag).
- Theme-era git tags (all pushed): `era/celestial-v1` (b7c9ff5), `era/nature-trailterrain`
  (4f11685), `era/celestial-revival` (pre-squash PR #10 head), `era/atlas-parchment`
  (light Cartographic Survey Atlas), `era/night-survey` (bd24406, dark Cartographic Survey
  Atlas). Current era: **Systems Console** (2026-10).
- `npm run work-facts` (`scripts/work-facts.mjs`) is **local-only**: it prints today's CrossCheck
  numbers from Ed's clone so the dated claims on the resume/site can be refreshed by hand when the
  weekly drift report flags them. `CROSSCHECK_DIR` (path to the local clone) is required; no path is
  baked in. It is deliberately NOT in `prebuild` or any workflow: work-repo data never flows through
  CI or automation. It runs read-only `git -C` commands only (`--ref` is validated and resolved once
  to a sha), never fetches (numbers reflect the last fetch), writes nothing, and lists the claim
  lines in `resume.js` / `projects.js` / `build-resume-pdf.mjs` to update.
  - Definitions (ref `origin/QA`; `--as-of` = last commit at or before that date): commits are
    `rev-list --count` (merges included); Ed's match is
    `-E -i --author='(^|<)(edward[ _]|ed )kubiak'` (anchored to the start of the name or email; the
    script also prints a names-only per-identity breakdown as a sanity check); source files =
    `src/**/*.{js,jsx,ts,tsx}` incl. tests; lines use `wc -l` semantics and are published as a
    split: application code (excluding `*.test.*`), tests, css; `ses/` (moved into the repo
    2026-10-19) is reported separately, never folded into the src figures.
  - "Tests passing" is NOT computed: the script's declared-test count is a static `it(`/`test(`
    count. The real number is a read-only run: `git archive origin/QA | tar -x` into a temp dir,
    symlink the clone's `node_modules`, `npx vitest run --cache=false --reporter=json` (see
    `--help`).

## Data-Point Discipline

Every stat shown in the UI is interpolated from a self-healing feed — `CAST_STATS` (castStats.js), `ATLAS_STATS` (atlasStats.js), `TOOL_VERSIONS` (toolStats.js), or `REPO_FACTS` (repoFacts.js) — or it is removed. No hardcoded counts, versions, or facility numbers live in components, so numbers can't drift. This discipline governs feature work: pull stats dynamically, never hardcode them.

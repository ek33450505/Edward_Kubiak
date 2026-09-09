# Edward Kubiak — Portfolio

**[edwardkubiak.com](https://edwardkubiak.com/) — Full Stack Developer & AI Systems Engineer**

I build production web applications and the tooling that keeps agent-written code
honest. Agents write most of my code now; that moved the work rather than removing
it, because the judgment, the verification and the consequences all stayed put.

- **Day job** — Applications Developer at [META Solutions](https://www.metasolutions.net/)
  since August 2022, building and owning React applications across Ohio's K-12
  education ecosystem. The largest is CrossCheck, the EMIS data-validation platform I
  was hired out of a certificate program to rewrite in React and have owned since.
- **[CAST](https://castframework.dev)** — a local-first, open-source multi-agent
  control plane for Claude Code. Every agent run lands in a tamper-evident SQLite
  record the system acts on: full-text search (`cast ask`), signed SHA-256 audit
  receipts (`cast ledger --verify`), telemetry-driven cost prediction (`cast predict`).
- **[Compute Atlas](https://compute-atlas.com)** — an open, source-cited census of the
  U.S. grid-scale compute buildout: data centers, crypto mining, and the dedicated
  power generation contracted to feed them. Released as open data with a public API.
- **Agent-reliability tools** — deterministic and zero-LLM: `misfire` asks which of
  your rules agents actually ignore, `attest` checks whether a claimed DONE landed on
  disk, `looptrip` trips coordination loops at iteration 2 rather than on the invoice.
- **[How I work with agents](https://edwardkubiak.com/practice)** — the loop I actually
  run, where review time goes, and dated case studies of output that looked right and
  wasn't.

Résumé: [edwardkubiak.com/resume](https://edwardkubiak.com/resume) ·
Reach me at [edward.kubiak.dev@gmail.com](mailto:edward.kubiak.dev@gmail.com)

---

## About this repository

This repo is the source of that site: React 19, Vite 8, and a custom dark "Night
Survey" cartographic design system.

- **Cartographic design system** — a single dark reference-atlas theme with semantic
  Tailwind v4 tokens, Fraunces display type, JetBrains Mono overlines, and cartographic
  utilities (graticule grid, neatline frames). No toggles, no light mode.
- **Typographic frontispiece hero** — no 3D; the legacy Three.js starfield was retired
  in PR #18.
- **Command palette (⌘K)** — navigation and search via `cmdk`.
- **Self-healing stats** — every figure in the UI is interpolated from a feed that
  re-syncs at build and deploy time, or it is removed. No hardcoded counts or versions,
  so published numbers cannot quietly drift.
- **Accessibility** — WCAG AA contrast, semantic HTML, ARIA labels, skip links,
  focus-visible states, global reduced-motion support.
- **Performance and SEO** — lazy-loaded routes plus a build-time head-only prerender,
  so deep links serve real 200s with correct metadata on GitHub Pages.

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, motion/react |
| **Routing & UI** | React Router 7, motion, cmdk, Lucide React |
| **Testing** | Vitest |
| **Deploy** | GitHub Pages (published on every push to `main` + daily cron) |

## Getting Started

### Install dependencies
```bash
npm install
```

### Run locally
```bash
npm run dev        # Vite dev server at localhost:5173 (or next free port)
npm run preview    # preview production build
```

### Build & deploy
```bash
npm run build      # production build (auto-runs prebuild: sync-cast-stats + sync-atlas-stats + sync-tool-versions + sitemap)
npm run deploy     # build + push to gh-pages branch
```

### Other commands
```bash
npm run sync-stats      # refresh CAST stats from canonical source (no local clone required)
npm run sync-atlas      # refresh Compute Atlas stats from canonical source (graceful fallback)
npm run sync-versions   # resolve ecosystem tool versions from GitHub API (graceful fallback)
npm run build-pdfs      # regenerate resume + one-pager PDFs from src/data/resume.js
npm run build-resume    # legacy: docx→PDF (superseded by build-pdfs)
npm test                # run Vitest suite
```

## Design System — Night Survey

Single dark "Night Survey" reference-atlas theme (nocturnal survey plate) — **no light mode, no toggle**. Character comes from typography and cartographic detail, never decoration or neon glow.

- **Tokens:** Semantic Tailwind v4 `@theme` in `src/index.css` — `background` (#181410), `foreground`, `card`, `muted`, `primary` (contour green), `border` (brass hairline), accents `terra`/`water`/`sepia`. Every text/bg pair ≥ 4.5:1 WCAG AA. JS/SVG consumers mirror tokens from `src/lib/tokens.js` — keep in sync.
- **Typography:** Fraunces (variable serif — headlines only) · JetBrains Mono (overlines, labels, coordinates, tabular figures) · DM Sans (body). All self-hosted via `@fontsource` (CSP: `font-src 'self'`; **no CDN fonts**).
- **Utilities:** `.graticule` (reference grid) · `.neatline` (engraved double frame) · crisp `card` / `card-interactive` · crisp corners only (0.25rem radius, no pills).
- **Signature patterns:** Mono eyebrow overlines + Fraunces titles + hairline rules · neatline "plate" cards with mono labels · hairline stat strips (mono tabular figures over tracked labels).

## Build Notes

**Stats Pipeline**
- `npm run sync-stats` fetches canonical CAST stats **over HTTPS** from `claude-agent-team/cast-stats.json` (with timeout + graceful fallback to `public/cast-stats.json`). No local clone required.
- `npm run sync-atlas` fetches Compute Atlas figures from `compute-atlas.com/api/stats` with graceful fallback to `public/atlas-stats.json`.
- `npm run sync-versions` resolves ecosystem tool versions from GitHub tags/releases with graceful fallback to `public/tool-versions.json`.
- `prebuild` hook runs all three feeds automatically before every `npm run build`.
- `deploy.yml` re-fetches all stats at deploy time, so the live site self-heals stats drifts.
- CI gate (`cast-stats-check.yml`) blocks commits if stats drift from canonical.

**Resume Pipeline**
- Single source of truth: `src/data/resume.js`.
- `npm run build-pdfs` (puppeteer) renders both PDF + copies to Desktop as **classic paper** (black-on-white, never UI-styled).
- Legacy `npm run build-resume` (docx → LibreOffice headless) is superseded.

**Animation**
- Uses `motion` (npm), not Framer Motion. Import with `import { motion } from "motion/react"`.
- All hero parallax and scroll animations respect `prefers-reduced-motion` globally via `<MotionConfig reducedMotion="user">` in `src/App.jsx`.

**Hero**
- The hero is a typographic **frontispiece** (`src/Components/Home/HeroSection.jsx`), not a 3D scene.
- The old Three.js celestial starfield, `src/Components/Celestial/`, the `three`/`@react-three`/`postprocessing` dependencies, and the orphaned StravaStats widget were **removed entirely** in this session (recoverable via the `era/celestial-revival` tag).

## Routes

- `/` — Home (frontispiece hero + featured projects)
- `/about` — Bio, skills, and philosophy
- `/projects` — Portfolio index
- `/projects/:slug` — Project detail (case studies, stats, open-source info)
- `/resume` — Downloadable resume + skills breakdown
- `/now` — What I'm working on this week
- `/practice` — How I work with agents: the loop, the review budget, dated case studies
- `/*` — 404 page

## Contact

- **GitHub:** [ek33450505](https://github.com/ek33450505)
- **Email:** edward.kubiak.dev@gmail.com
- **LinkedIn:** [edward-kubiak](https://www.linkedin.com/in/edward-kubiak/)

&copy; 2024–2026 Edward Kubiak

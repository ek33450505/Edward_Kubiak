# Edward Kubiak — Portfolio

**[edwardkubiak.com](https://edwardkubiak.com/) — Full Stack Developer & AI Systems Engineer**

Personal portfolio and professional site showcasing full-stack development, AI/LLM integration, and open-source work. Built with React 19, Vite 8, and a custom "Night Survey" cartographic design system.

## Highlights

- **Cartographic Design System** — A single dark "Night Survey" reference-atlas theme with semantic Tailwind v4 tokens, Fraunces display type, JetBrains Mono overlines, and cartographic utilities (graticule grid, neatline frames). Zero toggles, zero light mode.
- **Typographic Frontispiece Hero** — Clean, semantic layout without 3D effects. The legacy Three.js starfield was retired in PR #18.
- **Command Palette (⌘K)** — Fast navigation and search via `cmdk`
- **Flagship Projects** — [CAST](https://castframework.dev) (27-agent multi-agent framework for Claude Code) and [Compute Atlas](https://compute-atlas.com) (327-facility AI datacenter census)
- **Accessibility** — WCAG AA contrast, semantic HTML, ARIA labels, skip links, focus-visible states, global reduced-motion support
- **Performance** — Lazy-loaded routes; automatic stats sync from canonical sources

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, motion/react |
| **Routing & UI** | React Router 7, recharts, cmdk, Lucide React |
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
npm run build      # production build (auto-runs prebuild: sync-stats + sitemap)
npm run deploy     # build + push to gh-pages branch
```

### Other commands
```bash
npm run sync-stats      # refresh CAST stats from canonical source (no local clone required)
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
- `prebuild` hook runs automatically before every `npm run build`.
- `deploy.yml` re-fetches stats at deploy time, so the live site self-heals stats drifts.
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
- The old Three.js celestial starfield (deterministic meteor, selective bloom) was **retired in PR #18** and is no longer mounted. Files preserved in `src/Components/Celestial/` and recoverable via the `era/celestial-revival` tag.
- Retiring the 3D scene dropped the entire `three` chunk from the production bundle.

## Routes

- `/` — Home (frontispiece hero + featured projects)
- `/about` — Bio, skills, and philosophy
- `/projects` — Portfolio index
- `/projects/:slug` — Project detail (case studies, stats, open-source info)
- `/resume` — Downloadable resume + skills breakdown
- `/now` — What I'm working on this week
- `/*` — 404 page

## Contact

- **GitHub:** [ek33450505](https://github.com/ek33450505)
- **Email:** edward.kubiak.dev@gmail.com
- **LinkedIn:** [edward-kubiak](https://www.linkedin.com/in/edward-kubiak/)

&copy; 2024–2026 Edward Kubiak

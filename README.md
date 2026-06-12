# Edward Kubiak — Portfolio

**[edwardkubiak.com](https://edwardkubiak.com/) — Full Stack Developer & AI Systems Engineer**

Personal portfolio and professional site showcasing full-stack development, AI/LLM integration, and open-source work.

## Highlights

- **Interactive 3D Hero** — Lazy-loaded Three.js scene (Mohican-gorge terrain, river, instanced trees, race-route visualization, fireflies) with reduced-motion awareness
- **Cmd+K Command Palette** — Fast navigation and search via `cmdk`
- **Performance** — Lazy-loaded routes; main bundle ~97 kB gzip
- **Accessibility** — WCAG AA contrast, semantic HTML, comprehensive ARIA labelling, skip links, focus-visible states, reduced-motion support
- **Static Data Pipeline** — GitHub/dev.to/CAST stats fetched at build time, zero runtime API calls
- **CAST Ecosystem** — Maintains [CAST](https://castframework.dev), a 23-agent multi-agent framework for Claude Code

## Tech Stack

| | |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4 |
| **3D / Motion** | `motion` (motion/react), react-three-fiber, drei, Three.js |
| **Routing & UI** | React Router 7, recharts, cmdk, Lucide React |
| **Testing** | Vitest |
| **Deploy** | GitHub Pages (built fresh in CI, published to `gh-pages`) |

## Getting Started

### Install dependencies
```bash
npm install
```

### Run locally
```bash
npm run dev        # Vite dev server at localhost:5173
npm run preview    # preview production build
```

### Build & deploy
```bash
npm run build      # production build (auto-runs sync-stats via prebuild)
npm run deploy     # build + push to gh-pages branch
```

### Other commands
```bash
npm run sync-stats      # refresh CAST stats from ~/Projects/personal/claude-agent-team
npm run build-resume    # regenerate resume PDF from .docx (requires LibreOffice)
npm test                # run Vitest suite
```

## Build Notes

- **`sync-stats` prebuild hook** — Runs automatically before every `npm run build`. If `~/Projects/personal/claude-agent-team` is unavailable, build fails. Run `npm run sync-stats` first to debug.
- **Resume PDF generation** — Source is `assets/resume/Edward_Kubiak_Resume.docx`. After editing, run `npm run build-resume` to regenerate the PDF. Requires `brew install --cask libreoffice`. Script is idempotent; supports `--force` flag.
- **Animation package** — Uses `motion` (npm), not Framer Motion. Import with `import { motion } from "motion/react"`.

## Architecture

**Static data pipeline:** CAST stats (agents, tests, packages, commands, skills, tables), dev.to articles, and GitHub activity are fetched at deploy time (CI workflow + `scripts/sync-cast-stats.mjs`) and served as static JSON — no runtime API keys, deterministic builds. CAST stats are drift-gated in CI to catch upstream changes.

**Lazy routes:** All page routes (Home, About, Portfolio, Resume, Now, Talks, Uses) are code-split with React's `lazy()` and `Suspense`, reducing the initial main-bundle footprint.

**Reduced motion:** Hero parallax and scroll animations respect `prefers-reduced-motion` via the `useReducedMotion()` hook from `motion/react`.

## Contact

- **GitHub**: [ek33450505](https://github.com/ek33450505)
- **Email**: edward.kubiak.dev@gmail.com

&copy; 2024–2026 Edward Kubiak

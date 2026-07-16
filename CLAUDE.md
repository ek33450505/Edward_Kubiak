# Edward_Kubiak

Personal portfolio site — React 19 + Vite 8 + JSX + Tailwind CSS v4, deployed to GitHub Pages.
Visual identity: **Cartographic Survey Atlas** (see Design system below).

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
npm run build     # prebuild (sync-stats + generate-sitemap) then vite build
npm run deploy    # build + push to gh-pages branch
```

## Test
```bash
npm test          # vitest
```

## Design system — Cartographic Survey Atlas
Single dark "Night Survey" reference-atlas theme (nocturnal survey plate), **no light mode / no toggle**. Character comes from
typography + cartographic detail, never decoration or textures. Restraint is the bar:
hairlines over fills, mono over decoration, space over clutter. Dark ≠ neon: luminous
hairlines over glow, warm near-black over cold blue-black.

- **Tokens:** semantic Tailwind v4 `@theme` vars in `src/index.css` —
  `background`/`foreground`/`card`/`muted`/`muted-foreground`/`primary` (contour green)/
  `border` (brass/sepia hairline) + accents `terra`/`water`/`sepia`. Every text/bg pair ≥ 4.5:1 on the dark field `#181410`.
  JS/SVG/WebGL consumers read the mirror `src/lib/tokens.js` — keep it in sync.
- **Type:** `font-display` = Fraunces (variable serif — headlines/plate titles only) ·
  `font-mono` = JetBrains Mono (overlines, labels, coordinates, tabular figures) ·
  body = DM Sans. All self-hosted via `@fontsource` — the CSP is `font-src 'self'`, so do
  NOT load Google Fonts from a CDN.
- **Utilities:** `.graticule` (surveyor reference grid), `.neatline` (engraved double frame),
  crisp `card` / `card-interactive`. Crisp corners only (`rounded`, radius 0.25rem) — no pills.
- **Signature patterns:** frontispiece page headers (mono coordinate/eyebrow overline +
  Fraunces H1 + hairline rule), neatline "plate" cards with mono plate-numbers, hairline
  stat strips (mono tabular figures over tracked labels). No legacy token bridge — every
  component uses the semantic tokens directly.

## Non-obvious

- `prebuild` runs `sync-stats` + `generate-sitemap` before every `npm run build`.
  `sync-cast-stats.mjs` fetches canonical CAST stats from the flagship repo over https
  (with a timeout + graceful fallback to the committed `public/cast-stats.json`), so it does
  NOT require a local `~/Projects/personal/claude-agent-team` clone and will not fail the
  build if one is absent. Run `npm run sync-stats` any time to refresh dev + the committed
  snapshot from canonical.
- Resume / one-pager PDFs: `npm run build-pdfs` (`build-resume-pdf.mjs`, puppeteer) renders
  `public/Edward_Kubiak_Resume.pdf` + `CAST_Portfolio_OnePager.pdf` from `src/data/resume.js`
  (the single source of truth) as **classic paper** — black-on-white via the `printStyles`
  export, never UI-styled — and also copies both to `~/Desktop`. The legacy
  `npm run build-resume` (docx → LibreOffice headless) still exists but is superseded.
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
- The hero is a typographic **frontispiece** (`src/Components/Home/HeroSection.jsx`), not a
  3D scene. The old Celestial WebGL starfield (`src/Components/Celestial/`, deterministic
  mulberry32; shared utils in `src/lib/three/`) was retired in the atlas redesign (PR #18)
  and is no longer mounted — files are kept for history and recoverable via the
  `era/celestial-revival` tag. Retiring it also dropped the entire `three` chunk from the bundle.
- Theme-era git tags (all pushed): `era/celestial-v1` (b7c9ff5), `era/nature-trailterrain`
  (4f11685), `era/celestial-revival` (pre-squash PR #10 head). Current era: **Cartographic
  Survey Atlas** (PR #18).

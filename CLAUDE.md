# Edward_Kubiak

Personal portfolio site — React 19 + Vite 8 + JSX, deployed to GitHub Pages.

## Install
```bash
npm install
```

## Run
```bash
npm run dev       # Vite dev server at localhost:5173
npm run preview   # preview production build locally
```

## Build
```bash
npm run build     # runs sync-stats (prebuild) then vite build
npm run deploy    # build + push to gh-pages branch
```

## Test
```bash
npm test          # vitest
```

## Non-obvious

- `prebuild` auto-runs `sync-stats` before every `npm run build`. If `~/Projects/personal/claude-agent-team` is missing, the build will fail. Run `npm run sync-stats` first to debug.
- `npm run build-resume` converts `assets/resume/Edward_Kubiak_Resume.docx` → `public/Edward_Kubiak_Resume.pdf` via LibreOffice headless. Requires: `brew install --cask libreoffice`. Supports `--force` flag to bypass idempotency check.
- Animation package is `motion` (npm) not `framer-motion` — use `import { motion } from "motion/react"`.
- Deploy target is GitHub Pages (`gh-pages -d dist`); no Vercel or Netlify config.
- Deploys are AUTOMATIC: `deploy.yml` publishes to gh-pages on every push to `main` and on a daily 08:00 UTC cron. It fetches canonical CAST stats fresh at deploy time, so the live site self-heals stats; manual `npm run deploy` is rarely needed.
- CI drift gate: committed `public/cast-stats.json` must match canonical `claude-agent-team/main/cast-stats.json` (a moving target when that repo is active). Fix: update the JSON, run `npm run sync-stats`, commit both files.
- During agent work, never `npm run build` (prebuild churns `src/data/castStats.js`) — verify with `npx vite build --outDir /tmp/vite-verify`.
- Hero scene `src/Components/Celestial/` is fully deterministic (mulberry32; all tunables in `constants.js`; shared utils in `src/lib/three/`). Rare-meteor visual QA: run the same PRNG in node to compute the dormancy draw, then burst-screenshot the flight window.
- Theme-era git tags (all pushed): `era/celestial-v1` (b7c9ff5), `era/nature-trailterrain` (4f11685), `era/celestial-revival` (pre-squash PR #10 head).

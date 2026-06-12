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

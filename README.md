# Edward Kubiak — Portfolio

**[edwardkubiak.com](https://edwardkubiak.com/)**

Personal portfolio site for Edward Kubiak — Application Developer based in Columbus, OH.

## About

This portfolio showcases my work as a full stack developer specializing in React, Node.js, Python, and AI/LLM integration. I build and maintain production applications serving thousands of users across Ohio's K-12 education system at META Solutions.

### Sections

- **Home** — Introduction, core competencies, and calls to action
- **About** — Background, interests, and what drives me
- **Projects** — Featured work across personal and professional projects
- **Resume** — Skills, experience, and education
- **Contact** — Reach out via email form

## CAST Ecosystem

Edward maintains [CAST](https://castframework.dev), a 23-agent multi-agent framework for Claude Code. Try it: `brew tap ek33450505/cast && brew install cast`.

## Built With

- React 19 + Vite 8
- Tailwind CSS v4
- Framer Motion (page transitions & scroll animations)
- Lucide React (icons)
- React Router v7
- Web3Forms (contact form)
- Deployed via GitHub Pages

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server at `localhost:5173` |
| `npm run build` | Production build (runs `sync-stats` first via `prebuild`) |
| `npm run sync-stats` | Pull fresh CAST stats from `~/Projects/personal/claude-agent-team` into `src/data/castStats.js` |
| `npm run build-resume` | Convert `assets/resume/Edward_Kubiak_Resume.docx` → `public/Edward_Kubiak_Resume.pdf` via LibreOffice headless, and copy the CAST one-pager to `public/`. Run after editing the source `.docx`. |
| `npm run deploy` | Build + deploy to GitHub Pages |

> **Keeping the PDF current:** The canonical resume source is `assets/resume/Edward_Kubiak_Resume.docx` (authored in Word / Google Docs / Pages). After editing the `.docx`, run `npm run build-resume` to regenerate `public/Edward_Kubiak_Resume.pdf`. Requires LibreOffice installed locally: `brew install --cask libreoffice`. The script is idempotent (skips on unchanged source) and supports `--force` to override. The UI resume (`src/Components/Resume.jsx`) is a browse-only view; the download link serves the real authored PDF.

## Connect

- **GitHub**: [ek33450505](https://github.com/ek33450505)
- **Email**: edward.kubiak.dev@gmail.com
---

&copy; 2024–2026 Edward Kubiak

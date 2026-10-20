import sharp from "sharp";
import fs from "fs";
import { fileURLToPath } from "url";
import { isDirectInvocation } from "./lib/direct-invocation.mjs";
import { basename, dirname, join } from "path";
import {
  ACCENT,
  BACKGROUND,
  CARD,
  FOREGROUND,
  MUTED_FOREGROUND,
  SLATE_700,
} from "../src/lib/tokens.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const WIDTH = 1200;
export const HEIGHT = 630;

const DEFAULT_SUBTITLE = "Full Stack Developer & AI Systems Engineer · Columbus, OH";

// librsvg does not load the bundled Geist faces, so every stack ends in a generic.
const SANS = "Geist, 'Helvetica Neue', Helvetica, Arial, 'DejaVu Sans', sans-serif";
const MONO = "'Geist Mono', Menlo, 'DejaVu Sans Mono', monospace";

const PANEL = { x: 60, y: 60, w: 1080, h: 510 };
const HEAD_H = 56;
const MAX_HEADLINE_PX = 88;
const HEADLINE_BUDGET = 1700;

export function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function headlineSize(text) {
  return Math.min(MAX_HEADLINE_PX, Math.floor(HEADLINE_BUDGET / Math.max(1, text.length)));
}

export function generateOgSvg(mainText, subtitle = DEFAULT_SUBTITLE, kind = "PROFILE") {
  const { x, y, w, h } = PANEL;
  const headY = y + HEAD_H;
  const bodyMid = headY + (y + h - headY) / 2;
  const size = headlineSize(mainText);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}"/>

  <!-- Panel -->
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="4" fill="${CARD}" stroke="${SLATE_700}" stroke-width="1"/>

  <!-- Panel head -->
  <line x1="${x}" y1="${headY + 0.5}" x2="${x + w}" y2="${headY + 0.5}" stroke="${SLATE_700}" stroke-width="1"/>
  <circle cx="${x + 36}" cy="${y + HEAD_H / 2}" r="5" fill="${ACCENT}"/>
  <text x="${x + 58}" y="${y + HEAD_H / 2 + 7}" font-family="${MONO}" font-size="20" fill="${MUTED_FOREGROUND}" letter-spacing="2">EDWARDKUBIAK.COM</text>
  <text x="${x + w - 36}" y="${y + HEAD_H / 2 + 7}" text-anchor="end" font-family="${MONO}" font-size="20" fill="${MUTED_FOREGROUND}" letter-spacing="2">${escapeXml(kind)}</text>

  <!-- Headline -->
  <text x="${x + 40}" y="${bodyMid}" font-family="${SANS}" font-size="${size}" font-weight="600" fill="${FOREGROUND}" letter-spacing="-1.5">${escapeXml(mainText)}</text>

  <!-- Subtitle -->
  <text x="${x + 40}" y="${bodyMid + 64}" font-family="${SANS}" font-size="32" font-weight="400" fill="${MUTED_FOREGROUND}">${escapeXml(subtitle)}</text>
</svg>`;
}

async function generateImage(outDir, filename, svgContent) {
  const outPath = join(outDir, filename);
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(Buffer.from(svgContent)).png().toFile(outPath);
  return outPath;
}

function parseArgs(args) {
  const opts = { slug: null, title: null, outDir: join(__dirname, "../public/og") };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--slug" && i + 1 < args.length) {
      opts.slug = args[++i];
    } else if (args[i] === "--title" && i + 1 < args.length) {
      opts.title = args[++i];
    } else if (args[i] === "--outDir" && i + 1 < args.length) {
      opts.outDir = args[++i];
    }
  }
  return opts;
}

export async function main(args = process.argv.slice(2)) {
  const opts = parseArgs(args);
  let { slug } = opts;

  // Sanitize slug to prevent path traversal
  if (slug) {
    slug = basename(slug).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) throw new Error("Invalid slug");
  }

  if (slug && opts.title) {
    const svg = generateOgSvg(opts.title, "Project", "PROJECT");
    const outPath = await generateImage(opts.outDir, `${slug}.png`, svg);
    console.log(`Wrote project OG image to ${outPath}`);
  } else {
    const svg = generateOgSvg("Edward Kubiak");
    const outPath = await generateImage(opts.outDir, "og-image.png", svg);
    console.log(`Wrote og-image.png to ${outPath}`);
  }
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

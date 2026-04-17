import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/og-image.png");

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a0f1a"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="200" x2="${WIDTH}" y2="200" stroke="#1e293b" stroke-width="1"/>
  <line x1="0" y1="400" x2="${WIDTH}" y2="400" stroke="#1e293b" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="${HEIGHT}" stroke="#1e293b" stroke-width="1"/>
  <line x1="800" y1="0" x2="800" y2="${HEIGHT}" stroke="#1e293b" stroke-width="1"/>

  <!-- Amber accent line -->
  <rect x="100" y="200" width="160" height="6" fill="#fbbf24" rx="3"/>

  <!-- Headline -->
  <text
    x="100"
    y="310"
    font-family="'Courier New', Courier, monospace"
    font-size="96"
    font-weight="700"
    fill="#f8fafc"
    letter-spacing="-2"
  >EDWARD KUBIAK</text>

  <!-- Subtitle -->
  <text
    x="100"
    y="390"
    font-family="'Courier New', Courier, monospace"
    font-size="34"
    font-weight="400"
    fill="#cbd5e1"
    letter-spacing="1"
  >Full Stack Developer &amp; AI Systems Engineer</text>

  <!-- Footer domain -->
  <text
    x="100"
    y="560"
    font-family="'Courier New', Courier, monospace"
    font-size="26"
    font-weight="400"
    fill="#94a3b8"
    letter-spacing="2"
  >edwardkubiak.com</text>
</svg>`;

const svgBuffer = Buffer.from(svg);

await sharp(svgBuffer)
  .png()
  .toFile(outPath);

console.log(`Wrote og-image.png to ${outPath}`);

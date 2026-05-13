import sharp from "sharp";
import { fileURLToPath } from "url";
import { basename, dirname, join } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;

// Parse CLI arguments
const args = process.argv.slice(2);
let slug = null;
let title = null;
let outDir = join(__dirname, "../public/og");

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--slug" && i + 1 < args.length) {
    slug = args[i + 1];
    i++;
  } else if (args[i] === "--title" && i + 1 < args.length) {
    title = args[i + 1];
    i++;
  } else if (args[i] === "--outDir" && i + 1 < args.length) {
    outDir = args[i + 1];
    i++;
  }
}

function generateOgSvg(mainText, subtitle = "Full Stack Developer & AI Systems Engineer") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
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
  >${mainText}</text>

  <!-- Subtitle -->
  <text
    x="100"
    y="390"
    font-family="'Courier New', Courier, monospace"
    font-size="34"
    font-weight="400"
    fill="#cbd5e1"
    letter-spacing="1"
  >${subtitle}</text>

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
}

async function generateImage(filename, svgContent) {
  const svgBuffer = Buffer.from(svgContent);
  const outPath = join(outDir, filename);

  // Ensure output directory exists
  mkdirSync(outDir, { recursive: true });

  await sharp(svgBuffer)
    .png()
    .toFile(outPath);

  return outPath;
}

// Sanitize slug to prevent path traversal
if (slug) {
  slug = basename(slug).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!slug) {
    console.error('Invalid slug');
    process.exit(1);
  }
}

// If specific project requested
if (slug && title) {
  const svg = generateOgSvg(title, "Project");
  const outPath = await generateImage(`${slug}.png`, svg);
  console.log(`Wrote project OG image to ${outPath}`);
} else {
  // Generate main og-image.png
  const svg = generateOgSvg("EDWARD KUBIAK", "Full Stack Developer & AI Systems Engineer");
  const outPath = await generateImage("og-image.png", svg);
  console.log(`Wrote og-image.png to ${outPath}`);
}

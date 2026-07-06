/**
 * generate-icons.mjs — generates PWA and apple-touch PNG icons from favicon.svg
 * using the `sharp` devDependency.
 *
 * Outputs (all in public/):
 *   icon-192.png          — 192×192  (any)
 *   icon-512.png          — 512×512  (any)
 *   icon-maskable-512.png — 512×512  (maskable, 10% safe-zone padding)
 *   apple-touch-icon.png  — 180×180  (apple-touch-icon)
 *
 * NOT wired into prebuild intentionally: these PNGs are static committed
 * artifacts. favicon.svg rarely changes; re-rasterising 4 PNGs on every
 * build would be wasteful. Re-run manually (`node scripts/generate-icons.mjs`)
 * whenever favicon.svg is updated.
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '../public/favicon.svg');
const outDir  = join(__dirname, '../public');

// Background color matching the SVG and manifest theme (parchment)
const BG_COLOR = { r: 245, g: 241, b: 230, alpha: 1 }; // #F5F1E6

async function generateIcon(size, outFile) {
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(join(outDir, outFile));
  console.log(`  ✓ ${outFile} (${size}×${size})`);
}

async function generateMaskable(canvasSize, outFile) {
  // Safe zone = inner 80% (10% padding on each side per maskable spec)
  const iconSize = Math.round(canvasSize * 0.8);

  // Rasterise SVG at icon size
  const iconBuffer = await sharp(svgPath)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  // Offset to centre the icon on the canvas
  const offset = Math.round((canvasSize - iconSize) / 2);

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: iconBuffer, left: offset, top: offset }])
    .png()
    .toFile(join(outDir, outFile));

  console.log(`  ✓ ${outFile} (${canvasSize}×${canvasSize}, maskable — icon at ${iconSize}×${iconSize})`);
}

console.log('Generating PWA icons from favicon.svg…');

await generateIcon(192, 'icon-192.png');
await generateIcon(512, 'icon-512.png');
await generateMaskable(512, 'icon-maskable-512.png');
await generateIcon(180, 'apple-touch-icon.png');

console.log('\nDone. All icons written to public/');

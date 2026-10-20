import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  datasetJsonLd,
  escapeJsonForScriptTag,
  isValidCard,
  ogImageFor,
  renderRoute,
} from './prerender-routes.mjs';
import sharp from 'sharp';
import projects from '../src/data/projects.js';
import { ATLAS_DATASET } from '../src/data/atlasDataset.js';

const atlas = projects.find((p) => p.slug === 'compute-atlas');
const without = projects.find((p) => !p.dataset);

// Real 1200x630 PNG (sharp), built once; helper below derives broken variants.
const validPng = await sharp({
  create: { width: 1200, height: 630, channels: 3, background: '#000' },
})
  .png()
  .toBuffer();

describe('OG card helpers', () => {
  let dir;
  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-cards-'));
    fs.mkdirSync(path.join(dir, 'og'));
    fs.writeFileSync(path.join(dir, 'ok.png'), validPng);
    fs.writeFileSync(path.join(dir, 'sigonly.png'), validPng.subarray(0, 8));
    fs.writeFileSync(path.join(dir, 'truncated.png'), validPng.subarray(0, validPng.length - 20));
    fs.writeFileSync(
      path.join(dir, 'small.png'),
      await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).png().toBuffer(),
    );
    fs.writeFileSync(path.join(dir, 'empty.png'), '');
    fs.writeFileSync(path.join(dir, 'junk.png'), 'not a png at all');
    fs.writeFileSync(path.join(dir, 'og', 'a.png'), validPng);
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('isValidCard accepts only a regular PNG-signature file', () => {
    expect(isValidCard(path.join(dir, 'ok.png'))).toBe(true);
    expect(isValidCard(path.join(dir, 'missing.png'))).toBe(false);
    expect(isValidCard(path.join(dir, 'empty.png'))).toBe(false);
    expect(isValidCard(path.join(dir, 'junk.png'))).toBe(false);
    expect(isValidCard(path.join(dir, 'sigonly.png'))).toBe(false);
    expect(isValidCard(path.join(dir, 'truncated.png'))).toBe(false);
    expect(isValidCard(path.join(dir, 'small.png'))).toBe(false);
    expect(isValidCard(path.join(dir, 'og'))).toBe(false);
  });

  it('ogImageFor picks the card, the fallback, or the site image', () => {
    expect(ogImageFor({ project: { slug: 'a' } }, dir)).toBe('/og/a.png');
    expect(ogImageFor({ project: { slug: 'b' } }, dir)).toBe('/og-image.png');
    expect(ogImageFor({ path: '/about' }, dir)).toBe('/og-image.png');
  });

  it('renderRoute writes the absolute URL to og:image and twitter:image', () => {
    const html = renderRoute(
      { title: 't', description: 'd', canonical: '/x/', ogImage: '/og/a.png' },
      '<head><title>x</title><meta name="description" content="x" /><meta property="og:title" content="x" />' +
        '<meta property="og:description" content="x" /><meta name="twitter:title" content="x" />' +
        '<meta name="twitter:description" content="x" /><meta property="og:url" content="x" />' +
        '<meta property="og:image" content="x" /><meta name="twitter:image" content="x" />' +
        '<link rel="canonical" href="x" /></head>',
    );
    expect(html).toContain('<meta property="og:image" content="https://edwardkubiak.com/og/a.png" />');
    expect(html).toContain('<meta name="twitter:image" content="https://edwardkubiak.com/og/a.png" />');
  });
});

describe('datasetJsonLd', () => {
  it('builds a schema.org Dataset node for compute-atlas from ATLAS_DATASET', () => {
    const node = datasetJsonLd(atlas);
    expect(node).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: ATLAS_DATASET.title,
      description: ATLAS_DATASET.description,
      identifier: ATLAS_DATASET.doiUrl,
      url: ATLAS_DATASET.doiUrl,
      license: ATLAS_DATASET.licenseUrl,
      isAccessibleForFree: true,
      creator: { '@type': 'Person', name: 'Edward Kubiak', url: 'https://edwardkubiak.com' },
      publisher: { '@type': 'Organization', name: 'Zenodo' },
      isBasedOn: atlas.github,
    });
    expect(node.identifier).toContain(ATLAS_DATASET.doi);
  });

  it('returns null for a project without a dataset', () => {
    expect(datasetJsonLd(without)).toBeNull();
  });

  it('stays valid JSON once escaped for a script tag', () => {
    const escaped = escapeJsonForScriptTag(JSON.stringify(datasetJsonLd(atlas)));
    expect(escaped).not.toContain('</');
    expect(JSON.parse(escaped)['@type']).toBe('Dataset');
  });
});

describe('prerender-routes process behaviour', () => {
  const script = path.resolve(import.meta.dirname, 'prerender-routes.mjs');
  const indexHtml = `<!doctype html><html><head>
<title>x</title>
<meta name="description" content="x" />
<meta property="og:title" content="x" />
<meta property="og:description" content="x" />
<meta name="twitter:title" content="x" />
<meta name="twitter:description" content="x" />
<meta property="og:url" content="x" />
<meta property="og:image" content="x" />
<meta name="twitter:image" content="x" />
<link rel="canonical" href="x" />
</head><body></body></html>`;
  let tmp;

  const freshDist = () => {
    const dist = fs.mkdtempSync(path.join(tmp, 'dist-'));
    fs.writeFileSync(path.join(dist, 'index.html'), indexHtml);
    return dist;
  };
  const run = (args, dist) =>
    spawnSync('node', args, { env: { ...process.env, PRERENDER_DIST: dist }, encoding: 'utf8', timeout: 60_000 });

  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prerender-'));
  });
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('writes route shells when run directly', () => {
    const dist = freshDist();
    const res = run([script], dist);
    expect(res.status, res.stderr).toBe(0);
    expect(fs.existsSync(path.join(dist, 'about', 'index.html'))).toBe(true);
    const atlas = fs.readFileSync(path.join(dist, 'projects', 'compute-atlas', 'index.html'), 'utf8');
    expect(atlas).toContain('"@type":"Dataset"');
  });

  it('writes route shells when run through a symlink', () => {
    const dist = freshDist();
    const link = path.join(tmp, 'prerender-link.mjs');
    fs.symlinkSync(script, link);
    const res = run([link], dist);
    expect(res.status, res.stderr).toBe(0);
    expect(fs.existsSync(path.join(dist, 'about', 'index.html'))).toBe(true);
  });

  it('wires a valid card, falls back for the rest, and warns', () => {
    const dist = freshDist();
    fs.mkdirSync(path.join(dist, 'og'));
    fs.writeFileSync(path.join(dist, 'og', 'compute-atlas.png'), validPng);
    const res = spawnSync('node', [script], {
      env: { ...process.env, PRERENDER_DIST: dist, GITHUB_ACTIONS: 'true' },
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(res.status, res.stderr).toBe(0);
    const og = (slug) =>
      /<meta property="og:image" content="([^"]*)"/.exec(
        fs.readFileSync(path.join(dist, 'projects', slug, 'index.html'), 'utf8'),
      )[1];
    expect(og('compute-atlas')).toBe('https://edwardkubiak.com/og/compute-atlas.png');
    const other = projects.find((p) => p.slug !== 'compute-atlas' && !p.archived);
    expect(og(other.slug)).toBe('https://edwardkubiak.com/og-image.png');
    expect(res.stderr).toContain(`no valid OG card for ${projects.filter((p) => !p.archived).length - 1} of`);
    expect(res.stdout).toContain('::warning title=OG cards::');
  });

  it('writes nothing when only imported', () => {
    const dist = freshDist();
    const res = run(['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)})`], dist);
    expect(res.status, res.stderr).toBe(0);
    expect(fs.readdirSync(dist)).toEqual(['index.html']);
    expect(fs.readFileSync(path.join(dist, 'index.html'), 'utf8')).toBe(indexHtml);
  });
});

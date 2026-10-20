import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { datasetJsonLd, escapeJsonForScriptTag } from './prerender-routes.mjs';
import projects from '../src/data/projects.js';
import { ATLAS_DATASET } from '../src/data/atlasDataset.js';

const atlas = projects.find((p) => p.slug === 'compute-atlas');
const without = projects.find((p) => !p.dataset);

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

  it('writes nothing when only imported', () => {
    const dist = freshDist();
    const res = run(['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)})`], dist);
    expect(res.status, res.stderr).toBe(0);
    expect(fs.readdirSync(dist)).toEqual(['index.html']);
    expect(fs.readFileSync(path.join(dist, 'index.html'), 'utf8')).toBe(indexHtml);
  });
});

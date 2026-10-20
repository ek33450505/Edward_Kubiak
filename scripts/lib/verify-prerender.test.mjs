import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { verifyPrerender } from './verify-prerender.mjs';

const LD = '<script type="application/ld+json">{}</script>';
const WEBSITE = '<script type="application/ld+json">{"@type":"WebSite"}</script>';
const shell = (title, extra = '', { desc = 'Desc', ogUrl = 'https://edwardkubiak.com/x/' } = {}) =>
  `<html><head><title>${title}</title><meta name="description" content="${desc}" />` +
  `<meta property="og:url" content="${ogUrl}" />${LD}${WEBSITE}${extra}</head></html>`;
const routes = [
  { path: '/', title: 'Home & more', description: 'Desc', canonical: '/x/' },
  { path: '/about', title: 'About', description: 'Desc', canonical: '/x/' },
  { path: '/projects/compute-atlas', title: 'Atlas', description: 'Desc', canonical: '/x/', project: { dataset: {} } },
];

let tmp;
const write = (dist, rel, html) => {
  fs.mkdirSync(path.dirname(path.join(dist, rel)), { recursive: true });
  fs.writeFileSync(path.join(dist, rel), html);
};
const goodDist = () => {
  const dist = fs.mkdtempSync(path.join(tmp, 'd-'));
  write(dist, 'index.html', shell('Home &amp; more'));
  write(dist, 'about/index.html', shell('About'));
  write(dist, 'projects/compute-atlas/index.html', shell('Atlas', '<script>"@type":"Dataset"</script>'));
  return dist;
};

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-prerender-'));
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('verifyPrerender', () => {
  it('passes a fully prerendered dist (titles compared HTML-escaped)', () => {
    expect(verifyPrerender(goodDist(), routes)).toEqual([]);
  });

  it('fails a missing shell', () => {
    const dist = goodDist();
    fs.rmSync(path.join(dist, 'about'), { recursive: true });
    expect(verifyPrerender(dist, routes).join('\n')).toMatch(/\/about: missing/);
  });

  it('fails a wrong title', () => {
    const dist = goodDist();
    write(dist, 'about/index.html', shell('Other'));
    expect(verifyPrerender(dist, routes).join('\n')).toMatch(/\/about: <title>/);
  });

  it('fails a shell without JSON-LD', () => {
    const dist = goodDist();
    write(dist, 'about/index.html', '<html><head><title>About</title></head></html>');
    expect(verifyPrerender(dist, routes).join('\n')).toMatch(/\/about: no application\/ld\+json/);
  });

  it('fails a dataset route without the Dataset node', () => {
    const dist = goodDist();
    write(dist, 'projects/compute-atlas/index.html', shell('Atlas'));
    expect(verifyPrerender(dist, routes).join('\n')).toMatch(/compute-atlas: missing Dataset/);
  });

  it('fails the root when only the vite-authored head is present (no WebSite node)', () => {
    const dist = goodDist();
    write(dist, 'index.html', `<html><head><title>Home &amp; more</title><meta name="description" content="Desc" /><meta property="og:url" content="https://edwardkubiak.com/x/" />${LD}</head></html>`);
    expect(verifyPrerender(dist, routes).join('\n')).toMatch(/\/: missing WebSite/);
  });

  it('fails a wrong meta description', () => {
    const dist = goodDist();
    write(dist, 'about/index.html', shell('About', '', { desc: 'Other' }));
    expect(verifyPrerender(dist, routes).join('\n')).toMatch(/\/about: meta description/);
  });

  it('fails a wrong og:url', () => {
    const dist = goodDist();
    write(dist, 'about/index.html', shell('About', '', { ogUrl: 'https://example.com/' }));
    expect(verifyPrerender(dist, routes).join('\n')).toMatch(/\/about: og:url/);
  });

  it('fails an empty route list and a missing dist dir', () => {
    expect(verifyPrerender(goodDist(), [])).not.toEqual([]);
    expect(verifyPrerender(path.join(tmp, 'nope'), routes)).not.toEqual([]);
  });
});

describe('verify-prerender process behaviour', () => {
  const scripts = path.resolve(import.meta.dirname, '..');
  const minimalIndex = `<!doctype html><html><head><title>x</title>
<meta name="description" content="x" /><meta property="og:title" content="x" />
<meta property="og:description" content="x" /><meta name="twitter:title" content="x" />
<meta name="twitter:description" content="x" /><meta property="og:url" content="x" />
<link rel="canonical" href="x" /></head><body></body></html>`;
  const run = (script, dist) =>
    spawnSync('node', [path.join(scripts, script)], {
      env: { ...process.env, PRERENDER_DIST: dist },
      encoding: 'utf8',
      timeout: 60_000,
    });

  it('exits 0 after prerender has run', () => {
    const dist = fs.mkdtempSync(path.join(tmp, 'p-'));
    fs.writeFileSync(path.join(dist, 'index.html'), minimalIndex);
    expect(run('prerender-routes.mjs', dist).status).toBe(0);
    const res = run('verify-prerender.mjs', dist);
    expect(res.status, res.stderr).toBe(0);
  });

  it('exits 1 naming routes when prerender did not run', () => {
    const dist = fs.mkdtempSync(path.join(tmp, 'p-'));
    fs.writeFileSync(path.join(dist, 'index.html'), minimalIndex);
    const res = run('verify-prerender.mjs', dist);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('/about: missing');
  });
});

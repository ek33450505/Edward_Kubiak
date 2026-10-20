import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml, toAbsUrl } from '../prerender-routes.mjs';

const LD_JSON = /<script type="application\/ld\+json">/;

// Value of content="..." on the <meta> tag carrying matchAttr (a hardcoded literal), or null.
function metaContent(html, matchAttr) {
  const m = new RegExp(`<meta[^>]*${matchAttr}[^>]*content="([^"]*)"`).exec(html);
  return m ? m[1] : null;
}

/**
 * Fail-closed check that every route has a prerendered head shell in distDir.
 * Returns a list of failure strings; an empty list means every route verified.
 * An empty route list or missing dist dir is itself a failure, never a pass.
 */
export function verifyPrerender(distDir, routes) {
  if (!fs.existsSync(distDir)) return [`dist dir missing: ${distDir}`];
  if (!Array.isArray(routes) || routes.length === 0) return ['no routes to verify'];

  const failures = [];
  for (const route of routes) {
    const file =
      route.path === '/' ? path.join(distDir, 'index.html') : path.join(distDir, route.path.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(file)) {
      failures.push(`${route.path}: missing ${file}`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(`<title>${escapeHtml(route.title)}</title>`)) {
      failures.push(`${route.path}: <title> does not match "${route.title}"`);
    }
    if (!LD_JSON.test(html)) failures.push(`${route.path}: no application/ld+json block`);
    // vite's own index.html already carries a title and a ld+json block, so "/" would pass
    // those checks un-prerendered; the WebSite node is injected only by prerender (every route).
    if (!html.includes('"@type":"WebSite"')) failures.push(`${route.path}: missing WebSite JSON-LD`);
    const description = metaContent(html, 'name="description"');
    if (description !== escapeHtml(route.description)) {
      failures.push(`${route.path}: meta description does not match`);
    }
    const ogUrl = metaContent(html, 'property="og:url"');
    if (ogUrl !== escapeHtml(toAbsUrl(route.canonical))) {
      failures.push(`${route.path}: og:url does not match ${toAbsUrl(route.canonical)}`);
    }
    if (route.project?.dataset && !html.includes('"@type":"Dataset"')) {
      failures.push(`${route.path}: missing Dataset JSON-LD`);
    }
  }
  return failures;
}

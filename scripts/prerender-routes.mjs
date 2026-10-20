import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { isDirectInvocation } from './lib/direct-invocation.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = process.env.PRERENDER_DIST || join(__dirname, '../dist');
const routeMetaPath = join(__dirname, '../src/data/routeMeta.js');
const projectsPath = join(__dirname, '../src/data/projects.js');
const indexPath = join(distDir, 'index.html');

export const BASE_URL = 'https://edwardkubiak.com';

// ── Escaping / helpers ────────────────────────────────────────────────────────
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Replace the content="..." value of a tag identified by a stable attribute
 * (e.g. property="og:title", name="description"). Anchored tightly to the
 * tag containing matchAttr so only the intended tag is touched.
 *
 * `matchAttr` MUST be a hardcoded string literal from this file (it is
 * interpolated directly into a RegExp) — never pass route/project data here.
 */
function setAttrContent(html, matchAttr, value) {
  const escaped = escapeHtml(value);
  const re = new RegExp(`(<meta[^>]*${matchAttr}[^>]*content=")[^"]*("[^>]*>)`);
  if (!re.test(html)) {
    throw new Error(`setAttrContent: no match for ${matchAttr}`);
  }
  // Use a function replacer so `$`-sequences in escaped values (e.g. "$1")
  // are never reinterpreted as regex replacement patterns.
  return html.replace(re, (_match, pre, post) => `${pre}${escaped}${post}`);
}

function setTitle(html, title) {
  const escaped = escapeHtml(title);
  return html.replace(/<title>[^<]*<\/title>/, () => `<title>${escaped}</title>`);
}

function setCanonical(html, absUrl) {
  return html.replace(
    /(<link rel="canonical" href=")[^"]*("[^>]*>)/,
    (_match, pre, post) => `${pre}${absUrl}${post}`,
  );
}

// Escape sequences that could break out of a <script> element when JSON is
// embedded literally (e.g. a description containing the string "</script>").
// Standard mitigation: escape "/" following "<" so "</script>" can never
// appear verbatim inside the JSON payload.
export function escapeJsonForScriptTag(json) {
  return json.replace(/</g, '\\u003c');
}

function injectJsonLd(html, ...objects) {
  const scripts = objects
    .map((obj) => `    <script type="application/ld+json">\n${escapeJsonForScriptTag(JSON.stringify(obj))}\n    </script>`)
    .join('\n');
  return html.replace('</head>', () => `${scripts}\n  </head>`);
}

export function toAbsUrl(path) {
  if (path === '/') return `${BASE_URL}/`;
  return `${BASE_URL}${path}`;
}

// ── OG cards ─────────────────────────────────────────────────────────────────
export const SITE_OG_IMAGE = '/og-image.png';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Matches og:image:width/height in index.html.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

// A card counts only if it is a regular PNG: signature, an IHDR chunk of exactly
// OG_WIDTH x OG_HEIGHT, and a closing IEND chunk. A zero-byte, truncated or wrongly
// sized file from a failed render is treated as missing. Never throws.
export function isValidCard(file) {
  let fd;
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size < 24 + PNG_IEND.length) return false;
    fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(24);
    if (fs.readSync(fd, head, 0, 24, 0) !== 24) return false;
    if (!head.subarray(0, 8).equals(PNG_SIGNATURE)) return false;
    if (head.toString('latin1', 12, 16) !== 'IHDR') return false;
    if (head.readUInt32BE(16) !== OG_WIDTH || head.readUInt32BE(20) !== OG_HEIGHT) return false;
    const tail = Buffer.alloc(PNG_IEND.length);
    if (fs.readSync(fd, tail, 0, tail.length, stat.size - tail.length) !== tail.length) return false;
    return tail.equals(PNG_IEND);
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }
}

export function ogImageFor(route, dist) {
  if (route.project) {
    const slug = route.project.slug;
    if (isValidCard(join(dist, 'og', `${slug}.png`))) return `/og/${slug}.png`;
  }
  return SITE_OG_IMAGE;
}

// ── JSON-LD builders ─────────────────────────────────────────────────────────
function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Edward Kubiak',
    url: BASE_URL,
  };
}

function breadcrumbJsonLd(project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Projects', item: `${BASE_URL}/projects/` },
      { '@type': 'ListItem', position: 3, name: project.title, item: `${BASE_URL}/projects/${project.slug}/` },
    ],
  };
}

function softwareSourceCodeJsonLd(project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.title,
    description: project.summary ?? project.description,
    codeRepository: project.github,
    programmingLanguage: project.tech,
    author: {
      '@type': 'Person',
      name: 'Edward Kubiak',
      url: BASE_URL,
    },
  };
}

export function datasetJsonLd(project) {
  if (!project.dataset) return null;
  const { title, description, doiUrl, licenseUrl, publisher } = project.dataset;
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: title,
    description,
    identifier: doiUrl,
    url: doiUrl,
    license: licenseUrl,
    isAccessibleForFree: true,
    creator: { '@type': 'Person', name: 'Edward Kubiak', url: BASE_URL },
    publisher: { '@type': 'Organization', name: publisher },
    isBasedOn: project.github,
  };
}

function softwareApplicationJsonLd(project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    url: project.link,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: project.summary ?? project.description,
  };
}

// ── Render one route's head ─────────────────────────────────────────────────
export function renderRoute(route, indexHtml) {
  let html = indexHtml;
  html = setTitle(html, route.title);
  html = setAttrContent(html, 'name="description"', route.description);
  html = setAttrContent(html, 'property="og:title"', route.title);
  html = setAttrContent(html, 'property="og:description"', route.description);
  html = setAttrContent(html, 'name="twitter:title"', route.title);
  html = setAttrContent(html, 'name="twitter:description"', route.description);
  html = setAttrContent(html, 'property="og:url"', toAbsUrl(route.canonical));
  html = setAttrContent(html, 'property="og:image"', toAbsUrl(route.ogImage ?? SITE_OG_IMAGE));
  html = setAttrContent(html, 'name="twitter:image"', toAbsUrl(route.ogImage ?? SITE_OG_IMAGE));
  html = setCanonical(html, toAbsUrl(route.canonical));

  const jsonLdBlocks = [websiteJsonLd()];
  if (route.project) {
    jsonLdBlocks.push(breadcrumbJsonLd(route.project));
    if (route.project.github) {
      jsonLdBlocks.push(softwareSourceCodeJsonLd(route.project));
    }
    if (route.project.link) {
      jsonLdBlocks.push(softwareApplicationJsonLd(route.project));
    }
    const dataset = datasetJsonLd(route.project);
    if (dataset) jsonLdBlocks.push(dataset);
  }
  html = injectJsonLd(html, ...jsonLdBlocks);

  return html;
}

// The one definition of which routes get a prerendered shell; the post-build
// verifier (scripts/verify-prerender.mjs) reuses it so the two cannot disagree.
export async function loadRoutes() {
  const { ROUTE_META } = await import(routeMetaPath);
  const projectsModule = await import(projectsPath);
  const projects = (projectsModule.default || []).filter((p) => !p.archived);

  const STATIC_ROUTES = Object.entries(ROUTE_META).map(([path, meta]) => ({
    path,
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
  }));

  const PROJECT_ROUTES = projects.map((p) => ({
    path: `/projects/${p.slug}`,
    title: `${p.title} — Edward Kubiak`,
    description: p.summary ?? p.description,
    canonical: `/projects/${p.slug}/`,
    project: p,
  }));

  return { STATIC_ROUTES, PROJECT_ROUTES, ROUTES: [...STATIC_ROUTES, ...PROJECT_ROUTES] };
}

async function main() {
  // ── Guard: dist must already be built ─────────────────────────────────────
  if (!fs.existsSync(indexPath)) {
    console.error(`prerender-routes: ${indexPath} not found — run vite build first.`);
    process.exit(1);
  }
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  let routes;
  try {
    routes = await loadRoutes();
  } catch (e) {
    console.error('Failed to load routes:', e.message);
    process.exit(1);
  }
  const { STATIC_ROUTES, PROJECT_ROUTES, ROUTES } = routes;

  // ── Write shells ──────────────────────────────────────────────────────────────
  let written = 0;
  const fellBack = [];
  for (const route of ROUTES) {
    try {
      const ogImage = ogImageFor(route, distDir);
      if (route.project && ogImage === SITE_OG_IMAGE) fellBack.push(route.project.slug);
      const html = renderRoute({ ...route, ogImage }, indexHtml);
      const outPath = route.path === '/'
        ? indexPath
        : join(distDir, route.path.replace(/^\//, ''), 'index.html');
      fs.mkdirSync(dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      written += 1;
    } catch (e) {
      console.error(`prerender-routes: failed to write shell for ${route.path}: ${e.message}`);
      process.exit(1);
    }
  }

  console.log(`Wrote ${written} prerendered head-only shells to ${distDir}`);
  console.log(`  ${STATIC_ROUTES.length} static routes + ${PROJECT_ROUTES.length} project routes = ${ROUTES.length} total`);

  const wired = PROJECT_ROUTES.length - fellBack.length;
  console.log(`  ${wired} of ${PROJECT_ROUTES.length} project pages wired to their OG card`);
  if (fellBack.length > 0) {
    const msg = `prerender-routes: no valid OG card for ${fellBack.length} of ${PROJECT_ROUTES.length} project page(s); using ${SITE_OG_IMAGE}: ${fellBack.join(', ')}`;
    console.warn(msg);
    if (process.env.GITHUB_ACTIONS === 'true') console.log(`::warning title=OG cards::${msg}`);
  }
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  await main();
}

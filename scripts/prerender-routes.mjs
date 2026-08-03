import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = process.env.PRERENDER_DIST || join(__dirname, '../dist');
const routeMetaPath = join(__dirname, '../src/data/routeMeta.js');
const projectsPath = join(__dirname, '../src/data/projects.js');
const indexPath = join(distDir, 'index.html');

const BASE_URL = 'https://edwardkubiak.com';

// ── Guard: dist must already be built ───────────────────────────────────────
if (!fs.existsSync(indexPath)) {
  console.error(`prerender-routes: ${indexPath} not found — run vite build first.`);
  process.exit(1);
}
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// ── Load route model ─────────────────────────────────────────────────────────
const { ROUTE_META } = await import(routeMetaPath);
let projects = [];
try {
  const projectsModule = await import(projectsPath);
  projects = (projectsModule.default || []).filter((p) => !p.archived);
} catch (e) {
  console.error('Failed to load projects:', e.message);
  process.exit(1);
}

// ── Escaping / helpers ────────────────────────────────────────────────────────
function escapeHtml(str) {
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
function escapeJsonForScriptTag(json) {
  return json.replace(/</g, '\\u003c');
}

function injectJsonLd(html, ...objects) {
  const scripts = objects
    .map((obj) => `    <script type="application/ld+json">\n${escapeJsonForScriptTag(JSON.stringify(obj))}\n    </script>`)
    .join('\n');
  return html.replace('</head>', () => `${scripts}\n  </head>`);
}

function toAbsUrl(path) {
  if (path === '/') return `${BASE_URL}/`;
  return `${BASE_URL}${path}`;
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

// ── Route list ────────────────────────────────────────────────────────────────
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

const ROUTES = [...STATIC_ROUTES, ...PROJECT_ROUTES];

// ── Render one route's head ─────────────────────────────────────────────────
function renderRoute(route) {
  let html = indexHtml;
  html = setTitle(html, route.title);
  html = setAttrContent(html, 'name="description"', route.description);
  html = setAttrContent(html, 'property="og:title"', route.title);
  html = setAttrContent(html, 'property="og:description"', route.description);
  html = setAttrContent(html, 'name="twitter:title"', route.title);
  html = setAttrContent(html, 'name="twitter:description"', route.description);
  html = setAttrContent(html, 'property="og:url"', toAbsUrl(route.canonical));
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
  }
  html = injectJsonLd(html, ...jsonLdBlocks);

  return html;
}

// ── Write shells ──────────────────────────────────────────────────────────────
let written = 0;
for (const route of ROUTES) {
  try {
    const html = renderRoute(route);
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

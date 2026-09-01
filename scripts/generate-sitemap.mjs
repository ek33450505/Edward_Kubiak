import fs from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const projectsPath = join(__dirname, '../src/data/projects.js');
const outPath = join(__dirname, '../public/sitemap.xml');

const BASE_URL = 'https://edwardkubiak.com';
const TODAY = new Date().toISOString().slice(0, 10);

// Last commit date (YYYY-MM-DD) touching any of `paths`, or null if git can't
// answer — shallow clone, path never committed, or git unavailable.
// `lastmod` must reflect real content change: dating it to the deploy instead
// makes every static route look modified daily (the deploy cron runs every
// morning), and Google discards lastmod site-wide once it reads as unreliable.
function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function gitLastModified(paths) {
  const out = git(['log', '-1', '--format=%cs', '--', ...paths]);
  return out && /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
}

// A shallow clone cannot answer "when did this file last change". Worse, it
// answers WRONGLY without erroring: the grafted tip reads as the commit that
// added every file, so every route silently dates to the deploy — exactly the
// churn this script avoids. Detect shallowness directly; git's exit code won't.
const IS_SHALLOW = git(['rev-parse', '--is-shallow-repository']) === 'true';

// Static route table — order matters for sitemap priority scanning.
// `sources` are the files whose commits genuinely change the rendered page.
const STATIC_ROUTES = [
  { path: '/',         priority: '1.0', changefreq: 'weekly',
    sources: ['src/Components/Home.jsx', 'src/Components/Home', 'src/data/projects.js'] },
  { path: '/projects', priority: '0.9', changefreq: 'weekly',
    sources: ['src/Components/Portfolio.jsx', 'src/data/projects.js'] },
  { path: '/about',    priority: '0.8', changefreq: 'monthly',
    sources: ['src/Components/About.jsx'] },
  { path: '/resume',   priority: '0.7', changefreq: 'monthly',
    sources: ['src/Components/Resume.jsx', 'src/data/resume.js'] },
  { path: '/now',      priority: '0.5', changefreq: 'weekly',
    sources: ['src/Components/Now.jsx', 'src/data/now.js'] },
];

// Read and parse projects
let projects = [];
try {
  const projectsModule = await import(projectsPath);
  projects = projectsModule.default || [];
  // Filter out archived projects (no archived flag → include all)
  projects = projects.filter(p => !p.archived);
} catch (e) {
  console.error('Failed to load projects:', e.message);
  process.exit(1);
}

// Build <url> entries
function urlEntry({ loc, lastmod, priority, changefreq }) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const entries = [];

// Static routes — lastmod is the last commit date of the files backing the page,
// falling back to today only when git can't answer (see gitLastModified).
// Root stays `/`; every sub-route gets a trailing slash to match the 200 that
// GitHub Pages actually serves (directory-index 301s from the no-slash form).
let staleLastmod = 0;
for (const route of STATIC_ROUTES) {
  const loc = route.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.path}/`;
  const lastmod = gitLastModified(route.sources);
  if (!lastmod) staleLastmod++;
  entries.push(urlEntry({
    loc,
    lastmod: lastmod || TODAY,
    priority: route.priority,
    changefreq: route.changefreq,
  }));
}

// Dynamic project routes — lastmod is the project's real dateAdded
for (const project of projects) {
  const priority = project.featured ? '0.7' : '0.6';
  entries.push(urlEntry({
    loc: `${BASE_URL}/projects/${project.slug}/`,
    lastmod: project.dateAdded || TODAY,
    priority,
    changefreq: 'monthly',
  }));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

fs.writeFileSync(outPath, sitemap);
console.log(`Wrote sitemap to ${outPath}`);
console.log(`  ${STATIC_ROUTES.length} static routes + ${projects.length} project routes = ${entries.length} total URLs`);

if (IS_SHALLOW) {
  console.warn(
    `WARNING: shallow git clone — <lastmod> for all ${STATIC_ROUTES.length} static routes ` +
    `is dated to this build, not to real content change. Set fetch-depth: 0 on the CI checkout.`
  );
} else if (staleLastmod > 0) {
  console.warn(
    `WARNING: ${staleLastmod}/${STATIC_ROUTES.length} static routes fell back to today's date for <lastmod> ` +
    `(git unavailable or sources never committed).`
  );
}

// Print all project slugs for verification
console.log('\nProject slugs included:');
for (const p of projects) {
  console.log(`  /projects/${p.slug}`);
}

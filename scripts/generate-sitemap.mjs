import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectsPath = join(__dirname, '../src/data/projects.js');
const outPath = join(__dirname, '../public/sitemap.xml');

const BASE_URL = 'https://edwardkubiak.com';
const TODAY = new Date().toISOString().slice(0, 10);

// Static route table — order matters for sitemap priority scanning
const STATIC_ROUTES = [
  { path: '/',        priority: '1.0', changefreq: 'weekly'  },
  { path: '/projects', priority: '0.9', changefreq: 'weekly'  },
  { path: '/about',   priority: '0.8', changefreq: 'monthly' },
  { path: '/resume',  priority: '0.7', changefreq: 'monthly' },
  { path: '/now',     priority: '0.5', changefreq: 'weekly'  },
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

// Static routes — lastmod tracks deploy date since these change with every deploy
for (const route of STATIC_ROUTES) {
  entries.push(urlEntry({
    loc: `${BASE_URL}${route.path}`,
    lastmod: TODAY,
    priority: route.priority,
    changefreq: route.changefreq,
  }));
}

// Dynamic project routes — lastmod is the project's real dateAdded
for (const project of projects) {
  const priority = project.featured ? '0.7' : '0.6';
  entries.push(urlEntry({
    loc: `${BASE_URL}/projects/${project.slug}`,
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

// Print all project slugs for verification
console.log('\nProject slugs included:');
for (const p of projects) {
  console.log(`  /projects/${p.slug}`);
}

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectsPath = join(__dirname, '../src/data/projects.js');
const devtoPath = join(__dirname, '../public/devto-feed.json');
const outPath = join(__dirname, '../public/rss.xml');

// Read and parse projects
let projects = [];
try {
  const projectsModule = await import(projectsPath);
  projects = projectsModule.default || [];
  // Filter to featured projects only for RSS
  projects = projects.filter(p => p.featured);
} catch (e) {
  console.error('Failed to load projects:', e.message);
}

// Read dev.to articles
let articles = [];
try {
  const content = fs.readFileSync(devtoPath, 'utf8');
  articles = JSON.parse(content) || [];
} catch (e) {
  console.warn('Failed to load dev.to feed:', e.message);
}

// Escape XML entities
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format date for RSS (RFC 822)
function formatRssDate(dateString) {
  const date = new Date(dateString);
  return date.toUTCString();
}

// Generate items: dev.to articles + featured projects
const items = [];

// Add dev.to articles
for (const article of articles) {
  items.push({
    title: article.title,
    description: article.description || '',
    link: article.url,
    pubDate: article.published_at,
    category: 'Writing',
  });
}

// Add featured projects
for (const project of projects) {
  const projectLink = `https://edwardkubiak.com/projects/${project.slug}`;
  items.push({
    title: project.title,
    description: project.description,
    link: projectLink,
    pubDate: new Date(0).toISOString(), // Placeholder
    category: 'Project',
  });
}

// Sort by date (newest first)
items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

// Generate RSS XML
const rssItems = items
  .map(
    item => `
  <item>
    <title>${escapeXml(item.title)}</title>
    <description>${escapeXml(item.description)}</description>
    <link>${escapeXml(item.link)}</link>
    <category>${escapeXml(item.category)}</category>
    <pubDate>${formatRssDate(item.pubDate)}</pubDate>
    <guid isPermaLink="true">${escapeXml(item.link)}</guid>
  </item>`
  )
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Edward Kubiak</title>
    <link>https://edwardkubiak.com</link>
    <description>Full Stack Developer & AI Systems Engineer — articles, projects, and insights</description>
    <language>en-us</language>
    <atom:link href="https://edwardkubiak.com/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>https://edwardkubiak.com/favicon.svg</url>
      <title>Edward Kubiak</title>
      <link>https://edwardkubiak.com</link>
    </image>
${rssItems}
  </channel>
</rss>`;

fs.writeFileSync(outPath, rss);
console.log(`Wrote RSS feed to ${outPath} with ${items.length} items`);

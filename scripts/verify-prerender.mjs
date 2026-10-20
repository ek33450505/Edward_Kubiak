// Post-build gate: fails the build if prerender-routes.mjs left any route without its head shell.
// Deliberately has NO direct-invocation guard — a misfiring guard must not be able to skip it.
import { join } from 'node:path';
import { loadRoutes } from './prerender-routes.mjs';
import { verifyPrerender } from './lib/verify-prerender.mjs';

// Limit: the route set comes from loadRoutes() itself, so there is no independent route-count floor
// (sitemap/ROUTE_META parity tests and the a11y scanner cover the route set).
const distDir = process.env.PRERENDER_DIST || join(import.meta.dirname, '../dist');
const { ROUTES } = await loadRoutes();
const failures = verifyPrerender(distDir, ROUTES);

if (failures.length) {
  console.error(`verify-prerender: ${failures.length} failure(s) in ${distDir}`);
  for (const f of failures) console.error(`  ${f}`);
} else {
  console.log(`verify-prerender: ${ROUTES.length} routes verified in ${distDir}`);
}
process.exitCode = failures.length ? 1 : 0;

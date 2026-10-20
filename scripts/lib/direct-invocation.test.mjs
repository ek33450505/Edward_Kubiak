import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDirectInvocation } from './direct-invocation.mjs';

// import.meta.url is not a file: URL under the jsdom test environment, so build it from dirname.
const self = path.resolve(import.meta.dirname, 'direct-invocation.test.mjs');
const selfUrl = pathToFileURL(self).href;
let tmp;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'direct-inv-'));
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('isDirectInvocation', () => {
  it('is true for the module real path', () => {
    expect(isDirectInvocation(self, selfUrl)).toBe(true);
  });

  it('is true for a symlink to the module', () => {
    const link = path.join(tmp, 'link.mjs');
    fs.symlinkSync(self, link);
    expect(isDirectInvocation(link, selfUrl)).toBe(true);
  });

  it('is true for a module URL with encoded characters', () => {
    const spaced = path.join(tmp, 'a b.mjs');
    fs.writeFileSync(spaced, '');
    expect(isDirectInvocation(spaced, pathToFileURL(spaced).href)).toBe(true);
  });

  it('is false for undefined and for an unrelated path', () => {
    expect(isDirectInvocation(undefined, selfUrl)).toBe(false);
    expect(isDirectInvocation(path.join(tmp, 'missing.mjs'), selfUrl)).toBe(false);
    const other = path.join(tmp, 'other.mjs');
    fs.writeFileSync(other, '');
    expect(isDirectInvocation(other, selfUrl)).toBe(false);
  });
});

describe('every script that inspects process.argv[1]', () => {
  const scriptsDir = path.resolve(import.meta.dirname, '..');
  const guarded = fs
    .readdirSync(scriptsDir)
    .filter((f) => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))
    .map((f) => ({ f, src: fs.readFileSync(path.join(scriptsDir, f), 'utf8') }))
    // The helper import counts too, so a guard replaced by `if (true)` cannot drop out of the set.
    .filter(({ src }) => src.includes('process.argv[1]') || src.includes('lib/direct-invocation.mjs'));

  it('finds the guarded scripts (an empty glob must not pass vacuously)', () => {
    expect(guarded.length).toBeGreaterThanOrEqual(10);
  });

  it('uses the shared symlink-safe helper and no inline comparison', () => {
    for (const { f, src } of guarded) {
      expect(src, `${f} imports the helper`).toMatch(/from ["']\.\/lib\/direct-invocation\.mjs["']/);
      expect(src, `${f} calls the helper`).toContain('isDirectInvocation(process.argv[1], import.meta.url)');
      expect(src, `${f} has no pathToFileURL guard`).not.toContain('pathToFileURL(process.argv[1]');
      expect(src, `${f} has no path.resolve guard`).not.toContain('path.resolve(process.argv[1])');
      expect(src, `${f} has no isMain const`).not.toContain('const isMain');
    }
  });
});

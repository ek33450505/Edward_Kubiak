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

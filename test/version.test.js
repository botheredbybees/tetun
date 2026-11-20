import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeVersion } from '../tools/stamp.mjs';

test('CACHE_VERSION matches the precached files, so a change cannot ship without a new version', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const current = sw.match(/const CACHE_VERSION = '([^']+)';/)[1];
  assert.equal(current, computeVersion(), 'precached files changed: run `npm run stamp` and commit sw.js');
});

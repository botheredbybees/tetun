import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../tools/build-site.mjs';

const root = new URL('../', import.meta.url);
const sw = readFileSync(new URL('sw.js', root), 'utf8');
const precache = JSON.parse(sw.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/)[1]);

function listFiles(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full, base) : [full.slice(base.length + 1)];
  });
}

test('the built site is exactly the precached files plus the worker and .nojekyll', () => {
  const dest = mkdtempSync(join(tmpdir(), 'tetun-site-'));
  try {
    buildSite(dest);
    const expected = new Set([...precache.map((u) => (u === './' ? 'index.html' : u)), 'sw.js', '.nojekyll']);
    assert.deepEqual(new Set(listFiles(dest)), expected);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('the built site leaves out the DIT lexicon, docs, tools and tests', () => {
  const dest = mkdtempSync(join(tmpdir(), 'tetun-site-'));
  try {
    buildSite(dest);
    const files = listFiles(dest);
    for (const banned of ['data/', 'docs/', 'tools/', 'test/', '.git', 'package.json', 'CLAUDE.md']) {
      assert.deepEqual(files.filter((f) => f.startsWith(banned)), [], banned);
    }
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('the built worker is byte-identical to the source worker', () => {
  const dest = mkdtempSync(join(tmpdir(), 'tetun-site-'));
  try {
    buildSite(dest);
    assert.equal(readFileSync(join(dest, 'sw.js'), 'utf8'), sw);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

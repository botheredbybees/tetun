import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const sw = read('sw.js');
const urls = JSON.parse(sw.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/)[1]);
const manifest = JSON.parse(read('manifest.webmanifest'));
const words = JSON.parse(read('content/words.json'));
const jsIn = (dir) => readdirSync(new URL(dir, root)).filter((f) => f.endsWith('.js')).map((f) => dir + f);

test('every precached URL exists on disk', () => {
  for (const url of urls) {
    assert.ok(existsSync(new URL(url === './' ? 'index.html' : url, root)), `missing ${url}`);
  }
});

test('the precache lists everything the app needs offline', () => {
  const required = [
    './', 'index.html', 'content/words.json', 'css/app.css', 'manifest.webmanifest', 'favicon.png',
    'apple-touch-icon-precomposed.png',
    ...jsIn('js/'), ...jsIn('js/views/'),
    ...manifest.icons.map((i) => i.src),
    ...words.topics.flatMap((t) => ['disabled', 'finished', 'ninja'].map((s) => `images/${t.icon}_${s}.png`)),
  ];
  const missing = required.filter((r) => !urls.includes(r));
  assert.deepEqual(missing, []);
});

test('the cache version is a non-empty string', () => {
  assert.match(sw, /const CACHE_VERSION = '[^']+';/);
});

test('the manifest is installable: name, standalone display, start URL and two icons', () => {
  assert.ok(manifest.name && manifest.short_name);
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.start_url);
  const sizes = manifest.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(icon.src, root)), `missing ${icon.src}`);
});

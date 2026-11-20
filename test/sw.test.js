import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const VERSION = source.match(/const CACHE_VERSION = '([^']+)';/)[1];
const ORIGIN = 'https://example.github.io';

/** Run sw.js in a sandbox with a fake Cache Storage and collect what it does. */
function loadWorker({ keys = [], cacheHit = undefined } = {}) {
  const listeners = {};
  const log = { deleted: [], opened: [], added: [], searchedEveryCache: false, matchedIn: [] };
  const caches = {
    keys: async () => keys,
    delete: async (key) => { log.deleted.push(key); return true; },
    match: async () => { log.searchedEveryCache = true; return undefined; },
    open: async (name) => {
      log.opened.push(name);
      return {
        addAll: async (requests) => { log.added.push(...requests); },
        match: async () => { log.matchedIn.push(name); return cacheHit; },
      };
    },
  };
  const self = {
    location: new URL(`${ORIGIN}/tetun/sw.js`),
    addEventListener: (type, fn) => { listeners[type] = fn; },
    clients: { claim: async () => {} },
    skipWaiting: () => { log.skipped = true; },
  };
  vm.runInNewContext(source, { self, caches, URL, Request, fetch: async () => 'network' });
  const run = async (type, extra = {}) => {
    const waits = [];
    const event = { waitUntil: (p) => waits.push(p), ...extra };
    listeners[type](event);
    await Promise.all(waits);
    return event;
  };
  return { listeners, log, run };
}

test('activate deletes only older tetun caches, never another app on the same origin', async () => {
  const { log, run } = loadWorker({ keys: ['tetun-oldversion', 'other-app-v1', VERSION, 'workbox-precache'] });
  await run('activate');
  assert.deepEqual(log.deleted, ['tetun-oldversion']);
});

test('install precaches every file with a request that bypasses the HTTP cache', async () => {
  const { log, run } = loadWorker();
  await run('install');
  assert.deepEqual(log.opened, [VERSION]);
  assert.ok(log.added.length > 40);
  for (const request of log.added) assert.equal(request.cache, 'reload', request.url);
  const urls = log.added.map((r) => r.url);
  assert.ok(urls.includes(`${ORIGIN}/tetun/`));
  assert.ok(urls.includes(`${ORIGIN}/tetun/css/app.css`));
});

test('fetch answers from this version of the cache only, not from every cache on the origin', async () => {
  const { log, run } = loadWorker({ cacheHit: 'cached' });
  let answer;
  await run('fetch', {
    request: { method: 'GET', url: `${ORIGIN}/tetun/css/app.css` },
    respondWith: (p) => { answer = p; },
  });
  assert.equal(await answer, 'cached');
  assert.deepEqual(log.matchedIn, [VERSION]);
  assert.equal(log.searchedEveryCache, false);
});

test('fetch falls back to the network on a cache miss', async () => {
  const { run } = loadWorker({ cacheHit: undefined });
  let answer;
  await run('fetch', { request: { method: 'GET', url: `${ORIGIN}/tetun/new.json` }, respondWith: (p) => { answer = p; } });
  assert.equal(await answer, 'network');
});

test('fetch leaves cross-origin and non-GET requests alone', async () => {
  const { run } = loadWorker();
  let touched = false;
  const respondWith = () => { touched = true; };
  await run('fetch', { request: { method: 'GET', url: 'https://github.com/botheredbybees/tetun/issues/new' }, respondWith });
  await run('fetch', { request: { method: 'POST', url: `${ORIGIN}/tetun/x` }, respondWith });
  assert.equal(touched, false);
});

test('the update message makes the waiting worker take over', async () => {
  const { log, listeners } = loadWorker();
  listeners.message({ data: { type: 'SKIP_WAITING' } });
  assert.equal(log.skipped, true);
});

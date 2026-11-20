// Computes a cache version from the contents of every precached file, so a change to any of them
// needs a new CACHE_VERSION. `npm run stamp` rewrites the version line in sw.js.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

export function computeVersion() {
  const sw = readFileSync(new URL('sw.js', root), 'utf8');
  const urls = JSON.parse(sw.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/)[1]);
  const hash = createHash('sha256');
  for (const url of [...new Set(urls)].sort()) {
    hash.update(`${url}\0`).update(readFileSync(new URL(url === './' ? 'index.html' : url, root))).update('\0');
  }
  return `tetun-${hash.digest('hex').slice(0, 10)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = new URL('sw.js', root);
  const version = computeVersion();
  writeFileSync(file, readFileSync(file, 'utf8').replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = '${version}';`));
  console.log(`CACHE_VERSION = ${version}`);
}

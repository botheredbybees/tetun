// Copies exactly the files the app needs into a folder for hosting: everything in PRECACHE_URLS,
// the service worker, and an empty .nojekyll so GitHub Pages serves the files untouched.
// Nothing else is published (not data/, docs/, tools/ or test/).  Usage: node tools/build-site.mjs _site
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export function buildSite(dest) {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const urls = JSON.parse(sw.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/)[1]);
  const files = new Set([...urls.map((u) => (u === './' ? 'index.html' : u)), 'sw.js']);
  mkdirSync(dest, { recursive: true });
  for (const file of files) {
    mkdirSync(dirname(join(dest, file)), { recursive: true });
    cpSync(join(root, file), join(dest, file));
  }
  writeFileSync(join(dest, '.nojekyll'), '');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dest = process.argv[2];
  if (!dest) {
    console.error('usage: node tools/build-site.mjs <output folder>');
    process.exit(1);
  }
  rmSync(dest, { recursive: true, force: true });
  buildSite(dest);
  console.log(`site written to ${dest}`);
}

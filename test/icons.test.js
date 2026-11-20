import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', root), 'utf8'));

/** Width and height from a PNG's IHDR chunk. */
function pngSize(path) {
  const bytes = readFileSync(new URL(path, root));
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG', `${path} is not a PNG`);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

test('every manifest icon is the size the manifest says it is', () => {
  for (const icon of manifest.icons) assert.equal(pngSize(icon.src), icon.sizes, icon.src);
});

test('the manifest has any-purpose icons at 192 and 512 and a separate maskable 512', () => {
  const find = (sizes, purpose) => manifest.icons.find((i) => i.sizes === sizes && (i.purpose ?? 'any') === purpose);
  assert.ok(find('192x192', 'any'));
  assert.ok(find('512x512', 'any'));
  assert.ok(find('512x512', 'maskable'));
});

test('the iOS home-screen icon is 180x180 and the favicon is 32x32', () => {
  assert.equal(pngSize('apple-touch-icon-precomposed.png'), '180x180');
  assert.equal(pngSize('favicon.png'), '32x32');
});

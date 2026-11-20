import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const raw = readFileSync(new URL('content/words.json', root), 'utf8');
const data = JSON.parse(raw);

test('has 12 topics, 33 lessons and 330 entries', () => {
  assert.equal(data.topics.length, 12);
  assert.equal(data.lessons.length, 33);
  assert.equal(data.entries.length, 330);
});

test('entry ids are unique and run w001 to w330', () => {
  const ids = data.entries.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], 'w001');
  assert.equal(ids[329], 'w330');
});

test('every entry resolves to a lesson and every lesson has entries', () => {
  const lessonIds = new Set(data.lessons.map((l) => l.id));
  const used = new Set();
  for (const e of data.entries) {
    const id = `${e.topic}-${e.lesson}`;
    assert.ok(lessonIds.has(id), `entry ${e.id} points at missing lesson ${id}`);
    used.add(id);
  }
  for (const l of data.lessons) {
    assert.ok(used.has(l.id), `lesson ${l.id} has no entries`);
    assert.equal(l.id, `${l.topic}-${l.number}`);
  }
});

test('no entry has an empty tetun or english field', () => {
  for (const e of data.entries) {
    assert.ok(e.tetun.trim() !== '', `${e.id} has empty tetun`);
    assert.ok(e.english.trim() !== '', `${e.id} has empty english`);
  }
});

test('each topic has its three icon files', () => {
  for (const t of data.topics) {
    for (const state of ['disabled', 'finished', 'ninja']) {
      const file = new URL(`images/${t.icon}_${state}.png`, root);
      assert.ok(existsSync(file), `missing images/${t.icon}_${state}.png`);
    }
  }
});

test('diacritics survive extraction', () => {
  assert.ok(raw.includes('Númeru'));
  assert.ok(raw.includes('Atividade loro-loron nian'));
});

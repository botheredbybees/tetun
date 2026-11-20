import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyProgress, loadProgress, saveProgress, recordLevel, recordMiss, recordHit, keptMissing, KEY,
} from '../js/progress.js';

const storageWith = (value) => ({ getItem: (k) => (k === KEY ? value : null) });
const entry = (id) => ({ id, tetun: id, english: id, topic: 't', lesson: 1 });

test('loadProgress falls back to empty for missing, corrupt or wrong-shaped values', () => {
  const bad = [null, 'not json', 'null', '[]', '42', '"x"', '{"levels":"x"}', '{"levels":[],"misses":7}', '{}'];
  for (const value of bad) {
    assert.deepEqual(loadProgress(storageWith(value)), emptyProgress(), `value: ${value}`);
  }
});

test('loadProgress falls back to empty when getItem throws', () => {
  const storage = { getItem() { throw new Error('denied'); } };
  assert.deepEqual(loadProgress(storage), emptyProgress());
});

test('loadProgress keeps valid fields and drops invalid ones', () => {
  const stored = JSON.stringify({
    levels: { 'greetings-1': 4, 'greetings-2': 9, 'greetings-3': -1, 'greetings-4': 'x', 'greetings-5': 2.5 },
    misses: { w001: 3, w002: -2, w003: 'many', w004: 0, w005: 1.5 },
  });
  assert.deepEqual(loadProgress(storageWith(stored)), { levels: { 'greetings-1': 4 }, misses: { w001: 3 } });
});

test('saveProgress returns false when setItem throws and true otherwise', () => {
  assert.equal(saveProgress({ setItem() { throw new Error('quota'); } }, emptyProgress()), false);
  assert.equal(saveProgress({ setItem() {} }, emptyProgress()), true);
});

test('save then load round-trips', () => {
  const box = {};
  const storage = { getItem: (k) => box[k] ?? null, setItem: (k, v) => { box[k] = v; } };
  const p = recordMiss(recordLevel(emptyProgress(), 'greetings-1', 3), 'w001');
  saveProgress(storage, p);
  assert.deepEqual(loadProgress(storage), p);
});

test('recordLevel keeps the higher of the old and new level', () => {
  let p = recordLevel(emptyProgress(), 'a-1', 4);
  p = recordLevel(p, 'a-1', 1);
  assert.equal(p.levels['a-1'], 4);
  p = recordLevel(p, 'a-2', 2);
  assert.equal(p.levels['a-2'], 2);
});

test('recordMiss counts up and recordHit counts down but never below 0', () => {
  let p = recordMiss(recordMiss(emptyProgress(), 'w001'), 'w001');
  assert.equal(p.misses.w001, 2);
  p = recordHit(recordHit(recordHit(p, 'w001'), 'w001'), 'w001');
  assert.deepEqual(p.misses, {});
  assert.deepEqual(recordHit(emptyProgress(), 'w999').misses, {});
});

test('keptMissing returns entries at or over the threshold, most missed first, capped by the limit', () => {
  const entries = ['a', 'b', 'c', 'd', 'e'].map(entry);
  const p = { levels: {}, misses: { a: 3, b: 5, c: 2, d: 3, e: 9 } };
  assert.deepEqual(keptMissing(p, entries).map((e) => e.id), ['e', 'b', 'a', 'd']);
  assert.deepEqual(keptMissing(p, entries, 3, 2).map((e) => e.id), ['e', 'b']);
  assert.deepEqual(keptMissing(p, entries, 6).map((e) => e.id), ['e']);
  assert.deepEqual(keptMissing(emptyProgress(), entries), []);
});

test('record functions do not mutate their input', () => {
  const p = Object.freeze({ levels: Object.freeze({ 'a-1': 1 }), misses: Object.freeze({ w001: 1 }) });
  recordLevel(p, 'a-1', 4);
  recordMiss(p, 'w001');
  recordHit(p, 'w001');
  assert.deepEqual(p, { levels: { 'a-1': 1 }, misses: { w001: 1 } });
});

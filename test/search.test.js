import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalise, search } from '../js/search.js';

const e = (id, tetun, english) => ({ id, tetun, english, topic: 't', lesson: 1 });
const ids = (list) => list.map((x) => x.id);

test('normalise lowercases, strips diacritics and collapses whitespace', () => {
  assert.equal(normalise('Númeru  Oras '), 'numeru oras');
});

test('empty, whitespace-only and punctuation-only queries return nothing', () => {
  const entries = [e('a', 'bondia', 'good morning')];
  assert.deepEqual(search(entries, ''), []);
  assert.deepEqual(search(entries, '   '), []);
  assert.deepEqual(search(entries, '!!'), []);
});

test('searching without accents or in capitals finds accented entries', () => {
  const entries = [e('a', 'Númeru', 'number'), e('b', 'oras', 'hour')];
  assert.deepEqual(ids(search(entries, 'numeru')), ['a']);
  assert.deepEqual(ids(search(entries, 'NÚMERU')), ['a']);
});

test('matches in either language', () => {
  const entries = [e('a', 'bondia', 'good morning'), e('b', 'botarde', 'good afternoon')];
  assert.deepEqual(ids(search(entries, 'good morning')), ['a']);
  assert.deepEqual(ids(search(entries, 'bondia')), ['a']);
});

test('ranks exact, then word-start, then substring, keeping original order within a group', () => {
  const entries = [
    e('sub1', 'abonu', 'x'),
    e('start1', 'bondia', 'y'),
    e('sub2', 'tabon', 'z'),
    e('exact', 'bon', 'w'),
    e('start2', 'bonita', 'v'),
  ];
  assert.deepEqual(ids(search(entries, 'bon')), ['exact', 'start1', 'start2', 'sub1', 'sub2']);
});

test('a multi-word query needs every word to match', () => {
  const entries = [e('a', 'bondia', 'good morning')];
  assert.deepEqual(ids(search(entries, 'morning good')), ['a']);
  assert.deepEqual(ids(search(entries, 'good evening')), []);
});

test('a hyphenated word can be searched for', () => {
  const entries = [e('a', 'loro-loron', 'every day')];
  assert.deepEqual(ids(search(entries, 'loro-loron')), ['a']);
});

test('real data: bondia is found from either side', () => {
  const { entries } = JSON.parse(readFileSync(new URL('../content/words.json', import.meta.url), 'utf8'));
  assert.ok(ids(search(entries, 'bondia')).length > 0);
  assert.ok(search(entries, 'good morning').some((x) => x.tetun === 'bondia'));
});

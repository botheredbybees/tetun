import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LessonGame, pointsPerMatch, levelFor, isMatch } from '../js/game.js';

const make = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `e${i + 1}`, tetun: `t${i + 1}`, english: `en${i + 1}`, topic: 't', lesson: 1 }));
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`);

/** Play every round perfectly. Returns the game. */
function playPerfect(game) {
  for (;;) {
    const { prompts } = game.deal();
    let last;
    for (const p of prompts) last = game.submit(p.id, p.id);
    if (last.lessonDone) return game;
    game.nextRound();
  }
}

test('pointsPerMatch(10) is about 1.81818 and the points of a perfect game sum to 100', () => {
  near(pointsPerMatch(10), 1.81818, 0.001);
  for (const n of [1, 3, 7, 10]) near(pointsPerMatch(n) * ((n * (n + 1)) / 2), 100);
});

test('levelFor uses the 50 / 70 / 99 thresholds', () => {
  assert.equal(levelFor(49.9), 1);
  assert.equal(levelFor(50), 2);
  assert.equal(levelFor(69.9), 2);
  assert.equal(levelFor(70), 3);
  assert.equal(levelFor(98.9), 3);
  assert.equal(levelFor(99), 4);
  assert.equal(levelFor(100), 4);
});

test('a 10-pair game played perfectly finishes at 100 with level 4', () => {
  const game = playPerfect(new LessonGame(make(10), seeded(1)));
  near(game.score, 100);
  assert.equal(game.finished, true);
  assert.equal(game.level, 4);
});

test('a 1-pair game finishes after one correct submit with score 100', () => {
  const game = new LessonGame(make(1), seeded(1));
  const { prompts } = game.deal();
  const result = game.submit(prompts[0].id, prompts[0].id);
  assert.deepEqual(result, { correct: true, roundDone: true, lessonDone: true });
  near(game.score, 100);
});

test('a 3-pair game uses rounds of 1, 2 and 3 pairs and alternates direction', () => {
  const game = new LessonGame(make(3), seeded(2));
  const sizes = [];
  const directions = [];
  for (;;) {
    const deal = game.deal();
    sizes.push(deal.prompts.length);
    directions.push(deal.direction);
    assert.equal(deal.answers.length, deal.prompts.length);
    let last;
    for (const p of deal.prompts) last = game.submit(p.id, p.id);
    if (last.lessonDone) break;
    game.nextRound();
  }
  assert.deepEqual(sizes, [1, 2, 3]);
  assert.deepEqual(directions, ['t2e', 'e2t', 't2e']);
  near(game.score, 100);
});

test('wrong taps cost 1 point, are recorded, and the score never goes below 0', () => {
  const game = new LessonGame(make(10), seeded(3));
  const first = game.deal().prompts[0];
  game.submit(first.id, first.id);
  near(game.score, pointsPerMatch(10));
  game.nextRound();
  const { prompts, answers } = game.deal();
  const wrong = answers.find((a) => a.id !== prompts[0].id);
  const before = game.score;
  const r = game.submit(prompts[0].id, wrong.id);
  assert.equal(r.correct, false);
  near(game.score, Math.max(0, before - 1));
  for (let i = 0; i < 5; i++) game.submit(prompts[0].id, wrong.id);
  assert.equal(game.score, 0);
  assert.equal(game.misses.length, 6);
  assert.ok(game.misses.every((id) => id === prompts[0].id));
});

test('the score never goes above 100', () => {
  const game = playPerfect(new LessonGame(make(4), seeded(4)));
  assert.ok(game.score <= 100);
});

test('equal English glosses are interchangeable in both directions', () => {
  const a = { id: 'a', tetun: 'lian Indonézia', english: 'Indonesian language', topic: 't', lesson: 1 };
  const b = { id: 'b', tetun: 'Bahasa', english: 'Indonesian language', topic: 't', lesson: 1 };
  const c = { id: 'c', tetun: 'hotu', english: 'all', topic: 't', lesson: 1 };
  assert.equal(isMatch(a, b), true);
  assert.equal(isMatch(b, a), true);
  assert.equal(isMatch(a, c), false);
  // final round of a 2-pair game is e2t, final round of a 3-pair game is t2e
  for (const entries of [[a, b], [a, b, c]]) {
    const game = new LessonGame(entries, seeded(5));
    for (let r = 1; r < entries.length; r++) {
      for (const p of game.deal().prompts) game.submit(p.id, p.id);
      game.nextRound();
    }
    const { prompts } = game.deal();
    const pa = prompts.find((p) => p.id === 'a');
    const result = game.submit(pa.id, 'b');
    assert.equal(result.correct, true);
    assert.deepEqual(game.misses, []);
    const pb = prompts.find((p) => p.id === 'b');
    assert.equal(game.submit(pb.id, 'a').correct, true);
  }
});

test('two games from the same entries do not share state', () => {
  const entries = make(5);
  const g1 = new LessonGame(entries, seeded(6));
  const g2 = new LessonGame(entries, seeded(6));
  const p = g1.deal().prompts[0];
  g1.submit(p.id, p.id);
  assert.equal(g2.score, 0);
  assert.equal(g2.round, 1);
  assert.deepEqual(g2.misses, []);
});

test('a seeded rng gives a repeatable deal and the input array is not mutated', () => {
  const entries = make(6);
  const copy = entries.map((e) => e.id);
  const g1 = new LessonGame(entries, seeded(7));
  const g2 = new LessonGame(entries, seeded(7));
  for (let i = 0; i < 3; i++) {
    for (const g of [g1, g2]) {
      for (const p of g.deal().prompts) g.submit(p.id, p.id);
      g.nextRound();
    }
  }
  assert.deepEqual(g1.deal().prompts.map((p) => p.id), g2.deal().prompts.map((p) => p.id));
  assert.deepEqual(g1.deal().answers.map((p) => p.id), g2.deal().answers.map((p) => p.id));
  assert.deepEqual(entries.map((e) => e.id), copy);
});

test('submit rejects ids outside the current round', () => {
  const game = new LessonGame(make(3), seeded(8));
  assert.throws(() => game.submit('nope', 'nope'), RangeError);
});

test('a perfect game scores exactly 100 for every lesson length, with no floating-point shortfall', () => {
  for (let n = 1; n <= 12; n++) {
    const game = playPerfect(new LessonGame(make(n), seeded(n)));
    assert.equal(game.score, 100, `n=${n} gave ${game.score}`);
  }
});

test('cleanIds lists the entries with no wrong tap anywhere in the game', () => {
  const entries = make(3);
  const game = new LessonGame(entries, seeded(10));
  let missed;
  for (let r = 1; r <= 3; r++) {
    const { prompts, answers } = game.deal();
    if (r === 2) {
      missed = prompts[0];
      game.submit(missed.id, answers.find((a) => a.id !== missed.id).id);
    }
    for (const p of prompts) game.submit(p.id, p.id);
    if (r < 3) game.nextRound();
  }
  assert.equal(game.finished, true);
  assert.deepEqual(game.cleanIds().sort(), entries.map((e) => e.id).filter((id) => id !== missed.id).sort());
});

test('cleanIds is every entry for a perfect game', () => {
  const entries = make(4);
  const game = playPerfect(new LessonGame(entries, seeded(11)));
  assert.deepEqual(game.cleanIds().sort(), entries.map((e) => e.id).sort());
});

test('entries with the same Tetun word but different English are interchangeable', () => {
  const a = { id: 'a', tetun: 'ita', english: 'you (plural)', topic: 't', lesson: 1 };
  const b = { id: 'b', tetun: 'ita', english: 'we', topic: 't', lesson: 1 };
  const c = { id: 'c', tetun: 'nia', english: 'he, she', topic: 't', lesson: 1 };
  assert.equal(isMatch(a, b), true);
  assert.equal(isMatch(b, a), true);
  assert.equal(isMatch(a, c), false);
  const game = new LessonGame([a, b], seeded(12));
  for (const p of game.deal().prompts) game.submit(p.id, p.id);
  game.nextRound();
  const { prompts } = game.deal();
  const first = prompts[0].id;
  const other = first === 'a' ? 'b' : 'a';
  assert.equal(game.submit(first, other).correct, true);
  assert.deepEqual(game.misses, []);
});

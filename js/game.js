/** Points for one correct match in a lesson of n pairs: 100 split over 1+2+…+n matches. */
export function pointsPerMatch(n) {
  return 100 / ((n * (n + 1)) / 2);
}

/** Level for a finished lesson: 1 under 50, 2 under 70, 3 under 99, otherwise 4. */
export function levelFor(score) {
  if (score < 50) return 1;
  if (score < 70) return 2;
  if (score < 99) return 3;
  return 4;
}

/** Two entries match if they are the same entry or look identical on either side (same English or same Tetun). */
export function isMatch(a, b) {
  return a.id === b.id || a.english === b.english || a.tetun === b.tetun;
}

// Removes the floating-point drift from adding 55 fractional points, so a perfect game is exactly 100.
const tidy = (score) => Math.round(score * 1e6) / 1e6;

function shuffled(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One play of one lesson. Round r shows the first r pairs of a shuffled list,
 * and the direction alternates each round starting with Tetun to English.
 * Make a new LessonGame every time a lesson is opened.
 */
export class LessonGame {
  constructor(entries, rng = Math.random) {
    this._rng = rng;
    this._order = shuffled(entries, rng);
    this._answers = null;
    this._matchedPrompts = new Set();
    this._usedAnswers = new Set();
    this.total = entries.length;
    this.round = 1;
    this._score = 0;
    this.misses = [];
    this.finished = false;
  }

  /** Score from 0 to 100. */
  get score() {
    return tidy(this._score);
  }

  get level() {
    return levelFor(this.score);
  }

  deal() {
    const prompts = this._order.slice(0, this.round);
    if (!this._answers) this._answers = shuffled(prompts, this._rng);
    return {
      direction: this.round % 2 === 1 ? 't2e' : 'e2t',
      prompts,
      answers: this._answers.slice(),
    };
  }

  submit(promptId, answerId) {
    if (this.finished) throw new RangeError('lesson is finished');
    const inRound = this._order.slice(0, this.round);
    const prompt = inRound.find((e) => e.id === promptId);
    const answer = inRound.find((e) => e.id === answerId);
    if (!prompt || !answer) throw new RangeError('id is not in the current round');
    if (this._matchedPrompts.has(promptId) || this._usedAnswers.has(answerId)) {
      throw new RangeError('already matched');
    }
    const correct = isMatch(prompt, answer);
    if (correct) {
      this._matchedPrompts.add(promptId);
      this._usedAnswers.add(answerId);
      this._score = Math.min(100, this._score + pointsPerMatch(this.total));
    } else {
      this._score = Math.max(0, this._score - 1);
      this.misses.push(promptId);
    }
    const roundDone = this._matchedPrompts.size === this.round;
    const lessonDone = roundDone && this.round === this.total;
    if (lessonDone) this.finished = true;
    return { correct, roundDone, lessonDone };
  }

  nextRound() {
    if (this.finished || this._matchedPrompts.size !== this.round) {
      throw new RangeError('round is not complete');
    }
    this.round += 1;
    this._answers = null;
    this._matchedPrompts = new Set();
    this._usedAnswers = new Set();
  }

  /** Ids of entries with no wrong tap anywhere in this game. Call it once the game is finished. */
  cleanIds() {
    const missed = new Set(this.misses);
    return this._order.map((e) => e.id).filter((id) => !missed.has(id));
  }
}

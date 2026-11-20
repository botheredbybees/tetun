import { h, announce } from '../dom.js';
import { LessonGame } from '../game.js';
import { keptMissing, recordHit, recordLevel, recordMiss } from '../progress.js';

const ICON_STATE = ['disabled', 'disabled', 'finished', 'finished', 'ninja'];
const LEVEL_WORD = ['not started', 'started', 'good', 'very good', 'ninja'];
const MESSAGES = {
  1: 'Struggle on brave student...',
  2: "Not bad, you could probably fake it for this topic, but a bit more practice wouldn't hurt",
  3: "Way to go! Don't forget to come back in a day or two to wire those synapses for good",
  4: 'Tetun ninja!',
};

/** Lesson list plus the tap-to-match game. `store` is { get(): Progress, set(p): void }. */
export function renderPractise(root, data, store) {
  function drawList() {
    const progress = store.get();
    const missed = keptMissing(progress, data.entries);
    const children = [];
    if (missed.length) {
      children.push(h('button', { type: 'button', class: 'lesson missed', onclick: () => playGame(missed, null, 'Words I keep missing') },
        h('span', { class: 'title' }, `Words I keep missing (${missed.length})`)));
    }
    for (const topic of data.topics) {
      children.push(h('section', { class: 'practise-topic' },
        h('h2', {}, `${topic.tetun} (${topic.english})`),
        h('div', { class: 'lessons' }, data.lessons.filter((l) => l.topic === topic.id).map((lesson) => {
          const level = progress.levels[lesson.id] ?? 0;
          const entries = data.entries.filter((e) => e.topic === topic.id && e.lesson === lesson.number);
          return h('button', {
            type: 'button', class: `lesson level-${level}`, 'aria-label': `${lesson.title}, ${LEVEL_WORD[level]}`,
            onclick: () => playGame(entries, lesson.id, `${topic.tetun}: ${lesson.title}`),
          },
          h('img', { src: `images/${topic.icon}_${ICON_STATE[level]}.png`, alt: '', width: 48, height: 48 }),
          h('span', { class: 'title' }, lesson.title));
        }))));
    }
    root.replaceChildren(h('section', { class: 'practise' }, children));
  }

  function playGame(entries, lessonId, title) {
    const game = new LessonGame(entries);
    const pButtons = new Map();
    const aButtons = new Map();
    let selected = null;
    let busy = false;
    let active = true;

    const barText = h('span', { class: 'bar-text' }, '0%');
    const fill = h('div', { class: 'fill' });
    const bar = h('div', { class: 'bar', role: 'progressbar', 'aria-label': 'Score', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0 }, fill, barText);
    const roundInfo = h('p', { class: 'round' });
    const board = h('div', { class: 'board' });

    const updateBar = () => {
      const pct = Math.round(game.score);
      fill.style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(pct));
      barText.textContent = `${pct}%`;
    };

    function drawRound() {
      const { direction, prompts, answers } = game.deal();
      const pSide = direction === 't2e' ? 'tetun' : 'english';
      const aSide = direction === 't2e' ? 'english' : 'tetun';
      const lang = (side) => (side === 'tetun' ? 'tet' : 'en');
      selected = null;
      pButtons.clear();
      aButtons.clear();
      roundInfo.textContent = `Round ${game.round} of ${game.total}`;
      announce(roundInfo.textContent);
      const column = (list, side, buttons, onpick) => h('div', { class: 'col' }, list.map((entry) => {
        const attrs = { type: 'button', class: 'card', lang: lang(side), onclick: () => onpick(entry.id) };
        if (buttons === pButtons) attrs['aria-pressed'] = 'false';
        const button = h('button', attrs, entry[side]);
        buttons.set(entry.id, button);
        return button;
      }));
      board.replaceChildren(column(prompts, pSide, pButtons, pickPrompt), column(answers, aSide, aButtons, pickAnswer));
      pButtons.values().next().value?.focus();
    }

    function pickPrompt(id) {
      const button = pButtons.get(id);
      if (busy || button.disabled) return;
      if (selected) {
        pButtons.get(selected).classList.remove('selected');
        pButtons.get(selected).setAttribute('aria-pressed', 'false');
      }
      selected = id;
      button.classList.add('selected');
      button.setAttribute('aria-pressed', 'true');
    }

    function pickAnswer(id) {
      const answer = aButtons.get(id);
      if (busy || !selected || answer.disabled) return;
      const promptId = selected;
      const prompt = pButtons.get(promptId);
      const result = game.submit(promptId, id);
      prompt.classList.remove('selected');
      prompt.setAttribute('aria-pressed', 'false');
      selected = null;
      if (result.correct) {
        announce('Correct');
        for (const b of [prompt, answer]) { b.disabled = true; b.classList.add('matched'); }
      } else {
        store.set(recordMiss(store.get(), promptId));
        announce('Wrong, try again');
        answer.classList.add('wrong');
        setTimeout(() => answer.classList.remove('wrong'), 400);
      }
      updateBar();
      if (result.lessonDone) {
        finish();
      } else if (result.roundDone) {
        busy = true;
        setTimeout(() => {
          if (!active) return;
          game.nextRound();
          busy = false;
          drawRound();
        }, 600);
      }
    }

    function finish() {
      if (lessonId) store.set(recordLevel(store.get(), lessonId, game.level));
      // A word's miss count drops once per game, and only if it was not missed in that game.
      store.set(game.cleanIds().reduce((p, id) => recordHit(p, id), store.get()));
      active = false;
      const heading = h('h2', { tabindex: '-1' }, 'Finished!');
      root.replaceChildren(h('section', { class: 'result' },
        heading,
        h('p', { class: 'score' }, `Score: ${Math.floor(game.score)}%`),
        h('p', {}, MESSAGES[game.level]),
        h('button', { type: 'button', class: 'primary', onclick: () => playGame(entries, lessonId, title) }, 'Play again'),
        h('button', { type: 'button', onclick: drawList }, 'Back to lessons')));
      heading.focus();
    }

    root.replaceChildren(h('section', { class: 'game' },
      h('div', { class: 'game-head' },
        h('h2', {}, title),
        h('button', { type: 'button', class: 'exit', onclick: () => { active = false; drawList(); } }, 'Exit')),
      bar, roundInfo, board));
    drawRound();
  }

  drawList();
}

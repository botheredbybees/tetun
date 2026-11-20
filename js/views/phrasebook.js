import { h } from '../dom.js';
import { search, normalise } from '../search.js';

const REPORT_URL = 'https://github.com/botheredbybees/tetun/issues/new';

/** Search box, topic browser and word detail view. */
export function renderPhrasebook(root, data) {
  const topics = new Map(data.topics.map((t) => [t.id, t]));
  const lessons = new Map(data.lessons.map((l) => [l.id, l]));
  const state = { query: '', topic: null, entry: null };

  const input = h('input', {
    type: 'search', id: 'search', placeholder: 'Search Tetun or English', 'aria-label': 'Search Tetun or English',
    autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false',
    oninput: (e) => { state.query = e.target.value; state.entry = null; draw(); },
  });
  const body = h('div', { id: 'phrasebook-body' });
  root.replaceChildren(h('section', { class: 'phrasebook' }, input, body));

  const open = (entry) => { state.entry = entry; draw(); };
  const entryButton = (entry) =>
    h('button', { type: 'button', class: 'entry', onclick: () => open(entry) },
      h('span', { class: 'tetun', lang: 'tet' }, entry.tetun),
      h('span', { class: 'english' }, entry.english));

  function detail(entry) {
    const topic = topics.get(entry.topic);
    const lesson = lessons.get(`${entry.topic}-${entry.lesson}`);
    const report = `${REPORT_URL}?title=${encodeURIComponent(`Correction: ${entry.tetun} / ${entry.english}`)}`;
    return h('article', { class: 'detail' },
      h('button', { type: 'button', class: 'back', onclick: () => open(null) }, '← Back'),
      h('p', { class: 'big-tetun', lang: 'tet' }, entry.tetun),
      h('p', { class: 'big-english' }, entry.english),
      h('p', { class: 'meta' }, `${topic.english}: ${lesson.title}`),
      h('a', { class: 'report', href: report, target: '_blank', rel: 'noopener' }, 'Report a mistake'));
  }

  function draw() {
    let content;
    if (state.entry) {
      content = detail(state.entry);
    } else if (/[\p{L}\p{N}]/u.test(normalise(state.query))) {
      const hits = search(data.entries, state.query);
      content = hits.length
        ? h('div', { class: 'list' }, hits.map(entryButton))
        : h('p', { class: 'empty' }, 'No match. Try another spelling, or clear the search to browse by topic.');
    } else if (state.topic) {
      const topic = topics.get(state.topic);
      content = h('div', {},
        h('button', { type: 'button', class: 'back', onclick: () => { state.topic = null; draw(); } }, '← All topics'),
        h('h2', {}, `${topic.tetun} (${topic.english})`),
        h('div', { class: 'list' }, data.entries.filter((e) => e.topic === state.topic).map(entryButton)));
    } else {
      content = h('div', { class: 'topics' }, data.topics.map((t) =>
        h('button', { type: 'button', class: 'topic', onclick: () => { state.topic = t.id; draw(); } },
          h('img', { src: `images/${t.icon}_finished.png`, alt: '', width: 48, height: 48 }),
          h('span', { class: 'tetun', lang: 'tet' }, t.tetun),
          h('span', { class: 'english' }, t.english))));
    }
    body.replaceChildren(content);
  }
  draw();
}

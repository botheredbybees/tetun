import { h } from './dom.js';
import { loadWords } from './data.js';
import { loadProgress, saveProgress } from './progress.js';
import { renderPhrasebook } from './views/phrasebook.js';

const root = document.getElementById('view');

// localStorage can be missing or throw (blocked cookies, private mode). Fall back to memory.
function pickStorage() {
  try {
    const probe = '__tetun_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const memory = new Map();
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => { memory.set(k, v); } };
  }
}
const storage = pickStorage();
let progress = loadProgress(storage);
export const store = {
  get: () => progress,
  set(next) { progress = next; saveProgress(storage, next); },
};

let data = null;
const views = {
  phrasebook: () => renderPhrasebook(root, data),
  practise: () => root.replaceChildren(h('p', {}, 'Practise is coming soon.')),
};

export function showView(name) {
  if (!data) return;
  for (const key of Object.keys(views)) {
    const tab = document.getElementById(`tab-${key}`);
    if (key === name) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  views[name]();
}

for (const name of Object.keys(views)) {
  document.getElementById(`tab-${name}`).addEventListener('click', () => showView(name));
}

try {
  data = await loadWords();
  showView('phrasebook');
} catch (error) {
  root.replaceChildren(h('p', { class: 'empty' }, 'The word list could not be loaded. Reload the page and try again.'));
  console.error(error);
}

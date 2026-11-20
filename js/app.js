import { h } from './dom.js';
import { loadWords } from './data.js';
import { loadProgress, saveProgress } from './progress.js';
import { renderPhrasebook } from './views/phrasebook.js';
import { renderPractise } from './views/practise.js';

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
  practise: () => renderPractise(root, data, store),
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

// Offline support. A new version waits until the visitor accepts the banner; it never reloads on its own.
function showUpdateBanner(onAccept) {
  const banner = h('div', { class: 'banner', role: 'status' },
    'An update is ready.',
    h('button', { type: 'button', onclick: () => { banner.remove(); onAccept(); } }, 'Reload'));
  document.body.append(banner);
}

function registerWorker() {
  if (!('serviceWorker' in navigator)) return;
  let reloadRequested = false;
  const offer = (worker) => showUpdateBanner(() => {
    reloadRequested = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((registration) => {
    if (registration.waiting && navigator.serviceWorker.controller) offer(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
      });
    });
  }).catch((error) => console.error('Service worker registration failed', error));
}
registerWorker();

try {
  data = await loadWords();
  showView('phrasebook');
} catch (error) {
  root.replaceChildren(h('p', { class: 'empty' }, 'The word list could not be loaded. Reload the page and try again.'));
  console.error(error);
}

# Tetun for Visitors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2014 jQuery drag-and-drop game with an offline-capable phrasebook PWA (search, browse, tap-to-match practise) over the existing 330 word pairs.

**Architecture:** Plain ES modules and static files, no build step. Pure logic (search, game, progress) lives in small modules tested with Node's built-in test runner. Thin DOM views in `js/views/` call those modules. Word data is one JSON file generated once from the old `js/main.js` arrays. A classic service worker caches the shell and data.

**Tech Stack:** HTML, CSS, ES modules, `localStorage`, Service Worker, Web App Manifest, `node --test` (Node 24 is installed). No runtime or dev dependencies.

**Spec:** `docs/superpowers/specs/2026-11-21-tetun-visitor-design.md`

## Global Constraints

- No build step and no runtime dependencies; `python3 -m http.server` must be enough to run it.
- Works at 360px width in current Chrome on Android and Safari on iOS, and in a desktop browser.
- A service worker needs HTTPS (`localhost` is exempt for testing).
- Tetun spelling keeps diacritics (for example `Númeru`); files are UTF-8; search ignores case and diacritics.
- Keep the existing 33 lessons and 12 topics as they are. Lesson length comes from the data, not a constant of 10.
- Scoring: a correct match is worth 100 / (1+2+…+n) points for a lesson of n pairs (about 1.818 when n is 10), a wrong tap costs 1, and the score stays between 0 and 100.
- Levels: under 50% = 1, 50-69 = 2, 70-98 = 3, 99-100 = 4. A saved level is never lowered.
- Progress is in `localStorage` (not a cookie), keyed by entry id and lesson id. Old cookie progress is not migrated. No analytics.
- Credit the DIT dictionary and Catharina Williams-van Klinken in the app, and say the lists were compiled by a learner and are open to correction.
- Build and test locally only. Do not deploy publicly until the DIT answer is in (`TETUN-013`).
- Commit messages quote the issue key, for example `TETUN-012`.

## Review Focus

Inputs the spec implies but no obvious task would exercise, most likely first. Each has a test in the task that owns it.

- Empty, whitespace-only or punctuation-only search query returns no results and does not throw (Task 2).
- Searching `numeru` or `NÚMERU` finds `Númeru` entries (Task 2).
- A corrupt, `null` or wrong-typed `localStorage` value, or storage that throws on read or write (private browsing, quota), leaves the app working with empty progress (Task 4).
- A game with a single pair, or fewer than ten, completes and keeps the score between 0 and 100 (Task 3).
- The two duplicate-gloss pairs (`lian Indonézia`/`Bahasa`, `hotu`/`hotu-hotu`) accept either answer in both directions (Task 3).

## File Structure

- `content/words.json`: topics, lessons and 330 entries (new).
- `js/search.js`, `js/game.js`, `js/progress.js`, `js/data.js`: pure logic and loading (new).
- `js/views/phrasebook.js`, `js/views/practise.js`, `js/app.js`: DOM and wiring (new).
- `index.html`, `css/app.css`, `manifest.webmanifest`, `sw.js`, `icons/` (new or rewritten).
- `test/*.test.js` and a root `package.json` containing only `{"type":"module","scripts":{"test":"node --test"}}` (new).
- Removed in Task 8: `js/main.js`, `js/vendor/`, `js/jquery.cookie.js`, `css/bootstrap*`, `css/main.css`, `fonts/`.

---

### Task 1: Word data file

**Files:**
- Create: `content/words.json`, `package.json`, `test/words.test.js`

**Interfaces:**
- Produces: `content/words.json` shaped `{ "topics": Topic[], "lessons": Lesson[], "entries": Entry[] }` where
  `Topic = { id: string, tetun: string, english: string, icon: string }`,
  `Lesson = { id: string, topic: string, number: number, title: string }` (`id` is `${topic}-${number}`, `number` is 1-based within the topic, `title` is the old `units` English title such as `Greetings I`),
  `Entry = { id: string, tetun: string, english: string, topic: string, lesson: number }` (`id` is `w001` to `w330` in the old array order).

- [ ] **Step 1: Write the failing test** in `test/words.test.js`: read `content/words.json` and assert 12 topics, 33 lessons, 330 entries, unique entry ids, every entry's `topic` and `lesson` resolve to a lesson, every lesson has at least one entry, no empty `tetun` or `english`, each topic's three icon files `images/<icon>_{disabled,finished,ninja}.png` exist, and the strings `Númeru` and `Atividade loro-loron nian` appear unchanged (diacritics intact).
- [ ] **Step 2: Run it to see it fail.** Run `npm test`. Expected: FAIL, file not found.
- [ ] **Step 3: Generate `content/words.json` once.** Use a throwaway Node script (not committed) that evaluates the text of `js/main.js` before `var progressArray` to get `CueCards`, `units` and `topics`. Derive `Topic.id` from the old icon key, split lessons by the old `topics[t][3]` page counts, and write the file as UTF-8 with 2-space indent. Add `package.json` as in File Structure.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** `content/words.json`, `package.json` and the test with message `TETUN-012: extract word data to JSON`.

### Task 2: Search

**Files:**
- Create: `js/search.js`, `test/search.test.js`

**Interfaces:**
- Produces: `normalise(text: string): string` (lowercase, NFD-decompose and strip combining marks, trim, collapse whitespace) and `search(entries: Entry[], query: string): Entry[]`.

- [ ] **Step 1: Write the failing tests** in `test/search.test.js`: `normalise('Númeru  Oras ')` is `'numeru oras'`; `search(entries, '')`, `'   '` and `'!!'` return `[]`; `'numeru'` and `'NÚMERU'` each return the `Númeru` entries; a query matches in either language (`'good morning'` finds `bondia`, `'bondia'` finds it too); results rank exact match first, then word-start matches, then substring matches, each group in original order; a query with several words requires all words to match.
- [ ] **Step 2: Run** `node --test test/search.test.js`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** both functions in `js/search.js` as pure functions with no DOM use.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** with `TETUN-012: add diacritic-insensitive search`.

### Task 3: Game logic

**Files:**
- Create: `js/game.js`, `test/game.test.js`

**Interfaces:**
- Consumes: `Entry` from Task 1.
- Produces: `pointsPerMatch(n: number): number`, `levelFor(score: number): 1|2|3|4`, `isMatch(a: Entry, b: Entry): boolean` (true when `a.id === b.id` or `a.english === b.english`), and `class LessonGame` with
  `constructor(entries: Entry[], rng?: () => number)`,
  `deal(): { direction: 't2e'|'e2t', prompts: Entry[], answers: Entry[] }` (the first `round` entries of the shuffled list; `answers` shuffled separately; direction alternates each round starting `t2e`),
  `submit(promptId: string, answerId: string): { correct: boolean, roundDone: boolean, lessonDone: boolean }`,
  `nextRound(): void`,
  properties `score: number` (0-100), `round: number`, `total: number`, `finished: boolean`, `level: 1|2|3|4`, and `misses: string[]` (prompt entry ids tapped wrongly, with repeats).
  `submit` compares the prompt and answer entries with `isMatch`, so `promptId` and `answerId` are entry ids from the current deal. A new `LessonGame` is created every time a lesson opens, so score and round never carry over.

- [ ] **Step 1: Write the failing tests** in `test/game.test.js`: `pointsPerMatch(10)` is within 0.001 of `1.81818`; `levelFor` returns 1 for 49.9, 2 for 50 and 69.9, 3 for 70 and 98.9, 4 for 99 and 100; a 10-pair game played perfectly ends at score 100 and `finished`; three wrong submits from a fresh game leave `score` at 0, never negative; a 1-pair game finishes after one correct submit with score 100; a 3-pair game finishes with score 100 and uses rounds of 1, 2 and 3 pairs; direction is `t2e`, `e2t`, `t2e` across rounds; with entries `lian Indonézia`/`Bahasa` (both "Indonesian language") and `hotu`/`hotu-hotu` (both "all"), submitting either prompt with either answer is correct in both directions; wrong submits are recorded in `misses`; two `LessonGame`s from the same entries do not share state; passing a seeded `rng` gives a repeatable deal.
- [ ] **Step 2: Run** `node --test test/game.test.js`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `js/game.js` with no DOM use and no imports other than types by comment. Shuffle with Fisher-Yates using `rng` (default `Math.random`), and copy arrays so callers' data is not mutated.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** with `TETUN-012: add game logic`.

### Task 4: Progress storage

**Files:**
- Create: `js/progress.js`, `test/progress.test.js`

**Interfaces:**
- Produces: `type Progress = { levels: Record<string, 0|1|2|3|4>, misses: Record<string, number> }` and the pure or storage-taking functions
  `emptyProgress(): Progress`,
  `loadProgress(storage: { getItem(k: string): string | null }): Progress` (key `tetun.progress.v1`),
  `saveProgress(storage: { setItem(k: string, v: string): void }, p: Progress): boolean` (returns false on error),
  `recordLevel(p: Progress, lessonId: string, level: number): Progress` (never lowers),
  `recordMiss(p: Progress, entryId: string): Progress`, `recordHit(p: Progress, entryId: string): Progress` (floor 0),
  `keptMissing(p: Progress, entries: Entry[], threshold?: number, limit?: number): Entry[]` (defaults `3` and `10`, most missed first).
  All record functions return a new object and do not mutate their input.

- [ ] **Step 1: Write the failing tests** in `test/progress.test.js` using a fake storage object: `loadProgress` returns `emptyProgress()` for missing key, `'not json'`, `'null'`, `'[]'`, `'{"levels":"x"}'`, levels outside 0-4, negative or non-numeric misses, and when `getItem` throws; `saveProgress` returns false when `setItem` throws and true otherwise; a save then load round-trips; `recordLevel` keeps the higher of old and new; `recordHit` never goes below 0; `keptMissing` returns only entries at or over the threshold, sorted by miss count, capped at the limit; inputs are not mutated.
- [ ] **Step 2: Run** `node --test test/progress.test.js`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `js/progress.js`, validating each field when loading and dropping the bad ones instead of rejecting the whole object.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** with `TETUN-012: add validated progress storage`.

### Task 5: App shell and phrasebook

**Files:**
- Create: `js/data.js`, `js/app.js`, `js/views/phrasebook.js`, `css/app.css`
- Modify (replace): `index.html`

**Interfaces:**
- Consumes: `search` (Task 2), `loadProgress`/`saveProgress` (Task 4), `content/words.json` (Task 1).
- Produces: `loadWords(url?: string): Promise<{ topics: Topic[], lessons: Lesson[], entries: Entry[] }>` in `js/data.js`; `renderPhrasebook(root: HTMLElement, data): void` in `js/views/phrasebook.js`; `js/app.js` mounts two views, "Phrasebook" and "Practise", behind a two-button bottom bar, and exposes `showView(name: 'phrasebook'|'practise'): void`.

- [ ] **Step 1: Replace `index.html`** with a minimal shell: real `<title>` and meta description, viewport, a link to `css/app.css` and `manifest.webmanifest`, `<main id="view">`, the bottom bar, and `<script type="module" src="js/app.js">`. Give each element a unique id.
- [ ] **Step 2: Implement the phrasebook view:** a search box that updates results on input using `search`, with Tetun and English shown together; a topic list when the box is empty, opening that topic's entries; tapping an entry opens a large detail view of the pair with a "Report a mistake" link to `https://github.com/botheredbybees/tetun/issues/new` with the pair in the title. Tap targets are at least 48px.
- [ ] **Step 3: Add a footer** with the credit and learner-compiled notice from the Global Constraints.
- [ ] **Step 4: Verify** with `python3 -m http.server 8000` and a browser at 360px width (the Playwright MCP can do this): typing `numeru` lists Númeru entries, an empty box shows the 12 topics, a topic opens its entries, the detail view and mistake link work, and the console has no errors.
- [ ] **Step 5: Commit** with `TETUN-012: add app shell and phrasebook view`.

### Task 6: Practise view

**Files:**
- Create: `js/views/practise.js`
- Modify: `js/app.js` (mount the view), `css/app.css`

**Interfaces:**
- Consumes: `LessonGame`, `levelFor` (Task 3), progress functions (Task 4), topic icons `images/<icon>_{disabled,finished,ninja}.png`.
- Produces: `renderPractise(root: HTMLElement, data, store: { get(): Progress, set(p: Progress): void }): void`.

- [ ] **Step 1: Implement the lesson list:** topics with their lessons as tiles, each showing the icon for its saved level (`disabled` for 0-1, `finished` for 2-3, `ninja` for 4), plus a "Words I keep missing" tile shown only when `keptMissing` is non-empty.
- [ ] **Step 2: Implement the matching screen:** a new `LessonGame` per opening, prompts in one column and answers in the other, tap a prompt then an answer to submit, wrong taps flash and cost a point, matched pairs lock, a progress bar shows `score` and starts at 0 every time, and rounds advance with `nextRound` until `finished`. The Exit button and a result dialog (score and the old encouragement messages for each level) are included.
- [ ] **Step 3: Save results:** on finish call `recordLevel`, then `saveProgress`; on every submit call `recordMiss` or `recordHit` for the prompt entry. The "keep missing" game never calls `recordLevel`.
- [ ] **Step 4: Verify** at 360px: start a lesson, play a round, exit, re-open it (score and bar are back to 0 and round 1); finish with 100% and then replay with deliberate mistakes, and confirm the saved level stays at 4 after a reload; complete two different lessons in one session; open the duplicate-gloss lessons (Excuse me III, lesson 5, and Household III, lesson 26) and check either card is accepted; set `localStorage['tetun.progress.v1']` to `garbage` and reload, and confirm the page still works.
- [ ] **Step 5: Commit** with `TETUN-012: add tap-to-match practise view`.

### Task 7: Offline and installing

**Files:**
- Create: `manifest.webmanifest`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`, `test/precache.test.js`
- Modify: `js/app.js` (register the worker and show the update banner), `index.html`

**Interfaces:**
- `sw.js` is a classic (non-module) worker declaring `const CACHE_VERSION = 'tetun-v1'` and `const PRECACHE_URLS = [...]` (a JSON-valid array of double-quoted relative URLs, one per line). It handles `message` with `{ type: 'SKIP_WAITING' }`.

- [ ] **Step 1: Write the failing test** in `test/precache.test.js`: extract `PRECACHE_URLS` from `sw.js` with the regex `/const PRECACHE_URLS = (\[[\s\S]*?\]);/` and `JSON.parse`, then assert every URL (with `./` resolved to `index.html`) exists on disk, the list includes `index.html`, `content/words.json`, `css/app.css` and every `js/*.js` and `js/views/*.js` file, and every icon listed in the manifest exists.
- [ ] **Step 2: Run** `node --test test/precache.test.js`. Expected: FAIL.
- [ ] **Step 3: Create the icons** at 192px and 512px from `apple-touch-icon-precomposed.png` (152px, so this upscales; ask Peter for better artwork before any public release) with `convert` or PIL, then write the manifest (name, short name, `display: standalone`, start URL `./`, theme colour, both icons).
- [ ] **Step 4: Implement `sw.js`:** precache on install; on activate delete every cache whose name is not `CACHE_VERSION`; answer fetches cache-first with a network fallback; handle `SKIP_WAITING`. In `js/app.js` register it, and when a new worker finishes installing while one is already controlling the page, show a banner "Update ready: reload" that posts `SKIP_WAITING` and reloads on `controllerchange`. Never reload on its own.
- [ ] **Step 5: Run** `npm test`. Expected: all pass.
- [ ] **Step 6: Verify offline** over `http://localhost:8000` with the Playwright MCP or Chrome DevTools: load once, go offline, reload and confirm phrasebook and practise both work; change `CACHE_VERSION` to `tetun-v2`, reload online, confirm the banner appears, accept it, and confirm only the `tetun-v2` cache remains and the app still works offline. Peter checks an install and aeroplane-mode run on a real phone once the work is served over HTTPS locally (for example through a tunnel).
- [ ] **Step 7: Commit** with `TETUN-012: add manifest, service worker and update banner`.

### Task 8: Remove the old game and update docs

**Files:**
- Delete: `js/main.js`, `js/vendor/`, `js/jquery.cookie.js`, `css/bootstrap*`, `css/main.css`, `fonts/`
- Modify: `README.md`, `CLAUDE.md`, `.gitignore` if needed

- [ ] **Step 1: Confirm nothing references the deleted files:** `grep -rn "jquery\|bootstrap\|main.js\|\$.cookie" index.html js css sw.js` must return nothing. Remove each deleted file from `PRECACHE_URLS` if listed, then run `npm test`. Expected: PASS.
- [ ] **Step 2: Delete the files** with `git rm`, re-run `npm test`, reload the app at 360px, and confirm both views and offline still work.
- [ ] **Step 3: Rewrite `README.md`** for the new app: what it is, how to run it (`python3 -m http.server 8000`), how to run tests (`npm test`), where the data lives, how to add a word (edit `content/words.json`), the learner-compiled notice, and the correct counts (12 topics, 33 lessons, 330 pairs). This fixes `TETUN-001`.
- [ ] **Step 4: Rewrite `CLAUDE.md`** to match the new structure, dropping the old gotchas and keeping the data-source and public-release notes (DIT, `TETUN-013`).
- [ ] **Step 5: Commit** with `TETUN-012: remove the jQuery game and rewrite docs`.

### Task 9: Tracker follow-up

**Files:**
- Modify: files under `~/sourcecode/tracker/projects/tetun/` and `~/sourcecode/tracker/docs/tetun/overview.md`

- [ ] **Step 1: Check each old bug against the new code** and close it with a dated comment naming the commit that fixed it: `TETUN-002` (re-opening resets), `003` (level never lowered), `004` (score clamped), `005` (no stacked handlers), `006` (icon state), `007` (bar resets), `009` (corrupt storage), `010` (title, ids, https), `011` (navbar). If any behaviour is not covered by a Task 3, 4 or 6 check, reopen the work instead of closing it.
- [ ] **Step 2: Close `TETUN-008` and `TETUN-001`** with the commit hashes, and update `TETUN-012`'s status and last comment. Leave `TETUN-013` as it is.
- [ ] **Step 3: Update `docs/tetun/overview.md`:** "Plans and specs" shows spec and plan with their state (done), and the counts and "How to run it" lines match the new README.
- [ ] **Step 4: Run** `bash ~/sourcecode/tracker/tools/check.sh` and fix anything it reports for this project.

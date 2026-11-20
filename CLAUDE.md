# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An offline-capable phone web app for visitors to Timor-Leste: a searchable Tetun/English phrasebook plus a tap-to-match practice game, over 330 word pairs (12 topics, 33 lessons). Plain HTML, CSS and ES modules, with a service worker. No build step and no runtime or dev dependencies.

## Commands

```bash
python3 -m http.server 8000      # run it at http://localhost:8000
npm test                         # all tests (Node's built-in runner, Node 18+)
node --test test/game.test.js    # one test file
```

The app must be served over HTTP: ES modules and the service worker do not work from `file://`. Service workers need HTTPS except on `localhost`. The tests cover pure logic and the data and offline file lists. The two views and the service worker are verified by hand in a browser (at 360px width, and offline by stopping the server after one load).

## Architecture

- `content/words.json` is the only content file: `topics` (`id`, `tetun`, `english`, `icon`), `lessons` (`id` = `${topic}-${number}`, `title`) and `entries` (`id` `w001`..., `tetun`, `english`, `topic`, `lesson` number within the topic). Progress is keyed by entry id and lesson id, never by array position. Topic icons are `images/<icon>_{disabled,finished,ninja}.png`.
- Pure logic, no DOM, covered by `test/`: `js/search.js` (diacritic-insensitive search, ranked exact, word-start, substring), `js/game.js` (`LessonGame`, scoring, levels), `js/progress.js` (validated `localStorage`, key `tetun.progress.v1`).
- DOM: `js/app.js` (loads data, builds the progress `store`, two tabs, registers the service worker and the update banner), `js/views/phrasebook.js`, `js/views/practise.js`, `js/dom.js` (the `h()` element builder, no `innerHTML`).
- `sw.js` is a classic worker that precaches everything in `PRECACHE_URLS` with cache-bypassing requests. Any new or renamed file the app needs must be added there. `CACHE_VERSION` is a hash of those files' contents: after changing any of them, or the list, run `npm run stamp` (`tools/stamp.mjs`) and commit `sw.js`. `npm test` fails if it is stale (`test/version.test.js`), if a module, icon or topic image is missing from the list (`test/precache.test.js`), or if the worker deletes caches that are not its own (`test/sw.test.js`, which runs `sw.js` in a sandbox). The worker only touches caches named `tetun-*`, because on GitHub Pages the origin is shared with other sites.

## Game rules that are easy to break

- Round r shows the first r pairs of a shuffled lesson, so lesson length comes from the data. Direction alternates each round, starting Tetun to English.
- A correct match is worth 100 / (1+2+…+n) points, a wrong tap costs 1, and the score stays between 0 and 100. `LessonGame.score` is a getter that rounds the raw sum, because 55 fractional additions otherwise leave a perfect game at 99.99999999999991.
- Levels: under 50 is 1, 50-69 is 2, 70-98 is 3, 99-100 is 4. A saved lesson level is only ever raised.
- Two entries match when they share an id, an English meaning or a Tetun word (`isMatch`), because the player cannot tell such cards apart. This covers the equal glosses (`lian Indonézia`/`Bahasa`, `hotu`/`hotu-hotu`) and the eleven Tetun words that appear twice with different English (`ita`, `nia`, ...).
- A wrong tap records a miss against the prompt's entry id. When a game finishes, each word with no miss anywhere in that game (`LessonGame.cleanIds()`) has its count lowered once. Lowering on every correct match would cancel every miss, and lowering every round cancels them too, because a word is shown in every later round. "Words I keep missing" is entries with 3 or more misses.
- A new `LessonGame` is made every time a lesson opens, so score and round never carry over.

## Data source and release

`data/` holds source material only, not loaded at runtime: the Tetun-English lexicon (`.rtf` and the `Tetun - English/` Lexique Pro project, marked © Dili Institute of Technology 2011, by Catharina Williams-van Klinken), a LIFT XML spec PDF, and two CSVs. The word list was compiled from it by a learner. No permission to reuse it is recorded, and the lexicon files are in the public repo. Do not deploy publicly or add licence text for the word data until the dictionary author has answered (tracker issue `TETUN-013`).

## Conventions

- Tetun spelling matters: keep diacritics (for example `Númeru`). Files are UTF-8. Search drops apostrophes and punctuation on both sides, so `don't` finds `don’t`.
- Vocabulary corrections come from Tetun speakers via issues and PRs. Edit `content/words.json` directly.
- Specs and plans live in `docs/superpowers/specs/` and `plans/`. Issues are tracked outside the repo; quote the issue key (for example `TETUN-012`) in commit messages.

# Tetun for Visitors: design

Status: approved by Peter on 2026-11-21. Nothing has been built. Date: 2026-11-21.

## Intent and why

Peter built a drag-and-drop Tetun vocabulary game in 2014 to learn enough Tetun to greet people, ask for directions and apologise politely before a motorcycle holiday in Timor-Leste with his two sons. It worked, but a friend who tried it said he wanted to ask "what is the word for table" and be told. Peter's own experience was the same: he mostly needed words on the road, and wished he had learned more beforehand.

The goal is to turn it into a small, dependable tool for visitors to Timor-Leste: a phone app that works without a signal, where you can look a word up quickly and also practise the same words at home. It stays a hobby-sized project. The existing 330 word pairs (33 lessons, 12 topics) are the starting content.

## Goals

- A visitor can find a Tetun word or its English meaning in a few seconds, offline, on a mid-range Android or iOS phone.
- The same words can be practised with a matching game that works well by tapping on a small screen.
- It opens from a plain link with nothing to install, and can be added to the home screen so it keeps working offline.
- The word data lives in one plain JSON file, separate from the code, so it can be corrected by Tetun speakers and extended later.
- It runs on any static host with no build step.

## Non-goals

- A native app in an app store.
- Accounts, a server, or syncing progress between devices.
- Analytics. The existing Google Analytics snippet is a Universal Analytics property, which no longer collects data. It is not carried over.
- Audio, example sentences, grammar notes, Portuguese or Indonesian. These are possible later versions, not v1.
- A course for Timorese students learning English, or for Australian students learning Tetun. They are parked. Revisit if someone asks for them.
- Migrating progress saved in the old cookie. Its data is thin (one level per lesson), and the new progress records are keyed by entry id, not by lesson position.

## Anti-goals

These would make it a failure even if the code works:

- Publishing content derived from the DIT dictionary beyond what its author and DIT have agreed to.
- Presenting unreviewed vocabulary as authoritative. The lists were compiled by a learner. The app should say so until a Tetun speaker has reviewed them.
- Breaking offline use when a new version is released, for example by leaving a visitor with half of an old cache and half of a new one.
- Growing into a general dictionary that competes with the DIT app.

## Constraints

- No build step and no runtime dependencies. Plain HTML, CSS and ES modules, served as static files (`python3 -m http.server` must be enough to run it).
- A service worker needs HTTPS, so the host must serve over HTTPS. GitHub Pages and similar hosts do.
- Must work at a 360px-wide screen, in current Chrome on Android and Safari on iOS, and in a desktop browser for a school computer lab.
- Everything needed offline is cached on first load. The current assets are small (about 150 KB of images, 24 KB of script).
- Tetun spelling with diacritics (for example `Númeru`) must be stored and searched correctly. Files are UTF-8.

## Approaches considered

1. **Fix in place.** Keep jQuery, jQuery UI and Bootstrap 3, add a manifest and service worker, fix the 11 tracker issues. Least work, but touch drag-and-drop is the weakest part on phones, the libraries are long out of date, and a search view would be bolted onto global state. Rejected.
2. **Rewrite in plain modern JavaScript, no build step.** Data moved to JSON, ES modules, tap-to-match, a service worker. Small, matches how the project already works, and easy to pick up after a long gap. **Chosen by Peter.**
3. **Rewrite with a small framework and a build tool** (for example Vite with Svelte or Preact). Better structure and ready-made PWA tooling, but it adds a Node toolchain to maintain for two screens. Rejected for v1. Because the data is separate JSON, moving the interface to a framework later would not touch the data.

Delivery as a PWA (a link that works without installing, and can be added to the home screen) was chosen over link-only and over a native app.

## Design

### Data

One file, `data/words.json` (the existing `data/` folder holds source material, so the builder may choose another location). Each entry has a stable id so progress does not depend on array position:

```json
{ "id": "w001", "tetun": "bondia", "english": "good morning", "topic": "greetings", "lesson": 1 }
```

Topics carry their Tetun and English names and an icon key. Lessons are groups of entries within a topic. Search runs over `tetun` and `english`. The format must allow extra optional fields later (notes, audio file, part of speech) and a larger word set without changes to the code.

The two glosses that collide today (`lian Indonézia`/`Bahasa` both "Indonesian language", `hotu`/`hotu-hotu` both "all") must be made distinct in the data, or the game must treat equal glosses as the same answer.

### Phrasebook

- A search box at the top, matching as you type in either direction, ignoring case and diacritics, with Tetun and English results shown together.
- Browse by topic for people who do not know the word they want.
- Tapping a result opens a large, easy-to-read view of the pair.

### Practise

- A matching game built on tapping: tap a card on one side, then its match on the other. Drag-and-drop is dropped.
- Keeps what worked: a lesson starts with one pair and adds one per round up to ten, the direction alternates between Tetun-to-English and English-to-Tetun, and the end result is one of four levels (under 50%, 50-69, 70-98, 99-100 "ninja").
- Lesson length is read from the data, not hardcoded to 10.
- A word you miss is recorded, and a "words I keep missing" set can be practised.
- The behaviour the 2014 code got wrong (score never below zero, restarting a lesson resets score and bar, a lower result never lowers a saved level) is specified here and tested.

### Progress and storage

Progress lives in `localStorage` (not a cookie): the best level per lesson and a miss count per entry id. Stored data is validated when read, and corrupt or missing data falls back to empty rather than breaking the page.

### Offline and installing

- A web app manifest and a service worker that pre-caches the app shell and the word data on first load.
- Cache names are versioned. A new version replaces the old cache as a whole, and the visitor is told when an update is ready rather than being switched part-way through a session.
- Icons for home screen use at 192px and 512px need to be made from the existing artwork.

### Content and credit

- The app credits the DIT dictionary and Catharina Williams-van Klinken, and says that the lists were compiled by a learner and are open to correction by speakers.
- Corrections come in through issues on the repository. A "report a mistake" link goes with each entry.

### Data licence

The lexicon in `data/` is marked © Dili Institute of Technology 2011. Peter plans to ask its author for permission to use it as the source with credit, for a review of the 330 words, and for the current data (the 2019 edition, about 11,600 headwords) for a wider lookup. Building can go ahead on the 330 words in the meantime. A public release that uses DIT-derived data waits on her answer. If the answer is no, the word list is rewritten from sources that allow it.

### Existing code and tracker

The old jQuery game is replaced and then removed. `TETUN-002` to `TETUN-007`, `TETUN-009`, `TETUN-010` and `TETUN-011` apply to code that will no longer exist, and should be closed with a note once the replacement ships, after checking the new code does not repeat them. `TETUN-008` (duplicate glosses) is a data fix. `TETUN-001` (stale README counts) is fixed when the README is rewritten.

## Decisions Peter made

- Primary user is a visitor to Timor-Leste; the school and Australian-student ideas are parked.
- The 330 existing pairs are the starting content.
- Phone-first, offline-capable, delivered as a PWA.
- Phrasebook and lookup first, with the matching game as the trainer.
- Approach 2: plain modern JavaScript, no build step.
- Ask the dictionary's author for permission, and for review of the content. Peter sends this himself.

## Calls made by the author of this document (open to change)

- v1 searches only the 330 curated words, with a data format that can take more.
- Tap-to-match replaces drag-and-drop.
- `localStorage` replaces the cookie, and old progress is not migrated.
- No analytics.
- Hosting is any static HTTPS host. This document does not pick one.
- The existing 33 lessons and 12 topics are kept as they are. Reorganising them is not part of v1.
- Words you keep missing are tracked per entry, as a small step beyond today's per-lesson levels. A miss is a wrong tap against that entry's id. A word counts as "kept missing" at a simple threshold the builder picks (for example three misses), and a correct match in practice lowers the count. Fuller spaced repetition is out of scope.
- Scoring scales with lesson length. A correct match is worth 100 divided by the sum of 1 to n points for a lesson of n pairs (about 1.818 when n is 10, as today), a wrong tap costs 1, and the score stays between 0 and 100.
- The app is built and tested locally only. It is not deployed publicly until the DIT answer is in, as the Data licence section says.
- Logic that can be tested without a browser (search matching, scoring, level calculation, data validation) goes in separate modules and is tested with Node's built-in test runner, so there is still no dependency. The service worker and touch behaviour are checked by hand on a real phone, including in aeroplane mode.

## Left to the builder

- File and folder layout, naming, CSS approach, and the visual design within the constraints above.
- How search ranks results.
- How the update prompt looks and behaves.
- The exact shape of the topic and lesson data beyond the example entry.
- Which static host to deploy to.
- How to make the home screen icons.

## Open questions (not blocking v1)

- Audio for pronunciation, and where it could come from.
- What the phrasebook view should show beyond the word pair, once more data is available.
- The answer from DIT, and what it changes.
